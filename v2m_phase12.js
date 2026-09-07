const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

let startIndex = content.indexOf('  /* RKN_PLASTIC_V2M_EXACT_EXCEL_AUDIT_SYNC');
let endIndex = content.indexOf('          /* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_4 */');

let oldBlock = content.substring(startIndex, endIndex);

// Now I will completely reconstruct the old block
let lines = oldBlock.split('\n');
let newLines = [];
let inExec = false;

for (let l of lines) {
  if (l.trim().startsWith('sql.exec(')) {
      inExec = true;
      continue;
  }
  if (inExec && l.trim().startsWith('\).toArray();')) {
      inExec = false;
      continue;
  }
  if (inExec) {
      if (l.includes('UPDATE plastic_sales_invoice')) {
         let stmt = l.trim().replace(/;$/, '');
         if (stmt.includes('A9E605')) {
             stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31'";
         }
         newLines.push('          sql.exec("' + stmt + '").toArray();');
      }
  } else {
      newLines.push(l);
  }
}

let newBlock = newLines.join('\n').replace(/ANTIGRAVITY_RECOVERY_PHASE_11/g, 'ANTIGRAVITY_RECOVERY_PHASE_12');
content = content.replace(oldBlock, newBlock);

fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
console.log("Injected phase 12!");
