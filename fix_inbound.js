const fs = require('fs');
let code = fs.readFileSync('C:/RKN-ERP/rkn-erp-web/cloudflare/plasticTradingV2.ts', 'utf-8');

code = code.split("audit(sql,a,'PLASTIC_IN_CREATE'").join("syncAuthoritativeInventory(sql);\n  audit(sql,a,'PLASTIC_IN_CREATE'");
code = code.split("checkpointPhysical.set('PL-THERMAL-THERMAL-GOLDWIN', -1);").join("checkpointPhysical.set('PL-THERMAL-THERMAL-GOLDWIN', 0);");

fs.writeFileSync('C:/RKN-ERP/rkn-erp-web/cloudflare/plasticTradingV2.ts', code);
console.log('Fixed CREATE_INBOUND and Goldwin baseline');
