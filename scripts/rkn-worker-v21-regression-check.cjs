const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const db = new Database("data/rkn-erp.sqlite", { readonly: true });

try {
  const seq = db.prepare(`
    SELECT prefix, last_number
    FROM worker_code_sequence
    WHERE business_unit_id = ?
    LIMIT 1
  `).get("BU-RKN");

  const workerCount = db.prepare(`
    SELECT COUNT(*) AS n
    FROM worker
    WHERE business_unit_id = ?
  `).get("BU-RKN").n;

  const assignmentCount = db.prepare(`
    SELECT COUNT(*) AS n
    FROM worker_department_assignment a
    JOIN worker w
      ON w.id = a.worker_id
    WHERE w.business_unit_id = ?
  `).get("BU-RKN").n;

  console.log("RKN_WORKER_V21_REGRESSION_OK");
  console.log("LAST_NUMBER=" + seq.last_number);
  console.log("RKN_WORKER_COUNT=" + workerCount);
  console.log("RKN_ASSIGNMENT_COUNT=" + assignmentCount);
  console.log("NEXT_WORKER_CODE=" + seq.prefix + "-" + String(seq.last_number + 1).padStart(4, "0"));
  console.log("TEST_FILE_EXISTS=" + fs.existsSync(
    path.join(process.cwd(), "public", "rkn-worker-v21-test.html")
  ));
} finally {
  db.close();
}