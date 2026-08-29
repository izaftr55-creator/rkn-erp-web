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
    const columnsBefore = db.prepare("PRAGMA table_info(worker)").all();
    const hasAddressBefore = columnsBefore.some((row) => row.name === "address");

    const privateDir = path.join(process.cwd(), "data", "private");
    fs.mkdirSync(privateDir, { recursive: true });

    const stamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const backupPath = path.join(
      privateDir,
      "rkn-erp-before-worker-address-v1-" + stamp + ".sqlite"
    );

    await db.backup(backupPath);
    console.log("BACKUP_OK=" + backupPath);

    if (!hasAddressBefore) {
      db.exec("ALTER TABLE worker ADD COLUMN address TEXT");
    }

    const columnsAfter = db.prepare("PRAGMA table_info(worker)").all();
    const hasAddressAfter = columnsAfter.some((row) => row.name === "address");

    if (!hasAddressAfter) {
      throw new Error("WORKER_ADDRESS_COLUMN_NOT_CREATED");
    }

    const workerCount = db.prepare("SELECT COUNT(*) AS n FROM worker").get().n;

    console.log("WORKER_ADDRESS_FOUNDATION_V1_OK");
    console.log("ADDRESS_EXISTED_BEFORE=" + hasAddressBefore);
    console.log("HAS_ADDRESS_NOW=" + hasAddressAfter);
    console.log("WORKER_COUNT=" + workerCount);
  } finally {
    db.close();
  }
})().catch((error) => {
  console.error("WORKER_ADDRESS_FOUNDATION_V1_FAILED=" + error.message);
  process.exitCode = 1;
});