const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

// I will extract the big sql.exec( UPDATE ... UPDATE ... ) block from Phase 8.
const startToken = 'sql.exec(\n  UPDATE plastic_sales_invoice SET grand_total_rp = 1300000,';
const endToken = ').toArray();\n  \n  \n         sql.exec("INSERT INTO audit_log';

if (content.indexOf(startToken) !== -1) {
  let inner = content.substring(content.indexOf(startToken), content.indexOf(endToken));
  
  // inner is basically the big template string. I will split it by newline, and wrap each with sql.exec
  const lines = inner.split('\n');
  let newInner = '';
  for (let l of lines) {
     if (l.includes('UPDATE plastic_sales_invoice')) {
        newInner += 'sql.exec("' + l.trim() + '").toArray();\n';
     }
  }
  
  content = content.replace(inner + ').toArray();', newInner);
  content = content.replace(/ANTIGRAVITY_RECOVERY_PHASE_8/g, 'ANTIGRAVITY_RECOVERY_PHASE_10');
  fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
  console.log("Injected phase 10!");
} else {
  console.log("Start token not found!");
}
