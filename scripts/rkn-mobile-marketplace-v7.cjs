const fs =
  require("node:fs");

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
 * ========================================================
 * MOBILE IMPORT
 * ========================================================
 */

if (
  !mobile.includes(
    'from "./MobileMarketplaceView"'
  )
) {
  const styleImport =
    'import styles from "./MobileAdminShell.module.css";';

  if (
    !mobile.includes(
      styleImport
    )
  ) {
    throw new Error(
      "MOBILE_STYLE_IMPORT_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      styleImport,
      `${styleImport}

import MobileMarketplaceView, {
  type MobileMarketplaceStore,
} from "./MobileMarketplaceView";`
    );
}


/*
 * ========================================================
 * MOBILE PROPS
 * ========================================================
 */

if (
  !mobile.includes(
    "marketplaceStores?: MobileMarketplaceStore[];"
  )
) {
  const propsStart =
    mobile.indexOf(
      "type Props = {"
    );

  if (propsStart < 0) {
    throw new Error(
      "MOBILE_PROPS_NOT_FOUND"
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
    `  marketplaceStores?: MobileMarketplaceStore[];
` +
    mobile.slice(
      propsEnd
    );
}


/*
 * ========================================================
 * FUNCTION PROP
 * ========================================================
 */

if (
  !mobile.includes(
    "marketplaceStores,"
  )
) {
  const functionStart =
    mobile.indexOf(
      "export default function MobileAdminShell({"
    );

  if (functionStart < 0) {
    throw new Error(
      "MOBILE_FUNCTION_NOT_FOUND"
    );
  }

  const functionEnd =
    mobile.indexOf(
      "}: Props) {",
      functionStart
    );

  if (functionEnd < 0) {
    throw new Error(
      "MOBILE_FUNCTION_END_NOT_FOUND"
    );
  }

  mobile =
    mobile.slice(
      0,
      functionEnd
    ) +
    `  marketplaceStores,
` +
    mobile.slice(
      functionEnd
    );
}


/*
 * ========================================================
 * MARKETPLACE ACTIVE:
 * Orders belongs to Pesanan bottom tab,
 * not Marketplace bottom tab.
 * ========================================================
 */

mobile =
  mobile.replace(
    /const marketplaceTabs = \[\s*"orders",/,
    `const marketplaceTabs = [`
  );


/*
 * ========================================================
 * TITLE
 * ========================================================
 */

if (
  !mobile.includes(
    'case "marketplaceHub":'
  )
) {
  const dashboardCase =
    `    case "dashboard":
      return "Beranda Admin";`;

  if (
    !mobile.includes(
      dashboardCase
    )
  ) {
    throw new Error(
      "TITLE_DASHBOARD_CASE_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      dashboardCase,
      `${dashboardCase}

    case "marketplaceHub":
      return "Marketplace";`
    );
}


/*
 * ========================================================
 * RENDER MARKETPLACE PAGE
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_MARKETPLACE_V7"
  )
) {
  const panelAnchor =
    `      {panel && (`;

  const panelIndex =
    mobile.indexOf(
      panelAnchor
    );

  if (panelIndex < 0) {
    throw new Error(
      "MOBILE_PANEL_ANCHOR_NOT_FOUND"
    );
  }

  const page =
    `      {/* RKN_MOBILE_MARKETPLACE_V7 */}
      {activeTab === "marketplaceHub" && (
        <MobileMarketplaceView
          stores={marketplaceStores}
          onSelect={choose}
          onPlanned={openPlanned}
        />
      )}

`;

  mobile =
    mobile.slice(
      0,
      panelIndex
    ) +
    page +
    mobile.slice(
      panelIndex
    );
}


/*
 * ========================================================
 * BOTTOM NAV:
 * Marketplace is now a real page.
 * ========================================================
 */

const bottomNavIndex =
  mobile.indexOf(
    'className={styles.bottomNav}'
  );

if (bottomNavIndex < 0) {
  throw new Error(
    "BOTTOM_NAV_NOT_FOUND"
  );
}

const marketplaceButtonIndex =
  mobile.indexOf(
    '<Icon name="marketplace" />',
    bottomNavIndex
  );

if (marketplaceButtonIndex < 0) {
  throw new Error(
    "BOTTOM_MARKETPLACE_ICON_NOT_FOUND"
  );
}

const buttonStart =
  mobile.lastIndexOf(
    "<button",
    marketplaceButtonIndex
  );

const buttonEnd =
  mobile.indexOf(
    "</button>",
    marketplaceButtonIndex
  );

if (
  buttonStart < 0 ||
  buttonEnd < 0
) {
  throw new Error(
    "BOTTOM_MARKETPLACE_BUTTON_NOT_FOUND"
  );
}

let buttonBlock =
  mobile.slice(
    buttonStart,
    buttonEnd +
      "</button>".length
  );

buttonBlock =
  buttonBlock.replace(
    /onClick=\{\(\) =>[\s\S]*?\}/,
    `onClick={() =>
            choose("marketplaceHub")
          }`
  );

if (
  !buttonBlock.includes(
    'activeTab === "marketplaceHub"'
  )
) {
  buttonBlock =
    buttonBlock.replace(
      `className={`,
      `className={
            activeTab === "marketplaceHub" ||
`
    );
}

mobile =
  mobile.slice(
    0,
    buttonStart
  ) +
  buttonBlock +
  mobile.slice(
    buttonEnd +
      "</button>".length
  );


/*
 * ========================================================
 * ERP TAB TYPE
 * ========================================================
 */

app =
  app.replace(
    /type\s+Tab\s*=\s*([^;]+);/,
    (
      full,
      body
    ) => {
      if (
        body.includes(
          '"marketplaceHub"'
        )
      ) {
        return full;
      }

      return (
        'type Tab = "marketplaceHub" | ' +
        body.trim() +
        ";"
      );
    }
  );

if (
  !app.includes(
    '"marketplaceHub"'
  )
) {
  throw new Error(
    "MARKETPLACE_TAB_PATCH_FAIL"
  );
}


/*
 * ========================================================
 * ERP STORE DATA BRIDGE
 * ========================================================
 */

if (
  !app.includes(
    "marketplaceStores={stores.map"
  )
) {
  const shellIndex =
    app.indexOf(
      "<MobileAdminShell"
    );

  if (shellIndex < 0) {
    throw new Error(
      "ERP_MOBILE_SHELL_NOT_FOUND"
    );
  }

  const onSelectIndex =
    app.indexOf(
      "        onSelect=",
      shellIndex
    );

  if (onSelectIndex < 0) {
    throw new Error(
      "ERP_ONSELECT_NOT_FOUND"
    );
  }

  const bridge =
    `        marketplaceStores={stores.map(
          (store) => ({
            storeId: String(
              store.STORE_ID || ""
            ),
            storeName: String(
              store.STORE_NAME || ""
            ),
            platform: String(
              store.PLATFORM || ""
            ),
            status: String(
              store.STATUS || ""
            ),
          })
        )}
`;

  app =
    app.slice(
      0,
      onSelectIndex
    ) +
    bridge +
    app.slice(
      onSelectIndex
    );
}


/*
 * ========================================================
 * HIDE SHARED DESKTOP MAIN ON MOBILE MARKETPLACE HUB
 * ========================================================
 */

if (
  !app.includes(
    "rkn-mobile-marketplace-hidden"
  )
) {
  const stockPattern =
    /tab\s*===\s*"stock"\s*\?\s*"main rkn-mobile-stock-hidden"\s*:\s*"main"/;

  const ordersPattern =
    /tab\s*===\s*"orders"\s*\?\s*"main rkn-mobile-orders-hidden"\s*:\s*"main"/;

  const dashboardPattern =
    /tab\s*===\s*"dashboard"\s*\?\s*"main rkn-mobile-dashboard-hidden"\s*:\s*"main"/;

  if (
    stockPattern.test(app)
  ) {
    app =
      app.replace(
        stockPattern,
        `tab === "stock"
                ? "main rkn-mobile-stock-hidden"
                : tab === "marketplaceHub"
                  ? "main rkn-mobile-marketplace-hidden"
                  : "main"`
      );
  }
  else if (
    ordersPattern.test(app)
  ) {
    app =
      app.replace(
        ordersPattern,
        `tab === "orders"
              ? "main rkn-mobile-orders-hidden"
              : tab === "marketplaceHub"
                ? "main rkn-mobile-marketplace-hidden"
                : "main"`
      );
  }
  else if (
    dashboardPattern.test(app)
  ) {
    app =
      app.replace(
        dashboardPattern,
        `tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : tab === "marketplaceHub"
              ? "main rkn-mobile-marketplace-hidden"
              : "main"`
      );
  }
  else {
    const plain =
      '<main className="main">';

    if (
      !app.includes(plain)
    ) {
      throw new Error(
        "ERP_MAIN_NOT_FOUND"
      );
    }

    app =
      app.replace(
        plain,
        `<main
        className={
          tab === "marketplaceHub"
            ? "main rkn-mobile-marketplace-hidden"
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
  "MARKETPLACE_SHELL_PATCH_PASS"
);

console.log(
  "MARKETPLACE_STORE_BRIDGE_PASS"
);

console.log(
  "MARKETPLACE_BOTTOM_NAV_PASS"
);