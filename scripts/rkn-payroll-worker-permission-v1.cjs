const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

(async () => {
  const dbPath = path.join(process.cwd(), "data", "rkn-erp.sqlite");
  if (!fs.existsSync(dbPath)) throw new Error("DB_NOT_FOUND");

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  try {
    const role = db.prepare(
      "SELECT id FROM role WHERE code = ? LIMIT 1"
    ).get("RKN_PAYROLL_OFFICER");

    const permission = db.prepare(
      "SELECT id FROM permission WHERE code = ? LIMIT 1"
    ).get("payroll.manage_workers");

    if (!role) throw new Error("RKN_PAYROLL_ROLE_NOT_FOUND");
    if (!permission) throw new Error("MANAGE_WORKERS_PERMISSION_NOT_FOUND");

    const privateDir = path.join(process.cwd(), "data", "private");
    fs.mkdirSync(privateDir, { recursive: true });

    const stamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const backupPath = path.join(
      privateDir,
      "rkn-erp-before-rkn-worker-permission-v1-" + stamp + ".sqlite"
    );

    await db.backup(backupPath);
    console.log("BACKUP_OK=" + backupPath);

    const existing = db.prepare(`
      SELECT 1
      FROM role_permission
      WHERE role_id = ?
        AND permission_id = ?
      LIMIT 1
    `).get(role.id, permission.id);

    if (!existing) {
      const columns = new Set(
        db.prepare("PRAGMA table_info(role_permission)")
          .all()
          .map((row) => row.name)
      );

      const now = new Date().toISOString();
      const data = {
        id: "RP-RKN-PAYROLL-MANAGE-WORKERS",
        role_id: role.id,
        permission_id: permission.id,
        created_at: now,
        updated_at: now,
      };

      const entries = Object.entries(data)
        .filter(([key]) => columns.has(key));

      const names = entries.map(([key]) => key);
      const values = entries.map(([, value]) => value);

      db.prepare(
        "INSERT INTO role_permission (" +
        names.join(",") +
        ") VALUES (" +
        names.map(() => "?").join(",") +
        ")"
      ).run(...values);
    }

    const allowed = !!db.prepare(`
      SELECT 1
      FROM role r
      JOIN role_permission rp
        ON rp.role_id = r.id
      JOIN permission p
        ON p.id = rp.permission_id
      WHERE r.code = ?
        AND p.code = ?
      LIMIT 1
    `).get(
      "RKN_PAYROLL_OFFICER",
      "payroll.manage_workers"
    );

    const adminAllowed = !!db.prepare(`
      SELECT 1
      FROM role r
      JOIN role_permission rp
        ON rp.role_id = r.id
      JOIN permission p
        ON p.id = rp.permission_id
      WHERE r.code = ?
        AND p.code = ?
      LIMIT 1
    `).get(
      "SYSTEM_ADMIN",
      "payroll.manage_workers"
    );

    console.log("RKN_WORKER_PERMISSION_V1_OK");
    console.log("RKN_PAYROLL_MANAGE_WORKERS=" + allowed);
    console.log("SYSTEM_ADMIN_MANAGE_WORKERS=" + adminAllowed);
    console.log("SECURITY_TEST_FILE_EXISTS=" + fs.existsSync(
      path.join(process.cwd(), "public", "worker-security-test.html")
    ));
  } finally {
    db.close();
  }
})().catch((error) => {
  console.error("RKN_WORKER_PERMISSION_V1_FAILED=" + error.message);
  process.exitCode = 1;
});