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
 * IMPORT MOBILE MENU
 * ========================================================
 */

if (
  !mobile.includes(
    'from "./MobileMenuView"'
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

import MobileMenuView from "./MobileMenuView";`
    );
}


/*
 * ========================================================
 * MOBILE TITLE
 * ========================================================
 */

if (
  !mobile.includes(
    'case "menuHub":'
  )
) {
  const dashboard =
`    case "dashboard":
      return "Beranda Admin";`;

  if (!mobile.includes(dashboard)) {
    fail(
      "MOBILE_TITLE_DASHBOARD_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      dashboard,
`${dashboard}

    case "menuHub":
      return "Menu";`
    );
}


/*
 * ========================================================
 * RENDER MENU PAGE
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_MENU_V8"
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

  const page =
`      {/* RKN_MOBILE_MENU_V8 */}
      {activeTab === "menuHub" && (
        <MobileMenuView
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
 * ACCOUNT BUTTON -> MENU PAGE
 * ========================================================
 */

const accountIndex =
  mobile.indexOf(
    "className={styles.accountButton}"
  );

if (accountIndex < 0) {
  fail(
    "ACCOUNT_BUTTON_NOT_FOUND"
  );
}

const accountEnd =
  mobile.indexOf(
    "</button>",
    accountIndex
  );

if (accountEnd < 0) {
  fail(
    "ACCOUNT_BUTTON_END_NOT_FOUND"
  );
}

let accountBlock =
  mobile.slice(
    accountIndex,
    accountEnd
  );

accountBlock =
  accountBlock.replace(
    /setPanel\("menu"\)/g,
    'choose("menuHub")'
  );

mobile =
  mobile.slice(
    0,
    accountIndex
  ) +
  accountBlock +
  mobile.slice(
    accountEnd
  );


/*
 * ========================================================
 * BOTTOM MENU BUTTON -> MENU PAGE
 * ========================================================
 */

const navIndex =
  mobile.indexOf(
    'className={styles.bottomNav}'
  );

const menuIconIndex =
  mobile.indexOf(
    '<Icon name="menu" />',
    navIndex
  );

if (
  navIndex < 0 ||
  menuIconIndex < 0
) {
  fail(
    "BOTTOM_MENU_NOT_FOUND"
  );
}

const buttonStart =
  mobile.lastIndexOf(
    "<button",
    menuIconIndex
  );

const buttonEnd =
  mobile.indexOf(
    "</button>",
    menuIconIndex
  );

if (
  buttonStart < 0 ||
  buttonEnd < 0
) {
  fail(
    "BOTTOM_MENU_BLOCK_NOT_FOUND"
  );
}

const newMenuButton =
`<button
          type="button"
          className={
            activeTab === "menuHub"
              ? styles.bottomActive
              : undefined
          }
          onClick={() =>
            choose("menuHub")
          }
          aria-current={
            activeTab === "menuHub"
              ? "page"
              : undefined
          }
        >
          <Icon name="menu" />
          <small>Menu</small>
        </button>`;

mobile =
  mobile.slice(
    0,
    buttonStart
  ) +
  newMenuButton +
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
          '"menuHub"'
        )
      ) {
        return full;
      }

      return (
        'type Tab = "menuHub" | ' +
        body.trim() +
        ";"
      );
    }
  );

if (
  !app.includes(
    '"menuHub"'
  )
) {
  fail(
    "MENU_TAB_PATCH_FAIL"
  );
}


/*
 * ========================================================
 * adminTabTitles
 * ========================================================
 */

if (
  !/adminTabTitles[\s\S]{0,700}?menuHub\s*:/.test(
    app
  )
) {
  const regex =
    /(const\s+adminTabTitles\s*:\s*Record<Tab,\s*string>\s*=\s*\{)/;

  if (!regex.test(app)) {
    fail(
      "ADMIN_TAB_TITLES_NOT_FOUND"
    );
  }

  app =
    app.replace(
      regex,
      `$1
    menuHub: "Menu",`
    );
}


/*
 * ========================================================
 * adminTabDescriptions
 * ========================================================
 */

if (
  !/adminTabDescriptions[\s\S]{0,1000}?menuHub\s*:/.test(
    app
  )
) {
  const regex =
    /(const\s+adminTabDescriptions\s*:\s*Record<Tab,\s*string>\s*=\s*\{)/;

  if (!regex.test(app)) {
    fail(
      "ADMIN_TAB_DESCRIPTIONS_NOT_FOUND"
    );
  }

  app =
    app.replace(
      regex,
      `$1
    menuHub:
      "Pusat administrasi, domain ERP, akun, dan akses sistem.",`
    );
}


/*
 * ========================================================
 * titleFor internal map
 * ========================================================
 */

if (
  !/function\s+titleFor\s*\(\s*tab\s*:\s*Tab\s*\)[\s\S]{0,1200}?menuHub\s*:/.test(
    app
  )
) {
  const fnIndex =
    app.search(
      /function\s+titleFor\s*\(\s*tab\s*:\s*Tab\s*\)/
    );

  if (fnIndex < 0) {
    fail(
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
      fnIndex + 1400
  ) {
    fail(
      "TITLE_FOR_MAP_NOT_FOUND"
    );
  }

  const insertAt =
    returnIndex +
    "return ({".length;

  app =
    app.slice(
      0,
      insertAt
    ) +
    ` menuHub: "Menu",` +
    app.slice(
      insertAt
    );
}


/*
 * ========================================================
 * MOBILE MAIN SEPARATION
 * ========================================================
 */

if (
  !app.includes(
    "rkn-mobile-menu-hidden"
  )
) {
  let anchor =
    app.indexOf(
      "rkn-mobile-marketplace-hidden"
    );

  if (anchor < 0) {
    anchor =
      app.indexOf(
        "rkn-mobile-stock-hidden"
      );
  }

  if (anchor < 0) {
    anchor =
      app.indexOf(
        "rkn-mobile-orders-hidden"
      );
  }

  if (anchor < 0) {
    anchor =
      app.indexOf(
        "rkn-mobile-dashboard-hidden"
      );
  }

  if (anchor >= 0) {
    const finalBranch =
      app.indexOf(
        ': "main"',
        anchor
      );

    if (finalBranch < 0) {
      fail(
        "MAIN_FINAL_BRANCH_NOT_FOUND"
      );
    }

    app =
      app.slice(
        0,
        finalBranch
      ) +
      `: tab === "menuHub"
                  ? "main rkn-mobile-menu-hidden"
                  : "main"` +
      app.slice(
        finalBranch +
          ': "main"'.length
      );
  }
  else {
    const plain =
      '<main className="main">';

    if (!app.includes(plain)) {
      fail(
        "ERP_MAIN_NOT_FOUND"
      );
    }

    app =
      app.replace(
        plain,
`<main
        className={
          tab === "menuHub"
            ? "main rkn-mobile-menu-hidden"
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
  "MOBILE_MENU_SOURCE_PATCH_PASS"
);

console.log(
  "MENU_TAB_REGISTRY_PASS"
);

console.log(
  "MENU_NAVIGATION_PASS"
);