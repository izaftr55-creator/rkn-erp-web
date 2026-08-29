const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

console.log("=== USER TABLE ===");
console.table(
  db.prepare("PRAGMA table_info('user')").all()
);

console.log("=== USER INDEXES ===");
console.table(
  db.prepare("PRAGMA index_list('user')").all()
);

db.close();