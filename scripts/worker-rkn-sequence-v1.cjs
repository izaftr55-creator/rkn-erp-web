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
    const bu = db.prepare(
      "SELECT id FROM business_unit WHERE id = ? LIMIT 1"
    ).get("BU-RKN");

    if (!bu) throw new Error("BU_RKN_NOT_FOUND");

    const privateDir = path.join(process.cwd(), "data", "private");
    fs.mkdirSync(privateDir, { recursive: true });

    const stamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const backupPath = path.join(
      privateDir,
      "rkn-erp-before-worker-rkn-sequence-v1-" + stamp + ".sqlite"
    );

    await db.backup(backupPath);
    console.log("BACKUP_OK=" + backupPath);

    const existing = db.prepare(`
      SELECT
        business_unit_id,
        prefix,
        last_number
      FROM worker_code_sequence
      WHERE business_unit_id = ?
      LIMIT 1
    `).get("BU-RKN");

    if (!existing) {
      db.prepare(`
        INSERT INTO worker_code_sequence (
          business_unit_id,
          prefix,
          last_number
        )
        VALUES (?, ?, ?)
      `).run(
        "BU-RKN",
        "WRK-RKN",
        0
      );
    }

    const row = db.prepare(`
      SELECT
        business_unit_id,
        prefix,
        last_number
      FROM worker_code_sequence
      WHERE business_unit_id = ?
      LIMIT 1
    `).get("BU-RKN");

    if (!row) throw new Error("RKN_SEQUENCE_NOT_CREATED");
    if (row.prefix !== "WRK-RKN") throw new Error("RKN_PREFIX_MISMATCH");
    if (row.last_number !== 0) throw new Error("RKN_SEQUENCE_ALREADY_CONSUMED");

    console.log("WORKER_RKN_SEQUENCE_V1_OK");
    console.log("BUSINESS_UNIT=" + row.business_unit_id);
    console.log("PREFIX=" + row.prefix);
    console.log("LAST_NUMBER=" + row.last_number);
    console.log("NEXT_WORKER_CODE=" + row.prefix + "-" + String(row.last_number + 1).padStart(4, "0"));
  } finally {
    db.close();
  }
})().catch((error) => {
  console.error("WORKER_RKN_SEQUENCE_V1_FAILED=" + error.message);
  process.exitCode = 1;
});