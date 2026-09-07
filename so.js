const Database = require('better-sqlite3');
const db = new Database('C:/RKN-ERP/rkn-erp-web/.open-next/server-functions/default/data/rkn-erp.sqlite');
console.log(db.prepare("SELECT * FROM plastic_so_snapshot WHERE snapshot_date_key='2026-08-28'").all());
