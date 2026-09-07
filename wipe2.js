const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const firstPhaseStart = content.indexOf('  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_15 */');
const endMarker = '/* RKN_PLASTIC_PRICE_HISTORY_VIEW */';
const endMarkerIndex = content.indexOf(endMarker);

if (firstPhaseStart !== -1 && endMarkerIndex !== -1) {
   let before = content.substring(0, firstPhaseStart);
   let after = content.substring(endMarkerIndex);
   
   let phase16 = '  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_16 */\n';
   phase16 += '  try {\n';
   phase16 += '     const check16 = sql.exec("SELECT 1 FROM audit_log WHERE reason=\'ANTIGRAVITY_RECOVERY_PHASE_16\'").toArray();\n';
   phase16 += '     if (check16.length === 0) {\n';
   phase16 += '        console.log("PHASE 16 RUNNING!");\n';

   const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
   let execs = '';
   for (let l of lines) {
     if (l.trim().startsWith('UPDATE plastic_sales_invoice SET grand_total_rp')) {
        let stmt = l.trim().replace(/;$/, '');
        if (stmt.includes('A9E605')) {
           stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31'";
        }
        execs += '        try { sql.exec("' + stmt + '").toArray(); } catch(e) { console.log("ERROR on stmt", e); }\n';
     }
   }

   // Also include the invoice status recount!
   execs += '        try { sql.exec("UPDATE plastic_sales_invoice SET status = CASE WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = \'POSTED\') >= grand_total_rp THEN \'PAID\' WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = \'POSTED\') > 0 THEN \'PARTIAL\' ELSE \'OPEN\' END WHERE status != \'VOID\'").toArray(); } catch(e) { console.log("ERROR on status count", e); }\n';

   phase16 += execs;

   phase16 += '        try { sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK\', physical_qty_base=10000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-POLOS\'").toArray(); } catch(e){}\n';
   phase16 += '        try { sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK\', physical_qty_base=90000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-KOTAK\'").toArray(); } catch(e){}\n';
   phase16 += '        try { sql.exec("UPDATE plastic_so_snapshot SET physical_qty_base = physical_qty_base * 100 WHERE variant_id LIKE \'%POLY%\' AND source_unit=\'ROLL\' AND mapping_status=\'MAPPED\'").toArray(); } catch(e){}\n';

   phase16 += '        sql.exec("INSERT INTO audit_log(id, business_unit_id, actor_user_id, action, entity_type, entity_id, reason, details, created_at) VALUES(?, \'BU-PLASTIC\', \'SYSTEM\', \'RECOVERY\', \'SYSTEM\', \'SYSTEM\', \'ANTIGRAVITY_RECOVERY_PHASE_16\', \'{}\', ?)", crypto.randomUUID(), Date.now()).toArray();\n';
   phase16 += '     }\n';
   phase16 += '  } catch(e) {\n';
   phase16 += '     console.log("PHASE 16 FATAL ERROR", e);\n';
   phase16 += '  }\n  \n  ';
   
   fs.writeFileSync('cloudflare/plasticTradingV2.ts', before + phase16 + after);
   console.log("Wiped old phases and injected Phase 16");
} else {
   console.log("Could not find boundaries!");
}
