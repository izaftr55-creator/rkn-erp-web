(async function() {
  const masterHarga = {
    "HITAM 15X25 BALL": 1700000, "HITAM 17X30 BALL": 1520000, "HITAM 20X30 BALL": 1760000, "HITAM 25X35 BALL": 1350000,
    "PINK 15X25 BALL": 1850000, "KUNING 15X25 BALL": 1850000, "ORANGE 15X25 BALL": 1850000, "BIRU 15X25 BALL": 1850000,
    "HIJAU 15X25 BALL": 1850000, "UNGU 15X25 BALL": 1850000, "TOSCA 15X25 BALL": 1850000,
    "PINK 17X30 BALL": 1175000, "KUNING 17X30 BALL": 1175000, "ORANGE 17X30 BALL": 1175000, "BIRU 17X30 BALL": 1175000,
    "HIJAU 17X30 BALL": 1175000, "UNGU 17X30 BALL": 1175000, "TOSCA 17X30 BALL": 1175000,
    "PINK 20X30 BALL": 1300000, "KUNING 20X30 BALL": 1300000, "ORANGE 20X30 BALL": 1300000, "BIRU 20X30 BALL": 1300000,
    "HIJAU 20X30 BALL": 1300000, "UNGU 20X30 BALL": 1300000, "TOSCA 20X30 BALL": 1300000,
    "PINK 25X35 BALL": 1560000, "KUNING 25X35 BALL": 1560000, "ORANGE 25X35 BALL": 1560000, "BIRU 25X35 BALL": 1560000,
    "HIJAU 25X35 BALL": 1560000, "UNGU 25X35 BALL": 1560000, "TOSCA 25X35 BALL": 1560000,
    "PUTIH A 15X25 BALL": 1850000, "PUTIH A 17X30 BALL": 1175000, "PUTIH A 20X30 BALL": 1300000, "PUTIH A 25X35 BALL": 1560000,
    "PUTIH B 15X25 BALL": 1050000, "PUTIH B 17X30 BALL": 975000, "PUTIH B 20X30 BALL": 1100000, "PUTIH B 25X35 BALL": 1050000,
  };

  let totalFixed = 0;
  for (let month of ['2026-07', '2026-08']) {
    const res = await fetch('/api/rkn/plastic?view=DASHBOARD&period=' + month);
    const data = await res.json();
    if (!data?.data?.sales) continue;
    
    for (let sale of data.data.sales) {
      if (sale.status === 'VOID') continue;
      const detRes = await fetch('/api/rkn/plastic?view=SALE_DETAIL&invoiceId=' + sale.invoiceId);
      const det = (await detRes.json()).data;
      if (!det?.lines) continue;
      
      let changed = false;
      const newLines = det.lines.map(line => {
        let variant = line.variantId || "";
        let unit = (line.inputUnit || "").toUpperCase();
        
        if (unit === 'BALL') {
           // Parse color and size from variantId (e.g. PL-POLY-PUTIH-A-20X30)
           let key = null;
           if (variant.includes('PUTIH-A')) key = 'PUTIH A ' + variant.split('-').pop() + ' BALL';
           else if (variant.includes('PUTIH-B')) key = 'PUTIH B ' + variant.split('-').pop() + ' BALL';
           else if (variant.includes('HITAM')) key = 'HITAM ' + variant.split('-').pop() + ' BALL';
           else {
               let parts = variant.split('-');
               if (parts.length >= 4) key = parts[2] + ' ' + parts[3] + ' BALL';
           }
           
           if (key && masterHarga[key] && line.unitPriceRp !== masterHarga[key]) {
               console.log("Memperbaiki " + variant + " dari " + line.unitPriceRp + " ke " + masterHarga[key]);
               line.unitPriceRp = masterHarga[key];
               changed = true;
           }
        }
        
        if (sale.invoiceNo === 'PTR-20260826-864117' && variant.includes('THERMAL') && unit === 'DUS') {
            if (line.unitPriceRp !== 800000) {
               console.log("Memperbaiki RN Thermal dari " + line.unitPriceRp + " ke 800000");
               line.unitPriceRp = 800000;
               changed = true;
            }
        }
        
        return line;
      });

      if (changed) {
        console.log("Update nota: " + sale.invoiceNo);
        const updateRes = await fetch('/api/rkn/plastic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: 'UPDATE_SALE',
            payload: { ...det, lines: newLines, reason: "Force rollback to Excel base" }
          })
        });
        const updateData = await updateRes.json();
        if(updateData.ok) {
           console.log("  => OK!");
           totalFixed++;
        }
      }
    }
  }
  console.log("SELESAI! " + totalFixed + " nota diperbaiki.");
})();
