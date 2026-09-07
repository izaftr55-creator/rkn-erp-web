const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

// replace Phase 4 with Phase 5
content = content.replace(/ANTIGRAVITY_RECOVERY_PHASE_4/g, 'ANTIGRAVITY_RECOVERY_PHASE_5');

fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
console.log("Renamed to phase 5");
