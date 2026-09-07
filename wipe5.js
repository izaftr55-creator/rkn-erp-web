const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const firstPhaseStart = content.indexOf('  /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_17 */');
const endMarker = '  /* RKN_PLASTIC_PRICE_HISTORY_VIEW */';
const endMarkerIndex = content.indexOf(endMarker);

if (firstPhaseStart !== -1 && endMarkerIndex !== -1) {
   let before = content.substring(0, firstPhaseStart);
   let after = content.substring(endMarkerIndex);
   fs.writeFileSync('cloudflare/plasticTradingV2.ts', before + after);
   console.log("Wiped Phase 17");
} else {
   console.log("Phase 17 not found!");
}
