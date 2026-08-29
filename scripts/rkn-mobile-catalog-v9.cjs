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

function fail(message) {
  throw new Error(message);
}


/*
 * ========================================================
 * IMPORT
 * ========================================================
 */

if (
  !mobile.includes(
    'from "./MobileCatalogView"'
  )
) {
  const anchor =
    'import styles from "./MobileAdminShell.module.css";';

  if (!mobile.includes(anchor)) {
    fail(
      "MOBILE_STYLE_IMPORT_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      anchor,
`${anchor}

import MobileCatalogView, {
  type MobileProductRow,
  type MobileSkuRow,
  type MobileCatalogStore,
} from "./MobileCatalogView";`
    );
}


/*
 * ========================================================
 * PROPS
 * ========================================================
 */

if (
  !mobile.includes(
    "catalogProducts?: MobileProductRow[];"
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
    fail(
      "MOBILE_PROPS_NOT_FOUND"
    );
  }

  mobile =
    mobile.slice(
      0,
      end
    ) +
`  catalogProducts?: MobileProductRow[];
  catalogSkuRows?: MobileSkuRow[];
  catalogStores?: MobileCatalogStore[];
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
    "catalogProducts,"
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
    fail(
      "MOBILE_FUNCTION_NOT_FOUND"
    );
  }

  mobile =
    mobile.slice(
      0,
      end
    ) +
`  catalogProducts,
  catalogSkuRows,
  catalogStores,
` +
    mobile.slice(end);
}


/*
 * ========================================================
 * RENDER NATIVE CATALOG
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_CATALOG_V9"
  )
) {
  const anchor =
    `      {panel && (`;

  const index =
    mobile.indexOf(anchor);

  if (index < 0) {
    fail(
      "MOBILE_PANEL_ANCHOR_NOT_FOUND"
    );
  }

  const render =
`      {/* RKN_MOBILE_CATALOG_V9 */}
      {(activeTab === "products" ||
        activeTab === "skuColors" ||
        activeTab === "stores") && (
        <MobileCatalogView
          mode={
            activeTab as
              | "products"
              | "skuColors"
              | "stores"
          }
          products={catalogProducts}
          skuRows={catalogSkuRows}
          stores={catalogStores}
          onSelect={choose}
        />
      )}

`;

  mobile =
    mobile.slice(
      0,
      index
    ) +
    render +
    mobile.slice(index);
}


/*
 * ========================================================
 * MARKETPLACE BOTTOM NAV REMAINS ACTIVE
 * FOR ITS CHILD PAGES
 * ========================================================
 */

const navIndex =
  mobile.indexOf(
    'className={styles.bottomNav}'
  );

const marketplaceIcon =
  mobile.indexOf(
    '<Icon name="marketplace" />',
    navIndex
  );

if (
  navIndex < 0 ||
  marketplaceIcon < 0
) {
  fail(
    "MARKETPLACE_BOTTOM_NAV_NOT_FOUND"
  );
}

const buttonStart =
  mobile.lastIndexOf(
    "<button",
    marketplaceIcon
  );

const buttonEnd =
  mobile.indexOf(
    "</button>",
    marketplaceIcon
  );

if (
  buttonStart < 0 ||
  buttonEnd < 0
) {
  fail(
    "MARKETPLACE_BUTTON_BLOCK_NOT_FOUND"
  );
}

const marketplaceButton =
`<button
          type="button"
          className={
            [
              "marketplaceHub",
              "products",
              "skuColors",
              "stores",
            ].includes(activeTab)
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
  marketplaceButton +
  mobile.slice(
    buttonEnd +
      "</button>".length
  );


/*
 * ========================================================
 * ERP DATA BRIDGE
 * ========================================================
 */

if (
  !app.includes(
    "catalogProducts={products.map"
  )
) {
  const shell =
    app.indexOf(
      "<MobileAdminShell"
    );

  if (shell < 0) {
    fail(
      "ERP_MOBILE_SHELL_NOT_FOUND"
    );
  }

  const onSelect =
    app.indexOf(
      "        onSelect=",
      shell
    );

  if (onSelect < 0) {
    fail(
      "ERP_MOBILE_ONSELECT_NOT_FOUND"
    );
  }

  const bridge =
`        catalogProducts={products.map(
          (row) => ({
            productId: String(
              row.PRODUCT_ID || ""
            ),
            sku: String(
              row.SKU || ""
            ),
            productName: String(
              row.PRODUCT_NAME || ""
            ),
            category: String(
              row.CATEGORY || ""
            ),
            variant: String(
              row.VARIANT || ""
            ),
            unit: String(
              row.UNIT || ""
            ),
            hpp: String(
              row.HPP_DEFAULT || ""
            ),
            status: String(
              row.STATUS || ""
            ),
          })
        )}
        catalogSkuRows={skuColors.map(
          (row) => ({
            productName: String(
              row.PRODUCT_NAME || ""
            ),
            family: String(
              row.PRODUCT_FAMILY || ""
            ),
            parentSku: String(
              row.SKU_INDUK || ""
            ),
            variantSku: String(
              row.SKU_VARIAN || ""
            ),
            color: String(
              row.COLOR || ""
            ),
            size: String(
              row.SIZE || ""
            ),
            validationStatus: String(
              row.VALIDATION_STATUS || ""
            ),
            syncEligible: String(
              row.SYNC_ELIGIBLE || ""
            ),
            sourceSheet: String(
              row.SOURCE_SHEET || ""
            ),
            notes: String(
              row.NOTES || ""
            ),
          })
        )}
        catalogStores={stores.map(
          (row) => ({
            storeId: String(
              row.STORE_ID || ""
            ),
            ownerId: String(
              row.OWNER_ID || ""
            ),
            platform: String(
              row.PLATFORM || ""
            ),
            storeName: String(
              row.STORE_NAME || ""
            ),
            storeCode: String(
              row.STORE_CODE || ""
            ),
            status: String(
              row.STATUS || ""
            ),
            apiStatus: String(
              row.API_STATUS || ""
            ),
          })
        )}
`;

  app =
    app.slice(
      0,
      onSelect
    ) +
    bridge +
    app.slice(onSelect);
}


/*
 * ========================================================
 * MOBILE / DESKTOP CONTENT SEPARATION
 * ========================================================
 */

if (
  !app.includes(
    "rkn-mobile-catalog-hidden"
  )
) {
  const mainStart =
    app.indexOf(
      "<main"
    );

  if (mainStart < 0) {
    fail(
      "ERP_MAIN_NOT_FOUND"
    );
  }

  const mainEnd =
    app.indexOf(
      ">",
      mainStart
    );

  if (
    mainEnd < 0 ||
    mainEnd >
      mainStart + 1800
  ) {
    fail(
      "ERP_MAIN_TAG_END_NOT_FOUND"
    );
  }

  let mainBlock =
    app.slice(
      mainStart,
      mainEnd + 1
    );

  if (
    mainBlock.includes(
      'className="main"'
    )
  ) {
    mainBlock =
      mainBlock.replace(
        'className="main"',
`className={
          tab === "products" ||
          tab === "skuColors" ||
          tab === "stores"
            ? "main rkn-mobile-catalog-hidden"
            : "main"
        }`
      );
  }
  else {
    const finalMain =
      mainBlock.lastIndexOf(
        ': "main"'
      );

    if (finalMain < 0) {
      fail(
        "ERP_MAIN_TERMINAL_BRANCH_NOT_FOUND"
      );
    }

    mainBlock =
      mainBlock.slice(
        0,
        finalMain
      ) +
`: tab === "products" ||
                  tab === "skuColors" ||
                  tab === "stores"
                  ? "main rkn-mobile-catalog-hidden"
                  : "main"` +
      mainBlock.slice(
        finalMain +
          ': "main"'.length
      );
  }

  app =
    app.slice(
      0,
      mainStart
    ) +
    mainBlock +
    app.slice(
      mainEnd + 1
    );
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
  "CATALOG_SOURCE_PATCH_PASS"
);

console.log(
  "CATALOG_DATA_BRIDGE_PASS"
);

console.log(
  "CATALOG_NAVIGATION_PASS"
);