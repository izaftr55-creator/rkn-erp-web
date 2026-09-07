const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

let phase4 = 
"    /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_4 */\n" +
"    try {\n" +
"      const checkRecovery4 = sql.exec(\"SELECT 1 FROM audit_log WHERE reason='ANTIGRAVITY_RECOVERY_PHASE_4'\").toArray();\n" +
"      if (checkRecovery4.length === 0) {\n" +
"         sql.exec(\"UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK', physical_qty_base=30000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-POLOS'\").toArray();\n" +
"         sql.exec(\"UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK', physical_qty_base=90000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-KOTAK'\").toArray();\n" +
"         sql.exec(\"INSERT INTO audit_log(id, business_unit_id, actor_user_id, action, entity_type, entity_id, reason, details, created_at) VALUES(?, 'BU-PLASTIC', 'SYSTEM', 'RECOVERY', 'SYSTEM', 'SYSTEM', 'ANTIGRAVITY_RECOVERY_PHASE_4', '{}', ?)\", crypto.randomUUID(), Date.now()).toArray();\n" +
"      }\n" +
"    } catch(e) {}\n\n";

content = content.replace('/* RKN_PLASTIC_PRICE_HISTORY_VIEW */', phase4 + '/* RKN_PLASTIC_PRICE_HISTORY_VIEW */');
fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
console.log("Injected phase 4");
