const fs = require('fs');
let lines = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('UPDATE plastic_sales_line SET unit_price_rp'));
const endIdx = lines.findIndex(l => l.includes('INSERT INTO audit_log('));

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, (endIdx + 1) - startIdx);
    fs.writeFileSync('cloudflare/plasticTradingV2.ts', lines.join('\n'));
    console.log('Cleaned successfully! Removed ' + ((endIdx + 1) - startIdx) + ' lines.');
} else {
    console.log('Failed to find indices', startIdx, endIdx);
}
