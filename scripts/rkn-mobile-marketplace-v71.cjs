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
  const anchor =
    'import styles from "./MobileAdminShell.module.css";';

  if (!mobile.includes(anchor)) {
    throw new Error(
      "MOBILE_STYLE_IMPORT_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      anchor,
      `${anchor}

import MobileMarketplaceView, {
  type MobileMarketplaceStore,
} from "./MobileMarketplaceView";`
    );
}


/*
 * ========================================================
 * MOBILE PROP TYPE
 * ========================================================
 */

if (
  !mobile.includes(
    "marketplaceStores?: MobileMarketplaceStore[];"
  )
) {
  const start =
    mobile.indexOf(
      "type Props = {"
    );

  const end =
    mobile.indexOf(
      "};",
      start
    );

  if (
    start < 0 ||
    end < 0
  ) {
    throw new Error(
      "MOBILE_PROPS_NOT_FOUND"
    );
  }

  mobile =
    mobile.slice(0, end) +
    `  marketplaceStores?: MobileMarketplaceStore[];
` +
    mobile.slice(end);
}


/*
 * ========================================================
 * FUNCTION DESTRUCTURING
 * ========================================================
 */

if (
  !mobile.includes(
    "marketplaceStores,"
  )
) {
  const start =
    mobile.indexOf(
      "export default function MobileAdminShell({"
    );

  const end =
    mobile.indexOf(
      "}: Props) {",
      start
    );

  if (
    start < 0 ||
    end < 0
  ) {
    throw new Error(
      "MOBILE_FUNCTION_NOT_FOUND"
    );
  }

  mobile =
    mobile.slice(0, end) +
    `  marketplaceStores,
` +
    mobile.slice(end);
}


/*
 * ========================================================
 * MOBILE TITLE
 * ========================================================
 */

if (
  !mobile.includes(
    'case "marketplaceHub":'
  )
) {
  const dashboard =
`    case "dashboard":
      return "Beranda Admin";`;

  if (
    !mobile.includes(dashboard)
  ) {
    throw new Error(
      "MOBILE_TITLE_CASE_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      dashboard,
`${dashboard}

    case "marketplaceHub":
      return "Marketplace";`
    );
}


/*
 * ========================================================
 * ORDERS MUST NOT ACTIVATE MARKETPLACE
 * ========================================================
 */

mobile =
  mobile.replace(
    /const marketplaceTabs = \[\s*"orders",/,
    "const marketplaceTabs = ["
  );


/*
 * ========================================================
 * MOBILE MARKETPLACE PAGE
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_MARKETPLACE_V71"
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

  const page =
`      {/* RKN_MOBILE_MARKETPLACE_V71 */}
      {activeTab === "marketplaceHub" && (
        <MobileMarketplaceView
          stores={marketplaceStores}
          onSelect={choose}
          onPlanned={openPlanned}
        />
      )}

`;

  mobile =
    mobile.slice(0, index) +
    page +
    mobile.slice(index);
}


/*
 * ========================================================
 * BOTTOM MARKETPLACE BUTTON
 * ========================================================
 */

const navIndex =
  mobile.indexOf(
    'className={styles.bottomNav}'
  );

const iconIndex =
  mobile.indexOf(
    '<Icon name="marketplace" />',
    navIndex
  );

if (
  navIndex < 0 ||
  iconIndex < 0
) {
  throw new Error(
    "MARKETPLACE_BOTTOM_BUTTON_NOT_FOUND"
  );
}

const buttonStart =
  mobile.lastIndexOf(
    "<button",
    iconIndex
  );

const buttonEnd =
  mobile.indexOf(
    "</button>",
    iconIndex
  );

if (
  buttonStart < 0 ||
  buttonEnd < 0
) {
  throw new Error(
    "MARKETPLACE_BOTTOM_BLOCK_NOT_FOUND"
  );
}

const newButton =
`<button
          type="button"
          className={
            activeTab === "marketplaceHub"
              ? styles.bottomActive
              : undefined
          }
          onClick={() =>
            choose("marketplaceHub")
          }
          aria-current={
            activeTab === "marketplaceHub"
              ? "page"
              : undefined
          }
        >
          <Icon name="marketplace" />
          <small>Marketplace</small>
        </button>`;

mobile =
  mobile.slice(
    0,
    buttonStart
  ) +
  newButton +
  mobile.slice(
    buttonEnd +
      "</button>".length
  );


/*
 * ========================================================
 * ERP TAB UNION
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
    "ERP_TAB_PATCH_FAILED"
  );
}


/*
 * ========================================================
 * FIX #1:
 * adminTabTitles Record<Tab,string>
 * ========================================================
 */

if (
  !/adminTabTitles[\s\S]{0,500}?marketplaceHub\s*:/.test(
    app
  )
) {
  const regex =
    /(const\s+adminTabTitles\s*:\s*Record<Tab,\s*string>\s*=\s*\{)/;

  if (!regex.test(app)) {
    throw new Error(
      "ADMIN_TAB_TITLES_NOT_FOUND"
    );
  }

  app =
    app.replace(
      regex,
      `$1
    marketplaceHub: "Marketplace",`
    );
}


/*
 * ========================================================
 * FIX #2:
 * adminTabDescriptions Record<Tab,string>
 * ========================================================
 */

if (
  !/adminTabDescriptions[\s\S]{0,700}?marketplaceHub\s*:/.test(
    app
  )
) {
  const regex =
    /(const\s+adminTabDescriptions\s*:\s*Record<Tab,\s*string>\s*=\s*\{)/;

  if (!regex.test(app)) {
    throw new Error(
      "ADMIN_TAB_DESCRIPTIONS_NOT_FOUND"
    );
  }

  app =
    app.replace(
      regex,
      `$1
    marketplaceHub:
      "Pusat kendali marketplace, toko, operasional, settlement, dan integrasi API.",`
    );
}


/*
 * ========================================================
 * FIX #3:
 * titleFor(Tab) internal map
 * ========================================================
 */

if (
  !/function\s+titleFor\s*\(\s*tab\s*:\s*Tab\s*\)[\s\S]{0,800}?marketplaceHub\s*:/.test(
    app
  )
) {
  const fnIndex =
    app.search(
      /function\s+titleFor\s*\(\s*tab\s*:\s*Tab\s*\)/
    );

  if (fnIndex < 0) {
    throw new Error(
      "TITLE_FOR_FUNCTION_NOT_FOUND"
    );
  }

  const returnIndex =
    app.indexOf(
      "return ({",
      fnIndex
    );

  if (
    returnIndex < 0 ||
    returnIndex >
      fnIndex + 1200
  ) {
    throw new Error(
      "TITLE_FOR_MAP_NOT_FOUND"
    );
  }

  const insertAt =
    returnIndex +
    "return ({".length;

  app =
    app.slice(0, insertAt) +
    ` marketplaceHub: "Marketplace",` +
    app.slice(insertAt);
}


/*
 * ========================================================
 * ERP STORE BRIDGE
 * ========================================================
 */

if (
  !app.includes(
    "marketplaceStores={stores.map"
  )
) {
  const shell =
    app.indexOf(
      "<MobileAdminShell"
    );

  if (shell < 0) {
    throw new Error(
      "MOBILE_SHELL_RENDER_NOT_FOUND"
    );
  }

  const onSelect =
    app.indexOf(
      "        onSelect=",
      shell
    );

  if (onSelect < 0) {
    throw new Error(
      "MOBILE_ONSELECT_NOT_FOUND"
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
    app.slice(0, onSelect) +
    bridge +
    app.slice(onSelect);
}


/*
 * ========================================================
 * HIDE DESKTOP MAIN ON MOBILE HUB
 * ========================================================
 */

if (
  !app.includes(
    "rkn-mobile-marketplace-hidden"
  )
) {
  let anchorIndex =
    app.indexOf(
      "rkn-mobile-stock-hidden"
    );

  if (anchorIndex < 0) {
    anchorIndex =
      app.indexOf(
        "rkn-mobile-orders-hidden"
      );
  }

  if (anchorIndex < 0) {
    anchorIndex =
      app.indexOf(
        "rkn-mobile-dashboard-hidden"
      );
  }

  if (anchorIndex >= 0) {
    const finalMain =
      app.indexOf(
        ': "main"',
        anchorIndex
      );

    if (finalMain < 0) {
      throw new Error(
        "ERP_MAIN_FINAL_BRANCH_NOT_FOUND"
      );
    }

    app =
      app.slice(0, finalMain) +
      `: tab === "marketplaceHub"
                  ? "main rkn-mobile-marketplace-hidden"
                  : "main"` +
      app.slice(
        finalMain +
          ': "main"'.length
      );
  }
  else {
    const plain =
      '<main className="main">';

    if (!app.includes(plain)) {
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
  "V71_SOURCE_PATCH_PASS"
);

console.log(
  "TAB_REGISTRY_FIX_PASS"
);

console.log(
  "STORE_BRIDGE_PASS"
);