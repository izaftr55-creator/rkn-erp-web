import type { DoSqliteCompat } from "../do-sqlite-compat";
import { randomUUID } from "node:crypto";

export function createInventoryCore(db: DoSqliteCompat) {

  type InventoryMovementType =
    | "OPENING"
    | "ADJUSTMENT"
    | "ORDER_OUT"
    | "RETURN_IN"
    | "BORROW_OUT"
    | "BORROW_IN";

  type AllocationStatus =
    | "DRAFT"
    | "CONFIRMED"
    | "CANCELLED";

  type InventoryBalanceRow = {
    business_unit_id: string;
    warehouse_id: string;
    physical_sku: string;
    qty_on_hand: number;
    created_at: string;
    updated_at: string;
  };

  type InventoryLedgerRow = {
    movement_key: string;
    business_unit_id: string;
    warehouse_id: string;
    physical_sku: string;
    qty_delta: number;
    movement_type: InventoryMovementType;
    source_type: string;
    source_key: string;
    order_id: string;
    order_line_key: string;
    allocation_item_key: string;
    actor_user_id: string;
    note: string;
    created_at: string;
  };

  type OrderAllocationRow = {
    line_key: string;
    business_unit_id: string;
    warehouse_id: string;
    platform: string;
    store_id: string;
    order_id: string;
    order_date: string;
    sell_sku: string;
    ordered_qty: number;
    required_qty: number;
    status: AllocationStatus;
    confirmed_at: string;
    confirmed_by: string;
    created_at: string;
    updated_at: string;
  };

  type OrderAllocationItemRow = {
    item_key: string;
    line_key: string;
    physical_sku: string;
    qty: number;
    created_at: string;
    updated_at: string;
  };

  type AllocationDraftInput = {
    lineKey: string;
    businessUnitId: string;
    warehouseId: string;

    actorUserId?: string;

    platform?: string;
    storeId?: string;

    orderId: string;
    orderDate?: string;

    sellSku?: string;

    orderedQty: number;
    requiredQty: number;

    items: Array<{
      physicalSku: string;
      qty: number;
    }>;
  };

  type InventoryAdjustmentInput = {
    movementKey: string;

    businessUnitId: string;
    warehouseId: string;
    physicalSku: string;

    qtyDelta: number;

    movementType:
      | "OPENING"
      | "ADJUSTMENT"
      | "RETURN_IN"
      | "BORROW_OUT"
      | "BORROW_IN";

    actorUserId: string;

    sourceType?: string;
    sourceKey?: string;
    note?: string;
  };

  function cleanText(
    value: unknown,
    maxLength = 700
  ): string {
    return String(value ?? "")
      .trim()
      .slice(0, maxLength);
  }

  function cleanSku(
    value: unknown
  ): string {
    return cleanText(
      value,
      240
    ).toUpperCase();
  }

  function finiteNumber(
    value: unknown,
    fallback = 0
  ): number {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  function positiveNumber(
    value: unknown,
    code: string
  ): number {
    const number =
      finiteNumber(
        value,
        0
      );

    if (number <= 0) {
      throw new Error(code);
    }

    return number;
  }

  function nowIso(): string {
    return new Date().toISOString();
  }

  type InventoryAuditInput = {
    actorUserId: string;
    businessUnitId: string;

    action: string;
    entityType: string;
    entityId: string;

    reason?: string;

    details?: Record<
      string,
      unknown
    >;
  };

  function writeInventoryAudit(
    input: InventoryAuditInput
  ) {
    const actorUserId =
      cleanText(
        input.actorUserId,
        180
      );

    const businessUnitId =
      cleanText(
        input.businessUnitId,
        120
      );

    const action =
      cleanText(
        input.action,
        160
      );

    const entityType =
      cleanText(
        input.entityType,
        160
      );

    const entityId =
      cleanText(
        input.entityId,
        700
      );

    if (
      !actorUserId ||
      !businessUnitId ||
      !action ||
      !entityType
    ) {
      throw new Error(
        "INVENTORY_AUDIT_CONTEXT_INVALID"
      );
    }

    db.prepare(`
      INSERT INTO audit_log (
        id,
        actor_user_id,
        business_unit_id,
        action,
        entity_type,
        entity_id,
        reason,
        details_json,
        created_at
      )
      VALUES (
        @id,
        @actorUserId,
        @businessUnitId,
        @action,
        @entityType,
        @entityId,
        @reason,
        @detailsJson,
        CURRENT_TIMESTAMP
      )
    `).run({
      id:
        randomUUID(),

      actorUserId,
      businessUnitId,
      action,
      entityType,

      entityId:
        entityId || null,

      reason:
        cleanText(
          input.reason,
          1000
        ) || null,

      detailsJson:
        JSON.stringify(
          input.details || {}
        ),
    });
  }

  function inventoryMovementAuditAction(
    movementType: InventoryMovementType
  ) {
    switch (movementType) {
      case "OPENING":
        return "INVENTORY_OPENING_APPLIED";

      case "ADJUSTMENT":
        return "INVENTORY_ADJUSTMENT_APPLIED";

      case "RETURN_IN":
        return "INVENTORY_RETURN_IN_APPLIED";

      case "BORROW_OUT":
        return "INVENTORY_BORROW_OUT_APPLIED";

      case "BORROW_IN":
        return "INVENTORY_BORROW_IN_APPLIED";

      case "ORDER_OUT":
        return "INVENTORY_ORDER_OUT_APPLIED";

      default:
        return "INVENTORY_MOVEMENT_APPLIED";
    }
  }

  function closeEnough(
    left: number,
    right: number
  ): boolean {
    return (
      Math.abs(
        left - right
      ) < 0.0000001
    );
  }

  function ensureInventoryCoreSchema() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_balance (
        business_unit_id TEXT NOT NULL,
        warehouse_id TEXT NOT NULL,
        physical_sku TEXT NOT NULL,

        qty_on_hand REAL NOT NULL DEFAULT 0
          CHECK (qty_on_hand >= 0),

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        PRIMARY KEY (
          business_unit_id,
          warehouse_id,
          physical_sku
        )
      );


      CREATE TABLE IF NOT EXISTS order_allocation (
        line_key TEXT PRIMARY KEY,

        business_unit_id TEXT NOT NULL,
        warehouse_id TEXT NOT NULL,

        platform TEXT NOT NULL DEFAULT '',
        store_id TEXT NOT NULL DEFAULT '',

        order_id TEXT NOT NULL,
        order_date TEXT NOT NULL DEFAULT '',

        sell_sku TEXT NOT NULL DEFAULT '',

        ordered_qty REAL NOT NULL,
        required_qty REAL NOT NULL,

        status TEXT NOT NULL DEFAULT 'DRAFT'
          CHECK (
            status IN (
              'DRAFT',
              'CONFIRMED',
              'CANCELLED'
            )
          ),

        confirmed_at TEXT NOT NULL DEFAULT '',
        confirmed_by TEXT NOT NULL DEFAULT '',

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );


      CREATE TABLE IF NOT EXISTS order_allocation_item (
        item_key TEXT PRIMARY KEY,
        line_key TEXT NOT NULL,

        physical_sku TEXT NOT NULL,
        qty REAL NOT NULL
          CHECK (qty > 0),

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );


      CREATE TABLE IF NOT EXISTS inventory_ledger (
        movement_key TEXT PRIMARY KEY,

        business_unit_id TEXT NOT NULL,
        warehouse_id TEXT NOT NULL,
        physical_sku TEXT NOT NULL,

        qty_delta REAL NOT NULL
          CHECK (qty_delta <> 0),

        movement_type TEXT NOT NULL
          CHECK (
            movement_type IN (
              'OPENING',
              'ADJUSTMENT',
              'ORDER_OUT',
              'RETURN_IN',
              'BORROW_OUT',
              'BORROW_IN'
            )
          ),

        source_type TEXT NOT NULL DEFAULT '',
        source_key TEXT NOT NULL DEFAULT '',

        order_id TEXT NOT NULL DEFAULT '',
        order_line_key TEXT NOT NULL DEFAULT '',
        allocation_item_key TEXT NOT NULL DEFAULT '',

        actor_user_id TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',

        created_at TEXT NOT NULL
      );


      CREATE INDEX IF NOT EXISTS
        idx_inventory_balance_sku
      ON inventory_balance (
        business_unit_id,
        physical_sku
      );


      CREATE INDEX IF NOT EXISTS
        idx_inventory_ledger_sku
      ON inventory_ledger (
        business_unit_id,
        warehouse_id,
        physical_sku,
        created_at DESC
      );


      CREATE INDEX IF NOT EXISTS
        idx_inventory_ledger_order
      ON inventory_ledger (
        order_id,
        order_line_key
      );


      CREATE INDEX IF NOT EXISTS
        idx_order_allocation_order
      ON order_allocation (
        business_unit_id,
        platform,
        store_id,
        order_id
      );


      CREATE INDEX IF NOT EXISTS
        idx_order_allocation_status
      ON order_allocation (
        business_unit_id,
        warehouse_id,
        status
      );


      CREATE INDEX IF NOT EXISTS
        idx_order_allocation_item_line
      ON order_allocation_item (
        line_key
      );
    `);
  }

  function getInventoryBalance(
    businessUnitId: string,
    warehouseId: string,
    physicalSku: string
  ): InventoryBalanceRow | null {
    ensureInventoryCoreSchema();

    const row =
      db.prepare(`
        SELECT
          business_unit_id,
          warehouse_id,
          physical_sku,
          qty_on_hand,
          created_at,
          updated_at
        FROM inventory_balance
        WHERE business_unit_id = ?
          AND warehouse_id = ?
          AND physical_sku = ?
        LIMIT 1
      `).get(
        cleanText(
          businessUnitId,
          120
        ),
        cleanText(
          warehouseId,
          120
        ),
        cleanSku(
          physicalSku
        )
      ) as
        | InventoryBalanceRow
        | undefined;

    return row ?? null;
  }

  function getAllocation(
    lineKey: string
  ) {
    ensureInventoryCoreSchema();

    const key =
      cleanText(
        lineKey,
        700
      );

    const allocation =
      db.prepare(`
        SELECT *
        FROM order_allocation
        WHERE line_key = ?
        LIMIT 1
      `).get(
        key
      ) as
        | OrderAllocationRow
        | undefined;

    if (!allocation) {
      return null;
    }

    const items =
      db.prepare(`
        SELECT *
        FROM order_allocation_item
        WHERE line_key = ?
        ORDER BY physical_sku
      `).all(
        key
      ) as OrderAllocationItemRow[];

    return {
      allocation,
      items,
    };
  }

  function upsertAllocationDraft(
    input: AllocationDraftInput
  ) {
    ensureInventoryCoreSchema();

    const lineKey =
      cleanText(
        input.lineKey,
        700
      );

    const businessUnitId =
      cleanText(
        input.businessUnitId,
        120
      );

    const warehouseId =
      cleanText(
        input.warehouseId,
        120
      );

    const orderId =
      cleanText(
        input.orderId,
        240
      );

    const actorUserId =
      cleanText(
        input.actorUserId,
        180
      );

    if (!lineKey) {
      throw new Error(
        "ALLOCATION_LINE_KEY_REQUIRED"
      );
    }

    if (!businessUnitId) {
      throw new Error(
        "ALLOCATION_BUSINESS_UNIT_REQUIRED"
      );
    }

    if (!warehouseId) {
      throw new Error(
        "ALLOCATION_WAREHOUSE_REQUIRED"
      );
    }

    if (!orderId) {
      throw new Error(
        "ALLOCATION_ORDER_ID_REQUIRED"
      );
    }

    const orderedQty =
      positiveNumber(
        input.orderedQty,
        "ALLOCATION_ORDERED_QTY_INVALID"
      );

    const requiredQty =
      positiveNumber(
        input.requiredQty,
        "ALLOCATION_REQUIRED_QTY_INVALID"
      );


    const grouped =
      new Map<
        string,
        number
      >();

    for (
      const item
      of input.items || []
    ) {
      const sku =
        cleanSku(
          item.physicalSku
        );

      const qty =
        positiveNumber(
          item.qty,
          "ALLOCATION_ITEM_QTY_INVALID"
        );

      if (!sku) {
        throw new Error(
          "ALLOCATION_PHYSICAL_SKU_REQUIRED"
        );
      }

      grouped.set(
        sku,
        (
          grouped.get(sku) ||
          0
        ) + qty
      );
    }

    if (
      grouped.size === 0
    ) {
      throw new Error(
        "ALLOCATION_ITEMS_REQUIRED"
      );
    }

    const totalAllocated =
      Array.from(
        grouped.values()
      ).reduce(
        (
          total,
          qty
        ) =>
          total + qty,
        0
      );

    if (
      !closeEnough(
        totalAllocated,
        requiredQty
      )
    ) {
      throw new Error(
        `ALLOCATION_QTY_MISMATCH:${totalAllocated}:${requiredQty}`
      );
    }


    const transaction =
      db.transaction(
        () => {
          const current =
            db.prepare(`
              SELECT
                status
              FROM order_allocation
              WHERE line_key = ?
              LIMIT 1
            `).get(
              lineKey
            ) as
              | {
                  status: AllocationStatus;
                }
              | undefined;

          if (
            current?.status ===
            "CONFIRMED"
          ) {
            throw new Error(
              "ALLOCATION_ALREADY_CONFIRMED"
            );
          }

          const now =
            nowIso();

          db.prepare(`
            INSERT INTO order_allocation (
              line_key,

              business_unit_id,
              warehouse_id,

              platform,
              store_id,

              order_id,
              order_date,

              sell_sku,

              ordered_qty,
              required_qty,

              status,

              confirmed_at,
              confirmed_by,

              created_at,
              updated_at
            )
            VALUES (
              @lineKey,

              @businessUnitId,
              @warehouseId,

              @platform,
              @storeId,

              @orderId,
              @orderDate,

              @sellSku,

              @orderedQty,
              @requiredQty,

              'DRAFT',

              '',
              '',

              @now,
              @now
            )

            ON CONFLICT(line_key)
            DO UPDATE SET
              business_unit_id =
                excluded.business_unit_id,

              warehouse_id =
                excluded.warehouse_id,

              platform =
                excluded.platform,

              store_id =
                excluded.store_id,

              order_id =
                excluded.order_id,

              order_date =
                excluded.order_date,

              sell_sku =
                excluded.sell_sku,

              ordered_qty =
                excluded.ordered_qty,

              required_qty =
                excluded.required_qty,

              status =
                'DRAFT',

              confirmed_at =
                '',

              confirmed_by =
                '',

              updated_at =
                excluded.updated_at
          `).run({
            lineKey,
            businessUnitId,
            warehouseId,

            platform:
              cleanText(
                input.platform,
                40
              ).toUpperCase(),

            storeId:
              cleanText(
                input.storeId,
                160
              ),

            orderId,

            orderDate:
              cleanText(
                input.orderDate,
                80
              ),

            sellSku:
              cleanSku(
                input.sellSku
              ),

            orderedQty,
            requiredQty,

            now,
          });


          db.prepare(`
            DELETE FROM
              order_allocation_item
            WHERE line_key = ?
          `).run(
            lineKey
          );


          const insertItem =
            db.prepare(`
              INSERT INTO
                order_allocation_item (
                  item_key,
                  line_key,
                  physical_sku,
                  qty,
                  created_at,
                  updated_at
                )
              VALUES (
                @itemKey,
                @lineKey,
                @physicalSku,
                @qty,
                @now,
                @now
              )
            `);

          for (
            const [
              physicalSku,
              qty,
            ]
            of grouped
          ) {
            insertItem.run({
              itemKey:
                `${lineKey}::${physicalSku}`,

              lineKey,
              physicalSku,
              qty,
              now,
            });
          }


          if (actorUserId) {
            writeInventoryAudit({
              actorUserId,
              businessUnitId,

              action:
                "INVENTORY_ALLOCATION_DRAFT_UPSERTED",

              entityType:
                "ORDER_ALLOCATION",

              entityId:
                lineKey,

              details: {
                warehouseId,

                platform:
                  cleanText(
                    input.platform,
                    40
                  ).toUpperCase(),

                storeId:
                  cleanText(
                    input.storeId,
                    160
                  ),

                orderId,

                orderDate:
                  cleanText(
                    input.orderDate,
                    80
                  ),

                sellSku:
                  cleanSku(
                    input.sellSku
                  ),

                orderedQty,
                requiredQty,

                items:
                  Array.from(
                    grouped.entries()
                  ).map(
                    ([
                      physicalSku,
                      qty,
                    ]) => ({
                      physicalSku,
                      qty,
                    })
                  ),
              },
            });
          }
        }
      );

    transaction();

    return getAllocation(
      lineKey
    );
  }

  function applyInventoryAdjustment(
    input: InventoryAdjustmentInput
  ) {
    ensureInventoryCoreSchema();

    const movementKey =
      cleanText(
        input.movementKey,
        700
      );

    const businessUnitId =
      cleanText(
        input.businessUnitId,
        120
      );

    const warehouseId =
      cleanText(
        input.warehouseId,
        120
      );

    const physicalSku =
      cleanSku(
        input.physicalSku
      );

    const actorUserId =
      cleanText(
        input.actorUserId,
        180
      );

    const qtyDelta =
      finiteNumber(
        input.qtyDelta,
        0
      );

    if (!movementKey) {
      throw new Error(
        "MOVEMENT_KEY_REQUIRED"
      );
    }

    if (
      !businessUnitId ||
      !warehouseId ||
      !physicalSku
    ) {
      throw new Error(
        "MOVEMENT_DIMENSION_REQUIRED"
      );
    }

    if (
      qtyDelta === 0
    ) {
      throw new Error(
        "MOVEMENT_QTY_ZERO"
      );
    }


    const transaction =
      db.transaction(
        () => {
          const existing =
            db.prepare(`
              SELECT
                movement_key,
                business_unit_id,
                warehouse_id,
                physical_sku,
                qty_delta
              FROM inventory_ledger
              WHERE movement_key = ?
              LIMIT 1
            `).get(
              movementKey
            ) as
              | Pick<
                  InventoryLedgerRow,
                  | "movement_key"
                  | "business_unit_id"
                  | "warehouse_id"
                  | "physical_sku"
                  | "qty_delta"
                >
              | undefined;

          if (existing) {
            if (
              existing.business_unit_id !==
                businessUnitId ||
              existing.warehouse_id !==
                warehouseId ||
              existing.physical_sku !==
                physicalSku ||
              !closeEnough(
                Number(
                  existing.qty_delta
                ),
                qtyDelta
              )
            ) {
              throw new Error(
                "MOVEMENT_KEY_CONFLICT"
              );
            }

            return {
              alreadyApplied:
                true,
            };
          }


          const current =
            getInventoryBalance(
              businessUnitId,
              warehouseId,
              physicalSku
            );

          const nextQty =
            (
              current?.qty_on_hand ||
              0
            ) + qtyDelta;

          if (
            nextQty < 0
          ) {
            throw new Error(
              `INSUFFICIENT_STOCK:${physicalSku}`
            );
          }

          const now =
            nowIso();

          db.prepare(`
            INSERT INTO inventory_balance (
              business_unit_id,
              warehouse_id,
              physical_sku,
              qty_on_hand,
              created_at,
              updated_at
            )
            VALUES (
              @businessUnitId,
              @warehouseId,
              @physicalSku,
              @qtyOnHand,
              @now,
              @now
            )

            ON CONFLICT(
              business_unit_id,
              warehouse_id,
              physical_sku
            )
            DO UPDATE SET
              qty_on_hand =
                excluded.qty_on_hand,

              updated_at =
                excluded.updated_at
          `).run({
            businessUnitId,
            warehouseId,
            physicalSku,
            qtyOnHand:
              nextQty,
            now,
          });


          const sourceType =
            cleanText(
              input.sourceType ||
                "MANUAL",
              100
            );

          const sourceKey =
            cleanText(
              input.sourceKey,
              700
            );

          const note =
            cleanText(
              input.note,
              1000
            );


          db.prepare(`
            INSERT INTO inventory_ledger (
              movement_key,

              business_unit_id,
              warehouse_id,
              physical_sku,

              qty_delta,
              movement_type,

              source_type,
              source_key,

              order_id,
              order_line_key,
              allocation_item_key,

              actor_user_id,
              note,

              created_at
            )
            VALUES (
              @movementKey,

              @businessUnitId,
              @warehouseId,
              @physicalSku,

              @qtyDelta,
              @movementType,

              @sourceType,
              @sourceKey,

              '',
              '',
              '',

              @actorUserId,
              @note,

              @now
            )
          `).run({
            movementKey,

            businessUnitId,
            warehouseId,
            physicalSku,

            qtyDelta,

            movementType:
              input.movementType,

            sourceType,
            sourceKey,

            actorUserId,
            note,

            now,
          });


          writeInventoryAudit({
            actorUserId,
            businessUnitId,

            action:
              inventoryMovementAuditAction(
                input.movementType
              ),

            entityType:
              "INVENTORY_MOVEMENT",

            entityId:
              movementKey,

            reason:
              note,

            details: {
              warehouseId,
              physicalSku,
              qtyDelta,

              movementType:
                input.movementType,

              sourceType,
              sourceKey,

              resultingQty:
                nextQty,
            },
          });


          return {
            alreadyApplied:
              false,
          };
        }
      );


    const result =
      transaction() as {
        alreadyApplied: boolean;
      };


    return {
      ...result,

      balance:
        getInventoryBalance(
          businessUnitId,
          warehouseId,
          physicalSku
        ),
    };
  }

  function confirmAllocation(
    lineKeyValue: string,
    actorUserIdValue: string
  ) {
    ensureInventoryCoreSchema();

    const lineKey =
      cleanText(
        lineKeyValue,
        700
      );

    const actorUserId =
      cleanText(
        actorUserIdValue,
        180
      );

    if (!lineKey) {
      throw new Error(
        "ALLOCATION_LINE_KEY_REQUIRED"
      );
    }

    if (!actorUserId) {
      throw new Error(
        "ALLOCATION_ACTOR_REQUIRED"
      );
    }


    const confirm =
      db.transaction(
        () => {
          const allocation =
            db.prepare(`
              SELECT *
              FROM order_allocation
              WHERE line_key = ?
              LIMIT 1
            `).get(
              lineKey
            ) as
              | OrderAllocationRow
              | undefined;

          if (!allocation) {
            throw new Error(
              "ALLOCATION_NOT_FOUND"
            );
          }

          if (
            allocation.status ===
            "CONFIRMED"
          ) {
            return {
              alreadyConfirmed:
                true,

              allocation,
            };
          }

          if (
            allocation.status !==
            "DRAFT"
          ) {
            throw new Error(
              `ALLOCATION_NOT_CONFIRMABLE:${allocation.status}`
            );
          }


          const items =
            db.prepare(`
              SELECT *
              FROM order_allocation_item
              WHERE line_key = ?
              ORDER BY physical_sku
            `).all(
              lineKey
            ) as OrderAllocationItemRow[];

          if (
            items.length === 0
          ) {
            throw new Error(
              "ALLOCATION_ITEMS_REQUIRED"
            );
          }


          const totalAllocated =
            items.reduce(
              (
                total,
                item
              ) =>
                total +
                Number(
                  item.qty
                ),
              0
            );

          if (
            !closeEnough(
              totalAllocated,
              Number(
                allocation.required_qty
              )
            )
          ) {
            throw new Error(
              "ALLOCATION_QTY_MISMATCH"
            );
          }


          /*
           * Validate every SKU first.
           * No stock mutation happens before
           * all allocation items pass.
           */
          for (
            const item
            of items
          ) {
            const balance =
              getInventoryBalance(
                allocation.business_unit_id,
                allocation.warehouse_id,
                item.physical_sku
              );

            if (
              (
                balance?.qty_on_hand ||
                0
              ) < Number(item.qty)
            ) {
              throw new Error(
                `INSUFFICIENT_STOCK:${item.physical_sku}`
              );
            }


            const movementKey =
              `ALLOC_OUT::${lineKey}::${item.physical_sku}`;

            const existingMovement =
              db.prepare(`
                SELECT movement_key
                FROM inventory_ledger
                WHERE movement_key = ?
                LIMIT 1
              `).get(
                movementKey
              );

            if (existingMovement) {
              throw new Error(
                "ALLOCATION_LEDGER_CONFLICT"
              );
            }
          }


          const now =
            nowIso();

          for (
            const item
            of items
          ) {
            const qty =
              Number(
                item.qty
              );

            const movementKey =
              `ALLOC_OUT::${lineKey}::${item.physical_sku}`;


            const updated =
              db.prepare(`
                UPDATE inventory_balance

                SET
                  qty_on_hand =
                    qty_on_hand - @qty,

                  updated_at =
                    @now

                WHERE business_unit_id =
                      @businessUnitId

                  AND warehouse_id =
                      @warehouseId

                  AND physical_sku =
                      @physicalSku

                  AND qty_on_hand >=
                      @qty
              `).run({
                qty,
                now,

                businessUnitId:
                  allocation.business_unit_id,

                warehouseId:
                  allocation.warehouse_id,

                physicalSku:
                  item.physical_sku,
              });

            if (
              updated.changes !== 1
            ) {
              throw new Error(
                `INSUFFICIENT_STOCK:${item.physical_sku}`
              );
            }


            db.prepare(`
              INSERT INTO inventory_ledger (
                movement_key,

                business_unit_id,
                warehouse_id,
                physical_sku,

                qty_delta,
                movement_type,

                source_type,
                source_key,

                order_id,
                order_line_key,
                allocation_item_key,

                actor_user_id,
                note,

                created_at
              )
              VALUES (
                @movementKey,

                @businessUnitId,
                @warehouseId,
                @physicalSku,

                @qtyDelta,
                'ORDER_OUT',

                'ORDER_ALLOCATION',
                @lineKey,

                @orderId,
                @lineKey,
                @allocationItemKey,

                @actorUserId,
                @note,

                @now
              )
            `).run({
              movementKey,

              businessUnitId:
                allocation.business_unit_id,

              warehouseId:
                allocation.warehouse_id,

              physicalSku:
                item.physical_sku,

              qtyDelta:
                -qty,

              lineKey,

              orderId:
                allocation.order_id,

              allocationItemKey:
                item.item_key,

              actorUserId,

              note:
                "Confirmed order allocation",

              now,
            });
          }


          db.prepare(`
            UPDATE order_allocation

            SET
              status =
                'CONFIRMED',

              confirmed_at =
                @now,

              confirmed_by =
                @actorUserId,

              updated_at =
                @now

            WHERE line_key =
                  @lineKey

              AND status =
                  'DRAFT'
          `).run({
            lineKey,
            actorUserId,
            now,
          });


          const confirmed =
            db.prepare(`
              SELECT *
              FROM order_allocation
              WHERE line_key = ?
              LIMIT 1
            `).get(
              lineKey
            ) as OrderAllocationRow;


          writeInventoryAudit({
            actorUserId,

            businessUnitId:
              allocation.business_unit_id,

            action:
              "INVENTORY_ALLOCATION_CONFIRMED",

            entityType:
              "ORDER_ALLOCATION",

            entityId:
              lineKey,

            details: {
              warehouseId:
                allocation.warehouse_id,

              platform:
                allocation.platform,

              storeId:
                allocation.store_id,

              orderId:
                allocation.order_id,

              orderDate:
                allocation.order_date,

              sellSku:
                allocation.sell_sku,

              orderedQty:
                allocation.ordered_qty,

              requiredQty:
                allocation.required_qty,

              items:
                items.map(
                  (item) => ({
                    physicalSku:
                      item.physical_sku,

                    qty:
                      Number(
                        item.qty
                      ),
                  })
                ),
            },
          });


          return {
            alreadyConfirmed:
              false,

            allocation:
              confirmed,
          };
        }
      );


    return confirm() as {
      alreadyConfirmed: boolean;
      allocation: OrderAllocationRow;
    };
  }

  function getRecentInventoryLedger(
    limit = 100
  ): InventoryLedgerRow[] {
    ensureInventoryCoreSchema();

    const safeLimit =
      Math.max(
        1,
        Math.min(
          1000,
          Math.floor(
            finiteNumber(
              limit,
              100
            )
          )
        )
      );

    return db.prepare(`
      SELECT *
      FROM inventory_ledger
      ORDER BY created_at DESC
      LIMIT ?
    `).all(
      safeLimit
    ) as InventoryLedgerRow[];
  }

  function getInventoryCoreStats() {
    ensureInventoryCoreSchema();

    const balance =
      db.prepare(`
        SELECT
          COUNT(*) AS sku_count,
          COALESCE(
            SUM(qty_on_hand),
            0
          ) AS qty_on_hand
        FROM inventory_balance
      `).get() as {
        sku_count: number;
        qty_on_hand: number;
      };

    const allocation =
      db.prepare(`
        SELECT
          COUNT(*) AS total,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'DRAFT'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS draft,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'CONFIRMED'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS confirmed
        FROM order_allocation
      `).get() as {
        total: number;
        draft: number;
        confirmed: number;
      };

    const ledger =
      db.prepare(`
        SELECT
          COUNT(*) AS movements
        FROM inventory_ledger
      `).get() as {
        movements: number;
      };


    return {
      version:
        "RKN_INVENTORY_CORE_V10_0",

      skuCount:
        Number(
          balance.sku_count
        ) || 0,

      qtyOnHand:
        Number(
          balance.qty_on_hand
        ) || 0,

      allocations:
        Number(
          allocation.total
        ) || 0,

      draftAllocations:
        Number(
          allocation.draft
        ) || 0,

      confirmedAllocations:
        Number(
          allocation.confirmed
        ) || 0,

      movements:
        Number(
          ledger.movements
        ) || 0,
    };
  }

  return {
    ensureInventoryCoreSchema,
    getInventoryBalance,
    getAllocation,
    upsertAllocationDraft,
    applyInventoryAdjustment,
    confirmAllocation,
    getRecentInventoryLedger,
    getInventoryCoreStats,
  };
}
