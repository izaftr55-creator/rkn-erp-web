const fs = require('fs');

let content = fs.readFileSync('cloudflare/rkn-erp-core.ts', 'utf8');

const marker = 'this.ctx.storage.sql.exec(ERP_PRODUCT_MASTER_SCHEMA_V1).toArray();';
const injectIndex = content.indexOf(marker);

if (injectIndex !== -1) {
  let phase18 = '\n    // ANTIGRAVITY RECOVERY PHASE 18\n';
  phase18 += '    try {\n';
  phase18 += '      const check18 = this.ctx.storage.sql.exec("SELECT 1 FROM audit_log WHERE reason=\'ANTIGRAVITY_RECOVERY_PHASE_18\'").toArray();\n';
  phase18 += '      if (check18.length === 0) {\n';
  phase18 += '        console.log("RUNNING PHASE 18 IN DO CONSTRUCTOR");\n';
  
  const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
  let count = 0;
  for (let l of lines) {
     if (l.trim().startsWith('UPDATE plastic_sales_invoice SET grand_total_rp')) {
        let stmt = l.trim().replace(/;$/, '');
        if (stmt.includes('A9E605')) {
           stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31'";
        }
        phase18 += '        this.ctx.storage.sql.exec("' + stmt + '").toArray();\n';
        count++;
     }
  }
  
  // Status update but safer: one by one or maybe skip it if we can compute it on the fly?
  // Let's do the SO snapshot fixes
  phase18 += '        this.ctx.storage.sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK\', physical_qty_base=10000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-POLOS\'").toArray();\n';
  phase18 += '        this.ctx.storage.sql.exec("UPDATE plastic_so_snapshot SET variant_id=\'PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK\', physical_qty_base=90000, mapping_status=\'MAPPED\' WHERE line_key=\'SO2808-THERMAL-KOTAK\'").toArray();\n';
  phase18 += '        this.ctx.storage.sql.exec("UPDATE plastic_so_snapshot SET physical_qty_base = physical_qty_base * 100 WHERE variant_id LIKE \'%POLY%\' AND source_unit=\'ROLL\' AND mapping_status=\'MAPPED\'").toArray();\n';
  
  phase18 += '        this.ctx.storage.sql.exec("INSERT INTO audit_log(id, business_unit_id, actor_user_id, action, entity_type, entity_id, reason, details, created_at) VALUES(\'PHASE18\', \'BU-PLASTIC\', \'SYSTEM\', \'RECOVERY\', \'SYSTEM\', \'SYSTEM\', \'ANTIGRAVITY_RECOVERY_PHASE_18\', \'{}\', 0)").toArray();\n';
  phase18 += '        console.log("PHASE 18 SUCCESS");\n';
  phase18 += '      }\n';
  phase18 += '    } catch(e) {\n';
  phase18 += '      console.log("PHASE 18 FAILED", e);\n';
  phase18 += '    }\n';
  
  content = content.substring(0, injectIndex + marker.length) + phase18 + content.substring(injectIndex + marker.length);
  fs.writeFileSync('cloudflare/rkn-erp-core.ts', content);
  console.log("Injected Phase 18 with " + count + " updates");
} else {
  console.log("Marker not found!");
}
