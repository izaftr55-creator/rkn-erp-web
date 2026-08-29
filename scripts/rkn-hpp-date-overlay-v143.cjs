const fs =
  require("node:fs");
const ts =
  require("typescript");
const file =
  process.argv[2];
let source =
  fs.readFileSync(
    file,
    "utf8"
  );
function fail(message) {
  console.error(message);
  process.exit(1);
}
if (
  source.includes(
    "RKN_HPP_DATE_OVERLAY_V143"
  )
) {
  console.log(
    "V143_ALREADY_PRESENT"
  );
  process.exit(0);
}
const sourceFile =
  ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
if (
  sourceFile.parseDiagnostics.length > 0
) {
  fail(
    "SOURCE_PARSE_FAIL_BEFORE_PATCH"
  );
}
const matches = [];
function isDateInput(node) {
  if (
    !ts.isJsxSelfClosingElement(node)
  ) {
    return false;
  }
  if (
    node.tagName.getText(sourceFile)
      !== "input"
  ) {
    return false;
  }
  for (
    const prop
    of node.attributes.properties
  ) {
    if (
      !ts.isJsxAttribute(prop)
    ) {
      continue;
    }
    if (
      prop.name.getText(sourceFile)
        !== "type"
    ) {
      continue;
    }
    if (
      prop.initializer &&
      ts.isStringLiteral(
        prop.initializer
      ) &&
      prop.initializer.text === "date"
    ) {
      return true;
    }
  }
  return false;
}
function visit(node) {
  if (
    isDateInput(node)
  ) {
    matches.push(node);
  }
  ts.forEachChild(
    node,
    visit
  );
}
visit(sourceFile);
if (
  matches.length !== 1
) {
  fail(
    "DATE_INPUT_MATCH_COUNT=" +
    String(matches.length)
  );
}
const target =
  matches[0];
const originalInput =
  source.slice(
    target.getStart(sourceFile),
    target.end
  );
/*
 * Keep the original input completely intact,
 * only append a CSS class.
 */
let nativeInput =
  originalInput;
if (
  nativeInput.includes(
    "className="
  )
) {
  fail(
    "DATE_INPUT_ALREADY_HAS_CLASSNAME"
  );
}
nativeInput =
  nativeInput.replace(
    "<input",
`<input
                  className={styles.dateNativeV143}`
  );
const replacement =
`{/* RKN_HPP_DATE_OVERLAY_V143 */}
              <div
                className={
                  styles.dateShellV143
                }
              >
                <span
                  className={
                    styles.dateTextV143
                  }
                  aria-hidden="true"
                >
                  {effectiveFrom
                    ? new Intl.DateTimeFormat(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                        .format(
                          new Date(
                            effectiveFrom +
                              "T00:00:00"
                          )
                        )
                        .toUpperCase()
                    : "PILIH TANGGAL"}
                </span>
                <span
                  className={
                    styles.dateIconV143
                  }
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                    />
                    <path d="M16 3v4" />
                    <path d="M8 3v4" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
                ${nativeInput}
              </div>`;
const patched =
  source.slice(
    0,
    target.getStart(sourceFile)
  ) +
  replacement +
  source.slice(
    target.end
  );
/*
 * Validate JSX syntax BEFORE writing.
 */
const check =
  ts.createSourceFile(
    file,
    patched,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
if (
  check.parseDiagnostics.length > 0
) {
  for (
    const diagnostic
    of check.parseDiagnostics
  ) {
    console.error(
      "PARSE:",
      diagnostic.messageText
    );
  }
  fail(
    "PATCHED_TSX_PARSE_FAIL"
  );
}
fs.writeFileSync(
  file,
  patched,
  "utf8"
);
console.log(
  "DATE_INPUT_MATCH_COUNT=1"
);
console.log(
  "DATE_OVERLAY_PARSE_PASS"
);
console.log(
  "DATE_OVERLAY_TSX_PASS"
);