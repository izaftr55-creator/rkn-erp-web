const fs = require("node:fs");
const file = process.argv[2];
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
    "RKN_HPP_NATIVE_FINAL_V14"
  )
) {
  console.log(
    "V14_ALREADY_PRESENT"
  );
  process.exit(0);
}
/*
 * Find the actual desktop table wrapper.
 */
const oldTableWrap =
`        <div
          className={styles.tableWrap}
        >`;
const tableIndex =
  source.indexOf(
    oldTableWrap
  );
if (tableIndex < 0) {
  fail(
    "TABLE_WRAP_NOT_FOUND"
  );
}
/*
 * Native mobile renderer.
 * Independent from the table.
 */
const mobileRenderer =
`        {/* RKN_HPP_NATIVE_FINAL_V14 */}
        <div
          className={styles.mobileOnly}
        >
          {merged.map(
            ({
              product,
              saved,
            }) => (
              <article
                key={
                  "mobile-" +
                  productKey(product)
                }
                className={
                  styles.mobileHppCard
                }
              >
                <div
                  className={
                    styles.mobileHppHead
                  }
                >
                  <div>
                    <strong>
                      {product.productName ||
                        "-"}
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
                        ? styles.mobileHppReady
                        : styles.mobileHppEmpty
                    }
                  >
                    {saved
                      ? "TERISI"
                      : "BELUM ADA"}
                  </span>
                </div>
                <div
                  className={
                    styles.mobileHppDetails
                  }
                >
                  <div>
                    <span>SKU</span>
                    <strong>
                      {product.sku ||
                        "-"}
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
                        ? saved.method ===
                          "MANUAL"
                          ? "Manual"
                          : "Otomatis"
                        : "-"}
                    </strong>
                  </div>
                  <div>
                    <span>
                      Efektif Mulai
                    </span>
                    <strong>
                      {saved
                        ?.effective_from ||
                        "-"}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    styles.mobileHppAction
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
                      productKey(
                        product
                      )
                    );
                    setMethod(
                      "MANUAL"
                    );
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
/*
 * Insert native renderer directly before desktop table.
 */
source =
  source.slice(
    0,
    tableIndex
  ) +
  mobileRenderer +
  source.slice(
    tableIndex
  );
/*
 * Mark existing table desktop-only.
 */
source =
  source.replace(
    oldTableWrap,
`        <div
          className={
            \`\${styles.tableWrap} \${styles.desktopOnly}\`
          }
        >`
  );
fs.writeFileSync(
  file,
  source,
  "utf8"
);
console.log(
  "NATIVE_RENDERER_PASS"
);
console.log(
  "DESKTOP_TABLE_ONLY_PASS"
);