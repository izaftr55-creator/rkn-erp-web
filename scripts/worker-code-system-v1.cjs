const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const migrate = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_code_sequence (
      business_unit_id TEXT PRIMARY KEY NOT NULL,
      prefix TEXT NOT NULL UNIQUE,
      last_number INTEGER NOT NULL DEFAULT 0
        CHECK (last_number >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    );
  `);

  const sablon = db.prepare(`
    SELECT id
    FROM business_unit
    WHERE id = 'BU-SABLON'
      AND active = 1
    LIMIT 1
  `).get();

  if (!sablon) {
    throw new Error("ACTIVE_BU_SABLON_NOT_FOUND");
  }

  db.prepare(`
    INSERT OR IGNORE INTO worker_code_sequence (
      business_unit_id,
      prefix,
      last_number
    )
    VALUES (
      'BU-SABLON',
      'WRK-SBL',
      0
    )
  `).run();

  const sequence = db.prepare(`
    SELECT
      business_unit_id,
      prefix,
      last_number
    FROM worker_code_sequence
    WHERE business_unit_id = 'BU-SABLON'
    LIMIT 1
  `).get();

  if (!sequence) {
    throw new Error("SABLON_WORKER_SEQUENCE_NOT_FOUND");
  }

  if (sequence.prefix !== "WRK-SBL") {
    throw new Error(
      `SABLON_WORKER_PREFIX_INVALID:${sequence.prefix}`
    );
  }
});

try {
  migrate();

  const sequence = db.prepare(`
    SELECT
      business_unit_id,
      prefix,
      last_number,
      printf('%s-%04d', prefix, last_number + 1)
        AS next_worker_code
    FROM worker_code_sequence
    WHERE business_unit_id = 'BU-SABLON'
  `).get();

  const workerCount = db.prepare(`
    SELECT COUNT(*) AS total
    FROM worker
  `).get();

  console.log("");
  console.log("WORKER_CODE_SYSTEM_V1_OK");
  console.log("WORKERS=" + workerCount.total);

  console.log("");
  console.log("=== SABLON WORKER SEQUENCE ===");
  console.table([sequence]);

  if (sequence.last_number !== 0) {
    throw new Error(
      `UNEXPECTED_INITIAL_SEQUENCE:${sequence.last_number}`
    );
  }

  if (sequence.next_worker_code !== "WRK-SBL-0001") {
    throw new Error(
      `UNEXPECTED_NEXT_WORKER_CODE:${sequence.next_worker_code}`
    );
  }

  console.log("");
  console.log(
    "NEXT_WORKER_CODE=" +
    sequence.next_worker_code
  );
}
finally {
  db.close();
}