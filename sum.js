const fs = require('fs');
const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
let sum = 0;
lines.forEach(l => {
  const match = l.match(/grand_total_rp = (\d+)/);
  if (match) {
     if (l.includes('A9E605')) {
       // Agus is Goldwin (2630000) or Tanpa Merk (2570000)
       sum += 2570000;
     } else {
       sum += parseInt(match[1]);
     }
  }
});
console.log('SUM:', sum);
