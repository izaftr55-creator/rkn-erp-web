const Database = require("better-sqlite3");
const db = new Database("data/rkn-erp.sqlite", { readonly: true });
try {
  console.log("=== PAYROLL FOUNDATION CHECK ===");
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = ? AND (lower(name) LIKE ? OR lower(name) LIKE ? OR lower(name) LIKE ?) ORDER BY name").all("table", "%payroll%", "%department%", "%worker%");
  console.log("TABLES=" + JSON.stringify(rows.map((r) => r.name)));
  const bu = db.prepare("SELECT id, code, name FROM business_unit WHERE id = ? LIMIT 1").get("BU-RKN");
  console.log("BU_RKN=" + JSON.stringify(bu));
  const role = db.prepare("SELECT id, code, name FROM role WHERE code = ? LIMIT 1").get("RKN_PAYROLL_OFFICER");
  console.log("RKN_PAYROLL_ROLE=" + JSON.stringify(role));
} finally {
  db.close();
}