const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(process.cwd(), "data", "rkn-erp.sqlite"),
  { readonly: true }
);

try {
  const outboxCounts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN event_type = 'WORKER_REJECTED' THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN event_type = 'WORKER_APPROVED' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'QUEUED' THEN 1 ELSE 0 END) AS queued
    FROM whatsapp_message_outbox
    WHERE business_unit_id = ?
  `).get("BU-SABLON");

  const latest = db.prepare(`
    SELECT
      o.registration_id AS registrationId,
      o.worker_id AS workerId,
      o.event_type AS eventType,
      o.status AS outboxStatus,
      o.attempt_count AS attemptCount,
      o.payload_json AS payloadJson,
      wr.status AS registrationStatus,
      wr.review_reason AS reviewReason,
      wr.worker_id AS registrationWorkerId
    FROM whatsapp_message_outbox o
    INNER JOIN worker_registration wr
      ON wr.id = o.registration_id
    WHERE o.business_unit_id = ?
      AND o.event_type = 'WORKER_REJECTED'
    ORDER BY o.created_at DESC, o.rowid DESC
    LIMIT 1
  `).get("BU-SABLON");

  if (!latest) {
    throw new Error("REJECT_OUTBOX_NOT_FOUND");
  }

  const payload = JSON.parse(latest.payloadJson);

  const sequence = db.prepare(`
    SELECT prefix, last_number
    FROM worker_code_sequence
    WHERE business_unit_id = ?
    LIMIT 1
  `).get("BU-SABLON");

  const workerCount = db.prepare(`
    SELECT COUNT(*) AS n
    FROM worker
    WHERE business_unit_id = ?
  `).get("BU-SABLON").n;

  const registrationCounts = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
    FROM worker_registration
    WHERE business_unit_id = ?
  `).get("BU-SABLON");

  const nextCode =
    `${sequence.prefix}-${String(
      sequence.last_number + 1
    ).padStart(4, "0")}`;

  console.log("WHATSAPP_REJECT_QUEUE_V1_CHECK_PASS");
  console.log("OUTBOX_TOTAL=" + outboxCounts.total);
  console.log("OUTBOX_REJECTED=" + (outboxCounts.rejected ?? 0));
  console.log("OUTBOX_APPROVED=" + (outboxCounts.approved ?? 0));
  console.log("OUTBOX_QUEUED=" + (outboxCounts.queued ?? 0));
  console.log("LATEST_EVENT=" + latest.eventType);
  console.log("LATEST_STATUS=" + latest.outboxStatus);
  console.log("ATTEMPT_COUNT=" + latest.attemptCount);
  console.log("REGISTRATION_STATUS=" + latest.registrationStatus);
  console.log("REASON_MATCH=" + (
    latest.reviewReason === "DATA TEST SISTEM" &&
    payload.reason === "DATA TEST SISTEM"
  ));
  console.log("OUTBOX_WORKER_IS_NULL=" + (latest.workerId === null));
  console.log("REGISTRATION_WORKER_IS_NULL=" + (latest.registrationWorkerId === null));
  console.log("WORKER_COUNT=" + workerCount);
  console.log("PENDING=" + (registrationCounts.pending ?? 0));
  console.log("APPROVED=" + (registrationCounts.approved ?? 0));
  console.log("REJECTED=" + (registrationCounts.rejected ?? 0));
  console.log("LAST_NUMBER=" + sequence.last_number);
  console.log("NEXT_WORKER_CODE=" + nextCode);
}
finally {
  db.close();
}