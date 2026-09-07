const fs = require('fs');
let code = fs.readFileSync('C:/RKN-ERP/rkn-erp-web/cloudflare/plasticTradingV2.ts', 'utf-8');

const injection = `
  if(cmd==='FIX_GOLDWIN_SO'){
    const session=sql.exec("SELECT so_id FROM plastic_so_session WHERE business_unit_id='BU-PLASTIC' AND status='POSTED' AND date_key='2026-08-28' LIMIT 1").toArray()[0];
    if (session && session.so_id) {
       sql.exec("INSERT OR IGNORE INTO plastic_so_session_line(line_id,so_id,variant_id,system_qty_base,physical_qty_base,physical_entered,snapshot_unit_cost_rp,created_at,updated_at) VALUES(?,?,'PL-THERMAL-THERMAL-GOLDWIN',0,-1,1,0,?,?)", 'FIX-'+Date.now(), session.so_id, new Date().toISOString(), new Date().toISOString()).toArray();
       sql.exec("UPDATE plastic_so_session_line SET physical_qty_base=-1, physical_entered=1 WHERE so_id=? AND variant_id='PL-THERMAL-THERMAL-GOLDWIN'", session.so_id).toArray();
       syncAuthoritativeInventory(sql);
       return { ok: true, message: 'Goldwin injected into SO' };
    }
    return { ok: false, message: 'SO not found' };
  }
`;

code = code.replace(/if\(cmd==='CREATE_INBOUND'\)\{/g, injection + '\n  if(cmd===\'CREATE_INBOUND\'){');
fs.writeFileSync('C:/RKN-ERP/rkn-erp-web/cloudflare/plasticTradingV2.ts', code);
console.log('Injected FIX_GOLDWIN_SO');
