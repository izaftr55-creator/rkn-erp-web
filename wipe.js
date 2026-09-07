const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const firstPhaseStart = content.indexOf('  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_14 */');
const endMarker = '/* RKN_PLASTIC_PRICE_HISTORY_VIEW */';
const endMarkerIndex = content.indexOf(endMarker);

if (firstPhaseStart !== -1 && endMarkerIndex !== -1) {
   let before = content.substring(0, firstPhaseStart);
   let after = content.substring(endMarkerIndex);
   
   let phase14 = '  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_15 */\n';
   phase14 += '  try {\n';
   phase14 += '     const check14 = sql.exec("SELECT 1 FROM audit_log WHERE reason=\'ANTIGRAVITY_RECOVERY_PHASE_15\'").toArray();\n';
   phase14 += '     if (check14.length === 0) {\n';
   phase14 += '        console.log("PHASE 15 RUNNING!");\n';

   const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
   let execs = '';
   for (let l of lines) {
     if (l.trim().startsWith('UPDATE plastic_sales_invoice SET grand_total_rp')) {
        let stmt = l.trim().replace(/;$/, '');
        if (stmt.includes('A9E605')) {
           stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31'";
        }
        execs += '        sql.exec("' + stmt + '").toArray();\n';
     }
   }

   // Also include the invoice status recount!
   execs += '        sql.exec("UPDATE plastic_sales_invoice SET status = CASE WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = \'POSTED\') >= grand_total_rp THEN \'PAID\' WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = \'POSTED\') > 0 THEN \'PARTIAL\' ELSE \'OPEN\' END WHERE status != \'VOID\'").toArray();\n';

   phase14 += execs;

   phase14 += '        sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK\', physical_qty_base=10000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-POLOS\'").toArray();\n';
   phase14 += '        sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK\', physical_qty_base=90000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-KOTAK\'").toArray();\n';
   phase14 += '        sql.exec("UPDATE plastic_so_snapshot SET physical_qty_base = physical_qty_base * 100 WHERE variant_id LIKE \'%POLY%\' AND source_unit=\'ROLL\' AND mapping_status=\'MAPPED\'").toArray();\n';

   phase14 += '        sql.exec("INSERT INTO audit_log(id, business_unit_id, actor_user_id, action, entity_type, entity_id, reason, details, created_at) VALUES(?, \'BU-PLASTIC\', \'SYSTEM\', \'RECOVERY\', \'SYSTEM\', \'SYSTEM\', \'ANTIGRAVITY_RECOVERY_PHASE_15\', \'{}\', ?)", crypto.randomUUID(), Date.now()).toArray();\n';
   phase14 += '     }\n';
   phase14 += '  } catch(e) {\n';
   phase14 += '     console.log("PHASE 15 ERROR", e);\n';
   phase14 += '  }\n  \n  ';
   
   fs.writeFileSync('cloudflare/plasticTradingV2.ts', before + phase14 + after);
   console.log("Wiped old phases and injected Phase 15");
} else {
   console.log("Could not find boundaries!", firstPhaseStart, endMarkerIndex);
}
