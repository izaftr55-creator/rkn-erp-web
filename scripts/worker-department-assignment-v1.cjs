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
    const workerTable = db.prepare("SELECT name FROM sqlite_master WHERE type = ? AND name = ?").get("table", "worker");
    const departmentTable = db.prepare("SELECT name FROM sqlite_master WHERE type = ? AND name = ?").get("table", "payroll_department");

    if (!workerTable) throw new Error("WORKER_TABLE_NOT_FOUND");
    if (!departmentTable) throw new Error("PAYROLL_DEPARTMENT_TABLE_NOT_FOUND");

    const privateDir = path.join(process.cwd(), "data", "private");
    fs.mkdirSync(privateDir, { recursive: true });

    const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
    const backupPath = path.join(privateDir, "rkn-erp-before-worker-department-v1-" + stamp + ".sqlite");

    await db.backup(backupPath);
    console.log("BACKUP_OK=" + backupPath);

    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS worker_department_assignment (
          id TEXT PRIMARY KEY,
          worker_id TEXT NOT NULL,
          department_id TEXT NOT NULL,
          start_date TEXT,
          end_date TEXT,
          active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
          is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0,1)),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,

          FOREIGN KEY (worker_id)
            REFERENCES worker(id),

          FOREIGN KEY (department_id)
            REFERENCES payroll_department(id),

          CHECK (
            start_date IS NULL OR
            start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
          ),

          CHECK (
            end_date IS NULL OR
            end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
          ),

          CHECK (
            start_date IS NULL OR
            end_date IS NULL OR
            end_date >= start_date
          ),

          UNIQUE(worker_id, department_id, start_date)
        );

        CREATE INDEX IF NOT EXISTS idx_worker_department_worker
          ON worker_department_assignment(worker_id);

        CREATE INDEX IF NOT EXISTS idx_worker_department_department
          ON worker_department_assignment(department_id);

        CREATE INDEX IF NOT EXISTS idx_worker_department_active
          ON worker_department_assignment(active);

        CREATE TRIGGER IF NOT EXISTS trg_worker_department_same_bu_insert
        BEFORE INSERT ON worker_department_assignment
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN (
              SELECT w.business_unit_id
              FROM worker w
              WHERE w.id = NEW.worker_id
            ) != (
              SELECT d.business_unit_id
              FROM payroll_department d
              WHERE d.id = NEW.department_id
            )
            THEN RAISE(ABORT, 'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH')
          END;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_worker_department_same_bu_update
        BEFORE UPDATE OF worker_id, department_id
        ON worker_department_assignment
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN (
              SELECT w.business_unit_id
              FROM worker w
              WHERE w.id = NEW.worker_id
            ) != (
              SELECT d.business_unit_id
              FROM payroll_department d
              WHERE d.id = NEW.department_id
            )
            THEN RAISE(ABORT, 'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH')
          END;
        END;
      `);
    })();

    const columns = db.prepare("PRAGMA table_info(worker_department_assignment)").all();
    const indexes = db.prepare("PRAGMA index_list(worker_department_assignment)").all();
    const triggers = db.prepare("SELECT name FROM sqlite_master WHERE type = ? AND tbl_name = ? ORDER BY name").all("trigger", "worker_department_assignment");
    const count = db.prepare("SELECT COUNT(*) AS n FROM worker_department_assignment").get().n;

    console.log("WORKER_DEPARTMENT_ASSIGNMENT_V1_OK");
    console.log("COLUMN_COUNT=" + columns.length);
    console.log("ASSIGNMENT_COUNT=" + count);
    console.log("TRIGGER_COUNT=" + triggers.length);
    console.log("TRIGGERS=" + JSON.stringify(triggers.map((r) => r.name)));
    console.log("INDEX_COUNT=" + indexes.length);
  } finally {
    db.close();
  }
})().catch((error) => {
  console.error("WORKER_DEPARTMENT_ASSIGNMENT_V1_FAILED=" + error.message);
  process.exitCode = 1;
});