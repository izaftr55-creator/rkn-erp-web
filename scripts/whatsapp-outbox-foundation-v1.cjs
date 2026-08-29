const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "rkn-erp.sqlite");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_message_outbox (
      id TEXT PRIMARY KEY,

      business_unit_id TEXT NOT NULL,
      registration_id TEXT,
      worker_id TEXT,

      event_type TEXT NOT NULL
        CHECK (event_type IN (
          'WORKER_APPROVED',
          'WORKER_REJECTED'
        )),

      provider TEXT NOT NULL DEFAULT 'META_WHATSAPP_CLOUD'
        CHECK (provider IN (
          'META_WHATSAPP_CLOUD'
        )),

      recipient_whatsapp TEXT NOT NULL,
      recipient_name TEXT,

      template_name TEXT,
      payload_json TEXT NOT NULL,

      dedupe_key TEXT NOT NULL UNIQUE,

      status TEXT NOT NULL DEFAULT 'QUEUED'
        CHECK (status IN (
          'QUEUED',
          'SENDING',
          'SENT',
          'DELIVERED',
          'READ',
          'FAILED'
        )),

      provider_message_id TEXT,

      attempt_count INTEGER NOT NULL DEFAULT 0
        CHECK (attempt_count >= 0),

      last_error TEXT,
      last_attempt_at TEXT,
      next_attempt_at TEXT,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sent_at TEXT,
      delivered_at TEXT,
      read_at TEXT,

      FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id),

      FOREIGN KEY (registration_id)
        REFERENCES worker_registration(id),

      FOREIGN KEY (worker_id)
        REFERENCES worker(id)
    );

    CREATE INDEX IF NOT EXISTS
      idx_whatsapp_outbox_status_created
      ON whatsapp_message_outbox(status, created_at);

    CREATE INDEX IF NOT EXISTS
      idx_whatsapp_outbox_business_unit
      ON whatsapp_message_outbox(business_unit_id);

    CREATE INDEX IF NOT EXISTS
      idx_whatsapp_outbox_registration
      ON whatsapp_message_outbox(registration_id);

    CREATE INDEX IF NOT EXISTS
      idx_whatsapp_outbox_worker
      ON whatsapp_message_outbox(worker_id);

    CREATE INDEX IF NOT EXISTS
      idx_whatsapp_outbox_provider_message
      ON whatsapp_message_outbox(provider_message_id);
  `);

  const columns = db.prepare(
    "PRAGMA table_info(whatsapp_message_outbox)"
  ).all();

  const indexes = db.prepare(
    "PRAGMA index_list(whatsapp_message_outbox)"
  ).all();

  const count = db.prepare(`
    SELECT COUNT(*) AS n
    FROM whatsapp_message_outbox
  `).get().n;

  const requiredColumns = [
    "id",
    "business_unit_id",
    "registration_id",
    "worker_id",
    "event_type",
    "provider",
    "recipient_whatsapp",
    "recipient_name",
    "template_name",
    "payload_json",
    "dedupe_key",
    "status",
    "provider_message_id",
    "attempt_count",
    "last_error",
    "last_attempt_at",
    "next_attempt_at",
    "created_at",
    "updated_at",
    "sent_at",
    "delivered_at",
    "read_at",
  ];

  const actualColumns = new Set(
    columns.map((column) => column.name)
  );

  for (const required of requiredColumns) {
    if (!actualColumns.has(required)) {
      throw new Error(
        "MISSING_COLUMN_" + required
      );
    }
  }

  if (count !== 0) {
    throw new Error(
      "OUTBOX_NOT_EMPTY_AFTER_FOUNDATION"
    );
  }

  console.log("WHATSAPP_OUTBOX_FOUNDATION_V1_PASS");
  console.log("COLUMN_COUNT=" + columns.length);
  console.log("INDEX_COUNT=" + indexes.length);
  console.log("OUTBOX_COUNT=" + count);
  console.log("DEFAULT_STATUS=QUEUED");
  console.log("PROVIDER=META_WHATSAPP_CLOUD");
  console.log("DEDUPE_KEY_UNIQUE=true");
}
finally {
  db.close();
}