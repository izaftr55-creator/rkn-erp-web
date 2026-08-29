import Database from "better-sqlite3";

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

console.log("");
console.log("==============================================");
console.log(" RKN USER_ROLE SCHEMA AUDIT V1");
console.log("==============================================");

console.log("");
console.log("=== COLUMNS ===");

console.table(
  db.prepare(`
    PRAGMA table_info(user_role)
  `).all()
);

console.log("");
console.log("=== INDEXES ===");

const indexes = db.prepare(`
  PRAGMA index_list(user_role)
`).all();

console.table(indexes);

for (const index of indexes) {

  if (index.unique === 1) {

    console.log("");
    console.log("UNIQUE_INDEX =", index.name);

    console.table(
      db.prepare(
        `PRAGMA index_info("${index.name}")`
      ).all()
    );
  }
}

console.log("");
console.log("=== EXISTING GROUP OWNER ROW ===");

console.table(
  db.prepare(`
    SELECT
      ur.*,
      u.username,
      r.code AS role_code
    FROM user_role ur
    JOIN user u
      ON u.id = ur.user_id
    JOIN role r
      ON r.id = ur.role_id
    WHERE r.code = 'GROUP_OWNER'
  `).all()
);

db.close();

console.log("");
console.log("RKN_USER_ROLE_SCHEMA_AUDIT_V1_PASS");
