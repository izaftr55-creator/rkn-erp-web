import Database from "better-sqlite3";

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

console.log("");
console.log("==============================================");
console.log(" RKN HP SESSION FLICKER AUDIT V1");
console.log("==============================================");

console.log("");
console.log("=== FATUR RECENT SESSIONS ===");

const sessions = db.prepare(`
  SELECT
    s.id,
    s.createdAt,
    s.updatedAt,
    s.expiresAt,
    s.ipAddress,
    s.userAgent
  FROM session s
  JOIN user u
    ON u.id = s.userId
  WHERE u.username = 'fatur'
  ORDER BY s.createdAt DESC
  LIMIT 10
`).all();

console.table(sessions);

console.log("");
console.log("SESSION_COUNT =", sessions.length);

db.close();

console.log("");
console.log("RKN_HP_SESSION_FLICKER_AUDIT_V1_PASS");
