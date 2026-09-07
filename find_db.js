const Database = require('better-sqlite3');
const glob = require('glob');

const files = glob.sync('C:/RKN-ERP/**/*.sqlite');
for (const file of files) {
  try {
    const db = new Database(file);
    const res = db.prepare("SELECT count(*) as c FROM plastic_sales_invoice").get();
    console.log('FOUND IN:', file, res.c);
    db.close();
  } catch (e) {
    // ignore
  }
}
