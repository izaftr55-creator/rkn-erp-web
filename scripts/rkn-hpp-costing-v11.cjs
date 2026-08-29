const fs =
  require("node:fs");

const appFile =
  process.argv[2];

const menuFile =
  process.argv[3];

const shellFile =
  process.argv[4];

let app =
  fs.readFileSync(
    appFile,
    "utf8"
  );

let menu =
  fs.readFileSync(
    menuFile,
    "utf8"
  );

let shell =
  fs.readFileSync(
    shellFile,
    "utf8"
  );

function fail(message) {
  throw new Error(message);
}


/*
 * ========================================================
 * ERP IMPORT
 * ========================================================
 */

if (
  !app.includes(
    'from "./HppCostingCenter"'
  )
) {
  const anchor =
    'import ERPUserBadge from "./ERPUserBadge";';

  if (!app.includes(anchor)) {
    fail(
      "ERP_IMPORT_ANCHOR_NOT_FOUND"
    );
  }

  app =
    app.replace(
      anchor,
`${anchor}
import HppCostingCenter from "./HppCostingCenter";`
    );
}


/*
 * ========================================================
 * TAB UNION
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
          '"hppCosting"'
        )
      ) {
        return full;
      }

      return (
        'type Tab = "hppCosting" | ' +
        body.trim() +
        ";"
      );
    }
  );

if (
  !app.includes(
    '"hppCosting"'
  )
) {
  fail(
    "HPP_TAB_FAILED"
  );
}


/*
 * ========================================================
 * TAB TITLE REGISTRY
 * ========================================================
 */

if (
  !/adminTabTitles[\s\S]{0,1200}?hppCosting\s*:/.test(
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
    hppCosting: "HPP & Costing",`
    );
}


/*
 * ========================================================
 * TAB DESCRIPTION REGISTRY
 * ========================================================
 */

if (
  !/adminTabDescriptions[\s\S]{0,1600}?hppCosting\s*:/.test(
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
    hppCosting:
      "Kelola HPP manual, costing otomatis, effective date, dan riwayat perubahan.",`
    );
}


/*
 * ========================================================
 * titleFor(Tab)
 * ========================================================
 */

if (
  !/function\s+titleFor\s*\(\s*tab\s*:\s*Tab\s*\)[\s\S]{0,1800}?hppCosting\s*:/.test(
    app
  )
) {
  const fn =
    app.search(
      /function\s+titleFor\s*\(\s*tab\s*:\s*Tab\s*\)/
    );

  if (fn < 0) {
    fail(
      "TITLE_FOR_NOT_FOUND"
    );
  }

  const map =
    app.indexOf(
      "return ({",
      fn
    );

  if (
    map < 0 ||
    map > fn + 2000
  ) {
    fail(
      "TITLE_FOR_MAP_NOT_FOUND"
    );
  }

  const at =
    map +
    "return ({".length;

  app =
    app.slice(0, at) +
    ` hppCosting: "HPP & Costing",` +
    app.slice(at);
}


/*
 * ========================================================
 * SELECT TAB -> OPEN FINANCE GROUP
 * ========================================================
 */

if (
  !app.includes(
    "RKN_HPP_FINANCE_NAV_V11"
  )
) {
  const selectFn =
    app.indexOf(
      "const selectAdminTab"
    );

  if (selectFn < 0) {
    fail(
      "SELECT_ADMIN_TAB_NOT_FOUND"
    );
  }

  const setTab =
    app.indexOf(
      "setTab(nextTab);",
      selectFn
    );

  if (
    setTab < 0 ||
    setTab > selectFn + 1200
  ) {
    fail(
      "SET_TAB_ANCHOR_NOT_FOUND"
    );
  }

  const insertAt =
    setTab +
    "setTab(nextTab);".length;

  app =
    app.slice(
      0,
      insertAt
    ) +
`
    // RKN_HPP_FINANCE_NAV_V11
    if (nextTab === "hppCosting") {
      setAdminNavGroups((current) => ({
        ...current,
        finance: true,
      }));
    }
` +
    app.slice(
      insertAt
    );
}


/*
 * ========================================================
 * DESKTOP FINANCE SUBMENU
 * ========================================================
 */

if (
  !app.includes(
    "RKN_HPP_DESKTOP_NAV_V11"
  )
) {
  const finance =
    app.indexOf(
      "adminNavGroups.finance &&"
    );

  if (finance < 0) {
    fail(
      "FINANCE_SUBMENU_NOT_FOUND"
    );
  }

  const submenu =
    app.indexOf(
      '<div className="admin-nav-submenu">',
      finance
    );

  if (
    submenu < 0 ||
    submenu > finance + 1000
  ) {
    fail(
      "FINANCE_SUBMENU_DIV_NOT_FOUND"
    );
  }

  const insertAt =
    submenu +
    '<div className="admin-nav-submenu">'.length;

  const button =
`
                {/* RKN_HPP_DESKTOP_NAV_V11 */}
                <button
                  type="button"
                  className={
                    tab === "hppCosting"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab(
                      "hppCosting"
                    )
                  }
                >
                  <span>
                    HPP & Costing
                  </span>
                  <small>AKTIF</small>
                </button>
`;

  app =
    app.slice(
      0,
      insertAt
    ) +
    button +
    app.slice(
      insertAt
    );
}


/*
 * ========================================================
 * HPP PAGE
 * ========================================================
 */

if (
  !app.includes(
    "RKN_HPP_PAGE_V11"
  )
) {
  const productsRender =
    app.indexOf(
      '{tab === "products"'
    );

  if (productsRender < 0) {
    fail(
      "PRODUCT_RENDER_ANCHOR_NOT_FOUND"
    );
  }

  const page =
`        {/* RKN_HPP_PAGE_V11 */}
        {tab === "hppCosting" && (
          <HppCostingCenter
            products={products.map(
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
              })
            )}
          />
        )}

`;

  app =
    app.slice(
      0,
      productsRender
    ) +
    page +
    app.slice(
      productsRender
    );
}


/*
 * ========================================================
 * MAIN CLASS FOR MOBILE HPP
 * ========================================================
 */

if (
  !app.includes(
    "rkn-hpp-main"
  )
) {
  const mainStart =
    app.indexOf(
      "<main"
    );

  const mainEnd =
    app.indexOf(
      ">",
      mainStart
    );

  if (
    mainStart < 0 ||
    mainEnd < 0 ||
    mainEnd >
      mainStart + 2200
  ) {
    fail(
      "MAIN_TAG_NOT_FOUND"
    );
  }

  let block =
    app.slice(
      mainStart,
      mainEnd + 1
    );

  if (
    block.includes(
      'className="main"'
    )
  ) {
    block =
      block.replace(
        'className="main"',
`className={
          tab === "hppCosting"
            ? "main rkn-hpp-main"
            : "main"
        }`
      );
  }
  else {
    const terminal =
      block.lastIndexOf(
        ': "main"'
      );

    if (terminal < 0) {
      fail(
        "MAIN_TERMINAL_BRANCH_NOT_FOUND"
      );
    }

    block =
      block.slice(
        0,
        terminal
      ) +
`: tab === "hppCosting"
                  ? "main rkn-hpp-main"
                  : "main"` +
      block.slice(
        terminal +
          ': "main"'.length
      );
  }

  app =
    app.slice(
      0,
      mainStart
    ) +
    block +
    app.slice(
      mainEnd + 1
    );
}


/*
 * ========================================================
 * MOBILE SHELL TITLE
 * ========================================================
 */

if (
  !shell.includes(
    'case "hppCosting":'
  )
) {
  const dashboard =
`    case "dashboard":
      return "Beranda Admin";`;

  if (!shell.includes(dashboard)) {
    fail(
      "MOBILE_TITLE_ANCHOR_NOT_FOUND"
    );
  }

  shell =
    shell.replace(
      dashboard,
`${dashboard}

    case "hppCosting":
      return "HPP & Costing";`
    );
}


/*
 * ========================================================
 * MOBILE MENU REAL HPP BUTTON
 * ========================================================
 */

if (
  !menu.includes(
    "RKN_HPP_MOBILE_MENU_V11"
  )
) {
  const domainList =
    `<div className={styles.domainList}>`;

  const index =
    menu.indexOf(
      domainList
    );

  if (index < 0) {
    fail(
      "MOBILE_DOMAIN_LIST_NOT_FOUND"
    );
  }

  const insertAt =
    index +
    domainList.length;

  const mobileButton =
`
        {/* RKN_HPP_MOBILE_MENU_V11 */}
        <button
          type="button"
          className={styles.domainCard}
          onClick={() =>
            onSelect("hppCosting")
          }
        >
          <span
            className={styles.domainIcon}
          >
            <Icon name="finance" />
          </span>

          <span
            className={styles.domainCopy}
          >
            <strong>
              HPP & Costing
            </strong>

            <small>
              Input HPP manual, kalkulasi otomatis dan riwayat costing.
            </small>
          </span>

          <span
            className={styles.domainEnd}
          >
            <em>AKTIF</em>
            <Icon name="arrow" />
          </span>
        </button>
`;

  menu =
    menu.slice(
      0,
      insertAt
    ) +
    mobileButton +
    menu.slice(
      insertAt
    );
}


/*
 * ========================================================
 * MENU BOTTOM NAV ACTIVE ON HPP CHILD
 * ========================================================
 */

const nav =
  shell.indexOf(
    'className={styles.bottomNav}'
  );

const menuIcon =
  shell.indexOf(
    '<Icon name="menu" />',
    nav
  );

if (
  nav >= 0 &&
  menuIcon >= 0
) {
  const start =
    shell.lastIndexOf(
      "<button",
      menuIcon
    );

  const end =
    shell.indexOf(
      "</button>",
      menuIcon
    );

  if (
    start >= 0 &&
    end >= 0
  ) {
    let button =
      shell.slice(
        start,
        end +
          "</button>".length
      );

    if (
      !button.includes(
        '"hppCosting"'
      )
    ) {
      button =
        button.replace(
          'activeTab === "menuHub"',
          'activeTab === "menuHub" || activeTab === "hppCosting"'
        );

      shell =
        shell.slice(
          0,
          start
        ) +
        button +
        shell.slice(
          end +
            "</button>".length
        );
    }
  }
}


fs.writeFileSync(
  appFile,
  app,
  "utf8"
);

fs.writeFileSync(
  menuFile,
  menu,
  "utf8"
);

fs.writeFileSync(
  shellFile,
  shell,
  "utf8"
);

console.log(
  "HPP_SOURCE_PATCH_PASS"
);

console.log(
  "HPP_TAB_REGISTRY_PASS"
);

console.log(
  "HPP_NAVIGATION_PASS"
);