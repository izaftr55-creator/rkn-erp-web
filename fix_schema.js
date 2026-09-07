const fs = require('fs');
let content = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8');

const startMarker = "/* RKN_PLASTIC_V2M_EXACT_EXCEL_AUDIT_SYNC";
const endMarker = "-- Hitung ulang status pelunasan";

const sIndex = content.indexOf(startMarker);
const eIndex = content.indexOf(endMarker);

if (sIndex !== -1 && eIndex !== -1) {
   let before = content.substring(0, sIndex);
   let after = content.substring(eIndex + endMarker.length);
   fs.writeFileSync('cloudflare/plasticTradingV2.ts', before + after);
   console.log("Deleted the corrupted SQL from the schema string!");
} else {
   console.log("Markers not found");
}
