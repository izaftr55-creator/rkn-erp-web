const fs = require('fs');
const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
let sum = 0;
lines.forEach(l => {
  const match = l.match(/grand_total_rp = (\d+)/);
  if (match) {
     sum += parseInt(match[1]);
  }
});
console.log('RAW SUM from v2m.txt:', sum);
