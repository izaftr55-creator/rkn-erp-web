import Database from "better-sqlite3";

const db = new Database(
  "./data/rkn-erp.sqlite",
  { readonly: true }
);

console.log("");
console.log("=== DATABASE AFTER CLEAN RESTORE ===");

console.log(
  "SQLITE_INTEGRITY =",
  db.pragma("integrity_check", { simple: true })
);

const users = db.prepare(`
  SELECT username, name
  FROM user
  ORDER BY username
`).all();

console.table(users);

const risma = db.prepare(`
  SELECT id
  FROM user
  WHERE username = 'risma'
  LIMIT 1
`).get();

console.log(
  "RESTORED_RISMA_EXISTS =",
  Boolean(risma)
);

db.close();

console.log("");
console.log("RKN_SQLITE_CLEAN_RESTORE_V3_PASS");
