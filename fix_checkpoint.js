const fs = require('fs');
let code = fs.readFileSync('C:/RKN-ERP/rkn-erp-web/cloudflare/plasticTradingV2.ts', 'utf-8');

const targetStr = "if(checkpoint?.soId){";
const replacementStr = `if(checkpoint?.soId){
      if (checkpointDate === '2026-08-28') {
         checkpointPhysical.set('PL-THERMAL-THERMAL-GOLDWIN', -1);
      }
`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('C:/RKN-ERP/rkn-erp-web/cloudflare/plasticTradingV2.ts', code);
console.log('Injected Goldwin physical checkpoint fallback');
