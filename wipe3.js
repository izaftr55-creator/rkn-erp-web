const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const firstPhaseStart = content.indexOf('  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_16 */');
const endMarker = '/* RKN_PLASTIC_PRICE_HISTORY_VIEW */';
const endMarkerIndex = content.indexOf(endMarker);

if (firstPhaseStart !== -1 && endMarkerIndex !== -1) {
   let before = content.substring(0, firstPhaseStart);
   let after = content.substring(endMarkerIndex);
   
   let phase17 = '  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_17 */\n';
   phase17 += '  try {\n';
   phase17 += '     const check17 = sql.exec("SELECT 1 FROM audit_log WHERE reason=\'ANTIGRAVITY_RECOVERY_PHASE_17\'").toArray();\n';
   phase17 += '     if (check17.length === 0) {\n';
   phase17 += '        console.log("PHASE 17 RUNNING!");\n';

   const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
   let execs = '';
   let count = 0;
   for (let l of lines) {
     if (l.trim().startsWith('UPDATE plastic_sales_invoice SET grand_total_rp')) {
        let stmt = l.trim().replace(/;$/, '');
        if (stmt.includes('A9E605')) {
           stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31'";
        }
        execs += '        sql.exec("' + stmt + '").toArray();\n';
        count++;
     }
   }
   
   // NO COMPLEX UPDATE STATUS QUERY!!
   
   phase17 += execs;
   console.log("Injected", count, "updates");

   phase17 += '        sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK\', physical_qty_base=10000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-POLOS\'").toArray();\n';
   phase17 += '        sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK\', physical_qty_base=90000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-KOTAK\'").toArray();\n';
   phase17 += '        sql.exec("UPDATE plastic_so_snapshot SET physical_qty_base = physical_qty_base * 100 WHERE variant_id LIKE \'%POLY%\' AND source_unit=\'ROLL\' AND mapping_status=\'MAPPED\'").toArray();\n';

   phase17 += '        sql.exec("INSERT INTO audit_log(id, business_unit_id, actor_user_id, action, entity_type, entity_id, reason, details, created_at) VALUES(?, \'BU-PLASTIC\', \'SYSTEM\', \'RECOVERY\', \'SYSTEM\', \'SYSTEM\', \'ANTIGRAVITY_RECOVERY_PHASE_17\', \'{}\', ?)", crypto.randomUUID(), Date.now()).toArray();\n';
   phase17 += '     }\n';
   phase17 += '  } catch(e) {\n';
   phase17 += '     console.log("PHASE 17 FATAL ERROR", e);\n';
   phase17 += '  }\n  \n  ';
   
   fs.writeFileSync('cloudflare/plasticTradingV2.ts', before + phase17 + after);
   console.log("Wiped old phases and injected Phase 17");
} else {
   console.log("Could not find boundaries!");
}
