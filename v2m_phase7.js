const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

content = content.replace(
  "UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK', physical_qty_base=30000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-POLOS'",
  "UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK', physical_qty_base=10000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-POLOS'"
);

content = content.replace(/ANTIGRAVITY_RECOVERY_PHASE_6/g, 'ANTIGRAVITY_RECOVERY_PHASE_7');

fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
console.log("Injected phase 7");
