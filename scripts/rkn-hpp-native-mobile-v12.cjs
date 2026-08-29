const fs =
  require("node:fs");
const file =
  process.argv[2];
let source =
  fs.readFileSync(
    file,
    "utf8"
  );
function fail(message) {
  throw new Error(message);
}
/*
 * ========================================================
 * HELPER: OPEN PRODUCT EDITOR
 * ========================================================
 */
if (
  !source.includes(
    "RKN_HPP_OPEN_EDITOR_V12"
  )
) {
  const returnAnchor =
    `  return (
    <section`;
  const at =
    source.indexOf(
      returnAnchor
    );
  if (at < 0) {
    fail(
      "COMPONENT_RETURN_ANCHOR_NOT_FOUND"
    );
  }
  const helper =
`  // RKN_HPP_OPEN_EDITOR_V12
  function openProductEditor(
    product: HppProductOption,
    saved: HppRow | null
  ) {
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
  }
`;
  source =
    source.slice(
      0,
      at
    ) +
    helper +
    source.slice(
      at
    );
}
/*
 * ========================================================
 * INSERT NATIVE MOBILE LIST
 * ========================================================
 */
if (
  !source.includes(
    "RKN_HPP_NATIVE_MOBILE_LIST_V12"
  )
) {
  const anchor =
`        <div
          className={styles.tableWrap}
        >`;
  const at =
    source.indexOf(
      anchor
    );
  if (at < 0) {
    fail(
      "TABLE_WRAP_ANCHOR_NOT_FOUND"
    );
  }
  const mobileList =
`        {/* RKN_HPP_NATIVE_MOBILE_LIST_V12 */}
        <div
          className={styles.mobileList}
        >
          {merged.map(
            ({
              product,
              saved,
            }) => (
              <article
                key={
                  "mobile-" +
                  productKey(
                    product
                  )
                }
                className={styles.mobileProductCard}
              >
                <div
                  className={styles.mobileProductHead}
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
                        ? styles.mobileReady
                        : styles.mobileEmpty
                    }
                  >
                    {saved
                      ? "TERISI"
                      : "BELUM ADA"}
                  </span>
                </div>
                <div
                  className={styles.mobileInfoGrid}
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
                  <div
                    className={styles.mobileEffective}
                  >
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
                  className={styles.mobileEditButton}
                  onClick={() =>
                    openProductEditor(
                      product,
                      saved
                    )
                  }
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
    source.slice(
      0,
      at
    ) +
    mobileList +
    source.slice(
      at
    );
}
/*
 * ========================================================
 * DESKTOP TABLE ONLY
 * ========================================================
 */
if (
  !source.includes(
    "styles.desktopTable"
  )
) {
  const oldBlock =
`        <div
          className={styles.tableWrap}
        >`;
  const newBlock =
`        <div
          className={
            \`\${styles.tableWrap} \${styles.desktopTable}\`
          }
        >`;
  if (
    !source.includes(
      oldBlock
    )
  ) {
    fail(
      "DESKTOP_TABLE_WRAP_NOT_FOUND"
    );
  }
  source =
    source.replace(
      oldBlock,
      newBlock
    );
}
fs.writeFileSync(
  file,
  source,
  "utf8"
);
console.log(
  "NATIVE_MOBILE_TSX_PASS"
);
console.log(
  "DESKTOP_TABLE_PRESERVED_PASS"
);