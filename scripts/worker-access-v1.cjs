const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const PERMISSION_CODE = "payroll.manage_workers";
const PERMISSION_ID = "PERM-PAYROLL-WORKERS";

const allowedRoles = [
  "SABLON_MANAGER",
  "SABLON_PAYROLL_OFFICER",
];

const forbiddenRoles = [
  "GROUP_OWNER",
  "SYSTEM_ADMIN",
];

const migrate = db.transaction(() => {
  let permission = db.prepare(`
    SELECT id, code
    FROM permission
    WHERE code = ?
    LIMIT 1
  `).get(PERMISSION_CODE);

  if (!permission) {
    db.prepare(`
      INSERT INTO permission (
        id,
        code,
        module,
        name,
        description
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      PERMISSION_ID,
      PERMISSION_CODE,
      "PAYROLL",
      "Manage Payroll Workers",
      "Create and edit payroll worker master data"
    );

    permission = db.prepare(`
      SELECT id, code
      FROM permission
      WHERE code = ?
      LIMIT 1
    `).get(PERMISSION_CODE);
  }

  if (!permission) {
    throw new Error("WORKER_PERMISSION_CREATE_FAILED");
  }

  for (const roleCode of allowedRoles) {
    const role = db.prepare(`
      SELECT id, code
      FROM role
      WHERE code = ?
      LIMIT 1
    `).get(roleCode);

    if (!role) {
      throw new Error(`ROLE_NOT_FOUND:${roleCode}`);
    }

    db.prepare(`
      INSERT OR IGNORE INTO role_permission (
        role_id,
        permission_id
      )
      VALUES (?, ?)
    `).run(
      role.id,
      permission.id
    );
  }

  for (const roleCode of forbiddenRoles) {
    const row = db.prepare(`
      SELECT COUNT(*) AS total
      FROM role_permission rp
      JOIN role r
        ON r.id = rp.role_id
      WHERE r.code = ?
        AND rp.permission_id = ?
    `).get(
      roleCode,
      permission.id
    );

    if (row.total !== 0) {
      throw new Error(
        `FORBIDDEN_ROLE_HAS_WORKER_PERMISSION:${roleCode}`
      );
    }
  }

  const assignments = db.prepare(`
    SELECT
      r.code AS role_code,
      p.code AS permission_code
    FROM role_permission rp
    JOIN role r
      ON r.id = rp.role_id
    JOIN permission p
      ON p.id = rp.permission_id
    WHERE p.code = ?
    ORDER BY r.code
  `).all(PERMISSION_CODE);

  if (assignments.length !== 2) {
    throw new Error(
      `WORKER_PERMISSION_ASSIGNMENT_COUNT_INVALID:${assignments.length}`
    );
  }
});

try {
  migrate();

  console.log("");
  console.log("WORKER_ACCESS_V1_OK");

  console.log("");
  console.log("=== WORKER ACCESS MATRIX ===");

  console.table(
    db.prepare(`
      SELECT
        r.code AS role_code,
        p.code AS permission_code
      FROM role_permission rp
      JOIN role r
        ON r.id = rp.role_id
      JOIN permission p
        ON p.id = rp.permission_id
      WHERE p.code = ?
      ORDER BY r.code
    `).all(PERMISSION_CODE)
  );

  const checks = {};

  for (const roleCode of [
    "SABLON_MANAGER",
    "SABLON_PAYROLL_OFFICER",
    "GROUP_OWNER",
    "SYSTEM_ADMIN"
  ]) {
    const row = db.prepare(`
      SELECT COUNT(*) AS total
      FROM role_permission rp
      JOIN role r
        ON r.id = rp.role_id
      JOIN permission p
        ON p.id = rp.permission_id
      WHERE r.code = ?
        AND p.code = ?
    `).get(
      roleCode,
      PERMISSION_CODE
    );

    checks[roleCode] = row.total === 1;
  }

  console.log("");
  console.log("SABLON_MANAGER_CAN_MANAGE_WORKERS=" +
    checks.SABLON_MANAGER);

  console.log("SABLON_PAYROLL_CAN_MANAGE_WORKERS=" +
    checks.SABLON_PAYROLL_OFFICER);

  console.log("GROUP_OWNER_CAN_MANAGE_WORKERS=" +
    checks.GROUP_OWNER);

  console.log("SYSTEM_ADMIN_CAN_MANAGE_WORKERS=" +
    checks.SYSTEM_ADMIN);
}
finally {
  db.close();
}