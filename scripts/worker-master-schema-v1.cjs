const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const migrate = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker (
      id TEXT PRIMARY KEY NOT NULL,

      worker_code TEXT NOT NULL UNIQUE,

      business_unit_id TEXT NOT NULL,

      full_name TEXT NOT NULL,
      nickname TEXT,

      worker_type TEXT NOT NULL DEFAULT 'BORONGAN'
        CHECK (
          worker_type IN (
            'BORONGAN',
            'HARIAN',
            'BULANAN',
            'OTHER'
          )
        ),

      whatsapp TEXT,

      payment_method TEXT NOT NULL DEFAULT 'CASH'
        CHECK (
          payment_method IN (
            'CASH',
            'BANK_TRANSFER',
            'EWALLET',
            'OTHER'
          )
        ),

      start_date TEXT,
      end_date TEXT,

      active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),

      notes TEXT,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_worker_business_unit
      ON worker(business_unit_id);

    CREATE INDEX IF NOT EXISTS idx_worker_active
      ON worker(active);

    CREATE INDEX IF NOT EXISTS idx_worker_full_name
      ON worker(full_name);
  `);
});

try {
  migrate();

  const sablon = db.prepare(`
    SELECT id, code, name, active
    FROM business_unit
    WHERE id = ?
    LIMIT 1
  `).get("BU-SABLON");

  if (!sablon) {
    throw new Error("BU-SABLON_NOT_FOUND");
  }

  const columns = db.prepare(`
    PRAGMA table_info(worker)
  `).all();

  const indexes = db.prepare(`
    PRAGMA index_list(worker)
  `).all();

  const count = db.prepare(`
    SELECT COUNT(*) AS total
    FROM worker
  `).get();

  console.log("");
  console.log("WORKER_MASTER_SCHEMA_V1_OK");
  console.log("SABLON_UNIT=", sablon);
  console.log("WORKERS=", count.total);

  console.log("");
  console.log("=== WORKER COLUMNS ===");
  console.table(columns);

  console.log("");
  console.log("=== WORKER INDEXES ===");
  console.table(indexes);
}
finally {
  db.close();
}