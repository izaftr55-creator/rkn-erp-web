const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

// I will just replace the 2630000 with 2570000 for A9E605!
content = content.replace(
  "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31';",
  "UPDATE plastic_sales_invoice SET grand_total_rp = 2570000, subtotal_rp = 2570000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31';"
);

// I will rename PHASE_5 to PHASE_6 to run it!
content = content.replace(/ANTIGRAVITY_RECOVERY_PHASE_5/g, 'ANTIGRAVITY_RECOVERY_PHASE_6');

fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
console.log("Injected phase 6");
