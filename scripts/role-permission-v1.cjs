const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const matrix = {
  SYSTEM_ADMIN: [
    "system.manage_users",
    "system.manage_roles",
    "system.view_audit"
  ],

  GROUP_OWNER: [
    "system.manage_users",
    "system.view_audit",

    "payroll.view",
    "payroll.approve",
    "payroll.reopen",

    "finance.view",
    "finance.expense.approve",
    "finance.post"
  ],

  RKN_OPERATIONS: [
    "marketplace.view",
    "marketplace.manage",
    "inventory.view",
    "inventory.manage"
  ],

  SABLON_MANAGER: [
    "payroll.view"
  ],

  SABLON_PAYROLL_OFFICER: [
    "payroll.view",
    "payroll.entry",
    "payroll.verify",
    "payroll.submit",
    "payroll.mark_paid",
    "payroll.payslip"
  ],

  SELLER_OWNER: [
    "marketplace.view",
    "marketplace.manage",
    "finance.view"
  ]
};

const getRole = db.prepare(`
  SELECT id, code
  FROM role
  WHERE code = ?
`);

const getPermission = db.prepare(`
  SELECT id, code
  FROM permission
  WHERE code = ?
`);

const insertMapping = db.prepare(`
  INSERT OR IGNORE INTO role_permission
    (role_id, permission_id)
  VALUES (?, ?)
`);

const clearRoleMappings = db.prepare(`
  DELETE FROM role_permission
  WHERE role_id = ?
`);

const seed = db.transaction(() => {
  for (const [roleCode, permissionCodes] of Object.entries(matrix)) {
    const role = getRole.get(roleCode);

    if (!role) {
      throw new Error("ROLE_NOT_FOUND: " + roleCode);
    }

    // V1 canonical matrix:
    // reset only this known system role before rebuilding it.
    clearRoleMappings.run(role.id);

    for (const permissionCode of permissionCodes) {
      const permission = getPermission.get(permissionCode);

      if (!permission) {
        throw new Error(
          "PERMISSION_NOT_FOUND: " +
          roleCode +
          " -> " +
          permissionCode
        );
      }

      insertMapping.run(role.id, permission.id);
    }
  }
});

seed();

const rows = db.prepare(`
  SELECT
    r.code AS role,
    p.code AS permission
  FROM role_permission rp
  JOIN role r
    ON r.id = rp.role_id
  JOIN permission p
    ON p.id = rp.permission_id
  ORDER BY r.code, p.code
`).all();

console.log("ROLE_PERMISSION_V1_OK");
console.log("MATRIX_ROWS=" + rows.length);

for (const roleCode of Object.keys(matrix)) {
  const count = rows.filter(
    row => row.role === roleCode
  ).length;

  console.log(roleCode + "=" + count);
}

db.close();