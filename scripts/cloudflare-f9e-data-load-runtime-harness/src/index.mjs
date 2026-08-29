
import {
  DurableObject,
} from "cloudflare:workers";


import migration0001
  from "../../cloudflare-erp-do-migrations/0001-rkn-erp-do-schema.sql";


const EXPECTED_MIGRATION_HASH =
  "6F0111803A23CB7FA05D383DE1968517DEC2F398509A439C3783B07ED0FEBE28";


const EXPECTED_PAYLOAD_HASH =
  "B3DE6CE8F5E093DEECDA719810E0EDB6F4E17829375F6E58D19D19964CE26331";


const EXPECTED_PAYLOAD_BYTES =
  28847;


const EXPECTED_SOURCE_ROWS =
  145;


const EXPECTED_TOTAL_VALUES =
  991;


const EXPECTED_HPP_HISTORY_SEQUENCE =
  2;


const AUTH_TABLES =
  new Set([
    "user",
    "account",
    "session",
    "verification",
  ]);


const EXPECTED_ERP_TABLES =
  [
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
  ];


const EXPECTED_ERP_TABLE_SET =
  new Set(
    EXPECTED_ERP_TABLES,
  );


const EXPECTED_COPY_ORDER =
  [
    "business_event",
    "business_line_alias",
    "business_order",
    "business_order_line",
    "business_unit",
    "audit_log",
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
    "user_business_scope",
    "user_role",
    "worker",
    "worker_code_sequence",
    "worker_department_assignment",
    "worker_registration_invite",
    "worker_registration",
    "whatsapp_message_outbox",
  ];


const EXPECTED_COPY_ORDER_SET =
  new Set(
    EXPECTED_COPY_ORDER,
  );


const PLATFORM_TABLE_PREFIXES =
  [
    "__cf_",
    "__miniflare_",
  ];


function quoteIdentifier(
  name,
) {

  return (
    '"' +
    String(name)
      .replaceAll(
        '"',
        '""',
      ) +
    '"'
  );
}


function isPlatformTable(
  name,
) {

  return PLATFORM_TABLE_PREFIXES.some(
    prefix =>
      String(name)
        .startsWith(
          prefix,
        ),
  );
}


function jsonResponse(
  body,
  status = 200,
) {

  return new Response(
    JSON.stringify(
      body,
      null,
      2,
    ),
    {
      status,

      headers: {
        "content-type":
          "application/json; charset=utf-8",

        "cache-control":
          "no-store",
      },
    },
  );
}


async function sha256Hex(
  text,
) {

  const bytes =
    new TextEncoder()
      .encode(
        text,
      );


  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    );


  return Array.from(
    new Uint8Array(
      digest,
    ),
  )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();
}


function canonicalRows(
  rows,
) {

  return rows
    .map(
      row =>
        JSON.stringify(
          row,
        ),
    )
    .sort();
}


function arraysEqual(
  left,
  right,
) {

  return (
    JSON.stringify(left) ===
    JSON.stringify(right)
  );
}


export class RknErpDataLoadHarness
  extends DurableObject {

  constructor(
    ctx,
    env,
  ) {

    super(
      ctx,
      env,
    );


    this.ctx =
      ctx;


    this.env =
      env;


    this.sql =
      ctx.storage.sql;
  }


  rows(
    query,
    ...bindings
  ) {

    return this.sql
      .exec(
        query,
        ...bindings,
      )
      .toArray();
  }


  scalar(
    query,
    ...bindings
  ) {

    const rows =
      this.rows(
        query,
        ...bindings,
      );


    if (
      rows.length === 0
    ) {

      return null;
    }


    const values =
      Object.values(
        rows[0],
      );


    return (
      values.length > 0
        ? values[0]
        : null
    );
  }


  tableExists(
    table,
  ) {

    const rows =
      this.rows(
        `
          SELECT name
          FROM sqlite_master
          WHERE
            type = 'table'
            AND name = ?
        `,
        table,
      );


    return (
      rows.length === 1
    );
  }


  getColumns(
    table,
  ) {

    return this.rows(
      `
        PRAGMA table_info(
          ${quoteIdentifier(table)}
        )
      `,
    )
      .map(
        row => ({
          name:
            String(
              row.name,
            ),

          type:
            String(
              row.type ?? "",
            )
            .trim()
            .toUpperCase(),

          notnull:
            Number(
              row.notnull,
            ),

          pk:
            Number(
              row.pk,
            ),
        }),
      );
  }


  getApplicationTables() {

    return this.rows(`
      SELECT name
      FROM sqlite_master
      WHERE
        type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
      .map(
        row =>
          String(
            row.name,
          ),
      );
  }


  schemaSummary() {

    const allTables =
      this.getApplicationTables();


    const erpTables =
      allTables.filter(
        table =>
          EXPECTED_ERP_TABLE_SET.has(
            table,
          ),
      );


    const platformTables =
      allTables.filter(
        table =>
          isPlatformTable(
            table,
          ),
      );


    const unexpectedTables =
      allTables.filter(
        table =>
          !EXPECTED_ERP_TABLE_SET.has(
            table,
          ) &&
          !isPlatformTable(
            table,
          ),
      );


    const indexes =
      this.rows(`
        SELECT
          name,
          tbl_name

        FROM sqlite_master

        WHERE
          type = 'index'
          AND sql IS NOT NULL

        ORDER BY name
      `)
      .filter(
        row =>
          EXPECTED_ERP_TABLE_SET.has(
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

        WHERE
          type = 'trigger'

        ORDER BY name
      `)
      .filter(
        row =>
          EXPECTED_ERP_TABLE_SET.has(
            String(
              row.tbl_name,
            ),
          ),
      );


    let internalForeignKeys =
      0;


    let crossAuthForeignKeys =
      0;


    const logicalUserColumns =
      [];


    for (
      const table
      of erpTables
    ) {

      const fks =
        this.rows(
          `
            PRAGMA foreign_key_list(
              ${quoteIdentifier(table)}
            )
          `,
        );


      for (
        const fk
        of fks
      ) {

        const target =
          String(
            fk.table,
          );


        if (
          AUTH_TABLES.has(
            target,
          )
        ) {

          crossAuthForeignKeys++;

        }
        else {

          internalForeignKeys++;
        }
      }


      const columns =
        this.getColumns(
          table,
        );


      for (
        const column
        of columns
      ) {

        if (
          /(^|_)(user_id|actor_user_id|created_by_user_id|reviewed_by_user_id)$/i
            .test(
              column.name,
            )
        ) {

          logicalUserColumns.push({
            table,

            column:
              column.name,
          });
        }
      }
    }


    const foreignKeyCheckRows =
      this.rows(
        "PRAGMA foreign_key_check",
      );


    const autoObjects =
      this.rows(`
        SELECT name
        FROM sqlite_master
        WHERE
          type = 'table'
          AND upper(sql) LIKE '%AUTOINCREMENT%'
        ORDER BY name
      `);


    const authTablesPresent =
      allTables.filter(
        table =>
          AUTH_TABLES.has(
            table,
          ),
      );


    const transactionLedgerPresent =
      allTables.includes(
        "transaction_ledger",
      );


    const pass =
      erpTables.length === 27 &&

      platformTables.every(
        table =>
          isPlatformTable(
            table,
          ),
      ) &&

      unexpectedTables.length === 0 &&

      indexes.length === 39 &&

      triggers.length === 4 &&

      internalForeignKeys === 18 &&

      crossAuthForeignKeys === 0 &&

      foreignKeyCheckRows.length === 0 &&

      logicalUserColumns.length === 8 &&

      autoObjects.length === 1 &&

      autoObjects[0]?.name ===
        "hpp_history" &&

      authTablesPresent.length === 0 &&

      transactionLedgerPresent;


    return {
      pass,

      erpTables:
        erpTables.length,

      platformTables,

      unexpectedTables,

      explicitIndexes:
        indexes.length,

      triggers:
        triggers.length,

      internalForeignKeys,

      crossAuthForeignKeys,

      foreignKeyCheckRows:
        foreignKeyCheckRows.length,

      logicalUserIdColumns:
        logicalUserColumns.length,

      autoincrementObjects:
        autoObjects.map(
          row =>
            String(
              row.name,
            ),
        ),

      authTablesPresent,

      transactionLedgerPresent,
    };
  }


  ensureSchema(
    migrationHash,
  ) {

    if (
      migrationHash !==
        EXPECTED_MIGRATION_HASH
    ) {

      throw new Error(
        "MIGRATION_HASH_NOT_LOCKED",
      );
    }


    const currentExpected =
      this
        .getApplicationTables()
        .filter(
          table =>
            EXPECTED_ERP_TABLE_SET.has(
              table,
            ),
        );


    let migrationState =
      "ALREADY_PRESENT";


    if (
      currentExpected.length === 0
    ) {

      this.sql.exec(
        migration0001,
      );


      migrationState =
        "APPLIED_0001";

    }
    else if (
      currentExpected.length !== 27
    ) {

      throw new Error(
        "PARTIAL_ERP_SCHEMA_PRESENT",
      );
    }


    const schema =
      this.schemaSummary();


    if (
      !schema.pass
    ) {

      throw new Error(
        "TARGET_SCHEMA_CONTRACT_FAILED",
      );
    }


    return {
      migrationState,
      schema,
    };
  }


  validatePayload(
    payload,
  ) {

    if (
      !payload ||
      typeof payload !==
        "object"
    ) {

      throw new Error(
        "PAYLOAD_OBJECT_REQUIRED",
      );
    }


    if (
      payload.contract !==
        "RKN_F9E_D_DATA_LOAD_V1"
    ) {

      throw new Error(
        "PAYLOAD_CONTRACT_MISMATCH",
      );
    }


    if (
      payload.snapshotSha256 !==
        "0FE4F4F4FB9E23132F7F045D9CA311CF902E97FCBBD3496B06314AC8A7180AC0"
    ) {

      throw new Error(
        "SNAPSHOT_HASH_MISMATCH",
      );
    }


    if (
      payload.migration0001Sha256 !==
        EXPECTED_MIGRATION_HASH
    ) {

      throw new Error(
        "PAYLOAD_MIGRATION_HASH_MISMATCH",
      );
    }


    if (
      Number(
        payload.sourceErpTables,
      ) !== 26 ||

      Number(
        payload.sourceErpRows,
      ) !== EXPECTED_SOURCE_ROWS ||

      Number(
        payload.hppHistorySequence,
      ) !== EXPECTED_HPP_HISTORY_SEQUENCE
    ) {

      throw new Error(
        "PAYLOAD_COUNT_CONTRACT_MISMATCH",
      );
    }


    if (
      !Array.isArray(
        payload.copyOrder,
      ) ||

      !arraysEqual(
        payload.copyOrder,
        EXPECTED_COPY_ORDER,
      )
    ) {

      throw new Error(
        "PAYLOAD_COPY_ORDER_MISMATCH",
      );
    }


    if (
      !payload.tableFingerprints ||
      typeof payload.tableFingerprints !==
        "object" ||

      Object.keys(
        payload.tableFingerprints,
      ).length !== 26
    ) {

      throw new Error(
        "PAYLOAD_FINGERPRINT_MAP_MISMATCH",
      );
    }


    if (
      !Array.isArray(
        payload.tables,
      ) ||

      payload.tables.length !== 26
    ) {

      throw new Error(
        "PAYLOAD_TABLE_COUNT_MISMATCH",
      );
    }


    const payloadTableNames =
      payload.tables.map(
        item =>
          String(
            item?.table ?? "",
          ),
      );


    if (
      !arraysEqual(
        payloadTableNames,
        EXPECTED_COPY_ORDER,
      )
    ) {

      throw new Error(
        "PAYLOAD_TABLE_ORDER_MISMATCH",
      );
    }


    let totalRows =
      0;


    let totalValues =
      0;


    for (
      const tablePayload
      of payload.tables
    ) {

      const table =
        String(
          tablePayload.table,
        );


      if (
        !EXPECTED_COPY_ORDER_SET.has(
          table,
        ) ||

        AUTH_TABLES.has(
          table,
        ) ||

        table ===
          "transaction_ledger"
      ) {

        throw new Error(
          "FORBIDDEN_PAYLOAD_TABLE:" +
          table,
        );
      }


      if (
        !Array.isArray(
          tablePayload.columns,
        ) ||

        !Array.isArray(
          tablePayload.rows,
        )
      ) {

        throw new Error(
          "PAYLOAD_TABLE_SHAPE_INVALID:" +
          table,
        );
      }


      const targetColumns =
        this.getColumns(
          table,
        )
        .map(
          column =>
            column.name,
        );


      if (
        !arraysEqual(
          tablePayload.columns,
          targetColumns,
        )
      ) {

        throw new Error(
          "PAYLOAD_COLUMN_CONTRACT_MISMATCH:" +
          table,
        );
      }


      const fingerprint =
        String(
          payload.tableFingerprints[
            table
          ] ?? "",
        );


      if (
        !/^[A-F0-9]{64}$/
          .test(
            fingerprint,
          )
      ) {

        throw new Error(
          "PAYLOAD_TABLE_FINGERPRINT_INVALID:" +
          table,
        );
      }


      for (
        const row
        of tablePayload.rows
      ) {

        if (
          !Array.isArray(
            row,
          ) ||

          row.length !==
            targetColumns.length
        ) {

          throw new Error(
            "PAYLOAD_ROW_SHAPE_INVALID:" +
            table,
          );
        }


        totalRows++;


        totalValues +=
          row.length;


        for (
          const value
          of row
        ) {

          if (
            value === null ||
            typeof value ===
              "string"
          ) {

            continue;
          }


          if (
            typeof value ===
              "number"
          ) {

            if (
              !Number.isFinite(
                value,
              )
            ) {

              throw new Error(
                "PAYLOAD_NON_FINITE_NUMBER",
              );
            }


            if (
              Number.isInteger(
                value,
              ) &&

              !Number.isSafeInteger(
                value,
              )
            ) {

              throw new Error(
                "PAYLOAD_UNSAFE_INTEGER",
              );
            }


            continue;
          }


          throw new Error(
            "PAYLOAD_UNSUPPORTED_VALUE_TYPE",
          );
        }
      }
    }


    if (
      totalRows !==
        EXPECTED_SOURCE_ROWS ||

      totalValues !==
        EXPECTED_TOTAL_VALUES
    ) {

      throw new Error(
        "PAYLOAD_ROW_OR_VALUE_COUNT_MISMATCH",
      );
    }


    return {
      totalRows,
      totalValues,
    };
  }


  totalErpRows() {

    let total =
      0;


    for (
      const table
      of EXPECTED_ERP_TABLES
    ) {

      if (
        !this.tableExists(
          table,
        )
      ) {

        continue;
      }


      total +=
        Number(
          this.scalar(
            `
              SELECT COUNT(*) AS n
              FROM ${quoteIdentifier(table)}
            `,
          ) ?? 0,
        );
    }


    return total;
  }


  hppHistorySequence() {

    if (
      !this.tableExists(
        "hpp_history",
      )
    ) {

      return null;
    }


    const rows =
      this.rows(`
        SELECT seq
        FROM sqlite_sequence
        WHERE name = 'hpp_history'
      `);


    if (
      rows.length === 0
    ) {

      return null;
    }


    return Number(
      rows[0].seq,
    );
  }


  verifyCurrentDataSync(
    payload,
  ) {

    const mismatchTables =
      [];


    let copiedRows =
      0;


    for (
      const tablePayload
      of payload.tables
    ) {

      const table =
        tablePayload.table;


      const columns =
        tablePayload.columns;


      const projection =
        columns
          .map(
            quoteIdentifier,
          )
          .join(", ");


      const actualRows =
        this.rows(
          `
            SELECT
              ${projection}

            FROM
              ${quoteIdentifier(table)}
          `,
        )
        .map(
          row =>
            columns.map(
              column =>
                row[column],
            ),
        );


      copiedRows +=
        actualRows.length;


      const expectedCanonical =
        canonicalRows(
          tablePayload.rows,
        );


      const actualCanonical =
        canonicalRows(
          actualRows,
        );


      if (
        !arraysEqual(
          expectedCanonical,
          actualCanonical,
        )
      ) {

        mismatchTables.push(
          table,
        );
      }
    }


    const ledgerRows =
      Number(
        this.scalar(
          `
            SELECT COUNT(*) AS n
            FROM "transaction_ledger"
          `,
        ) ?? 0,
      );


    const foreignKeyCheckRows =
      this.rows(
        "PRAGMA foreign_key_check",
      ).length;


    const sequence =
      this.hppHistorySequence();


    const schema =
      this.schemaSummary();


    const pass =
      schema.pass &&

      copiedRows ===
        EXPECTED_SOURCE_ROWS &&

      ledgerRows === 0 &&

      foreignKeyCheckRows === 0 &&

      sequence ===
        EXPECTED_HPP_HISTORY_SEQUENCE &&

      mismatchTables.length === 0;


    return {
      pass,

      copiedRows,

      ledgerRows,

      foreignKeyCheckRows,

      hppHistorySequence:
        sequence,

      mismatchTables,

      schema,
    };
  }


  async fingerprintCurrentData(
    payload,
  ) {

    const mismatches =
      [];


    const actualFingerprints =
      {};


    for (
      const tablePayload
      of payload.tables
    ) {

      const table =
        tablePayload.table;


      const columns =
        tablePayload.columns;


      const projection =
        columns
          .map(
            quoteIdentifier,
          )
          .join(", ");


      const rows =
        this.rows(
          `
            SELECT
              ${projection}

            FROM
              ${quoteIdentifier(table)}
          `,
        )
        .map(
          row =>
            columns.map(
              column =>
                row[column],
            ),
        );


      const canonical =
        canonicalRows(
          rows,
        )
        .join("\n") +
        "\n";


      const hash =
        await sha256Hex(
          canonical,
        );


      actualFingerprints[
        table
      ] =
        hash;


      if (
        hash !==
          payload.tableFingerprints[
            table
          ]
      ) {

        mismatches.push(
          table,
        );
      }
    }


    return {
      pass:
        mismatches.length === 0,

      mismatches,

      fingerprints:
        actualFingerprints,
    };
  }


  insertPayloadSync(
    payload,
  ) {

    return this.ctx.storage
      .transactionSync(
        () => {

          for (
            const tablePayload
            of payload.tables
          ) {

            const table =
              tablePayload.table;


            const columns =
              tablePayload.columns;


            const columnSql =
              columns
                .map(
                  quoteIdentifier,
                )
                .join(", ");


            const placeholders =
              columns
                .map(
                  () =>
                    "?",
                )
                .join(", ");


            const sql =
              `
                INSERT INTO
                  ${quoteIdentifier(table)}
                  (
                    ${columnSql}
                  )
                VALUES
                  (
                    ${placeholders}
                  )
              `;


            for (
              const row
              of tablePayload.rows
            ) {

              this.sql.exec(
                sql,
                ...row,
              );
            }
          }


          const verification =
            this.verifyCurrentDataSync(
              payload,
            );


          if (
            !verification.pass
          ) {

            throw new Error(
              "POST_INSERT_TRANSACTION_VERIFY_FAILED:" +
              JSON.stringify({
                copiedRows:
                  verification.copiedRows,

                ledgerRows:
                  verification.ledgerRows,

                foreignKeyCheckRows:
                  verification.foreignKeyCheckRows,

                hppHistorySequence:
                  verification.hppHistorySequence,

                mismatchTables:
                  verification.mismatchTables,
              }),
            );
          }


          return verification;
        },
      );
  }


  async loadPayloadText(
    payloadText,
  ) {

    if (
      typeof payloadText !==
        "string"
    ) {

      throw new Error(
        "PAYLOAD_TEXT_REQUIRED",
      );
    }


    const payloadBytes =
      new TextEncoder()
        .encode(
          payloadText,
        )
        .byteLength;


    if (
      payloadBytes !==
        EXPECTED_PAYLOAD_BYTES
    ) {

      throw new Error(
        "PAYLOAD_BYTE_LENGTH_MISMATCH",
      );
    }


    const payloadHash =
      await sha256Hex(
        payloadText,
      );


    if (
      payloadHash !==
        EXPECTED_PAYLOAD_HASH
    ) {

      throw new Error(
        "PAYLOAD_SHA256_MISMATCH",
      );
    }


    const migrationHash =
      await sha256Hex(
        migration0001,
      );


    if (
      migrationHash !==
        EXPECTED_MIGRATION_HASH
    ) {

      throw new Error(
        "IMPORTED_MIGRATION_SHA256_MISMATCH",
      );
    }


    const schemaState =
      this.ensureSchema(
        migrationHash,
      );


    const payload =
      JSON.parse(
        payloadText,
      );


    const payloadValidation =
      this.validatePayload(
        payload,
      );


    const rowsBefore =
      this.totalErpRows();


    let loadState =
      "UNKNOWN";


    let transactionVerification =
      null;


    if (
      rowsBefore === 0
    ) {

      transactionVerification =
        this.insertPayloadSync(
          payload,
        );


      loadState =
        "LOADED";

    }
    else {

      const existing =
        this.verifyCurrentDataSync(
          payload,
        );


      if (
        !existing.pass
      ) {

        throw new Error(
          "TARGET_NOT_EMPTY_OR_DIFFERENT",
        );
      }


      transactionVerification =
        existing;


      loadState =
        "ALREADY_LOADED";
    }


    const fingerprint =
      await this.fingerprintCurrentData(
        payload,
      );


    const after =
      this.verifyCurrentDataSync(
        payload,
      );


    const totalRowsAfter =
      this.totalErpRows();


    const pass =
      after.pass &&

      fingerprint.pass &&

      totalRowsAfter ===
        EXPECTED_SOURCE_ROWS &&

      payloadValidation.totalRows ===
        EXPECTED_SOURCE_ROWS &&

      payloadValidation.totalValues ===
        EXPECTED_TOTAL_VALUES;


    return {
      harness:
        "RKN_CLOUDFLARE_F9E_DATA_LOAD",

      storage:
        "SQLITE_DURABLE_OBJECT_LOCAL",

      rpc:
        true,

      loadState,

      schemaMigrationState:
        schemaState.migrationState,

      payload: {
        contract:
          payload.contract,

        hash:
          payloadHash,

        bytes:
          payloadBytes,

        rows:
          payloadValidation.totalRows,

        values:
          payloadValidation.totalValues,

        tables:
          payload.tables.length,
      },

      result: {
        copiedRows:
          after.copiedRows,

        totalErpRows:
          totalRowsAfter,

        transactionLedgerRows:
          after.ledgerRows,

        foreignKeyCheckRows:
          after.foreignKeyCheckRows,

        hppHistorySequence:
          after.hppHistorySequence,

        rowValueMismatchTables:
          after.mismatchTables,

        fingerprintMismatchTables:
          fingerprint.mismatches,
      },

      schema:
        after.schema,

      pass,
    };
  }


  async probe() {

    const migrationHash =
      await sha256Hex(
        migration0001,
      );


    const schemaPresent =
      this.tableExists(
        "business_unit",
      );


    if (
      !schemaPresent
    ) {

      return {
        harness:
          "RKN_CLOUDFLARE_F9E_DATA_LOAD",

        storage:
          "SQLITE_DURABLE_OBJECT_LOCAL",

        rpc:
          true,

        importedMigrationHash:
          migrationHash,

        schemaPresent:
          false,

        totalErpRows:
          0,

        loaded:
          false,

        pass:
          migrationHash ===
            EXPECTED_MIGRATION_HASH,
      };
    }


    const schema =
      this.schemaSummary();


    const totalErpRows =
      this.totalErpRows();


    const transactionLedgerRows =
      Number(
        this.scalar(
          `
            SELECT COUNT(*) AS n
            FROM "transaction_ledger"
          `,
        ) ?? 0,
      );


    const sequence =
      this.hppHistorySequence();


    const loaded =
      totalErpRows ===
        EXPECTED_SOURCE_ROWS;


    const pass =
      migrationHash ===
        EXPECTED_MIGRATION_HASH &&

      schema.pass &&

      loaded &&

      transactionLedgerRows === 0 &&

      sequence ===
        EXPECTED_HPP_HISTORY_SEQUENCE;


    return {
      harness:
        "RKN_CLOUDFLARE_F9E_DATA_LOAD",

      storage:
        "SQLITE_DURABLE_OBJECT_LOCAL",

      rpc:
        true,

      importedMigrationHash:
        migrationHash,

      schemaPresent:
        true,

      totalErpRows,

      transactionLedgerRows,

      hppHistorySequence:
        sequence,

      schema,

      loaded,

      pass,
    };
  }
}


export default {

  async fetch(
    request,
    env,
  ) {

    try {

      const url =
        new URL(
          request.url,
        );


      if (
        request.method === "GET" &&
        url.pathname === "/"
      ) {

        return jsonResponse({
          harness:
            "RKN_CLOUDFLARE_F9E_DATA_LOAD",

          ready:
            true,

          localOnlyContract:
            true,

          payloadContract:
            "RKN_F9E_D_DATA_LOAD_V1",

          expectedPayloadHash:
            EXPECTED_PAYLOAD_HASH,

          expectedPayloadBytes:
            EXPECTED_PAYLOAD_BYTES,
        });
      }


      const stub =
        env.RKN_ERP_LOAD
          .getByName(
            "rkn-f9e-data-load-local-only",
          );


      if (
        request.method === "GET" &&
        url.pathname === "/probe"
      ) {

        const result =
          await stub.probe();


        return jsonResponse(
          result,
          result.pass
            ? 200
            : 500,
        );
      }


      if (
        request.method === "POST" &&
        url.pathname === "/load"
      ) {

        const payloadText =
          await request.text();


        const result =
          await stub.loadPayloadText(
            payloadText,
          );


        return jsonResponse(
          result,
          result.pass
            ? 200
            : 500,
        );
      }


      return jsonResponse(
        {
          error:
            "NOT_FOUND",
        },
        404,
      );

    }
    catch (error) {

      return jsonResponse(
        {
          harness:
            "RKN_CLOUDFLARE_F9E_DATA_LOAD",

          pass:
            false,

          error:
            String(
              error?.message ??
              error ??
              "UNKNOWN_ERROR",
            ),
        },
        500,
      );
    }
  },
};
