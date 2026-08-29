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
    JOIN worker w ON w.id = a.worker_id
    WHERE w.business_unit_id = ?
  `).get("BU-RKN").n;

  const departments = db.prepare(`
    SELECT code
    FROM payroll_department
    WHERE business_unit_id = ?
      AND active = 1
    ORDER BY sort_order
  `).all("BU-RKN").map((r) => r.code);

  const expected = [
    "CUTTING",
    "SEWING",
    "FINISHING",
    "PACKING"
  ];

  const departmentPass =
    JSON.stringify(departments) ===
    JSON.stringify(expected);

  const tempFiles = [
    "rkn-worker-v21-primary-test.html",
    "rkn-worker-v21-test.html",
    "rkn-worker-post-test.html",
    "rkn-worker-packing-test.html",
    "worker-security-test.html"
  ];

  const tempFilesExist = tempFiles.some((name) =>
    fs.existsSync(path.join(process.cwd(), "public", name))
  );

  console.log("WORKER_API_V21_FREEZE_CHECK_OK");
  console.log("RKN_WORKER_COUNT=" + workerCount);
  console.log("RKN_ASSIGNMENT_COUNT=" + assignmentCount);
  console.log("LAST_NUMBER=" + seq.last_number);
  console.log("NEXT_WORKER_CODE=" + seq.prefix + "-" + String(seq.last_number + 1).padStart(4, "0"));
  console.log("DEPARTMENTS=" + JSON.stringify(departments));
  console.log("DEPARTMENT_SET_PASS=" + departmentPass);
  console.log("TEMP_TEST_FILES_EXIST=" + tempFilesExist);
} finally {
  db.close();
}