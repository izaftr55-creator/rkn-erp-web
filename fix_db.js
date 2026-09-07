const db = require('better-sqlite3')('C:/RKN-ERP/rkn-erp-web/.wrangler/state/v3/do/rkn-erp-prod-RknErpCore/ae188df98989563873dc46d29d58a3751ea492c43bd3491b641153aa7d2e29fd.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

const session = db.prepare("SELECT so_id FROM plastic_so_session WHERE business_unit_id='BU-PLASTIC' AND status='POSTED' AND date_key='2026-08-28' LIMIT 1").get();
if (session) {
   console.log('Session ID:', session.so_id);
   const existing = db.prepare("SELECT * FROM plastic_so_session_line WHERE so_id=? AND variant_id='PL-THERMAL-THERMAL-GOLDWIN'").get(session.so_id);
   console.log('Existing Goldwin Line:', existing);
   
   if (!existing) {
      db.prepare("INSERT INTO plastic_so_session_line(line_id,so_id,variant_id,system_qty_base,physical_qty_base,physical_entered,snapshot_unit_cost_rp,created_at,updated_at) VALUES(?,?,'PL-THERMAL-THERMAL-GOLDWIN',0,-1,1,0,?,?)").run('FIX-'+Date.now(), session.so_id, new Date().toISOString(), new Date().toISOString());
      console.log('Inserted Goldwin line into DB!');
   } else {
      db.prepare("UPDATE plastic_so_session_line SET physical_qty_base=-1, physical_entered=1 WHERE so_id=? AND variant_id='PL-THERMAL-THERMAL-GOLDWIN'").run(session.so_id);
      console.log('Updated Goldwin line in DB!');
   }
   
   // We can't run syncAuthoritativeInventory from node, so we'll just delete the inventory balance row for Goldwin to force a recalculation on next access if the system allows it...
   // Wait, syncAuthoritativeInventory is called on any CREATE_INBOUND or DASHBOARD fetch. Let's just delete the plastic_inventory_balance row for Goldwin, or we can just leave it since any operation or dashboard view will run syncAuthoritativeInventory and recalculate it from the DB.
} else {
   console.log('SO not found');
}
