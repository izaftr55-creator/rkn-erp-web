const fs = require('fs');
let content = fs.readFileSync('cloudflare/rkn-erp-core.ts', 'utf8');

content = content.replace('\nhis.ctx.storage.sql', '\n    this.ctx.storage.sql');
fs.writeFileSync('cloudflare/rkn-erp-core.ts', content);
console.log("Fixed 'his' -> 'this'");
