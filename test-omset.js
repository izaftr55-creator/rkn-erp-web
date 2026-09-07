const fs = require('fs');
const content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const invoiceMap = {};

const lines = content.split('\n');
for (let line of lines) {
  let m = line.match(/INSERT.+?plastic_sales_invoice\([^)]+\).+?VALUES\('([^']+)',[^,]+,'([^']+)',[^,]+,[^,]+,[^,]+,[^,]+,(\d+)/);
  if (m) {
     invoiceMap[m[1]] = parseInt(m[3], 10);
  }
  
  // Also match UPDATE
  let m2 = line.match(/UPDATE plastic_sales_invoice SET grand_total_rp = (\d+).*?WHERE.*?'([^']+)'/);
  if (m2) {
     // invoice_no = 'PTR-20260826-A9E605' -> the m2[2] would be PTR-20260826-A9E605
     let inv = m2[2];
     if (inv.startsWith('%') && inv.endsWith('%')) {
        let keyword = inv.substring(1, inv.length - 1);
        for (let k in invoiceMap) {
            if (k.includes(keyword)) invoiceMap[k] = parseInt(m2[1], 10);
        }
     } else {
        invoiceMap[inv] = parseInt(m2[1], 10);
     }
  }
}

let sum = 0;
for (let k in invoiceMap) {
   sum += invoiceMap[k];
}
console.log('Total Omset:', sum);
