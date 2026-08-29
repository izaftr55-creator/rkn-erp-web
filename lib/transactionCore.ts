import "server-only";
import { db } from "@/lib/db";
export type TransactionCostStatus =
  | "FOUND"
  | "HPP_ZERO"
  | "HPP_MISSING"
  | "SKU_MISSING"
  | "ORDER_DATE_INVALID";
export type TransactionCoreInput = {
  lineKey: string;
  source: string;
  platform: string;
  storeId: string;
  orderId: string;
  orderDate: string;
  orderStatus?: string;
  canonicalSku: string;
  qty: number;
};
type HistoricalHppRow = {
  cost_key: string;
  sku: string;
  effective_hpp: number;
  effective_from: string;
  cost_source: "HPP_HISTORY" | "HPP_MASTER";
};
export type HistoricalHppLookup = {
  status: TransactionCostStatus;
  hpp: number;
  effectiveFrom: string;
  costKey: string;
  costSource: string;
  dateKey: string;
};
export type TransactionLedgerRow = {
  line_key: string;
  source: string;
  platform: string;
  store_id: string;
  order_id: string;
  order_date: string;
  order_date_key: string;
  order_status: string;
  canonical_sku: string;
  qty: number;
  hpp_snapshot: number;
  hpp_effective_from: string;
  hpp_cost_key: string;
  cost_source: string;
  cogs_total: number;
  cost_status: TransactionCostStatus;
  created_at: string;
  updated_at: string;
};
function cleanText(
  value: unknown,
  max = 500
): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}
function finiteNumber(
  value: unknown,
  fallback = 0
): number {
  const n = Number(value);
  return Number.isFinite(n)
    ? n
    : fallback;
}
function validYmd(
  year: number,
  month: number,
  day: number
): boolean {
  if (
    year < 2000 ||
    year > 2200 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }
  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
function ymd(
  year: number,
  month: number,
  day: number
): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}
/**
 * Mengubah tanggal transaksi menjadi YYYY-MM-DD.
 *
 * Format utama yang didukung:
 * - 2026-03-15
 * - 2026-03-15 10:20:30
 * - 2026-03-15T10:20:30
 * - 15/03/2026
 * - 15-03-2026
 * - 15.03.2026
 */
export function normalizeTransactionDate(
  value: unknown
): string {
  const raw =
    cleanText(value, 120);
  if (!raw) {
    return "";
  }
  const iso =
    raw.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return validYmd(
      year,
      month,
      day
    )
      ? ymd(year, month, day)
      : "";
  }
  const dmy =
    raw.match(
      /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/
    );
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    return validYmd(
      year,
      month,
      day
    )
      ? ymd(year, month, day)
      : "";
  }
  return "";
}
export function ensureTransactionCoreSchema() {
  db.exec(`
    /*
     * Transaction Core may initialize before /api/rkn/hpp
     * has ever been requested.
     *
     * Keep the HPP read-model schema available so historical
     * costing never depends on UI/API initialization order.
     */
    CREATE TABLE IF NOT EXISTS hpp_master (
      cost_key TEXT PRIMARY KEY,
      product_id TEXT NOT NULL DEFAULT '',
      sku TEXT NOT NULL DEFAULT '',
      product_name TEXT NOT NULL DEFAULT '',
      method TEXT NOT NULL
        CHECK (method IN ('MANUAL', 'AUTO')),
      manual_hpp REAL NOT NULL DEFAULT 0,
      calculated_hpp REAL NOT NULL DEFAULT 0,
      effective_hpp REAL NOT NULL DEFAULT 0,
      components_json TEXT NOT NULL DEFAULT '[]',
      effective_from TEXT NOT NULL,
      source_note TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
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
    );
    CREATE INDEX IF NOT EXISTS
      idx_hpp_history_cost_key
    ON hpp_history (
      cost_key,
      changed_at DESC
    );
    CREATE INDEX IF NOT EXISTS
      idx_hpp_master_effective_from
    ON hpp_master (
      effective_from
    );
    CREATE TABLE IF NOT EXISTS transaction_ledger (
      line_key TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT '',
      store_id TEXT NOT NULL DEFAULT '',
      order_id TEXT NOT NULL DEFAULT '',
      order_date TEXT NOT NULL DEFAULT '',
      order_date_key TEXT NOT NULL DEFAULT '',
      order_status TEXT NOT NULL DEFAULT '',
      canonical_sku TEXT NOT NULL DEFAULT '',
      qty REAL NOT NULL DEFAULT 1,
      hpp_snapshot REAL NOT NULL DEFAULT 0,
      hpp_effective_from TEXT NOT NULL DEFAULT '',
      hpp_cost_key TEXT NOT NULL DEFAULT '',
      cost_source TEXT NOT NULL DEFAULT '',
      cogs_total REAL NOT NULL DEFAULT 0,
      cost_status TEXT NOT NULL DEFAULT 'HPP_MISSING'
        CHECK (
          cost_status IN (
            'FOUND',
            'HPP_ZERO',
            'HPP_MISSING',
            'SKU_MISSING',
            'ORDER_DATE_INVALID'
          )
        ),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS
      idx_transaction_ledger_order
    ON transaction_ledger (
      platform,
      store_id,
      order_id
    );
    CREATE INDEX IF NOT EXISTS
      idx_transaction_ledger_sku_date
    ON transaction_ledger (
      canonical_sku,
      order_date_key
    );
    CREATE INDEX IF NOT EXISTS
      idx_transaction_ledger_cost_status
    ON transaction_ledger (
      cost_status
    );
    CREATE INDEX IF NOT EXISTS
      idx_hpp_history_sku_effective
    ON hpp_history (
      sku,
      effective_from,
      changed_at DESC
    );
  `);
}
export function lookupHistoricalHpp(
  skuValue: unknown,
  orderDateValue: unknown
): HistoricalHppLookup {
  ensureTransactionCoreSchema();
  const sku =
    cleanText(
      skuValue,
      240
    );
  if (!sku) {
    return {
      status: "SKU_MISSING",
      hpp: 0,
      effectiveFrom: "",
      costKey: "",
      costSource: "",
      dateKey:
        normalizeTransactionDate(
          orderDateValue
        ),
    };
  }
  const dateKey =
    normalizeTransactionDate(
      orderDateValue
    );
  if (!dateKey) {
    return {
      status:
        "ORDER_DATE_INVALID",
      hpp: 0,
      effectiveFrom: "",
      costKey: "",
      costSource: "",
      dateKey: "",
    };
  }
  /*
   * PRIORITAS 1
   * Historical HPP berdasarkan
   * SKU + tanggal efektif.
   */
  const history =
    db.prepare(`
      SELECT
        cost_key,
        sku,
        effective_hpp,
        effective_from,
        'HPP_HISTORY' AS cost_source
      FROM hpp_history
      WHERE
        UPPER(TRIM(sku)) =
          UPPER(TRIM(?))
        AND
        SUBSTR(effective_from, 1, 10)
          <= ?
      ORDER BY
        SUBSTR(effective_from, 1, 10)
          DESC,
        changed_at DESC,
        id DESC
      LIMIT 1
    `).get(
      sku,
      dateKey
    ) as
      | HistoricalHppRow
      | undefined;
  /*
   * PRIORITAS 2
   * Fallback untuk master lama
   * yang mungkin belum mempunyai
   * record history.
   */
  const master =
    history
      ? undefined
      : (
          db.prepare(`
            SELECT
              cost_key,
              sku,
              effective_hpp,
              effective_from,
              'HPP_MASTER' AS cost_source
            FROM hpp_master
            WHERE
              UPPER(TRIM(sku)) =
                UPPER(TRIM(?))
              AND
              SUBSTR(effective_from, 1, 10)
                <= ?
            ORDER BY
              SUBSTR(effective_from, 1, 10)
                DESC,
              updated_at DESC
            LIMIT 1
          `).get(
            sku,
            dateKey
          ) as
            | HistoricalHppRow
            | undefined
        );
  const found =
    history || master;
  if (!found) {
    return {
      status: "HPP_MISSING",
      hpp: 0,
      effectiveFrom: "",
      costKey: "",
      costSource: "",
      dateKey,
    };
  }
  const hpp =
    Math.max(
      0,
      finiteNumber(
        found.effective_hpp,
        0
      )
    );
  return {
    status:
      hpp > 0
        ? "FOUND"
        : "HPP_ZERO",
    hpp,
    effectiveFrom:
      cleanText(
        found.effective_from,
        120
      ),
    costKey:
      cleanText(
        found.cost_key,
        240
      ),
    costSource:
      found.cost_source,
    dateKey,
  };
}
export function upsertTransactionLine(
  input: TransactionCoreInput
): TransactionLedgerRow {
  ensureTransactionCoreSchema();
  const lineKey =
    cleanText(
      input.lineKey,
      700
    );
  if (!lineKey) {
    throw new Error(
      "TRANSACTION_LINE_KEY_REQUIRED"
    );
  }
  const qty =
    Math.max(
      0,
      finiteNumber(
        input.qty,
        0
      )
    );
  if (qty <= 0) {
    throw new Error(
      `TRANSACTION_QTY_INVALID:${lineKey}`
    );
  }
  const canonicalSku =
    cleanText(
      input.canonicalSku,
      240
    );
  const lookup =
    lookupHistoricalHpp(
      canonicalSku,
      input.orderDate
    );
  const cogsTotal =
    lookup.status === "FOUND"
      ? lookup.hpp * qty
      : 0;
  const now =
    new Date().toISOString();
  /*
   * COST IDENTITY RULE:
   *
   * Unit HPP snapshot tetap immutable
   * selama canonical SKU + transaction date
   * tidak berubah.
   *
   * Qty boleh berubah dan COGS_TOTAL
   * dihitung ulang menggunakan unit HPP
   * snapshot yang sudah terkunci.
   *
   * Jika canonical SKU atau transaction date
   * berubah, historical HPP wajib di-resolve ulang.
   *
   * HPP_MISSING / HPP_ZERO / SKU_MISSING /
   * ORDER_DATE_INVALID juga tetap boleh
   * diselesaikan saat data sudah lengkap.
   */
  db.prepare(`
    INSERT INTO transaction_ledger (
      line_key,
      source,
      platform,
      store_id,
      order_id,
      order_date,
      order_date_key,
      order_status,
      canonical_sku,
      qty,
      hpp_snapshot,
      hpp_effective_from,
      hpp_cost_key,
      cost_source,
      cogs_total,
      cost_status,
      created_at,
      updated_at
    )
    VALUES (
      @lineKey,
      @source,
      @platform,
      @storeId,
      @orderId,
      @orderDate,
      @orderDateKey,
      @orderStatus,
      @canonicalSku,
      @qty,
      @hppSnapshot,
      @hppEffectiveFrom,
      @hppCostKey,
      @costSource,
      @cogsTotal,
      @costStatus,
      @createdAt,
      @updatedAt
    )
    ON CONFLICT(line_key)
    DO UPDATE SET
      source =
        excluded.source,
      platform =
        excluded.platform,
      store_id =
        excluded.store_id,
      order_id =
        excluded.order_id,
      order_date =
        excluded.order_date,
      order_status =
        excluded.order_status,
      canonical_sku =
        excluded.canonical_sku,
      qty =
        excluded.qty,
      order_date_key =
        excluded.order_date_key,
      hpp_snapshot =
        CASE
          WHEN
            transaction_ledger.cost_status = 'FOUND'
            AND UPPER(TRIM(transaction_ledger.canonical_sku)) =
                UPPER(TRIM(excluded.canonical_sku))
            AND transaction_ledger.order_date_key =
                excluded.order_date_key
          THEN transaction_ledger.hpp_snapshot
          ELSE excluded.hpp_snapshot
        END,
      hpp_effective_from =
        CASE
          WHEN
            transaction_ledger.cost_status = 'FOUND'
            AND UPPER(TRIM(transaction_ledger.canonical_sku)) =
                UPPER(TRIM(excluded.canonical_sku))
            AND transaction_ledger.order_date_key =
                excluded.order_date_key
          THEN transaction_ledger.hpp_effective_from
          ELSE excluded.hpp_effective_from
        END,
      hpp_cost_key =
        CASE
          WHEN
            transaction_ledger.cost_status = 'FOUND'
            AND UPPER(TRIM(transaction_ledger.canonical_sku)) =
                UPPER(TRIM(excluded.canonical_sku))
            AND transaction_ledger.order_date_key =
                excluded.order_date_key
          THEN transaction_ledger.hpp_cost_key
          ELSE excluded.hpp_cost_key
        END,
      cost_source =
        CASE
          WHEN
            transaction_ledger.cost_status = 'FOUND'
            AND UPPER(TRIM(transaction_ledger.canonical_sku)) =
                UPPER(TRIM(excluded.canonical_sku))
            AND transaction_ledger.order_date_key =
                excluded.order_date_key
          THEN transaction_ledger.cost_source
          ELSE excluded.cost_source
        END,
      cogs_total =
        CASE
          WHEN
            transaction_ledger.cost_status = 'FOUND'
            AND UPPER(TRIM(transaction_ledger.canonical_sku)) =
                UPPER(TRIM(excluded.canonical_sku))
            AND transaction_ledger.order_date_key =
                excluded.order_date_key
          THEN transaction_ledger.hpp_snapshot * excluded.qty
          ELSE excluded.cogs_total
        END,
      cost_status =
        CASE
          WHEN
            transaction_ledger.cost_status = 'FOUND'
            AND UPPER(TRIM(transaction_ledger.canonical_sku)) =
                UPPER(TRIM(excluded.canonical_sku))
            AND transaction_ledger.order_date_key =
                excluded.order_date_key
          THEN 'FOUND'
          ELSE excluded.cost_status
        END,
      updated_at =
        excluded.updated_at
  `).run({
    lineKey,
    source:
      cleanText(
        input.source,
        120
      ),
    platform:
      cleanText(
        input.platform,
        60
      ).toUpperCase(),
    storeId:
      cleanText(
        input.storeId,
        240
      ),
    orderId:
      cleanText(
        input.orderId,
        300
      ),
    orderDate:
      cleanText(
        input.orderDate,
        120
      ),
    orderDateKey:
      lookup.dateKey,
    orderStatus:
      cleanText(
        input.orderStatus,
        120
      ),
    canonicalSku,
    qty,
    hppSnapshot:
      lookup.hpp,
    hppEffectiveFrom:
      lookup.effectiveFrom,
    hppCostKey:
      lookup.costKey,
    costSource:
      lookup.costSource,
    cogsTotal,
    costStatus:
      lookup.status,
    createdAt: now,
    updatedAt: now,
  });
  return db.prepare(`
    SELECT
      *
    FROM transaction_ledger
    WHERE line_key = ?
  `).get(
    lineKey
  ) as TransactionLedgerRow;
}
export function upsertTransactionLines(
  inputs: TransactionCoreInput[]
): TransactionLedgerRow[] {
  ensureTransactionCoreSchema();
  const execute =
    db.transaction(
      (
        rows: TransactionCoreInput[]
      ) =>
        rows.map(
          upsertTransactionLine
        )
    );
  return execute(inputs);
}
export function getTransactionCoreStats() {
  ensureTransactionCoreSchema();
  return db.prepare(`
    SELECT
      COUNT(*) AS total_lines,
      SUM(
        CASE
          WHEN cost_status = 'FOUND'
          THEN 1
          ELSE 0
        END
      ) AS cost_found,
      SUM(
        CASE
          WHEN cost_status <> 'FOUND'
          THEN 1
          ELSE 0
        END
      ) AS cost_pending,
      COALESCE(
        SUM(cogs_total),
        0
      ) AS total_cogs
    FROM transaction_ledger
  `).get();
}
export function getRecentTransactions(
  limitValue = 100
): TransactionLedgerRow[] {
  ensureTransactionCoreSchema();
  const limit =
    Math.max(
      1,
      Math.min(
        500,
        Math.floor(
          finiteNumber(
            limitValue,
            100
          )
        )
      )
    );
  return db.prepare(`
    SELECT
      *
    FROM transaction_ledger
    ORDER BY
      updated_at DESC
    LIMIT ?
  `).all(
    limit
  ) as TransactionLedgerRow[];
}


