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
    const sablon = db.prepare(
      "SELECT id FROM business_unit WHERE id = ? LIMIT 1"
    ).get("BU-SABLON");

    if (!sablon) throw new Error("BU_SABLON_NOT_FOUND");

    const privateDir = path.join(process.cwd(), "data", "private");
    fs.mkdirSync(privateDir, { recursive: true });

    const stamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const backupPath = path.join(
      privateDir,
      "rkn-erp-before-worker-self-registration-v1-" + stamp + ".sqlite"
    );

    await db.backup(backupPath);
    console.log("BACKUP_OK=" + backupPath);

    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS worker_registration_invite (
          id TEXT PRIMARY KEY,
          business_unit_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          active INTEGER NOT NULL DEFAULT 1
            CHECK(active IN (0,1)),
          expires_at TEXT,
          max_uses INTEGER
            CHECK(max_uses IS NULL OR max_uses > 0),
          use_count INTEGER NOT NULL DEFAULT 0
            CHECK(use_count >= 0),
          created_by_user_id TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          revoked_at TEXT,

          FOREIGN KEY (business_unit_id)
            REFERENCES business_unit(id),

          FOREIGN KEY (created_by_user_id)
            REFERENCES user(id)
        );

        CREATE INDEX IF NOT EXISTS idx_worker_registration_invite_bu
          ON worker_registration_invite(business_unit_id);

        CREATE INDEX IF NOT EXISTS idx_worker_registration_invite_active
          ON worker_registration_invite(active);

        CREATE TABLE IF NOT EXISTS worker_registration (
          id TEXT PRIMARY KEY,
          invite_id TEXT NOT NULL,
          business_unit_id TEXT NOT NULL,
          full_name TEXT NOT NULL,
          nickname TEXT,
          whatsapp TEXT NOT NULL,
          address TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'PENDING'
            CHECK(status IN ('PENDING','APPROVED','REJECTED')),
          submitted_at TEXT NOT NULL,
          reviewed_by_user_id TEXT,
          reviewed_at TEXT,
          review_reason TEXT,
          worker_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,

          FOREIGN KEY (invite_id)
            REFERENCES worker_registration_invite(id),

          FOREIGN KEY (business_unit_id)
            REFERENCES business_unit(id),

          FOREIGN KEY (reviewed_by_user_id)
            REFERENCES user(id),

          FOREIGN KEY (worker_id)
            REFERENCES worker(id)
        );

        CREATE INDEX IF NOT EXISTS idx_worker_registration_bu_status
          ON worker_registration(business_unit_id, status);

        CREATE INDEX IF NOT EXISTS idx_worker_registration_whatsapp
          ON worker_registration(whatsapp);

        CREATE INDEX IF NOT EXISTS idx_worker_registration_submitted
          ON worker_registration(submitted_at);

        CREATE TRIGGER IF NOT EXISTS trg_worker_registration_invite_bu_insert
        BEFORE INSERT ON worker_registration
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN (
              SELECT business_unit_id
              FROM worker_registration_invite
              WHERE id = NEW.invite_id
            ) != NEW.business_unit_id
            THEN RAISE(ABORT, 'REGISTRATION_INVITE_BUSINESS_UNIT_MISMATCH')
          END;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_worker_registration_worker_bu_update
        BEFORE UPDATE OF worker_id ON worker_registration
        FOR EACH ROW
        WHEN NEW.worker_id IS NOT NULL
        BEGIN
          SELECT CASE
            WHEN (
              SELECT business_unit_id
              FROM worker
              WHERE id = NEW.worker_id
            ) != NEW.business_unit_id
            THEN RAISE(ABORT, 'REGISTRATION_WORKER_BUSINESS_UNIT_MISMATCH')
          END;
        END;
      `);
    })();

    const inviteCount = db.prepare(
      "SELECT COUNT(*) AS n FROM worker_registration_invite"
    ).get().n;

    const registrationCount = db.prepare(
      "SELECT COUNT(*) AS n FROM worker_registration"
    ).get().n;

    const registrationColumns = new Set(
      db.prepare("PRAGMA table_info(worker_registration)")
        .all()
        .map((row) => row.name)
    );

    console.log("WORKER_SELF_REGISTRATION_V1_OK");
    console.log("INVITE_COUNT=" + inviteCount);
    console.log("REGISTRATION_COUNT=" + registrationCount);
    console.log("HAS_START_DATE=" + registrationColumns.has("start_date"));
    console.log("HAS_ADDRESS=" + registrationColumns.has("address"));
    console.log("HAS_WORKER_ID=" + registrationColumns.has("worker_id"));
  } finally {
    db.close();
  }
})().catch((error) => {
  console.error("WORKER_SELF_REGISTRATION_V1_FAILED=" + error.message);
  process.exitCode = 1;
});