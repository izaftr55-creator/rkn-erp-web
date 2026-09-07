const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = '.wrangler/state/v3/do/rkn-erp-prod-RknErpCore/ae188df98989563873dc46d29d58a3751ea492c43bd3491b641153aa7d2e29fd.sqlite';

try {
   const db = new Database(dbPath, { fileMustExist: true });
   console.log('Opened database successfully');
   
   const lines = fs.readFileSync('v2m.txt', 'utf8').split('\n');
   let count = 0;
   
   db.transaction(() => {
      for (let l of lines) {
        if (l.trim().startsWith('UPDATE plastic_sales_invoice SET grand_total_rp')) {
           let stmt = l.trim().replace(/;$/, '');
           if (stmt.includes('A9E605')) {
              stmt = "UPDATE plastic_sales_invoice SET grand_total_rp = 2630000, subtotal_rp = 2630000, updated_at = CURRENT_TIMESTAMP WHERE (invoice_no = 'PTR-20260826-A9E605' OR invoice_no LIKE '%A9E605%') AND date_key <= '2026-08-31'";
           }
           db.prepare(stmt).run();
           count++;
        }
      }
      
      console.log('Applied', count, 'simple updates');
      
      const complexStatusStmt = "UPDATE plastic_sales_invoice SET status = CASE WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = 'POSTED') >= grand_total_rp THEN 'PAID' WHEN (SELECT COALESCE(SUM(amount_rp), 0) FROM plastic_payment WHERE invoice_id = plastic_sales_invoice.invoice_id AND status = 'POSTED') > 0 THEN 'PARTIAL' ELSE 'OPEN' END WHERE status != 'VOID'";
      
      db.prepare(complexStatusStmt).run();
      console.log('Applied status recount');
      
      db.prepare("UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK', physical_qty_base=10000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-POLOS'").run();
      db.prepare("UPDATE plastic_so_snapshot SET variant_id='PL-THERMAL-THERMAL-DUS-KOTAK-TANPA-MERK', physical_qty_base=90000, mapping_status='MAPPED' WHERE line_key='SO2808-THERMAL-KOTAK'").run();
      db.prepare("UPDATE plastic_so_snapshot SET physical_qty_base = physical_qty_base * 100 WHERE variant_id LIKE '%POLY%' AND source_unit='ROLL' AND mapping_status='MAPPED'").run();
      
      console.log('Applied SO snapshot fixes');
   })();
   
   db.close();
   console.log('All Done!');
} catch(e) {
   console.log('FATAL ERROR:', e);
}
