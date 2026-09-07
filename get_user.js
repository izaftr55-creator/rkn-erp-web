const Database = require('better-sqlite3');
const db = new Database('C:/RKN-ERP/rkn-erp-web/.open-next/server-functions/default/data/rkn-erp.sqlite');
const user = db.prepare('SELECT id FROM rkn_user LIMIT 1').get();
console.log(user.id);
