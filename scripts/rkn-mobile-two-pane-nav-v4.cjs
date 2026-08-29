const fs = require("node:fs");

const file = process.argv[2];

let src = fs.readFileSync(file, "utf8");

const pattern =
  /const\s+toggleAdminNavGroup\s*=\s*\(\s*group:\s*AdminNavGroup\s*\)\s*=>\s*\{[\s\S]*?\n\s*\};/;

const match = src.match(pattern);

if (!match) {
  throw new Error(
    "TOGGLE_ADMIN_NAV_GROUP_NOT_FOUND"
  );
}

const replacement = `const toggleAdminNavGroup = (
    group: AdminNavGroup
  ) => {
    /*
     * RKN_ADMIN_MOBILE_TWO_PANE_V4
     *
     * Keep only one navigation group open.
     * Desktop remains functionally identical,
     * while mobile can use one right-side
     * submenu panel without overlap.
     */
    setAdminNavGroups((current) => {
      const next =
        Object.fromEntries(
          Object.keys(current).map(
            (key) => [key, false]
          )
        ) as Record<
          AdminNavGroup,
          boolean
        >;

      next[group] =
        !current[group];

      return next;
    });
  };`;

src = src.replace(
  pattern,
  replacement
);

fs.writeFileSync(
  file,
  src,
  "utf8"
);

console.log(
  "SINGLE_OPEN_NAV_PATCH_PASS"
);
