const Database = require('better-sqlite3');
const db = new Database('C:/RKN-ERP/rkn-erp-web/.open-next/server-functions/default/data/rkn-erp.sqlite');
console.log(db.prepare("SELECT * FROM audit_log WHERE action='SO_SESSION'").all());
