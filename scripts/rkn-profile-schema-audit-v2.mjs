import Database from "better-sqlite3";

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

console.log("");
console.log("==============================================");
console.log(" RKN PROFILE SCHEMA AUDIT V2");
console.log("==============================================");

console.log("");
console.log("=== COLUMNS ===");

console.table(
  db.prepare(`
    PRAGMA table_info(erp_user_profile)
  `).all()
);

console.log("");
console.log("=== INDEXES ===");

const indexes = db.prepare(`
  PRAGMA index_list(erp_user_profile)
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
console.log("=== CURRENT PROFILES ===");

console.table(
  db.prepare(`
    SELECT
      u.username,
      p.*
    FROM erp_user_profile p
    JOIN user u
      ON u.id = p.user_id
    ORDER BY u.username
  `).all()
);

db.close();

console.log("");
console.log("RKN_PROFILE_SCHEMA_AUDIT_V2_PASS");
