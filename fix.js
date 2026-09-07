const fs = require('fs');
let code = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

code = code.replace(/INSERT OR IGNORE INTO plastic_customer\(customer_id, business_unit_id, customer_name, created_at\)[\s\S]+?CURRENT_TIMESTAMP\);/m, 
"INSERT OR IGNORE INTO plastic_customer(customer_id, business_unit_id, customer_name, created_at, updated_at)\n    VALUES ('CUST-SYS-RECON', 'BU-PLASTIC', 'System Reconciliation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);");

fs.writeFileSync('cloudflare/plasticTradingV2.ts', code);
console.log('Fixed');
