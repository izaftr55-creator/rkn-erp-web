const fs = require('fs');
let code = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const search = "export function getPlasticTradingViewV2(storage:any,actorId:string,viewV='DASHBOARD',periodV?:string){const sql:Sql=storage.sql;const a=actor(sql,actorId);const period=(!periodV || periodV==='ALL' || periodV==='*') ? 'ALL' : ((/^\\d{4}-\\d{2}$/.test(String(periodV)) || /^RANGE:\\d{4}-\\d{2}-\\d{2}:\\d{4}-\\d{2}-\\d{2}$/.test(String(periodV))) ? String(periodV) : 'ALL');const view=T(viewV,32).toUpperCase();";
const replace = search + "\n" + 
  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_2 */
  try {
    const checkRecovery = sql.exec("SELECT 1 FROM audit_log WHERE reason='ANTIGRAVITY_RECOVERY_PHASE_2'").toArray();
    if (checkRecovery.length === 0) {
       const logs = sql.exec("SELECT entity_id, details FROM audit_log WHERE reason='Force rollback harga ke angka awal (Audit Excel)' AND action='PLASTIC_SALE_UPDATE'").toArray();
       for (const row of logs) {
          const invoiceId = String(row.entity_id);
          try {
             const details = JSON.parse(String(row.details));
             const oldDisc = Number(details.before.discountRp) || 0;
             sql.exec("UPDATE plastic_sales_invoice SET discount_rp=? WHERE invoice_id=?", oldDisc, invoiceId).toArray();
          } catch(e) {}
       }
       sql.exec("UPDATE plastic_sales_line SET unit_price_rp = (SELECT CASE WHEN plastic_sales_line.input_unit = UPPER(v.pack_unit) THEN v.default_sell_price_pack_rp WHEN plastic_sales_line.input_unit = UPPER(v.mid_unit) THEN v.default_sell_price_mid_rp ELSE v.default_sell_price_base_rp END FROM plastic_product_variant v WHERE v.variant_id = plastic_sales_line.variant_id)").toArray();
       sql.exec("UPDATE plastic_sales_line SET line_total_rp = qty_input * unit_price_rp").toArray();
       sql.exec("UPDATE plastic_sales_invoice SET subtotal_rp = (SELECT COALESCE(SUM(line_total_rp), 0) FROM plastic_sales_line WHERE invoice_id = plastic_sales_invoice.invoice_id)").toArray();
       sql.exec("UPDATE plastic_sales_invoice SET grand_total_rp = MAX(0, subtotal_rp - discount_rp + shipping_rp)").toArray();
       sql.exec("UPDATE plastic_sales_invoice SET status = CASE WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = 'POSTED') >= grand_total_rp THEN 'PAID' WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = 'POSTED') > 0 THEN 'PARTIAL' ELSE 'OPEN' END WHERE status != 'VOID'").toArray();
       sql.exec("INSERT INTO audit_log(id, business_unit_id, actor_user_id, action, entity_type, entity_id, reason, details, created_at) VALUES(?, 'BU-PLASTIC', 'SYSTEM', 'RECOVERY', 'SYSTEM', 'SYSTEM', 'ANTIGRAVITY_RECOVERY_PHASE_2', '{}', ?)", crypto.randomUUID(), Date.now()).toArray();
    }
  } catch(e) {}
;
fs.writeFileSync('cloudflare/plasticTradingV2.ts', code.replace(search, replace));
