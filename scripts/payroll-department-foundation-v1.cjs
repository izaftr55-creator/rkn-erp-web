const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

(async () => {
  const dbPath = path.join(process.cwd(), "data", "rkn-erp.sqlite");

  if (!fs.existsSync(dbPath)) {
    throw new Error("DB_NOT_FOUND");
  }

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  try {
    const privateDir = path.join(process.cwd(), "data", "private");
    fs.mkdirSync(privateDir, { recursive: true });

    const stamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const backupPath = path.join(
      privateDir,
      "rkn-erp-before-payroll-department-v1-" + stamp + ".sqlite"
    );

    await db.backup(backupPath);
    console.log("BACKUP_OK=" + backupPath);

    const bu = db.prepare(
      "SELECT id FROM business_unit WHERE id = ? LIMIT 1"
    ).get("BU-RKN");

    if (!bu) {
      throw new Error("BU_RKN_NOT_FOUND");
    }

    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS payroll_department (
          id TEXT PRIMARY KEY,
          business_unit_id TEXT NOT NULL,
          code TEXT NOT NULL,
          name TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,

          FOREIGN KEY (business_unit_id)
            REFERENCES business_unit(id),

          UNIQUE (business_unit_id, code)
        );

        CREATE INDEX IF NOT EXISTS idx_payroll_department_business_unit
          ON payroll_department(business_unit_id);

        CREATE INDEX IF NOT EXISTS idx_payroll_department_active
          ON payroll_department(active);
      `);

      const now = new Date().toISOString();

      const insert = db.prepare(`
        INSERT INTO payroll_department (
          id,
          business_unit_id,
          code,
          name,
          active,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(business_unit_id, code)
        DO UPDATE SET
          name = excluded.name,
          active = 1,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at
      `);

      const departments = [
        ["DEP-RKN-CUTTING",   "CUTTING",   "Cutting",   10],
        ["DEP-RKN-SEWING",    "SEWING",    "Sewing",    20],
        ["DEP-RKN-FINISHING", "FINISHING", "Finishing", 30],
        ["DEP-RKN-PACKING",   "PACKING",   "Packing",   40]
      ];

      for (const [id, code, name, sortOrder] of departments) {
        insert.run(
          id,
          "BU-RKN",
          code,
          name,
          sortOrder,
          now,
          now
        );
      }
    })();

    const rows = db.prepare(`
      SELECT
        id,
        business_unit_id,
        code,
        name,
        active,
        sort_order
      FROM payroll_department
      WHERE business_unit_id = ?
      ORDER BY sort_order, code
    `).all("BU-RKN");

    console.log("PAYROLL_DEPARTMENT_V1_OK");
    console.log("DEPARTMENT_COUNT=" + rows.length);

    for (const row of rows) {
      console.log(
        row.code +
        "|BU=" + row.business_unit_id +
        "|ACTIVE=" + row.active +
        "|ORDER=" + row.sort_order
      );
    }
  } finally {
    db.close();
  }
})().catch((error) => {
  console.error("PAYROLL_DEPARTMENT_V1_FAILED=" + error.message);
  process.exitCode = 1;
});