const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

// I will find ALL sql.exec(\nUPDATE...) and replace them with individual sql.exec
const lines = content.split('\n');
let newLines = [];
let inBigExec = false;

for (let i = 0; i < lines.length; i++) {
   const l = lines[i];
   if (l.trim() === 'sql.exec(' && lines[i+1] && lines[i+1].includes('UPDATE plastic_sales_invoice')) {
       inBigExec = true;
       continue;
   }
   
   if (inBigExec) {
       if (l.trim() === ').toArray();') {
           inBigExec = false;
           continue;
       }
       if (l.trim().startsWith('UPDATE plastic_sales_invoice')) {
           // write it as an individual sql.exec
           // Wait, make sure we use double quotes for the query so single quotes inside work
           let stmt = l.trim();
           // if it has a trailing semicolon, remove it so it's clean (optional, but good practice)
           stmt = stmt.replace(/;$/, '');
           
           // I need Agus to be 2630000, wait, the user wants 191.391.500 which is 2630000!
           if (stmt.includes('A9E605')) {
               stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31'";
           }
           
           newLines.push('          sql.exec("' + stmt + '").toArray();');
       }
   } else {
       // Replace PHASE_8 with PHASE_11
       newLines.push(l.replace(/ANTIGRAVITY_RECOVERY_PHASE_8/g, 'ANTIGRAVITY_RECOVERY_PHASE_11'));
   }
}

fs.writeFileSync('cloudflare/plasticTradingV2.ts', newLines.join('\n'));
console.log("Injected phase 11!");
