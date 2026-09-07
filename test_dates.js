const fs = require('fs');
const content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const invoiceMap = {};
const dateMap = {};

const lines = content.split('\n');
for (let line of lines) {
  let m = line.match(/INSERT.+?plastic_sales_invoice\([^)]+\).+?VALUES\('([^']+)',[^,]+,'([^']+)',[^,]+,[^,]+,[^,]+,[^,]+,(\d+)/);
  if (m) {
     invoiceMap[m[1]] = parseInt(m[3], 10);
     dateMap[m[1]] = m[2];
  }
  
  let m2 = line.match(/UPDATE plastic_sales_invoice SET grand_total_rp = (\d+).*?WHERE.*?'([^']+)'/);
  if (m2) {
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

let dateSums = {};
for (let k in invoiceMap) {
    let d = dateMap[k];
    if (!d) {
        let m3 = k.match(/PTR-(\d{4})(\d{2})(\d{2})/);
        if (m3) d = m3[1] + '-' + m3[2] + '-' + m3[3];
    }
    if (d) {
        if (!dateSums[d]) dateSums[d] = 0;
        dateSums[d] += invoiceMap[k];
    }
}
console.log(dateSums);
console.log("Sum 2026-07-28:", dateSums['2026-07-28']);
