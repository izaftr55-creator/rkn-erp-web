const fs = require('fs');
const content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');
const start = content.indexOf('/* RKN_PLASTIC_V2M_EXACT_EXCEL_AUDIT_SYNC');
const end = content.indexOf('/*', start + 10);
const v2m = content.substring(start, end);
fs.writeFileSync('v2m.txt', v2m);
