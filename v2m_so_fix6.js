const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

content = content.replace(
  "/* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_4 */", 
  "/* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_4 */\n      console.log('PHASE 5 REACHED!');"
);
content = content.replace(
  "if (checkRecovery4.length === 0) {",
  "if (checkRecovery4.length === 0) {\n         console.log('PHASE 5 RUNNING!');"
);

fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
console.log("Injected logs");
