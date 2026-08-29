const fs = require("node:fs");
const file = process.argv[2];
let source =
  fs.readFileSync(file, "utf8");
function fail(message) {
  console.error(message);
  process.exit(1);
}
if (
  source.includes(
    "RKN_HPP_NATIVE_MOBILE_V141"
  )
) {
  console.log("V141_ALREADY_PRESENT");
  process.exit(0);
}
const tableWrap =
`        <div
          className={styles.tableWrap}
        >`;
const at =
  source.indexOf(tableWrap);
if (at < 0) {
  fail("TABLE_WRAP_NOT_FOUND");
}
const mobile =
`        {/* RKN_HPP_NATIVE_MOBILE_V141 */}
        <div
          className={styles.mobileNativeList}
        >
          {merged.map(
            ({
              product,
              saved,
            }) => (
              <article
                key={
                  "hpp-mobile-" +
                  productKey(product)
                }
                className={
                  styles.mobileNativeCard
                }
              >
                <div
                  className={
                    styles.mobileNativeHead
                  }
                >
                  <div>
                    <strong>
                      {product.productName || "-"}
                    </strong>
                    <small>
                      {product.category ||
                        product.productId ||
                        "Produk canonical"}
                    </small>
                  </div>
                  <span>
                    {saved
                      ? "TERISI"
                      : "BELUM ADA"}
                  </span>
                </div>
                <div
                  className={
                    styles.mobileNativeRows
                  }
                >
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
                        ? rupiah(
                            saved.effective_hpp
                          )
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
                  <div>
                    <span>Efektif Mulai</span>
                    <strong>
                      {saved?.effective_from || "-"}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    styles.mobileNativeAction
                  }
                  onClick={() => {
                    if (saved) {
                      openSaved(
                        saved,
                        product
                      );
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
                    setEffectiveFrom(
                      today()
                    );
                    setSourceNote("");
                    setHistory([]);
                    setEditorOpen(true);
                  }}
                >
                  {saved
                    ? "Ubah HPP"
                    : "Isi HPP"}
                </button>
              </article>
            )
          )}
        </div>
`;
source =
  source.slice(0, at) +
  mobile +
  source.slice(at);
source =
  source.replace(
    tableWrap,
`        <div
          className={
            \`\${styles.tableWrap} \${styles.desktopTableOnly}\`
          }
        >`
  );
fs.writeFileSync(
  file,
  source,
  "utf8"
);
console.log("V141_TSX_PASS");