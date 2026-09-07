(async function() {
  console.log("Mulai membersihkan kekacauan harga di database...");
  
  // Harga asli manual Kakak sebelum diubah AI
  const manualPrices = {
    "PL-POLY-TOSCA-20X30": 1300000,
    "PL-POLY-PUTIH-A-17X30": 1175000,
    "PL-POLY-PUTIH-A-20X30": 1300000,
    "PL-POLY-PUTIH-A-25X35": 1560000,
    "PL-POLY-PUTIH-B-17X30": 975000, // Harga jadul
    "PL-POLY-PUTIH-B-20X30": 1100000, // Harga jadul
    // Semua warna 25x35 jadulnya 1950000 (kecuali Putih/Hitam)
  };

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
      if (sale.status === 'VOID') continue;

      // Ambil detailnya
      const detRes = await fetch('/api/rkn/plastic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: 'GET_SALE', payload: { invoiceId: sale.invoiceId } })
      });
      const det = await detRes.json();
      if (!det || !det.lines) continue;
      
      let changed = false;
      const newLines = det.lines.map(line => {
        let variant = line.variantId;
        let unit = line.inputUnit.toUpperCase();
        
        if (unit === 'BALL') {
          // 1. Balikin Tosca Wawan dkk
          if (manualPrices[variant] && line.unitPriceRp !== manualPrices[variant]) {
             // Tapi hati-hati, jangan ubah kalau emang dari awal bener. 
             // Kita tau AI kemaren ubah Tosca jadi 2080000
             if (variant === 'PL-POLY-TOSCA-20X30' && line.unitPriceRp === 2080000) {
                 line.unitPriceRp = 1300000; changed = true;
             }
             if (variant === 'PL-POLY-PUTIH-A-17X30' && line.unitPriceRp === 1880000) {
                 line.unitPriceRp = 1175000; changed = true;
             }
             if (variant === 'PL-POLY-PUTIH-A-20X30' && line.unitPriceRp === 2080000) {
                 line.unitPriceRp = 1300000; changed = true;
             }
             if (variant === 'PL-POLY-PUTIH-A-25X35' && line.unitPriceRp === 1950000) {
                 line.unitPriceRp = 1560000; changed = true;
             }
             // AI mengubah Putih B jadi 1560000 dan 1760000
             if (variant === 'PL-POLY-PUTIH-B-17X30' && line.unitPriceRp === 1560000) {
                 line.unitPriceRp = 975000; changed = true;
             }
             if (variant === 'PL-POLY-PUTIH-B-20X30' && line.unitPriceRp === 1760000) {
                 line.unitPriceRp = 1100000; changed = true;
             }
          }
          
          // 2. Balikin Warna 25x35 jadi 1.950.000 (AI sempet ubah jadi 1.560.000)
          if (variant.includes('-25X35') && !variant.includes('HITAM') && !variant.includes('PUTIH')) {
             if (line.unitPriceRp === 1560000) {
                 line.unitPriceRp = 1950000; changed = true;
             }
          }
        }
        
        // 3. Balikin RN Thermal Dus Panjang 5 Dus (PTR-20260826-864117)
        if (sale.invoiceNo === 'PTR-20260826-864117' && variant.includes('THERMAL') && unit === 'DUS') {
            if (line.unitPriceRp === 700000) {
                line.unitPriceRp = 800000; changed = true;
            }
        }
        
        return line;
      });

      if (changed) {
        console.log("Memperbaiki nota: " + sale.invoiceNo);
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
              reason: "Rollback koreksi paksa AI ke angka manual awal"
            }
          })
        });
        const updateData = await updateRes.json();
        if(updateData.ok) {
           console.log("  => Berhasil dikembalikan!");
           totalFixed++;
        }
      }
    }
  }
  console.log("SELESAI KAK! " + totalFixed + " nota sudah kembali suci bersih sesuai hitungan manual Kakak.");
})();
