const Database = require("better-sqlite3");
const db = new Database("data/rkn-erp.sqlite", { readonly: true });

try {
  console.log("=== WORKER SEQUENCE CHECK ===");

  const rows = db.prepare(`
    SELECT
      business_unit_id,
      prefix,
      last_number
    FROM worker_code_sequence
    ORDER BY business_unit_id
  `).all();

  console.log("SEQUENCES=" + JSON.stringify(rows));

  const counts = db.prepare(`
    SELECT
      business_unit_id,
      COUNT(*) AS worker_count
    FROM worker
    GROUP BY business_unit_id
    ORDER BY business_unit_id
  `).all();

  console.log("WORKERS_BY_BU=" + JSON.stringify(counts));
} finally {
  db.close();
}