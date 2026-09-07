const fs = require('fs');
let content = fs.readFileSync('cloudflare/rkn-erp-core.ts', 'utf8');

const firstPhaseStart = content.indexOf('    // ANTIGRAVITY RECOVERY PHASE 19');
const endPhaseIndex = content.indexOf('    } catch(e) {\n      console.log("PHASE 19 FAILED", e);\n    }');

if (firstPhaseStart !== -1 && endPhaseIndex !== -1) {
   let before = content.substring(0, firstPhaseStart);
   let after = content.substring(endPhaseIndex + 67);
   fs.writeFileSync('cloudflare/rkn-erp-core.ts', before + after);
   console.log("Wiped Phase 19");
} else {
   console.log("Phase 19 not found!");
}
