const fs = require('fs');
let content = fs.readFileSync('cloudflare/rkn-erp-core.ts', 'utf8');

const firstPhaseStart = content.indexOf('    // ANTIGRAVITY RECOVERY PHASE 18');
const endPhaseIndex = content.indexOf('    } catch(e) {');

if (firstPhaseStart !== -1 && endPhaseIndex !== -1) {
   let before = content.substring(0, firstPhaseStart);
   let after = content.substring(endPhaseIndex + 67);
   
   let phase19 = '    // ANTIGRAVITY RECOVERY PHASE 19\n';
   phase19 += '    try {\n';
   phase19 += '      const check19 = this.ctx.storage.sql.exec("SELECT 1 FROM audit_log WHERE reason=\'ANTIGRAVITY_RECOVERY_PHASE_19\'").toArray();\n';
   phase19 += '      if (check19.length === 0) {\n';
   phase19 += '        console.log("RUNNING PHASE 19");\n';

   const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
   let bigSQL = '';
   for (let l of lines) {
     if (l.trim().startsWith('UPDATE plastic_sales_invoice SET grand_total_rp')) {
        let stmt = l.trim();
        if (stmt.includes('A9E605')) {
           stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31';";
        }
        bigSQL += stmt + '\\n';
     }
   }
   
   bigSQL += "UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK', physical_qty_base=10000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-POLOS';\\n";
   bigSQL += "UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK', physical_qty_base=90000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-KOTAK';\\n";
   bigSQL += "UPDATE plastic_so_snapshot SET physical_qty_base = physical_qty_base * 100 WHERE variant_id LIKE '%POLY%' AND source_unit='ROLL' AND mapping_status='MAPPED';\\n";
   bigSQL += "INSERT INTO audit_log(id, business_unit_id, actor_user_id, action, entity_type, entity_id, reason, details, created_at) VALUES('PHASE19', 'BU-PLASTIC', 'SYSTEM', 'RECOVERY', 'SYSTEM', 'SYSTEM', 'ANTIGRAVITY_RECOVERY_PHASE_19', '{}', 0);\\n";

   phase19 += '        const sqlStr = "' + bigSQL + '";\n';
   phase19 += '        this.ctx.storage.sql.exec(sqlStr);\n';
   
   phase19 += '        console.log("PHASE 19 SUCCESS");\n';
   phase19 += '      }\n';
   phase19 += '    } catch(e) {\n';
   phase19 += '      console.log("PHASE 19 FAILED", e);\n';
   phase19 += '    }\n';
   
   fs.writeFileSync('cloudflare/rkn-erp-core.ts', before + phase19 + after);
   console.log("Injected Phase 19");
} else {
   console.log("Phase 18 not found!");
}
