const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite", {
  readonly: true
});

const rows = db.prepare(`
  SELECT
    r.code AS role,
    p.code AS permission
  FROM role_permission rp
  JOIN role r ON r.id = rp.role_id
  JOIN permission p ON p.id = rp.permission_id
  ORDER BY r.code, p.code
`).all();

console.log(
  "OWNER_CAN_APPROVE_PAYROLL=" +
  rows.some(
    row =>
      row.role === "GROUP_OWNER" &&
      row.permission === "payroll.approve"
  )
);

console.log(
  "SYSTEM_ADMIN_CAN_APPROVE_PAYROLL=" +
  rows.some(
    row =>
      row.role === "SYSTEM_ADMIN" &&
      row.permission === "payroll.approve"
  )
);

console.log(
  "SABLON_PAYROLL_CAN_APPROVE=" +
  rows.some(
    row =>
      row.role === "SABLON_PAYROLL_OFFICER" &&
      row.permission === "payroll.approve"
  )
);

console.log(
  "SABLON_PAYROLL_CAN_SUBMIT=" +
  rows.some(
    row =>
      row.role === "SABLON_PAYROLL_OFFICER" &&
      row.permission === "payroll.submit"
  )
);

db.close();