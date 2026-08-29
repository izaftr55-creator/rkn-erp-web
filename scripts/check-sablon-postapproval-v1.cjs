const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "rkn-erp.sqlite");
const db = new Database(dbPath, { readonly: true });

try {
  const workerCount = db.prepare(`
    SELECT COUNT(*) AS n
    FROM worker
    WHERE business_unit_id = ?
  `).get("BU-SABLON").n;

  const counts = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
    FROM worker_registration
    WHERE business_unit_id = ?
  `).get("BU-SABLON");

  const linkedApproved = db.prepare(`
    SELECT COUNT(*) AS n
    FROM worker_registration
    WHERE business_unit_id = ?
      AND status = 'APPROVED'
      AND worker_id IS NOT NULL
  `).get("BU-SABLON").n;

  const approvedWorker = db.prepare(`
    SELECT
      w.worker_code AS workerCode,
      w.start_date AS startDate,
      w.active AS active,
      w.business_unit_id AS businessUnitId,
      wr.status AS registrationStatus
    FROM worker_registration wr
    INNER JOIN worker w
      ON w.id = wr.worker_id
    WHERE wr.business_unit_id = ?
      AND wr.status = 'APPROVED'
    ORDER BY wr.reviewed_at DESC
    LIMIT 1
  `).get("BU-SABLON");

  if (!approvedWorker) {
    throw new Error("APPROVED_WORKER_NOT_FOUND");
  }

  const sequence = db.prepare(`
    SELECT prefix, last_number
    FROM worker_code_sequence
    WHERE business_unit_id = ?
    LIMIT 1
  `).get("BU-SABLON");

  if (!sequence) {
    throw new Error("SABLON_WORKER_SEQUENCE_NOT_FOUND");
  }

  const nextCode =
    `${sequence.prefix}-${String(
      sequence.last_number + 1
    ).padStart(4, "0")}`;

  console.log("SABLON_POSTAPPROVAL_DB_CHECK_V1_OK");
  console.log("WORKER_COUNT=" + workerCount);
  console.log("PENDING=" + (counts.pending ?? 0));
  console.log("APPROVED=" + (counts.approved ?? 0));
  console.log("REJECTED=" + (counts.rejected ?? 0));
  console.log("LINKED_APPROVED=" + linkedApproved);
  console.log("WORKER_CODE=" + approvedWorker.workerCode);
  console.log("START_DATE_IS_NULL=" + (approvedWorker.startDate === null));
  console.log("ACTIVE=" + approvedWorker.active);
  console.log("BUSINESS_UNIT=" + approvedWorker.businessUnitId);
  console.log("REGISTRATION_STATUS=" + approvedWorker.registrationStatus);
  console.log("LAST_NUMBER=" + sequence.last_number);
  console.log("NEXT_WORKER_CODE=" + nextCode);
}
finally {
  db.close();
}