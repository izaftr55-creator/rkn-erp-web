const Database = require('better-sqlite3');
const db = new Database('.wrangler/state/v3/do/rkn-erp-prod-RknErpCore/ae188df98989563873dc46d29d58a3751ea492c43bd3491b641153aa7d2e29fd.sqlite');
const tables = db.prepare("SELECT * FROM sqlite_master").all();
console.log(tables);
