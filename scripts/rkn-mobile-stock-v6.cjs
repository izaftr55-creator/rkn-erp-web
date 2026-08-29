const fs = require("node:fs");

const appFile =
  process.argv[2];

const mobileFile =
  process.argv[3];

let app =
  fs.readFileSync(
    appFile,
    "utf8"
  );

let mobile =
  fs.readFileSync(
    mobileFile,
    "utf8"
  );

/*
 * Import.
 */
if (
  !mobile.includes(
    'from "./MobileStockView"'
  )
) {
  const styleImport =
    'import styles from "./MobileAdminShell.module.css";';

  if (
    !mobile.includes(styleImport)
  ) {
    throw new Error(
      "MOBILE_STYLE_IMPORT_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      styleImport,
      `${styleImport}

import MobileStockView, {
  type MobileStockRow,
  type MobileStockSummary,
} from "./MobileStockView";`
    );
}

/*
 * Add mobile stock props.
 */
if (
  !mobile.includes(
    "stockSummary?: MobileStockSummary;"
  )
) {
  const propsStart =
    mobile.indexOf(
      "type Props = {"
    );

  if (propsStart < 0) {
    throw new Error(
      "MOBILE_PROPS_START_NOT_FOUND"
    );
  }

  const propsEnd =
    mobile.indexOf(
      "};",
      propsStart
    );

  if (propsEnd < 0) {
    throw new Error(
      "MOBILE_PROPS_END_NOT_FOUND"
    );
  }

  mobile =
    mobile.slice(
      0,
      propsEnd
    ) +
    `  stockSummary?: MobileStockSummary;
  stockRows?: MobileStockRow[];
` +
    mobile.slice(
      propsEnd
    );
}

/*
 * Function destructuring.
 */
if (
  !mobile.includes(
    "stockSummary,"
  )
) {
  const signatureStart =
    mobile.indexOf(
      "export default function MobileAdminShell({"
    );

  if (signatureStart < 0) {
    throw new Error(
      "MOBILE_FUNCTION_NOT_FOUND"
    );
  }

  const signatureEnd =
    mobile.indexOf(
      "}: Props) {",
      signatureStart
    );

  if (signatureEnd < 0) {
    throw new Error(
      "MOBILE_FUNCTION_END_NOT_FOUND"
    );
  }

  mobile =
    mobile.slice(
      0,
      signatureEnd
    ) +
    `  stockSummary,
  stockRows,
` +
    mobile.slice(
      signatureEnd
    );
}

/*
 * Render dedicated stock screen.
 */
if (
  !mobile.includes(
    "RKN_MOBILE_STOCK_V6"
  )
) {
  const anchor =
    `      {panel && (`;

  const index =
    mobile.indexOf(anchor);

  if (index < 0) {
    throw new Error(
      "MOBILE_PANEL_ANCHOR_NOT_FOUND"
    );
  }

  const view =
    `      {/* RKN_MOBILE_STOCK_V6 */}
      {activeTab === "stock" && (
        <MobileStockView
          summary={stockSummary}
          rows={stockRows}
        />
      )}

`;

  mobile =
    mobile.slice(0, index) +
    view +
    mobile.slice(index);
}

/*
 * ERP -> mobile inventory bridge.
 */
if (
  !app.includes(
    "stockSummary={{"
  )
) {
  const shell =
    app.indexOf(
      "<MobileAdminShell"
    );

  if (shell < 0) {
    throw new Error(
      "ERP_MOBILE_SHELL_NOT_FOUND"
    );
  }

  const onSelect =
    app.indexOf(
      "        onSelect=",
      shell
    );

  if (onSelect < 0) {
    throw new Error(
      "ERP_MOBILE_ONSELECT_NOT_FOUND"
    );
  }

  const bridge =
    `        stockSummary={{
          ready: inventoryReady,
          pending: inventoryPending,
          waiting: inventoryWaiting,
          random: inventoryRandom,
          review: inventoryReview,
        }}
        stockRows={allMappedRows
          .filter(
            (row) =>
              String(
                row.INVENTORY_STATUS || ""
              ) !== "ARCHIVED"
          )
          .slice(0, 240)
          .map((row, index) => ({
            key:
              String(
                row.STORE_ID || ""
              ) +
              "::" +
              String(
                row.PRODUCT_ID || ""
              ) +
              "::" +
              String(
                row.VARIATION_NAME || ""
              ) +
              "::" +
              index,
            platform: String(
              row.PLATFORM || ""
            ),
            storeName: String(
              stores.find(
                (store) =>
                  String(
                    store.STORE_ID || ""
                  ) ===
                  String(
                    row.STORE_ID || ""
                  )
              )?.STORE_NAME ||
                row.STORE_ID ||
                ""
            ),
            productId: String(
              row.PRODUCT_ID || ""
            ),
            productName: String(
              row.PRODUCT_NAME || ""
            ),
            variationName: String(
              row.VARIATION_NAME || ""
            ),
            family: String(
              row.PRODUCT_FAMILY || ""
            ),
            canonicalSku: String(
              row.SUGGESTED_SKU ||
                row.CURRENT_SKU ||
                ""
            ),
            inventoryStatus: String(
              row.INVENTORY_STATUS || ""
            ),
            detectedColors: String(
              row.DETECTED_COLORS || ""
            ),
            bundleQty:
              Number(
                row.BUNDLE_QTY
              ) || 1,
            fulfillmentAction: String(
              row.FULFILLMENT_ACTION || ""
            ),
            componentDetail: String(
              row.COMPONENT_DETAIL || ""
            ),
          }))}
`;

  app =
    app.slice(0, onSelect) +
    bridge +
    app.slice(onSelect);
}

/*
 * Hide desktop stock screen on phones.
 * Support V5, V3, or earlier shell form.
 */
if (
  !app.includes(
    "rkn-mobile-stock-hidden"
  )
) {
  const v5 =
`          tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : tab === "orders"
              ? "main rkn-mobile-orders-hidden"
              : "main"`;

  const v6 =
`          tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : tab === "orders"
              ? "main rkn-mobile-orders-hidden"
              : tab === "stock"
                ? "main rkn-mobile-stock-hidden"
                : "main"`;

  const v3 =
`          tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : "main"`;

  const v3ToV6 =
`          tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : tab === "stock"
              ? "main rkn-mobile-stock-hidden"
              : "main"`;

  if (app.includes(v5)) {
    app =
      app.replace(
        v5,
        v6
      );
  }
  else if (app.includes(v3)) {
    app =
      app.replace(
        v3,
        v3ToV6
      );
  }
  else {
    const plain =
      '<main className="main">';

    if (!app.includes(plain)) {
      throw new Error(
        "ERP_MAIN_CLASS_NOT_FOUND"
      );
    }

    app =
      app.replace(
        plain,
        `<main
        className={
          tab === "stock"
            ? "main rkn-mobile-stock-hidden"
            : "main"
        }
      >`
      );
  }
}

fs.writeFileSync(
  appFile,
  app,
  "utf8"
);

fs.writeFileSync(
  mobileFile,
  mobile,
  "utf8"
);

console.log(
  "MOBILE_STOCK_SHELL_PATCH_PASS"
);

console.log(
  "STOCK_DATA_BRIDGE_PASS"
);

console.log(
  "DESKTOP_STOCK_SEPARATION_PATCH_PASS"
);