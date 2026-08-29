const fs = require("node:fs");
const ts = require("typescript");
const file = process.argv[2];
let source = fs.readFileSync(file, "utf8");
function fail(message) {
  console.error(message);
  process.exit(1);
}
if (source.includes("RKN_HPP_NATIVE_MOBILE_V142")) {
  console.log("V142_ALREADY_PRESENT");
  process.exit(0);
}
const sourceFile = ts.createSourceFile(
  file,
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);
if (sourceFile.parseDiagnostics.length > 0) {
  fail("SOURCE_PARSE_ERROR_BEFORE_PATCH");
}
const matches = [];
function isTableWrap(node) {
  if (!ts.isJsxElement(node)) {
    return false;
  }
  const opening = node.openingElement;
  if (opening.tagName.getText(sourceFile) !== "div") {
    return false;
  }
  for (const prop of opening.attributes.properties) {
    if (!ts.isJsxAttribute(prop)) {
      continue;
    }
    if (prop.name.getText(sourceFile) !== "className") {
      continue;
    }
    if (!prop.initializer || !ts.isJsxExpression(prop.initializer)) {
      continue;
    }
    const expression = prop.initializer.expression;
    if (!expression) {
      continue;
    }
    if (expression.getText(sourceFile) === "styles.tableWrap") {
      return true;
    }
  }
  return false;
}
function visit(node) {
  if (isTableWrap(node)) {
    matches.push(node);
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);
if (matches.length !== 1) {
  fail(
    "TABLE_WRAP_AST_MATCH_COUNT=" +
    String(matches.length)
  );
}
const target = matches[0];
const start = target.getStart(sourceFile);
const end = target.end;
let desktopTable = source.slice(start, end);
desktopTable = desktopTable.replace(
  "className={styles.tableWrap}",
  'className={`${styles.tableWrap} ${styles.desktopTableV142}`}'
);
if (!desktopTable.includes("desktopTableV142")) {
  fail("DESKTOP_CLASS_REPLACE_FAILED");
}
const mobileRenderer = `
<>
  {/* RKN_HPP_NATIVE_MOBILE_V142 */}
  <div className={styles.mobileListV142}>
    {merged.map(({ product, saved }) => (
      <article
        key={"hpp-mobile-v142-" + productKey(product)}
        className={styles.mobileCardV142}
      >
        <div className={styles.mobileHeadV142}>
          <div className={styles.mobileTitleV142}>
            <strong>
              {product.productName || "-"}
            </strong>
            <small>
              {product.category ||
                product.productId ||
                "Produk canonical"}
            </small>
          </div>
          <span
            className={
              saved
                ? styles.mobileStatusReadyV142
                : styles.mobileStatusEmptyV142
            }
          >
            {saved ? "TERISI" : "BELUM ADA"}
          </span>
        </div>
        <div className={styles.mobileRowsV142}>
          <div>
            <span>SKU</span>
            <strong>
              {product.sku || "-"}
            </strong>
          </div>
          <div>
            <span>HPP</span>
            <strong>
              {saved
                ? rupiah(saved.effective_hpp)
                : "-"}
            </strong>
          </div>
          <div>
            <span>Metode</span>
            <strong>
              {saved
                ? saved.method === "MANUAL"
                  ? "Manual"
                  : "Otomatis"
                : "-"}
            </strong>
          </div>
          <div className={styles.mobileDateV142}>
            <span>Efektif Mulai</span>
            <strong>
              {saved?.effective_from || "-"}
            </strong>
          </div>
        </div>
        <button
          type="button"
          className={styles.mobileActionV142}
          onClick={() => {
            if (saved) {
              openSaved(saved, product);
              return;
            }
            setSelectedProductKey(
              productKey(product)
            );
            setMethod("MANUAL");
            setManualHpp(0);
            setComponents(
              defaultComponents.map(
                (item) => ({
                  ...item,
                })
              )
            );
            setEffectiveFrom(today());
            setSourceNote("");
            setHistory([]);
            setEditorOpen(true);
          }}
        >
          {saved ? "Ubah HPP" : "Isi HPP"}
        </button>
      </article>
    ))}
  </div>
${desktopTable}
</>`;
const patched =
  source.slice(0, start) +
  mobileRenderer +
  source.slice(end);
/*
 * Validate TSX syntax BEFORE writing file.
 */
const checkFile = ts.createSourceFile(
  file,
  patched,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);
if (checkFile.parseDiagnostics.length > 0) {
  for (const diagnostic of checkFile.parseDiagnostics) {
    console.error(
      "PARSE_DIAGNOSTIC:",
      diagnostic.messageText
    );
  }
  fail("PATCHED_TSX_PARSE_FAIL");
}
fs.writeFileSync(
  file,
  patched,
  "utf8"
);
console.log("AST_TARGET_COUNT=1");
console.log("PATCHED_TSX_PARSE_PASS");
console.log("V142_TSX_PASS");