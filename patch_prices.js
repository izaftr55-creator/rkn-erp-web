(async function() {
  const masterHarga = {
    "HITAM 15X25 BALL": 1700000,
    "HITAM 17X30 BALL": 1520000,
    "HITAM 20X30 BALL": 1760000,
    "HITAM 25X35 BALL": 1350000,
    "PINK 15X25 BALL": 1850000,
    "KUNING 15X25 BALL": 1850000,
    "ORANGE 15X25 BALL": 1850000,
    "BIRU 15X25 BALL": 1850000,
    "HIJAU 15X25 BALL": 1850000,
    "UNGU 15X25 BALL": 1850000,
    "TOSCA 15X25 BALL": 1850000,
    "PINK 17X30 BALL": 1520000,
    "KUNING 17X30 BALL": 1520000,
    "ORANGE 17X30 BALL": 1520000,
    "BIRU 17X30 BALL": 1520000,
    "HIJAU 17X30 BALL": 1520000,
    "UNGU 17X30 BALL": 1520000,
    "TOSCA 17X30 BALL": 1520000,
    "PINK 20X30 BALL": 1760000,
    "KUNING 20X30 BALL": 1760000,
    "ORANGE 20X30 BALL": 1760000,
    "BIRU 20X30 BALL": 1760000,
    "HIJAU 20X30 BALL": 1760000,
    "UNGU 20X30 BALL": 1760000,
    "TOSCA 20X30 BALL": 1760000,
    "PINK 25X35 BALL": 1350000,
    "KUNING 25X35 BALL": 1350000,
    "ORANGE 25X35 BALL": 1350000,
    "BIRU 25X35 BALL": 1350000,
    "HIJAU 25X35 BALL": 1350000,
    "UNGU 25X35 BALL": 1350000,
    "TOSCA 25X35 BALL": 1350000,
    "PUTIH A 15X25 BALL": 1850000,
    "PUTIH A 17X30 BALL": 1880000,
    "PUTIH A 20X30 BALL": 2080000,
    "PUTIH A 25X35 BALL": 2000000,
    "PUTIH B 15X25 BALL": 1050000,
    "PUTIH B 17X30 BALL": 1150000,
    "PUTIH B 20X30 BALL": 1200000,
    "PUTIH B 25X35 BALL": 1050000,
  };

  const invoiceNos = ["PTR-20260730-FE5337", "PTR-20260730-A4769A", "PTR-20260730-AC6275", "PTR-20260811-3F19FB", "PTR-20260822-3BBB13", "PTR-20260822-BFF96C", "PTR-20260825-3BE337", "PTR-20260826-8BCD5C"];
  
  let totalFixed = 0;
  for (let month of ['2026-07', '2026-08']) {
    const res = await fetch('/api/rkn/plastic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'GET_DASHBOARD', payload: { periodKey: month } })
    });
    const data = await res.json();
    if (!data.sales) continue;
    
    for (let sale of data.sales) {
      if (invoiceNos.includes(sale.invoiceNo)) {
        console.log("Fixing " + sale.invoiceNo + " (ID: " + sale.invoiceId + ")");
        // Get details
        const detRes = await fetch('/api/rkn/plastic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: 'GET_SALE', payload: { invoiceId: sale.invoiceId } })
        });
        const det = await detRes.json();
        
        let changed = false;
        const newLines = det.lines.map(line => {
          let variantName = line.variantName || "";
          let unit = line.inputUnit.toUpperCase();
          if (unit === 'BALL') {
             // Find matching master
             let warna = variantName.split(' ')[1]; 
             if (variantName.includes("PUTIH A")) warna = "PUTIH A";
             if (variantName.includes("PUTIH B")) warna = "PUTIH B";
             let ukuran = variantName.split(' ').find(x => x.includes('X'));
             let key = (warna + " " + ukuran + " " + unit).toUpperCase();
             if (masterHarga[key] && line.unitPriceRp !== masterHarga[key]) {
                console.log("  - Changing price of " + variantName + " from " + line.unitPriceRp + " to " + masterHarga[key]);
                changed = true;
                return { ...line, unitPriceRp: masterHarga[key] };
             }
          }
          return line;
        });

        if (changed) {
          const updateRes = await fetch('/api/rkn/plastic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cmd: 'UPDATE_SALE',
              payload: {
                invoiceId: sale.invoiceId,
                customerId: sale.customerId,
                customerName: sale.customerName,
                dateKey: sale.dateKey,
                lines: newLines,
                note: sale.note,
                reason: "Auto-koreksi harga master Ball"
              }
            })
          });
          const updateData = await updateRes.json();
          if(updateData.ok) {
             console.log("  => Success!");
             totalFixed++;
          } else {
             console.error("  => Failed:", updateData);
          }
        }
      }
    }
  }
  console.log("Selesai! " + totalFixed + " invoice berhasil dikoreksi.");
})();
