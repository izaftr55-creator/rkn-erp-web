const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

const row = db.prepare(`
  SELECT
    a.action,
    p.identity_code,
    p.full_name,
    a.entity_type,
    a.created_at
  FROM audit_log a
  LEFT JOIN erp_user_profile p
    ON p.user_id = a.actor_user_id
  WHERE a.action = 'AUTH_PASSWORD_CHANGED'
  ORDER BY a.created_at DESC
  LIMIT 1
`).get();

console.log(row);

db.close();