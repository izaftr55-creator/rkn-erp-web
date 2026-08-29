import { DurableObject } from "cloudflare:workers";

import migration0001 from "../../cloudflare-erp-do-migrations/0001-rkn-erp-do-schema.sql";


const EXPECTED_SQL_HASH =
  "6F0111803A23CB7FA05D383DE1968517DEC2F398509A439C3783B07ED0FEBE28";

const EXPECTED_SQL_BYTES =
  23711;

const AUTH_TABLES =
  new Set([
    "user",
    "account",
    "session",
    "verification",
  ]);


const EXPECTED_ERP_TABLES =
  new Set([
    "audit_log",
    "business_event",
    "business_line_alias",
    "business_order",
    "business_order_line",
    "business_unit",
    "erp_user_profile",
    "hpp_history",
    "hpp_master",
    "inventory_balance",
    "inventory_ledger",
    "marketplace_store_scope",
    "order_allocation",
    "order_allocation_item",
    "payroll_department",
    "permission",
    "role",
    "role_permission",
    "transaction_ledger",
    "user_business_scope",
    "user_role",
    "whatsapp_message_outbox",
    "worker",
    "worker_code_sequence",
    "worker_department_assignment",
    "worker_registration",
    "worker_registration_invite",
  ]);


const PLATFORM_TABLE_PREFIXES = [
  "__cf_",
  "__miniflare_",
];


function isPlatformTableName(name) {

  return PLATFORM_TABLE_PREFIXES.some(
    prefix =>
      name.startsWith(
        prefix,
      ),
  );
}


async function sha256Hex(text) {

  const bytes =
    new TextEncoder()
      .encode(text);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    );

  return Array
    .from(
      new Uint8Array(
        digest,
      ),
    )
    .map(
      value =>
        value
          .toString(16)
          .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();
}


function firstValue(row) {

  if (!row) {
    return null;
  }

  const values =
    Object.values(row);

  return values.length > 0
    ? values[0]
    : null;
}


export class RknErpSchemaHarness extends DurableObject {

  constructor(ctx, env) {

    super(ctx, env);

    this.ctx =
      ctx;

    this.env =
      env;

    this.sql =
      ctx.storage.sql;
  }


  rows(query, ...bindings) {

    return this.sql
      .exec(
        query,
        ...bindings,
      )
      .toArray();
  }


  ensureSchema() {

    const existing =
      this.rows(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'business_unit'
        LIMIT 1
      `);


    if (existing.length === 0) {

      /*
       * Execute frozen migration 0001 exactly as imported.
       *
       * No copied DDL and no runtime mutation of the artifact.
       */
      this.sql.exec(
        migration0001,
      );

      return "APPLIED_0001";
    }


    return "ALREADY_PRESENT";
  }


  async probe() {

    const importedHash =
      await sha256Hex(
        migration0001,
      );


    const importedBytes =
      new TextEncoder()
        .encode(
          migration0001,
        )
        .byteLength;


    const hashLocked =
      importedHash ===
        EXPECTED_SQL_HASH;


    const bytesLocked =
      importedBytes ===
        EXPECTED_SQL_BYTES;


    if (
      !hashLocked ||
      !bytesLocked
    ) {

      return {
        harness:
          "RKN_CLOUDFLARE_F9D",

        pass:
          false,

        error:
          "MIGRATION_0001_IMPORT_HASH_MISMATCH",

        artifact: {
          importedHash,
          importedBytes,
          hashLocked,
          bytesLocked,
        },
      };
    }


    const migrationState =
      this.ensureSchema();


    const allTables =
      this.rows(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);


    const erpTables =
      allTables.filter(
        row =>
          EXPECTED_ERP_TABLES.has(
            String(
              row.name,
            ),
          ),
      );


    const platformTables =
      allTables.filter(
        row =>
          isPlatformTableName(
            String(
              row.name,
            ),
          ),
      );


    const unexpectedTables =
      allTables.filter(
        row => {

          const name =
            String(
              row.name,
            );


          return (
            !EXPECTED_ERP_TABLES.has(
              name,
            ) &&
            !isPlatformTableName(
              name,
            )
          );
        },
      );


    const indexes =
      this.rows(`
        SELECT
          name,
          tbl_name
        FROM sqlite_master
        WHERE type = 'index'
          AND sql IS NOT NULL
        ORDER BY name
      `);


    const erpIndexes =
      indexes.filter(
        row =>
          EXPECTED_ERP_TABLES.has(
            String(
              row.tbl_name,
            ),
          ),
      );


    const triggers =
      this.rows(`
        SELECT
          name,
          tbl_name
        FROM sqlite_master
        WHERE type = 'trigger'
        ORDER BY name
      `);


    const erpTriggers =
      triggers.filter(
        row =>
          EXPECTED_ERP_TABLES.has(
            String(
              row.tbl_name,
            ),
          ),
      );


    let internalFkCount =
      0;

    let crossAuthFkCount =
      0;


    const logicalUserColumns =
      [];


    for (
      const tableRow
      of erpTables
    ) {

      const tableName =
        String(
          tableRow.name,
        );


      const quotedTableName =
        tableName.replace(
          /"/g,
          '""',
        );


      const fks =
        this.rows(
          `PRAGMA foreign_key_list("${quotedTableName}")`,
        );


      for (
        const fk
        of fks
      ) {

        const target =
          String(
            fk.table ?? "",
          );


        if (
          AUTH_TABLES.has(
            target,
          )
        ) {

          crossAuthFkCount++;

        }
        else {

          internalFkCount++;
        }
      }


      const columns =
        this.rows(
          `PRAGMA table_info("${quotedTableName}")`,
        );


      for (
        const column
        of columns
      ) {

        const columnName =
          String(
            column.name ?? "",
          );


        if (
          /(^|_)(user_id|actor_user_id|created_by_user_id|reviewed_by_user_id)$/i
            .test(
              columnName,
            )
        ) {

          logicalUserColumns.push({
            table:
              tableName,

            column:
              columnName,
          });
        }
      }
    }


    const foreignKeyCheckRows =
      this.rows(
        "PRAGMA foreign_key_check",
      );


    let foreignKeyBehavioralRejected =
      false;


    let foreignKeyBehavioralError =
      "";


    let foreignKeyRollbackClean =
      false;


    let foreignKeyCleanupPass =
      true;


    /*
     * Behavioral FK enforcement proof.
     *
     * Do not depend on PRAGMA foreign_keys, because PRAGMA
     * authorization differs from normal SQL API access.
     *
     * If FK enforcement is ON:
     *   - invalid child INSERT throws
     *   - transactionSync rolls back CREATE TABLE statements
     *
     * If FK enforcement is OFF:
     *   - INSERT succeeds
     *   - probe tables commit
     *   - residue detection makes the probe fail
     *   - cleanup removes test-only residue
     */
    try {

      this.ctx.storage.transactionSync(
        () => {

          this.sql.exec(`
            CREATE TABLE rkn_f9d_probe_fk_parent (
              id TEXT PRIMARY KEY
            );

            CREATE TABLE rkn_f9d_probe_fk_child (
              id TEXT PRIMARY KEY,
              parent_id TEXT NOT NULL,

              FOREIGN KEY (parent_id)
                REFERENCES rkn_f9d_probe_fk_parent(id)
            );
          `);


          this.sql.exec(`
            INSERT INTO rkn_f9d_probe_fk_child (
              id,
              parent_id
            )
            VALUES (
              'probe-child',
              'missing-parent'
            );
          `);
        },
      );

    }
    catch (error) {

      foreignKeyBehavioralError =
        String(
          error?.message ??
          error ??
          "",
        );


      foreignKeyBehavioralRejected =
        /FOREIGN KEY/i.test(
          foreignKeyBehavioralError,
        ) &&

        /CONSTRAINT|SQLITE_CONSTRAINT/i.test(
          foreignKeyBehavioralError,
        );
    }


    const fkProbeResidueBeforeCleanup =
      this.rows(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (
            'rkn_f9d_probe_fk_parent',
            'rkn_f9d_probe_fk_child'
          )
        ORDER BY name
      `);


    foreignKeyRollbackClean =
      fkProbeResidueBeforeCleanup.length === 0;


    if (
      fkProbeResidueBeforeCleanup.length > 0
    ) {

      foreignKeyCleanupPass =
        false;


      try {

        this.ctx.storage.transactionSync(
          () => {

            this.sql.exec(`
              DROP TABLE IF EXISTS rkn_f9d_probe_fk_child;
              DROP TABLE IF EXISTS rkn_f9d_probe_fk_parent;
            `);
          },
        );


        const fkProbeResidueAfterCleanup =
          this.rows(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name IN (
                'rkn_f9d_probe_fk_parent',
                'rkn_f9d_probe_fk_child'
              )
            ORDER BY name
          `);


        foreignKeyCleanupPass =
          fkProbeResidueAfterCleanup.length === 0;

      }
      catch (cleanupError) {

        foreignKeyCleanupPass =
          false;


        foreignKeyBehavioralError =
          foreignKeyBehavioralError +
          " | CLEANUP: " +
          String(
            cleanupError?.message ??
            cleanupError ??
            "",
          );
      }
    }


    const foreignKeyBehavioralPass =
      foreignKeyBehavioralRejected &&

      foreignKeyRollbackClean &&

      foreignKeyCleanupPass;


    const autoObjects =
      this.rows(`
        SELECT
          name,
          type
        FROM sqlite_master
        WHERE sql IS NOT NULL
          AND upper(sql) LIKE '%AUTOINCREMENT%'
          AND name NOT LIKE '__cf_%'
        ORDER BY type, name
      `);


    const schemaSqlRows =
      this.rows(`
        SELECT
          name,
          type,
          sql
        FROM sqlite_master
        WHERE sql IS NOT NULL
          AND name NOT LIKE '__cf_%'
        ORDER BY type, name
      `);


    const physicalAuthReference =
      schemaSqlRows.some(
        row =>
          /\bREFERENCES\s+(?:"user"|'user'|`user`|\[user\]|user)\s*\(/i
            .test(
              String(
                row.sql ?? "",
              ),
            ),
      );


    const authTableCreate =
      allTables.some(
        row =>
          AUTH_TABLES.has(
            String(
              row.name,
            ),
          ),
      );


    const transactionLedgerPresent =
      allTables.some(
        row =>
          String(
            row.name,
          ) ===
            "transaction_ledger",
      );


    const autoincrementPass =
      autoObjects.length === 1 &&
      String(
        autoObjects[0]?.name ?? "",
      ) ===
        "hpp_history";


    const schemaPass =
      erpTables.length === 27 &&

      erpIndexes.length === 39 &&

      erpTriggers.length === 4 &&

      unexpectedTables.length === 0 &&

      internalFkCount === 18 &&

      crossAuthFkCount === 0 &&

      foreignKeyCheckRows.length === 0 &&

      logicalUserColumns.length === 8 &&

      autoincrementPass &&

      transactionLedgerPresent &&

      foreignKeyBehavioralPass &&

      !physicalAuthReference &&

      !authTableCreate;


    return {
      harness:
        "RKN_CLOUDFLARE_F9D",

      storage:
        "SQLITE_DURABLE_OBJECT_LOCAL",

      rpc:
        true,

      migrationState,

      artifact: {
        importedHash,
        expectedHash:
          EXPECTED_SQL_HASH,

        importedBytes,
        expectedBytes:
          EXPECTED_SQL_BYTES,

        hashLocked,
        bytesLocked,
      },

      schema: {
        tables:
          erpTables.length,

        explicitIndexes:
          erpIndexes.length,

        triggers:
          erpTriggers.length,

        internalForeignKeys:
          internalFkCount,

        crossAuthForeignKeys:
          crossAuthFkCount,

        foreignKeyCheckRows:
          foreignKeyCheckRows.length,

        logicalUserIdColumns:
          logicalUserColumns.length,

        autoincrementObjects:
          autoObjects.length,

        transactionLedgerPresent,

        platformTables:
          platformTables.map(
            row =>
              String(
                row.name,
              ),
          ),

        unexpectedTables:
          unexpectedTables.map(
            row =>
              String(
                row.name,
              ),
          ),

        foreignKeyBehavioralPass,

        foreignKeyBehavioralRejected,

        foreignKeyBehavioralError,

        foreignKeyRollbackClean,

        foreignKeyCleanupPass,

        physicalAuthReference,

        authTableCreate,
      },

      pass:
        hashLocked &&
        bytesLocked &&
        schemaPass,
    };
  }
}


export default {

  async fetch(request, env) {

    const url =
      new URL(
        request.url,
      );


    if (url.pathname === "/") {

      return Response.json({
        harness:
          "RKN_CLOUDFLARE_F9D",

        ready:
          true,

        mode:
          "LOCAL_SQLITE_DO_SCHEMA_RUNTIME",
      });
    }


    if (url.pathname === "/probe") {

      const stub =
        env.RKN_ERP_SCHEMA
          .getByName(
            "rkn-f9d-schema-local-only",
          );


      const result =
        await stub.probe();


      return Response.json(
        result,
        {
          status:
            result.pass
              ? 200
              : 500,
        },
      );
    }


    return Response.json(
      {
        error:
          "NOT_FOUND",
      },
      {
        status:
          404,
      },
    );
  },
};