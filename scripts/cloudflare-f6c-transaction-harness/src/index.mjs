import { DurableObject } from "cloudflare:workers";


/*
 * RKN CLOUDFLARE F6C
 *
 * Local-only transaction semantics harness.
 *
 * PURPOSE:
 * - prove transactionSync commit
 * - prove rollback on thrown exception
 * - prove guarded stock decrement
 * - prove insufficient-stock rollback
 * - prove idempotent replay does not double deduct
 *
 * NOT A PRODUCTION MIGRATION.
 * NOT THE RKN ERP DATABASE.
 */


const SCHEMA = [

`
CREATE TABLE IF NOT EXISTS inventory_balance (
  business_unit_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  physical_sku TEXT NOT NULL,

  qty_on_hand REAL NOT NULL
    CHECK (qty_on_hand >= 0),

  PRIMARY KEY (
    business_unit_id,
    warehouse_id,
    physical_sku
  )
)
`,

`
CREATE TABLE IF NOT EXISTS inventory_ledger (
  movement_key TEXT PRIMARY KEY,

  business_unit_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  physical_sku TEXT NOT NULL,

  qty_delta REAL NOT NULL,

  movement_type TEXT NOT NULL,
  source_key TEXT NOT NULL,

  created_at TEXT NOT NULL
)
`

];


function errorMessage(error) {
  return error instanceof Error
    ? error.message
    : String(error);
}


export class RknTransactionHarness extends DurableObject {

  constructor(ctx, env) {

    super(ctx, env);

    this.ctx =
      ctx;

    this.sql =
      ctx.storage.sql;


    ctx.blockConcurrencyWhile(
      async () => {

        for (const ddl of SCHEMA) {
          this.sql.exec(ddl);
        }
      }
    );
  }


  seedBalance(
    businessUnitId,
    warehouseId,
    physicalSku,
    qty
  ) {

    this.sql.exec(`
      INSERT INTO inventory_balance (
        business_unit_id,
        warehouse_id,
        physical_sku,
        qty_on_hand
      )
      VALUES (?, ?, ?, ?)
    `,
      businessUnitId,
      warehouseId,
      physicalSku,
      qty
    );
  }


  getBalance(
    businessUnitId,
    warehouseId,
    physicalSku
  ) {

    const row =
      this.sql.exec(`
        SELECT
          qty_on_hand
        FROM inventory_balance
        WHERE business_unit_id = ?
          AND warehouse_id = ?
          AND physical_sku = ?
      `,
        businessUnitId,
        warehouseId,
        physicalSku
      ).one();

    return Number(
      row.qty_on_hand
    );
  }


  getLedgerCount(
    movementKey
  ) {

    const row =
      this.sql.exec(`
        SELECT
          COUNT(*) AS n
        FROM inventory_ledger
        WHERE movement_key = ?
      `,
        movementKey
      ).one();

    return Number(
      row.n
    );
  }


  confirmMovement({
    businessUnitId,
    warehouseId,
    physicalSku,
    qty,
    movementKey,
    sourceKey
  }) {

    return this.ctx.storage.transactionSync(
      () => {

        /*
         * IDEMPOTENCY GATE
         *
         * Equivalent principle to Inventory Core:
         * a previously-confirmed movement must never
         * deduct physical stock twice.
         */

        const existing =
          this.sql.exec(`
            SELECT
              movement_key
            FROM inventory_ledger
            WHERE movement_key = ?
            LIMIT 1
          `,
            movementKey
          ).toArray();


        if (
          existing.length > 0
        ) {

          return {
            alreadyConfirmed: true
          };
        }


        /*
         * GUARDED STOCK DECREMENT
         */

        const update =
          this.sql.exec(`
            UPDATE inventory_balance
            SET
              qty_on_hand =
                qty_on_hand - ?
            WHERE business_unit_id = ?
              AND warehouse_id = ?
              AND physical_sku = ?
              AND qty_on_hand >= ?
          `,
            qty,
            businessUnitId,
            warehouseId,
            physicalSku,
            qty
          );


        if (
          update.rowsWritten !== 1
        ) {

          throw new Error(
            "INSUFFICIENT_STOCK"
          );
        }


        /*
         * PHYSICAL INVENTORY LEDGER
         */

        this.sql.exec(`
          INSERT INTO inventory_ledger (
            movement_key,
            business_unit_id,
            warehouse_id,
            physical_sku,
            qty_delta,
            movement_type,
            source_key,
            created_at
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
          movementKey,
          businessUnitId,
          warehouseId,
          physicalSku,
          -qty,
          "ORDER_CONFIRM",
          sourceKey,
          "2026-08-14T00:00:00Z"
        );


        return {
          alreadyConfirmed: false
        };
      }
    );
  }


  async probe() {

    const suffix =
      crypto.randomUUID();

    const bu =
      "BU-F6C-" + suffix;

    const warehouse =
      "WH-F6C-" + suffix;


    /* ======================================================
       CASE 1 · SUCCESSFUL ATOMIC COMMIT
       ====================================================== */

    const commitSku =
      "SKU-COMMIT-" + suffix;

    const commitMovement =
      "MOV-COMMIT-" + suffix;


    this.seedBalance(
      bu,
      warehouse,
      commitSku,
      10
    );


    const commitResult =
      this.confirmMovement({
        businessUnitId: bu,
        warehouseId: warehouse,
        physicalSku: commitSku,
        qty: 3,
        movementKey: commitMovement,
        sourceKey:
          "ORDER-COMMIT-" +
          suffix
      });


    const commitBalance =
      this.getBalance(
        bu,
        warehouse,
        commitSku
      );

    const commitLedger =
      this.getLedgerCount(
        commitMovement
      );


    const commitPass =
      commitResult.alreadyConfirmed === false &&
      commitBalance === 7 &&
      commitLedger === 1;


    /* ======================================================
       CASE 2 · IDEMPOTENT REPLAY
       ====================================================== */

    const replayResult =
      this.confirmMovement({
        businessUnitId: bu,
        warehouseId: warehouse,
        physicalSku: commitSku,
        qty: 3,
        movementKey: commitMovement,
        sourceKey:
          "ORDER-COMMIT-" +
          suffix
      });


    const replayBalance =
      this.getBalance(
        bu,
        warehouse,
        commitSku
      );

    const replayLedger =
      this.getLedgerCount(
        commitMovement
      );


    const replayPass =
      replayResult.alreadyConfirmed === true &&
      replayBalance === 7 &&
      replayLedger === 1;


    /* ======================================================
       CASE 3 · FORCED ROLLBACK AFTER WRITES
       ====================================================== */

    const rollbackSku =
      "SKU-ROLLBACK-" + suffix;

    const rollbackMovement =
      "MOV-ROLLBACK-" + suffix;


    this.seedBalance(
      bu,
      warehouse,
      rollbackSku,
      10
    );


    let rollbackError =
      null;


    try {

      this.ctx.storage.transactionSync(
        () => {

          this.sql.exec(`
            UPDATE inventory_balance
            SET
              qty_on_hand =
                qty_on_hand - 4
            WHERE business_unit_id = ?
              AND warehouse_id = ?
              AND physical_sku = ?
          `,
            bu,
            warehouse,
            rollbackSku
          );


          this.sql.exec(`
            INSERT INTO inventory_ledger (
              movement_key,
              business_unit_id,
              warehouse_id,
              physical_sku,
              qty_delta,
              movement_type,
              source_key,
              created_at
            )
            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?
            )
          `,
            rollbackMovement,
            bu,
            warehouse,
            rollbackSku,
            -4,
            "FORCED_ROLLBACK_TEST",
            "ROLLBACK-SOURCE-" +
              suffix,
            "2026-08-14T00:00:00Z"
          );


          throw new Error(
            "F6C_FORCED_ROLLBACK"
          );
        }
      );

    }
    catch (error) {

      rollbackError =
        errorMessage(error);
    }


    const rollbackBalance =
      this.getBalance(
        bu,
        warehouse,
        rollbackSku
      );

    const rollbackLedger =
      this.getLedgerCount(
        rollbackMovement
      );


    const rollbackPass =
      rollbackError !== null &&
      rollbackError.includes(
        "F6C_FORCED_ROLLBACK"
      ) &&
      rollbackBalance === 10 &&
      rollbackLedger === 0;


    /* ======================================================
       CASE 4 · INSUFFICIENT STOCK GUARD
       ====================================================== */

    const guardSku =
      "SKU-GUARD-" + suffix;

    const guardMovement =
      "MOV-GUARD-" + suffix;


    this.seedBalance(
      bu,
      warehouse,
      guardSku,
      2
    );


    let guardError =
      null;


    try {

      this.confirmMovement({
        businessUnitId: bu,
        warehouseId: warehouse,
        physicalSku: guardSku,
        qty: 5,
        movementKey: guardMovement,
        sourceKey:
          "ORDER-GUARD-" +
          suffix
      });

    }
    catch (error) {

      guardError =
        errorMessage(error);
    }


    const guardBalance =
      this.getBalance(
        bu,
        warehouse,
        guardSku
      );

    const guardLedger =
      this.getLedgerCount(
        guardMovement
      );


    const guardPass =
      guardError !== null &&
      guardError.includes(
        "INSUFFICIENT_STOCK"
      ) &&
      guardBalance === 2 &&
      guardLedger === 0;


    /* ======================================================
       FINAL RESULT
       ====================================================== */

    const result = {

      harness:
        "RKN_CLOUDFLARE_F6C",

      storage:
        "SQLITE_DURABLE_OBJECT_LOCAL",

      transactionApi:
        "transactionSync",

      commit: {
        balance:
          commitBalance,

        ledgerRows:
          commitLedger,

        alreadyConfirmed:
          commitResult
            .alreadyConfirmed,

        passed:
          commitPass
      },

      replay: {
        balance:
          replayBalance,

        ledgerRows:
          replayLedger,

        alreadyConfirmed:
          replayResult
            .alreadyConfirmed,

        passed:
          replayPass
      },

      rollback: {
        error:
          rollbackError,

        balance:
          rollbackBalance,

        ledgerRows:
          rollbackLedger,

        passed:
          rollbackPass
      },

      insufficientStock: {
        error:
          guardError,

        balance:
          guardBalance,

        ledgerRows:
          guardLedger,

        passed:
          guardPass
      }
    };


    result.pass =
      commitPass &&
      replayPass &&
      rollbackPass &&
      guardPass;


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
            "RKN_CLOUDFLARE_F6C",

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
      env.RKN_TX_DO.getByName(
        "rkn-f6c-local-only"
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
