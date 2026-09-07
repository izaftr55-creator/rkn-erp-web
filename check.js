const Database = require('better-sqlite3');
try {
  const db = new Database('.wrangler/state/v3/do/rkn-erp-prod-RknErpCore/ae188df98989563873dc46d29d58a3751ea492c43bd3491b641153aa7d2e29fd.sqlite', { fileMustExist: true });
  console.log('Opened successfully!');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(tables);
  const integrity = db.prepare("PRAGMA integrity_check").get();
  console.log('Integrity:', integrity);
} catch(e) {
  console.error("DB Error:", e);
}
