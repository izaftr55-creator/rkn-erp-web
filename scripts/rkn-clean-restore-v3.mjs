import Database from "better-sqlite3";

const backupPath =
  "C:/RKN-ERP/rkn-erp-web/data/rkn-erp.before-auth-recovery-2026-08-12T05-41-14-460Z.sqlite";

const db = new Database(backupPath, {
  readonly: true,
  fileMustExist: true
});

console.log("");
console.log("=== ORIGINAL BACKUP USERS ===");

const users = db.prepare(`
  SELECT username, name
  FROM user
  ORDER BY username
`).all();

console.table(users);

const risma = db.prepare(`
  SELECT id, username, name
  FROM user
  WHERE username = 'risma'
  LIMIT 1
`).get();

console.log("BACKUP_RISMA_EXISTS =", Boolean(risma));

console.log(
  "BACKUP_INTEGRITY =",
  db.pragma("integrity_check", { simple: true })
);

db.close();
