(async function() {
  console.log("Mengambil data seluruh invoice (OUTBOUND)...");
  
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

  const res = await fetch('/api/rkn/plastic?view=OUTBOUND&period=ALL');
  const data = await res.json();
  if (!data?.data?.rows) {
      console.error("Gagal mengambil data OUTBOUND");
      return;
  }
  
  const rows = data.data.rows;
  
  // Kelompokkan per invoice
  const invoices = {};
  for (let row of rows) {
      if (row.status === 'VOID') continue;
      if (!invoices[row.invoiceId]) {
          invoices[row.invoiceId] = {
              invoiceId: row.invoiceId,
              invoiceNo: row.invoiceNo,
              customerId: row.customerId,
              customerName: row.customerName,
              dateKey: row.dateKey,
              note: row.note,
              lines: []
          };
      }
      invoices[row.invoiceId].lines.push({
          variantId: row.variantId,
          qty: row.qtyInput,
          unit: row.inputUnit,
          unitPriceRp: row.unitPriceRp
      });
  }
  
  let totalFixed = 0;
  for (let invId in invoices) {
      const inv = invoices[invId];
      let changed = false;
      
      const newLines = inv.lines.map(line => {
          let variant = line.variantId || "";
          let unit = (line.unit || "").toUpperCase();
          
          if (unit === 'BALL') {
             let key = null;
             if (variant.includes('PUTIH-A')) key = 'PUTIH A ' + variant.split('-').pop() + ' BALL';
             else if (variant.includes('PUTIH-B')) key = 'PUTIH B ' + variant.split('-').pop() + ' BALL';
             else if (variant.includes('HITAM')) key = 'HITAM ' + variant.split('-').pop() + ' BALL';
             else {
                 let parts = variant.split('-');
                 if (parts.length >= 4) key = parts[2] + ' ' + parts[3] + ' BALL';
             }
             
             if (key && masterHarga[key] && line.unitPriceRp !== masterHarga[key]) {
                 console.log("  [+] Koreksi " + variant + " di " + inv.invoiceNo + " dari " + line.unitPriceRp + " ke " + masterHarga[key]);
                 line.unitPriceRp = masterHarga[key];
                 changed = true;
             }
          }
          
          // Koreksi Thermal RN
          if (inv.invoiceNo === 'PTR-20260826-864117' && variant.includes('THERMAL') && unit === 'DUS') {
              if (line.unitPriceRp !== 800000) {
                 console.log("  [+] Koreksi RN Thermal di " + inv.invoiceNo + " dari " + line.unitPriceRp + " ke 800000");
                 line.unitPriceRp = 800000;
                 changed = true;
              }
          }
          return line;
      });
      
      if (changed) {
          console.log("Menyimpan " + inv.invoiceNo + "...");
          const updateRes = await fetch('/api/rkn/plastic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              command: 'UPDATE_SALE',
              payload: {
                  invoiceId: inv.invoiceId,
                  customerId: inv.customerId,
                  customerName: inv.customerName,
                  dateKey: inv.dateKey,
                  note: inv.note,
                  lines: newLines,
                  reason: "Force rollback ke baseline Excel Kakak"
              }
            })
          });
          const updateData = await updateRes.json();
          if (updateData.ok) {
              console.log("  => OK");
              totalFixed++;
          } else {
              console.error("  => Gagal: ", updateData.error);
          }
      }
  }
  console.log("SELESAI KAK! " + totalFixed + " nota sudah kembali ke Excel.");
})();
