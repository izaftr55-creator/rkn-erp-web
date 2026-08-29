import type { DoSqliteCompat } from "../do-sqlite-compat";

export function createInventoryReadModelOps(
  db: DoSqliteCompat
) {

  function getInventoryRouteReadModel(
    businessUnitId: string,
    warehouseId: string,
    limit: number
  ) {

    const balances = db.prepare(`
            SELECT
              business_unit_id,
              warehouse_id,
              physical_sku,
              qty_on_hand,
              created_at,
              updated_at
    
            FROM inventory_balance
    
            WHERE business_unit_id = @businessUnitId
    
              AND (
                @warehouseId = ''
                OR warehouse_id =
                   @warehouseId
              )
    
            ORDER BY
              warehouse_id,
              physical_sku
    
            LIMIT @limit
          `).all({
            businessUnitId,
            warehouseId,
            limit,
          });
    
    const ledger = db.prepare(`
            SELECT
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
    
            FROM inventory_ledger
    
            WHERE business_unit_id =
                  @businessUnitId
    
              AND (
                @warehouseId = ''
                OR warehouse_id =
                   @warehouseId
              )
    
            ORDER BY
              created_at DESC
    
            LIMIT @limit
          `).all({
            businessUnitId,
            warehouseId,
            limit,
          });
    
    const allocations = db.prepare(`
            SELECT
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
    
            FROM order_allocation
    
            WHERE business_unit_id =
                  @businessUnitId
    
              AND (
                @warehouseId = ''
                OR warehouse_id =
                   @warehouseId
              )
    
            ORDER BY
              updated_at DESC
    
            LIMIT @limit
          `).all({
            businessUnitId,
            warehouseId,
            limit,
          });
    
    const scopedStats = db.prepare(`
            SELECT
              COUNT(*) AS sku_count,
              COALESCE(
                SUM(qty_on_hand),
                0
              ) AS qty_on_hand
    
            FROM inventory_balance
    
            WHERE business_unit_id =
                  ?
    
              AND (
                ? = ''
                OR warehouse_id = ?
              )
          `).get(
            businessUnitId,
            warehouseId,
            warehouseId
          );

    return {
      balances,
      ledger,
      allocations,
      scopedStats,
    };
  }

  return {
    getInventoryRouteReadModel,
  };
}
