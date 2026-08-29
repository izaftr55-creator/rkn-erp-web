import type { DoSqliteCompat } from '../do-sqlite-compat';

export function createB2BCore(db: DoSqliteCompat) {
  
  const recordManualMovement = (params: {
    sku: string;
    qty: number;
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
    warehouseId?: string;
    note?: string;
    actorUserId?: string;
  }) => {
    const timestamp = new Date().toISOString();
    const isOut = params.movementType === 'OUT';
    const qtyDelta = isOut ? -Math.abs(params.qty) : Math.abs(params.qty);

    const stmt = db.prepare(`
      INSERT INTO stock_movements (
        occurred_at, warehouse_id, sku, movement_type, qty, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      timestamp,
      params.warehouseId || 'WH-UTAMA',
      params.sku,
      params.movementType,
      qtyDelta,
      params.note || 'Manual B2B Adjustment'
    );

    return { success: true, sku: params.sku, delta: qtyDelta, timestamp };
  };

  const processB2BOrder = (params: {
    customerId: string;
    items: Array<{ sku: string; qty: number; price: number }>;
    paymentMethod: 'LUNAS' | 'TEMPO';
    actorUserId?: string;
  }) => {
    const timestamp = new Date().toISOString();
    const orderId = 'B2B-' + Date.now();
    const invoiceNumber = 'INV/' + new Date().getFullYear() + '/' + Date.now();
    
    let totalAmount = 0;
    params.items.forEach(item => totalAmount += (item.qty * item.price));

    db.transaction(() => {
      db.prepare(`
        INSERT INTO sales_orders (order_id, customer_id, order_source, total_amount, payment_status, invoice_number)
        VALUES (?, ?, 'MANUAL_B2B', ?, ?, ?)
      `).run(orderId, params.customerId, totalAmount, params.paymentMethod === 'TEMPO' ? 'UNPAID' : 'PAID', invoiceNumber);

      const insertLine = db.prepare(`
        INSERT INTO sales_order_lines (line_id, order_id, sku, qty, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const insertStock = db.prepare(`
        INSERT INTO stock_movements (occurred_at, warehouse_id, sku, movement_type, qty, reference_type, reference_id, notes)
        VALUES (?, 'WH-UTAMA', ?, 'SALE', ?, 'SALES_ORDER', ?, 'B2B Wholesale')
      `);

      params.items.forEach((item, index) => {
        const lineId = orderId + '-L' + index;
        const subtotal = item.qty * item.price;
        
        insertLine.run(lineId, orderId, item.sku, item.qty, item.price, subtotal);
        insertStock.run(timestamp, item.sku, -Math.abs(item.qty), orderId);
      });

      if (params.paymentMethod === 'TEMPO') {
        db.prepare(`
          INSERT INTO trade_debts (debt_id, debt_type, counterparty_name, amount_total, reference_type, reference_id)
          VALUES (?, 'RECEIVABLE', ?, ?, 'SALES_ORDER', ?)
        `).run('DBT-' + Date.now(), params.customerId, totalAmount, orderId);
      }
      
    })();

    return {
      success: true,
      orderId,
      invoiceNumber,
      totalAmount,
      status: params.paymentMethod === 'TEMPO' ? 'PIUTANG_RECORDED' : 'PAID_CASH'
    };
  };

  return {
    recordManualMovement,
    processB2BOrder
  };
}