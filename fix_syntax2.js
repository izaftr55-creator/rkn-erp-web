const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

content = content.replace(
  "UPDATE plastic_sales_invoice\nSET status = CASE",
  "sql.exec(\nUPDATE plastic_sales_invoice\nSET status = CASE"
);

fs.writeFileSync('cloudflare/plasticTradingV2.ts', content);
