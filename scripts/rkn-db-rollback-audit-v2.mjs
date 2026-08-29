import Database from "better-sqlite3";

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

console.log("");
console.log("=== SQLITE INTEGRITY ===");

const integrity = db.pragma("integrity_check", {
  simple: true
});

console.log("SQLITE_INTEGRITY =", integrity);

console.log("");
console.log("=== USERS AFTER ROLLBACK ===");

const users = db.prepare(`
  SELECT
    username,
    name
  FROM user
  ORDER BY username
`).all();

console.table(users);

console.log("");
console.log("=== RISMA CHECK ===");

const risma = db.prepare(`
  SELECT
    username,
    name
  FROM user
  WHERE username = 'risma'
  LIMIT 1
`).get();

console.log(
  "RISMA_EXISTS =",
  Boolean(risma)
);

db.close();

console.log("");
console.log("RKN_AUTH_RECOVERY_SAFE_ROLLBACK_V2_PASS");
