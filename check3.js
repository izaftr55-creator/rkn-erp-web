const Database = require('better-sqlite3');
const db = new Database('.wrangler/state/v3/do/rkn-erp-prod-RknErpCore/metadata.sqlite');
const tables = db.prepare("SELECT * FROM sqlite_master").all();
console.log(tables);
