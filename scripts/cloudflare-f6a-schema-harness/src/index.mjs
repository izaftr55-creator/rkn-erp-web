import { DurableObject } from "cloudflare:workers";


/*
 * RKN CLOUDFLARE F6A
 *
 * Local-only compatibility harness.
 *
 * PURPOSE:
 * - prove SQLite Durable Object accepts RKN trigger syntax
 * - prove RAISE(ABORT, ...) behavior
 * - prove INTEGER PRIMARY KEY AUTOINCREMENT
 *
 * NOT A PRODUCTION MIGRATION.
 * NOT THE RKN ERP DATABASE.
 */


const SCHEMA_STATEMENTS = [


/* ----------------------------------------------------------
   Minimal prerequisite tables
   ---------------------------------------------------------- */

`
CREATE TABLE IF NOT EXISTS worker (
  id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL
)
`,

`
CREATE TABLE IF NOT EXISTS payroll_department (
  id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL
)
`,

`
CREATE TABLE IF NOT EXISTS worker_department_assignment (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
  department_id TEXT NOT NULL
)
`,

`
CREATE TABLE IF NOT EXISTS worker_registration_invite (
  id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL
)
`,

`
CREATE TABLE IF NOT EXISTS worker_registration (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,
  worker_id TEXT
)
`,


/* ----------------------------------------------------------
   Exact RKN AUTOINCREMENT table contract
   ---------------------------------------------------------- */

`
CREATE TABLE IF NOT EXISTS hpp_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  cost_key TEXT NOT NULL,

  product_id TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',

  method TEXT NOT NULL,

  manual_hpp REAL NOT NULL DEFAULT 0,
  calculated_hpp REAL NOT NULL DEFAULT 0,
  effective_hpp REAL NOT NULL DEFAULT 0,

  components_json TEXT NOT NULL DEFAULT '[]',

  effective_from TEXT NOT NULL,
  source_note TEXT NOT NULL DEFAULT '',

  changed_by TEXT NOT NULL DEFAULT '',
  changed_at TEXT NOT NULL
)
`,


/* ----------------------------------------------------------
   Exact RKN trigger 1
   ---------------------------------------------------------- */

`
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
    THEN RAISE(
      ABORT,
      'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH'
    )
  END;
END
`,


/* ----------------------------------------------------------
   Exact RKN trigger 2
   ---------------------------------------------------------- */

`
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
    THEN RAISE(
      ABORT,
      'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH'
    )
  END;
END
`,


/* ----------------------------------------------------------
   Exact RKN trigger 3
   ---------------------------------------------------------- */

`
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
    THEN RAISE(
      ABORT,
      'REGISTRATION_INVITE_BUSINESS_UNIT_MISMATCH'
    )
  END;
END
`,


/* ----------------------------------------------------------
   Exact RKN trigger 4
   ---------------------------------------------------------- */

`
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
    THEN RAISE(
      ABORT,
      'REGISTRATION_WORKER_BUSINESS_UNIT_MISMATCH'
    )
  END;
END
`

];


function errorMessage(error) {
  return error instanceof Error
    ? error.message
    : String(error);
}


function expectAbort(fn, expectedMessage) {

  try {

    fn();

    return {
      passed: false,
      expectedMessage,
      observedMessage: "NO_ABORT_THROWN"
    };

  }
  catch (error) {

    const observedMessage =
      errorMessage(error);

    return {
      passed:
        observedMessage.includes(
          expectedMessage
        ),

      expectedMessage,
      observedMessage
    };
  }
}


export class RknSchemaHarness extends DurableObject {

  constructor(ctx, env) {

    super(ctx, env);

    this.ctx =
      ctx;

    this.sql =
      ctx.storage.sql;


    ctx.blockConcurrencyWhile(
      async () => {

        for (
          const statement
          of SCHEMA_STATEMENTS
        ) {

          this.sql.exec(
            statement
          );
        }
      }
    );
  }


  async probe() {

    const suffix =
      crypto.randomUUID();


    /* ------------------------------------------------------
       Schema object proof
       ------------------------------------------------------ */

    const triggerRows =
      this.sql.exec(`
        SELECT
          name,
          tbl_name
        FROM sqlite_schema
        WHERE type = 'trigger'
        ORDER BY name
      `).toArray();


    /* ------------------------------------------------------
       AUTOINCREMENT proof
       ------------------------------------------------------ */

    const insertHpp = (
      costKey
    ) => {

      this.sql.exec(`
        INSERT INTO hpp_history (
          cost_key,
          method,
          effective_from,
          changed_at
        )
        VALUES (?, ?, ?, ?)
      `,
        costKey,
        "MANUAL",
        "2026-08-14",
        "2026-08-14T00:00:00Z"
      );

      return Number(
        this.sql.exec(`
          SELECT
            last_insert_rowid() AS id
        `).one().id
      );
    };


    const firstHistoryId =
      insertHpp(
        "F6A-A-" + suffix
      );

    const secondHistoryId =
      insertHpp(
        "F6A-B-" + suffix
      );

    const autoincrementPass =
      Number.isInteger(
        firstHistoryId
      ) &&
      Number.isInteger(
        secondHistoryId
      ) &&
      secondHistoryId >
        firstHistoryId;


    /* ------------------------------------------------------
       Trigger prerequisite rows
       ------------------------------------------------------ */

    const buA =
      "BU-A-" + suffix;

    const buB =
      "BU-B-" + suffix;

    const workerA =
      "WORKER-A-" + suffix;

    const workerB =
      "WORKER-B-" + suffix;

    const departmentA =
      "DEPT-A-" + suffix;

    const departmentB =
      "DEPT-B-" + suffix;

    const assignment =
      "ASSIGN-" + suffix;

    const invite =
      "INVITE-" + suffix;

    const registration =
      "REG-" + suffix;


    this.sql.exec(`
      INSERT INTO worker (
        id,
        business_unit_id
      )
      VALUES (?, ?)
    `,
      workerA,
      buA
    );


    this.sql.exec(`
      INSERT INTO worker (
        id,
        business_unit_id
      )
      VALUES (?, ?)
    `,
      workerB,
      buB
    );


    this.sql.exec(`
      INSERT INTO payroll_department (
        id,
        business_unit_id
      )
      VALUES (?, ?)
    `,
      departmentA,
      buA
    );


    this.sql.exec(`
      INSERT INTO payroll_department (
        id,
        business_unit_id
      )
      VALUES (?, ?)
    `,
      departmentB,
      buB
    );


    /* ------------------------------------------------------
       Trigger 1 · valid insert + mismatch insert
       ------------------------------------------------------ */

    this.sql.exec(`
      INSERT INTO worker_department_assignment (
        id,
        worker_id,
        department_id
      )
      VALUES (?, ?, ?)
    `,
      assignment,
      workerA,
      departmentA
    );


    const trigger1 =
      expectAbort(
        () => {

          this.sql.exec(`
            INSERT INTO worker_department_assignment (
              id,
              worker_id,
              department_id
            )
            VALUES (?, ?, ?)
          `,
            "ASSIGN-BAD-" + suffix,
            workerA,
            departmentB
          );
        },
        "WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH"
      );


    /* ------------------------------------------------------
       Trigger 2 · mismatch update
       ------------------------------------------------------ */

    const trigger2 =
      expectAbort(
        () => {

          this.sql.exec(`
            UPDATE worker_department_assignment
            SET department_id = ?
            WHERE id = ?
          `,
            departmentB,
            assignment
          );
        },
        "WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH"
      );


    /* ------------------------------------------------------
       Trigger 3 · invite BU check
       ------------------------------------------------------ */

    this.sql.exec(`
      INSERT INTO worker_registration_invite (
        id,
        business_unit_id
      )
      VALUES (?, ?)
    `,
      invite,
      buA
    );


    this.sql.exec(`
      INSERT INTO worker_registration (
        id,
        invite_id,
        business_unit_id,
        worker_id
      )
      VALUES (?, ?, ?, NULL)
    `,
      registration,
      invite,
      buA
    );


    const trigger3 =
      expectAbort(
        () => {

          this.sql.exec(`
            INSERT INTO worker_registration (
              id,
              invite_id,
              business_unit_id,
              worker_id
            )
            VALUES (?, ?, ?, NULL)
          `,
            "REG-BAD-" + suffix,
            invite,
            buB
          );
        },
        "REGISTRATION_INVITE_BUSINESS_UNIT_MISMATCH"
      );


    /* ------------------------------------------------------
       Trigger 4 · worker BU check
       ------------------------------------------------------ */

    const trigger4 =
      expectAbort(
        () => {

          this.sql.exec(`
            UPDATE worker_registration
            SET worker_id = ?
            WHERE id = ?
          `,
            workerB,
            registration
          );
        },
        "REGISTRATION_WORKER_BUSINESS_UNIT_MISMATCH"
      );


    const triggerNames =
      triggerRows.map(
        row => row.name
      );


    const requiredTriggers = [
      "trg_worker_department_same_bu_insert",
      "trg_worker_department_same_bu_update",
      "trg_worker_registration_invite_bu_insert",
      "trg_worker_registration_worker_bu_update"
    ];


    const triggerSchemaPass =
      requiredTriggers.every(
        name =>
          triggerNames.includes(name)
      );


    const result = {

      harness:
        "RKN_CLOUDFLARE_F6A",

      storage:
        "SQLITE_DURABLE_OBJECT_LOCAL",

      schema: {

        triggerCount:
          triggerRows.length,

        triggerSchemaPass,

        triggerNames,

        autoincrement: {
          firstHistoryId,
          secondHistoryId,
          passed:
            autoincrementPass
        }
      },

      behavior: {

        workerDepartmentInsertAbort:
          trigger1,

        workerDepartmentUpdateAbort:
          trigger2,

        registrationInviteAbort:
          trigger3,

        registrationWorkerAbort:
          trigger4
      }
    };


    result.pass =
      triggerSchemaPass &&
      autoincrementPass &&
      trigger1.passed &&
      trigger2.passed &&
      trigger3.passed &&
      trigger4.passed;


    return result;
  }
}


export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(
        request.url
      );


    if (
      url.pathname !== "/probe"
    ) {

      return new Response(
        JSON.stringify({
          harness:
            "RKN_CLOUDFLARE_F6A",

          endpoint:
            "/probe",

          remoteResource:
            false
        }),
        {
          headers: {
            "content-type":
              "application/json"
          }
        }
      );
    }


    const stub =
      env.RKN_SCHEMA_DO.getByName(
        "rkn-f6a-local-only"
      );


    const result =
      await stub.probe();


    return new Response(
      JSON.stringify(
        result,
        null,
        2
      ),
      {
        headers: {
          "content-type":
            "application/json"
        }
      }
    );
  }
};
