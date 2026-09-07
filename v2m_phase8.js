const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

// Rename PHASE_3 to PHASE_8 so the entire Phase 3 block re-runs!
content = content.replace(/ANTIGRAVITY_RECOVERY_PHASE_3/g, 'ANTIGRAVITY_RECOVERY_PHASE_8');

// I also need to update Thermal Dus Panjang to 1!
// Wait, that is in PHASE_7 (which used to be PHASE_4).
content = content.replace(/ANTIGRAVITY_RECOVERY_PHASE_7/g, 'ANTIGRAVITY_RECOVERY_PHASE_9');

fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
console.log("Injected phase 8 and 9");
