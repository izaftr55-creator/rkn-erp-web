const Database = require('better-sqlite3');
const db = new Database('C:/RKN-ERP/rkn-erp-web/.open-next/server-functions/default/data/rkn-erp.sqlite');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
