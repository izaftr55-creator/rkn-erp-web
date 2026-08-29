const fs = require("node:fs");

const file =
  process.argv[2];

let src =
  fs.readFileSync(
    file,
    "utf8"
  );

/*
 * Import dedicated mobile shell.
 */
if (
  !src.includes(
    'import MobileAdminShell from "./MobileAdminShell";'
  )
) {
  const marker =
    'import ERPUserBadge from "./ERPUserBadge";';

  if (!src.includes(marker)) {
    throw new Error(
      "ERP_USER_BADGE_IMPORT_NOT_FOUND"
    );
  }

  src =
    src.replace(
      marker,
      `${marker}
import MobileAdminShell from "./MobileAdminShell";`
    );
}

/*
 * Restore desktop navigation behavior.
 * Mobile no longer depends on desktop accordion state.
 */
const togglePattern =
  /const\s+toggleAdminNavGroup\s*=\s*\(\s*group:\s*AdminNavGroup\s*\)\s*=>\s*\{[\s\S]*?\n\s*\};/;

if (!togglePattern.test(src)) {
  throw new Error(
    "TOGGLE_ADMIN_NAV_GROUP_NOT_FOUND"
  );
}

src =
  src.replace(
    togglePattern,
    `const toggleAdminNavGroup = (
    group: AdminNavGroup
  ) => {
    setAdminNavGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  };`
  );

/*
 * Insert mobile shell between desktop sidebar
 * and shared ERP content.
 */
if (
  !src.includes(
    "RKN_MOBILE_ADMIN_SHELL_V1"
  )
) {
  const shellPattern =
    /<\/aside>\s*\r?\n\s*<main className="main">/;

  if (!shellPattern.test(src)) {
    throw new Error(
      "SIDEBAR_MAIN_BOUNDARY_NOT_FOUND"
    );
  }

  src =
    src.replace(
      shellPattern,
      `</aside>

      {/* RKN_MOBILE_ADMIN_SHELL_V1 */}
      <MobileAdminShell
        activeTab={tab}
        onSelect={(nextTab) =>
          selectAdminTab(nextTab as Tab)
        }
      />

      <main className="main">`
    );
}

fs.writeFileSync(
  file,
  src,
  "utf8"
);

console.log(
  "ERPAPP_MOBILE_SHELL_PATCH_PASS"
);