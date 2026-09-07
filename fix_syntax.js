const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

// The file contains ERP_PLASTIC_TRADING_SCHEMA_V1
// I need to see if there is syntax errors.
// I will output line 280 to 300 to be sure.
let lines = content.split('\n');
for(let i=270; i<310; i++) {
   console.log(i + ": " + lines[i]);
}
