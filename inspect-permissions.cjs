const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

const permissions = db.prepare(`
  SELECT id, code, module, name
  FROM permission
  ORDER BY module, code
`).all();

console.table(permissions);

console.log("PERMISSION_COUNT=" + permissions.length);

db.close();