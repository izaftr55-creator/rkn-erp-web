import "server-only";

import { createHash } from "node:crypto";

import { db } from "@/lib/db";


/* ============================================================
 * RKN GLOBAL BUSINESS CORE V11.1
 *
 * Identity / orchestration contract only.
 *
 * IMPORTANT:
 * - Inventory Core remains authoritative for physical stock.
 * - Transaction Core remains authoritative for HPP / COGS.
 * - Marketplace listing PRICE is NOT order revenue.
 * - Legacy LINE_KEY remains a source fingerprint, not the
 *   permanent global business-line identity.
 * ============================================================ */


export type BusinessPlatform =
  | "SHOPEE"
  | "TIKTOK"
  | "TOKOPEDIA"
  | "MANUAL"
  | "UNKNOWN";


export type BusinessEventType =
  | "ORDER_IMPORTED"
  | "ORDER_UPDATED"
  | "ORDER_CANCELLED"

  | "ALLOCATION_DRAFTED"
  | "ALLOCATION_CONFIRMED"

  | "STOCK_OPENED"
  | "STOCK_ADJUSTED"
  | "STOCK_DEDUCTED"
  | "STOCK_RETURNED"

  | "HPP_SNAPSHOTTED"
  | "COGS_RECOGNIZED"

  | "SALE_RECOGNIZED"
  | "MARKETPLACE_FEE_POSTED"
  | "SETTLEMENT_RECEIVED"

  | "RETURN_REQUESTED"
  | "RETURN_RECEIVED"
  | "REFUND_COMPLETED";


export type SourceAliasType =
  | "LEGACY_LINE_KEY"
  | "MARKETPLACE_ORDER_ITEM_ID"
  | "MARKETPLACE_MODEL_ID"
  | "SOURCE_ROW_FINGERPRINT"
  | "EXTERNAL_LINE_ID";


export type StoreBusinessScopeRow = {
  platform: string;
  store_id: string;

  business_unit_id: string;

  store_name: string;

  source: string;

  active: number;

  created_at: string;
  updated_at: string;
};


export type BusinessOrderRow = {
  order_key: string;

  business_unit_id: string;

  platform: string;
  store_id: string;

  marketplace_order_id: string;

  order_date: string;
  order_status: string;

  first_seen_at: string;
  last_seen_at: string;
};


export type BusinessOrderLineRow = {
  business_line_key: string;

  order_key: string;

  business_unit_id: string;

  platform: string;
  store_id: string;

  marketplace_order_id: string;

  source_sku: string;
  canonical_sku: string;

  product_name: string;
  variation_name: string;

  qty: number;

  created_at: string;
  updated_at: string;
};


export type BusinessLineAliasRow = {
  alias_key: string;

  business_line_key: string;
  order_key: string;

  business_unit_id: string;

  platform: string;
  store_id: string;

  alias_type: SourceAliasType;
  alias_value: string;

  source: string;

  created_at: string;
};


export type BusinessEventRow = {
  event_key: string;

  event_type: BusinessEventType;

  business_unit_id: string;

  order_key: string;
  business_line_key: string;

  source: string;
  source_ref: string;

  actor_user_id: string;

  payload_json: string;

  occurred_at: string;
  recorded_at: string;
};


function cleanText(
  value: unknown,
  max = 700
): string {
  return String(
    value ?? ""
  )
    .trim()
    .slice(0, max);
}


function identityText(
  value: unknown
): string {
  return cleanText(
    value,
    1000
  )
    .normalize("NFKC")
    .toLowerCase();
}


function sha256(
  value: string
): string {
  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest(
      "hex"
    );
}


/*
 * ORDER_KEY
 *
 * Stable marketplace-order identity.
 *
 * Business Unit is intentionally included so business ownership
 * can never silently cross tenant/business boundaries.
 */
export function buildOrderKey(
  input: {
    businessUnitId: unknown;
    platform: unknown;
    storeId: unknown;
    orderId: unknown;
  }
): string {

  const businessUnitId =
    identityText(
      input.businessUnitId
    );

  const platform =
    identityText(
      input.platform
    );

  const storeId =
    identityText(
      input.storeId
    );

  const orderId =
    identityText(
      input.orderId
    );

  if (!businessUnitId) {
    throw new Error(
      "BUSINESS_UNIT_REQUIRED"
    );
  }

  if (!platform) {
    throw new Error(
      "PLATFORM_REQUIRED"
    );
  }

  if (!storeId) {
    throw new Error(
      "STORE_ID_REQUIRED"
    );
  }

  if (!orderId) {
    throw new Error(
      "ORDER_ID_REQUIRED"
    );
  }

  return [
    "ORD",
    businessUnitId,
    platform,
    storeId,
    orderId,
  ].join("::");
}


/*
 * Alias keys are deterministic and idempotent.
 *
 * Alias != permanent business-line identity.
 *
 * Examples:
 * - old Excel LINE_KEY
 * - Shopee API order_item_id
 * - Shopee model_id
 */
export function buildBusinessLineAliasKey(
  input: {
    businessUnitId: unknown;
    platform: unknown;
    storeId: unknown;
    aliasType: SourceAliasType;
    aliasValue: unknown;
  }
): string {

  const material = [
    identityText(
      input.businessUnitId
    ),

    identityText(
      input.platform
    ),

    identityText(
      input.storeId
    ),

    identityText(
      input.aliasType
    ),

    identityText(
      input.aliasValue
    ),
  ].join("|");

  if (
    material
      .split("|")
      .some(
        (part) =>
          !part
      )
  ) {
    throw new Error(
      "BUSINESS_LINE_ALIAS_IDENTITY_INCOMPLETE"
    );
  }

  return (
    "ALIAS::" +
    sha256(
      material
    )
  );
}


/*
 * BUSINESS_LINE_KEY
 *
 * Internal RKN identity.
 *
 * It is deliberately NOT built from:
 * product_name / variation_name / listing title.
 *
 * The seed is created by the resolver/orchestrator when a line
 * is first accepted. Subsequent Excel/API observations resolve
 * through business_line_alias.
 */
export function buildBusinessLineKey(
  input: {
    orderKey: unknown;
    identitySeed: unknown;
  }
): string {

  const orderKey =
    cleanText(
      input.orderKey,
      1200
    );

  const identitySeed =
    cleanText(
      input.identitySeed,
      1200
    );

  if (!orderKey) {
    throw new Error(
      "ORDER_KEY_REQUIRED"
    );
  }

  if (!identitySeed) {
    throw new Error(
      "BUSINESS_LINE_IDENTITY_SEED_REQUIRED"
    );
  }

  return (
    "LINE::" +
    sha256(
      [
        identityText(
          orderKey
        ),
        identityText(
          identitySeed
        ),
      ].join("|")
    )
  );
}


/*
 * Event keys must be supplied from deterministic domain facts.
 *
 * Example:
 *
 * ORDER_IMPORTED::<orderKey>::<sourceObservationKey>
 *
 * ALLOCATION_CONFIRMED::<businessLineKey>
 *
 * MARKETPLACE_FEE_POSTED::<settlementLineId>
 */
export function buildBusinessEventKey(
  input: {
    eventType: BusinessEventType;
    identity: unknown;
  }
): string {

  const identity =
    identityText(
      input.identity
    );

  if (!identity) {
    throw new Error(
      "BUSINESS_EVENT_IDENTITY_REQUIRED"
    );
  }

  return [
    "EVT",
    input.eventType,
    sha256(
      identity
    ),
  ].join("::");
}


/*
 * Schema definition exists in V11.1A but is NOT invoked merely
 * by importing this file.
 *
 * Runtime activation will happen only after source/type/runtime
 * verification and canonical STORE -> BUSINESS UNIT seeding.
 */
export function ensureGlobalBusinessCoreSchema() {

  db.exec(`
    CREATE TABLE IF NOT EXISTS
      marketplace_store_scope (

        platform TEXT NOT NULL,

        store_id TEXT NOT NULL,

        business_unit_id TEXT NOT NULL,

        store_name TEXT NOT NULL
          DEFAULT '',

        source TEXT NOT NULL
          DEFAULT '',

        active INTEGER NOT NULL
          DEFAULT 1
          CHECK (
            active IN (0, 1)
          ),

        created_at TEXT NOT NULL,

        updated_at TEXT NOT NULL,

        PRIMARY KEY (
          platform,
          store_id
        )
      );


    CREATE INDEX IF NOT EXISTS
      idx_marketplace_store_scope_bu

    ON marketplace_store_scope (
      business_unit_id,
      active
    );


    CREATE TABLE IF NOT EXISTS
      business_order (

        order_key TEXT PRIMARY KEY,

        business_unit_id TEXT NOT NULL,

        platform TEXT NOT NULL,

        store_id TEXT NOT NULL,

        marketplace_order_id TEXT NOT NULL,

        order_date TEXT NOT NULL
          DEFAULT '',

        order_status TEXT NOT NULL
          DEFAULT '',

        first_seen_at TEXT NOT NULL,

        last_seen_at TEXT NOT NULL,

        UNIQUE (
          business_unit_id,
          platform,
          store_id,
          marketplace_order_id
        )
      );


    CREATE INDEX IF NOT EXISTS
      idx_business_order_scope

    ON business_order (
      business_unit_id,
      platform,
      store_id,
      marketplace_order_id
    );


    CREATE TABLE IF NOT EXISTS
      business_order_line (

        business_line_key TEXT PRIMARY KEY,

        order_key TEXT NOT NULL,

        business_unit_id TEXT NOT NULL,

        platform TEXT NOT NULL,

        store_id TEXT NOT NULL,

        marketplace_order_id TEXT NOT NULL,

        source_sku TEXT NOT NULL
          DEFAULT '',

        canonical_sku TEXT NOT NULL
          DEFAULT '',

        product_name TEXT NOT NULL
          DEFAULT '',

        variation_name TEXT NOT NULL
          DEFAULT '',

        qty REAL NOT NULL
          CHECK (
            qty > 0
          ),

        created_at TEXT NOT NULL,

        updated_at TEXT NOT NULL
      );


    CREATE INDEX IF NOT EXISTS
      idx_business_order_line_order

    ON business_order_line (
      order_key
    );


    CREATE INDEX IF NOT EXISTS
      idx_business_order_line_scope

    ON business_order_line (
      business_unit_id,
      platform,
      store_id,
      marketplace_order_id
    );


    CREATE TABLE IF NOT EXISTS
      business_line_alias (

        alias_key TEXT PRIMARY KEY,

        business_line_key TEXT NOT NULL,

        order_key TEXT NOT NULL,

        business_unit_id TEXT NOT NULL,

        platform TEXT NOT NULL,

        store_id TEXT NOT NULL,

        alias_type TEXT NOT NULL,

        alias_value TEXT NOT NULL,

        source TEXT NOT NULL
          DEFAULT '',

        created_at TEXT NOT NULL,

        UNIQUE (
          business_unit_id,
          platform,
          store_id,
          alias_type,
          alias_value
        )
      );


    CREATE INDEX IF NOT EXISTS
      idx_business_line_alias_line

    ON business_line_alias (
      business_line_key
    );


    CREATE TABLE IF NOT EXISTS
      business_event (

        event_key TEXT PRIMARY KEY,

        event_type TEXT NOT NULL,

        business_unit_id TEXT NOT NULL,

        order_key TEXT NOT NULL
          DEFAULT '',

        business_line_key TEXT NOT NULL
          DEFAULT '',

        source TEXT NOT NULL
          DEFAULT '',

        source_ref TEXT NOT NULL
          DEFAULT '',

        actor_user_id TEXT NOT NULL
          DEFAULT '',

        payload_json TEXT NOT NULL
          DEFAULT '{}',

        occurred_at TEXT NOT NULL,

        recorded_at TEXT NOT NULL
      );


    CREATE INDEX IF NOT EXISTS
      idx_business_event_order

    ON business_event (
      business_unit_id,
      order_key,
      recorded_at
    );


    CREATE INDEX IF NOT EXISTS
      idx_business_event_line

    ON business_event (
      business_line_key,
      recorded_at
    );


    CREATE INDEX IF NOT EXISTS
      idx_business_event_type

    ON business_event (
      business_unit_id,
      event_type,
      recorded_at
    );
  `);
}


/* RKN_GLOBAL_BUSINESS_CORE_V11_1A_END */

// ============================================================
// RKN GLOBAL BUSINESS CORE V11.2B
// CANONICAL ORDER INGESTION SERVICE
//
// Scope:
// - canonical order persistence only
// - canonical line persistence only
// - source alias persistence only
// - ORDER_IMPORTED business event only
//
// Explicitly NOT performed here:
// - inventory allocation
// - stock deduction
// - Cost / COGS posting
// - revenue / fee / settlement posting
// ============================================================


export type CanonicalOrderLineObservationV11 = {
  aliasType: SourceAliasType;
  aliasValue: string;

  sourceSku?: string;
  canonicalSku?: string;

  productName?: string;
  variationName?: string;

  qty: number;
};


export type CanonicalOrderObservationV11 = {
  source: string;
  sourceRef: string;

  platform: string;
  storeId: string;

  orderId: string;
  orderDate?: string;
  orderStatus?: string;

  actorUserId?: string;

  lines: CanonicalOrderLineObservationV11[];
};


export type CanonicalOrderLineIngestResultV11 = {
  businessLineKey: string;
  aliasKey: string;
  aliasType: SourceAliasType;

  status:
    | "CREATED"
    | "REPLAYED";
};


export type CanonicalOrderIngestResultV11 = {
  orderKey: string;
  businessUnitId: string;

  platform: string;
  storeId: string;
  orderId: string;

  orderCreated: boolean;
  eventCreated: boolean;

  createdLines: number;
  replayedLines: number;

  lines:
    CanonicalOrderLineIngestResultV11[];
};


type ActiveStoreScopeInternalV11 = {
  platform: string;
  store_id: string;
  business_unit_id: string;
  store_name: string;
};


type ExistingAliasInternalV11 = {
  alias_key: string;
  business_line_key: string;
  order_key: string;
  business_unit_id: string;
  platform: string;
  store_id: string;
  alias_type: string;
  alias_value: string;
};


type ExistingBusinessLineInternalV11 = {
  business_line_key: string;
  order_key: string;
  business_unit_id: string;
  platform: string;
  store_id: string;
  marketplace_order_id: string;
};


const SOURCE_ALIAS_TYPES_V11 =
  new Set<SourceAliasType>([
    "LEGACY_LINE_KEY",
    "MARKETPLACE_ORDER_ITEM_ID",
    "MARKETPLACE_MODEL_ID",
    "SOURCE_ROW_FINGERPRINT",
    "EXTERNAL_LINE_ID",
  ]);


/**
 * Canonical business scope is always resolved by the server.
 *
 * Caller-supplied BUSINESS_UNIT_ID is intentionally not part of
 * CanonicalOrderObservationV11.
 */
export function resolveActiveStoreBusinessScopeV11(
  platformInput: unknown,
  storeIdInput: unknown
): ActiveStoreScopeInternalV11 {

  ensureGlobalBusinessCoreSchema();

  const platform =
    cleanText(
      platformInput,
      60
    ).toUpperCase();

  const storeId =
    cleanText(
      storeIdInput,
      240
    );


  if (!platform) {
    throw new Error(
      "PLATFORM_REQUIRED"
    );
  }


  if (!storeId) {
    throw new Error(
      "STORE_ID_REQUIRED"
    );
  }


  const scope =
    db.prepare(`
      SELECT
        platform,
        store_id,
        business_unit_id,
        store_name

      FROM marketplace_store_scope

      WHERE
        UPPER(TRIM(platform)) = ?
        AND TRIM(store_id) = ?
        AND active = 1

      LIMIT 1
    `).get(
      platform,
      storeId
    ) as
      | ActiveStoreScopeInternalV11
      | undefined;


  if (!scope) {
    throw new Error(
      "STORE_BUSINESS_SCOPE_NOT_FOUND"
    );
  }


  if (
    !cleanText(
      scope.business_unit_id,
      240
    )
  ) {
    throw new Error(
      "STORE_BUSINESS_SCOPE_INVALID"
    );
  }


  return scope;
}


/**
 * BUSINESS_LINE_KEY must be an internal durable identity.
 *
 * We intentionally generate a random internal seed and then feed
 * it into buildBusinessLineKey().
 *
 * We do NOT seed it from:
 * - product name
 * - variation name
 * - legacy LINE_KEY
 * - API item ID
 *
 * Those values belong in business_line_alias.
 */
function createInternalBusinessLineKeyV11(
  orderKey: string
): string {

  const randomRow =
    db.prepare(`
      SELECT
        lower(
          hex(
            randomblob(16)
          )
        ) AS seed
    `).get() as {
      seed?: string;
    };


  const seed =
    cleanText(
      randomRow?.seed,
      100
    );


  if (!seed) {
    throw new Error(
      "BUSINESS_LINE_SEED_GENERATION_FAILED"
    );
  }


  return buildBusinessLineKey({
    orderKey,

    identitySeed:
      `INTERNAL::${seed}`,
  });
}


function assertCanonicalAliasTypeV11(
  value: unknown
): asserts value is SourceAliasType {

  const normalized =
    cleanText(
      value,
      120
    );


  if (
    !SOURCE_ALIAS_TYPES_V11.has(
      normalized as SourceAliasType
    )
  ) {
    throw new Error(
      "SOURCE_ALIAS_TYPE_INVALID"
    );
  }
}


/**
 * Canonical order ingestion.
 *
 * Important safety contract:
 *
 * If the order already existed BEFORE this observation and an
 * incoming alias cannot be resolved, we DO NOT silently create a
 * second business line.
 *
 * This is what protects future:
 *
 *   Excel LEGACY_LINE_KEY
 *        vs
 *   API MARKETPLACE_ORDER_ITEM_ID
 *
 * from becoming duplicate economic / inventory lines.
 *
 * A future bridge/resolver may attach the new alias only after
 * proving which existing business line it belongs to.
 */
export function ingestCanonicalOrderObservationV11(
  input:
    CanonicalOrderObservationV11
): CanonicalOrderIngestResultV11 {

  ensureGlobalBusinessCoreSchema();


  const source =
    cleanText(
      input.source,
      120
    );


  const sourceRef =
    cleanText(
      input.sourceRef,
      700
    );


  const orderId =
    cleanText(
      input.orderId,
      300
    );


  const orderDate =
    cleanText(
      input.orderDate,
      120
    );


  const orderStatus =
    cleanText(
      input.orderStatus,
      120
    );


  const actorUserId =
    cleanText(
      input.actorUserId,
      240
    );


  if (!source) {
    throw new Error(
      "SOURCE_REQUIRED"
    );
  }


  if (!sourceRef) {
    throw new Error(
      "SOURCE_REF_REQUIRED"
    );
  }


  if (!orderId) {
    throw new Error(
      "ORDER_ID_REQUIRED"
    );
  }


  if (
    !Array.isArray(
      input.lines
    )
    ||
    input.lines.length === 0
  ) {
    throw new Error(
      "ORDER_LINES_REQUIRED"
    );
  }


  const scope =
    resolveActiveStoreBusinessScopeV11(
      input.platform,
      input.storeId
    );


  const platform =
    cleanText(
      scope.platform,
      60
    ).toUpperCase();


  const storeId =
    cleanText(
      scope.store_id,
      240
    );


  const businessUnitId =
    cleanText(
      scope.business_unit_id,
      240
    );


  const orderKey =
    buildOrderKey({
      businessUnitId,
      platform,
      storeId,
      orderId,
    });


  // --------------------------------------------------------
  // Pre-validate all line observations before transaction.
  // --------------------------------------------------------

  const preparedLines =
    input.lines.map(
      (
        line,
        index
      ) => {

        assertCanonicalAliasTypeV11(
          line.aliasType
        );


        const aliasValue =
          cleanText(
            line.aliasValue,
            1400
          );


        if (!aliasValue) {
          throw new Error(
            `SOURCE_ALIAS_VALUE_REQUIRED:${index}`
          );
        }


        const qty =
          Number(
            line.qty
          );


        if (
          !Number.isFinite(
            qty
          )
          ||
          qty <= 0
        ) {
          throw new Error(
            `ORDER_LINE_QTY_INVALID:${index}`
          );
        }


        const aliasKey =
          buildBusinessLineAliasKey({
            businessUnitId,
            platform,
            storeId,

            aliasType:
              line.aliasType,

            aliasValue,
          });


        return {
          aliasType:
            line.aliasType,

          aliasValue,
          aliasKey,

          sourceSku:
            cleanText(
              line.sourceSku,
              500
            ),

          canonicalSku:
            cleanText(
              line.canonicalSku,
              500
            ),

          productName:
            cleanText(
              line.productName,
              1000
            ),

          variationName:
            cleanText(
              line.variationName,
              1000
            ),

          qty,
        };
      }
    );


  const aliasKeys =
    new Set<string>();


  for (
    const line
    of preparedLines
  ) {

    if (
      aliasKeys.has(
        line.aliasKey
      )
    ) {
      throw new Error(
        `DUPLICATE_SOURCE_ALIAS_IN_OBSERVATION:${line.aliasKey}`
      );
    }


    aliasKeys.add(
      line.aliasKey
    );
  }


  const execute =
    db.transaction(
      () => {

        const now =
          new Date()
            .toISOString();


        const existingOrder =
          db.prepare(`
            SELECT
              order_key,
              business_unit_id,
              platform,
              store_id,
              marketplace_order_id

            FROM business_order

            WHERE order_key = ?

            LIMIT 1
          `).get(
            orderKey
          ) as
            | {
                order_key: string;
                business_unit_id: string;
                platform: string;
                store_id: string;
                marketplace_order_id: string;
              }
            | undefined;


        const orderExistedBefore =
          Boolean(
            existingOrder
          );


        if (existingOrder) {

          if (
            existingOrder.business_unit_id !==
              businessUnitId
            ||
            cleanText(
              existingOrder.platform,
              60
            ).toUpperCase() !==
              platform
            ||
            existingOrder.store_id !==
              storeId
            ||
            existingOrder.marketplace_order_id !==
              orderId
          ) {
            throw new Error(
              "ORDER_IDENTITY_CONFLICT"
            );
          }
        }


        db.prepare(`
          INSERT INTO business_order (
            order_key,
            business_unit_id,
            platform,
            store_id,
            marketplace_order_id,
            order_date,
            order_status,
            first_seen_at,
            last_seen_at
          )

          VALUES (
            @orderKey,
            @businessUnitId,
            @platform,
            @storeId,
            @orderId,
            @orderDate,
            @orderStatus,
            @now,
            @now
          )

          ON CONFLICT(order_key)
          DO UPDATE SET

            order_date =
              CASE
                WHEN
                  TRIM(excluded.order_date) <> ''
                THEN
                  excluded.order_date
                ELSE
                  business_order.order_date
              END,

            order_status =
              CASE
                WHEN
                  TRIM(excluded.order_status) <> ''
                THEN
                  excluded.order_status
                ELSE
                  business_order.order_status
              END,

            last_seen_at =
              excluded.last_seen_at
        `).run({
          orderKey,
          businessUnitId,
          platform,
          storeId,
          orderId,
          orderDate,
          orderStatus,
          now,
        });


        const lineResults:
          CanonicalOrderLineIngestResultV11[] =
            [];


        let createdLines =
          0;


        let replayedLines =
          0;


        for (
          const line
          of preparedLines
        ) {

          const existingAlias =
            db.prepare(`
              SELECT
                alias_key,
                business_line_key,
                order_key,
                business_unit_id,
                platform,
                store_id,
                alias_type,
                alias_value

              FROM business_line_alias

              WHERE alias_key = ?

              LIMIT 1
            `).get(
              line.aliasKey
            ) as
              | ExistingAliasInternalV11
              | undefined;


          if (existingAlias) {

            if (
              existingAlias.order_key !==
                orderKey
              ||
              existingAlias.business_unit_id !==
                businessUnitId
              ||
              cleanText(
                existingAlias.platform,
                60
              ).toUpperCase() !==
                platform
              ||
              existingAlias.store_id !==
                storeId
            ) {
              throw new Error(
                `SOURCE_ALIAS_SCOPE_CONFLICT:${line.aliasKey}`
              );
            }


            const existingLine =
              db.prepare(`
                SELECT
                  business_line_key,
                  order_key,
                  business_unit_id,
                  platform,
                  store_id,
                  marketplace_order_id

                FROM business_order_line

                WHERE business_line_key = ?

                LIMIT 1
              `).get(
                existingAlias.business_line_key
              ) as
                | ExistingBusinessLineInternalV11
                | undefined;


            if (!existingLine) {
              throw new Error(
                `SOURCE_ALIAS_ORPHANED:${line.aliasKey}`
              );
            }


            if (
              existingLine.order_key !==
                orderKey
              ||
              existingLine.business_unit_id !==
                businessUnitId
              ||
              cleanText(
                existingLine.platform,
                60
              ).toUpperCase() !==
                platform
              ||
              existingLine.store_id !==
                storeId
              ||
              existingLine.marketplace_order_id !==
                orderId
            ) {
              throw new Error(
                `BUSINESS_LINE_SCOPE_CONFLICT:${existingLine.business_line_key}`
              );
            }


            db.prepare(`
              UPDATE business_order_line

              SET
                source_sku =
                  CASE
                    WHEN
                      TRIM(@sourceSku) <> ''
                    THEN
                      @sourceSku
                    ELSE
                      source_sku
                  END,

                canonical_sku =
                  CASE
                    WHEN
                      TRIM(@canonicalSku) <> ''
                    THEN
                      @canonicalSku
                    ELSE
                      canonical_sku
                  END,

                product_name =
                  CASE
                    WHEN
                      TRIM(@productName) <> ''
                    THEN
                      @productName
                    ELSE
                      product_name
                  END,

                variation_name =
                  CASE
                    WHEN
                      TRIM(@variationName) <> ''
                    THEN
                      @variationName
                    ELSE
                      variation_name
                  END,

                qty =
                  @qty,

                updated_at =
                  @now

              WHERE
                business_line_key =
                  @businessLineKey
            `).run({
              businessLineKey:
                existingLine.business_line_key,

              sourceSku:
                line.sourceSku,

              canonicalSku:
                line.canonicalSku,

              productName:
                line.productName,

              variationName:
                line.variationName,

              qty:
                line.qty,

              now,
            });


            replayedLines +=
              1;


            lineResults.push({
              businessLineKey:
                existingLine.business_line_key,

              aliasKey:
                line.aliasKey,

              aliasType:
                line.aliasType,

              status:
                "REPLAYED",
            });


            continue;
          }


          /**
           * Critical anti-double-line guard.
           *
           * A missing alias on an already known order is ambiguous.
           *
           * It might be:
           * - a genuinely new marketplace line
           * - the API identity of an Excel line already present
           * - a changed legacy fingerprint
           *
           * Until a resolver can prove the relationship, fail closed.
           */
          if (
            orderExistedBefore
          ) {
            throw new Error(
              `LINE_ALIAS_REVIEW_REQUIRED:${line.aliasKey}`
            );
          }


          const businessLineKey =
            createInternalBusinessLineKeyV11(
              orderKey
            );


          db.prepare(`
            INSERT INTO business_order_line (
              business_line_key,
              order_key,
              business_unit_id,
              platform,
              store_id,
              marketplace_order_id,
              source_sku,
              canonical_sku,
              product_name,
              variation_name,
              qty,
              created_at,
              updated_at
            )

            VALUES (
              @businessLineKey,
              @orderKey,
              @businessUnitId,
              @platform,
              @storeId,
              @orderId,
              @sourceSku,
              @canonicalSku,
              @productName,
              @variationName,
              @qty,
              @now,
              @now
            )
          `).run({
            businessLineKey,
            orderKey,
            businessUnitId,
            platform,
            storeId,
            orderId,

            sourceSku:
              line.sourceSku,

            canonicalSku:
              line.canonicalSku,

            productName:
              line.productName,

            variationName:
              line.variationName,

            qty:
              line.qty,

            now,
          });


          db.prepare(`
            INSERT INTO business_line_alias (
              alias_key,
              business_line_key,
              order_key,
              business_unit_id,
              platform,
              store_id,
              alias_type,
              alias_value,
              source,
              created_at
            )

            VALUES (
              @aliasKey,
              @businessLineKey,
              @orderKey,
              @businessUnitId,
              @platform,
              @storeId,
              @aliasType,
              @aliasValue,
              @source,
              @now
            )
          `).run({
            aliasKey:
              line.aliasKey,

            businessLineKey,
            orderKey,
            businessUnitId,
            platform,
            storeId,

            aliasType:
              line.aliasType,

            aliasValue:
              line.aliasValue,

            source,
            now,
          });


          createdLines +=
            1;


          lineResults.push({
            businessLineKey,
            aliasKey:
              line.aliasKey,

            aliasType:
              line.aliasType,

            status:
              "CREATED",
          });
        }


        const eventKey =
          buildBusinessEventKey({
            eventType:
              "ORDER_IMPORTED",

            identity: [
              orderKey,
              source,
              sourceRef,
            ].join("::"),
          });


        const eventInsert =
          db.prepare(`
            INSERT OR IGNORE INTO
              business_event (
                event_key,
                event_type,
                business_unit_id,
                order_key,
                business_line_key,
                source,
                source_ref,
                actor_user_id,
                payload_json,
                occurred_at,
                recorded_at
              )

            VALUES (
              @eventKey,
              'ORDER_IMPORTED',
              @businessUnitId,
              @orderKey,
              '',
              @source,
              @sourceRef,
              @actorUserId,
              @payloadJson,
              @now,
              @now
            )
          `).run({
            eventKey,
            businessUnitId,
            orderKey,
            source,
            sourceRef,
            actorUserId,

            payloadJson:
              JSON.stringify({
                platform,
                storeId,
                orderId,

                lineCount:
                  preparedLines.length,

                createdLines,
                replayedLines,
              }),

            now,
          });


        return {
          orderKey,
          businessUnitId,

          platform,
          storeId,
          orderId,

          orderCreated:
            !orderExistedBefore,

          eventCreated:
            Number(
              eventInsert.changes
            ) === 1,

          createdLines,
          replayedLines,

          lines:
            lineResults,
        };
      }
    );


  return execute();
}


// RKN_GLOBAL_BUSINESS_CORE_V11_2B_END
