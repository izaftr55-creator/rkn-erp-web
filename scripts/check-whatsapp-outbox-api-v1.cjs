const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(
    process.cwd(),
    "data",
    "rkn-erp.sqlite"
  ),
  { readonly: true }
);

try {
  const result = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(
        CASE
          WHEN event_type = 'WORKER_REJECTED'
          THEN 1 ELSE 0
        END
      ) AS rejected,
      SUM(
        CASE
          WHEN status = 'QUEUED'
          THEN 1 ELSE 0
        END
      ) AS queued
    FROM whatsapp_message_outbox
    WHERE business_unit_id = 'BU-SABLON'
  `).get();

  console.log(
    "OUTBOX_TOTAL=" + result.total
  );

  console.log(
    "OUTBOX_REJECTED=" +
    (result.rejected ?? 0)
  );

  console.log(
    "OUTBOX_QUEUED=" +
    (result.queued ?? 0)
  );
}
finally {
  db.close();
}