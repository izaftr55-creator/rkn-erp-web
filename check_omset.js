(async function() {
  const agent = new (require('https').Agent)({ rejectUnauthorized: false });
  const res = await fetch('https://127.0.0.1:3000/api/rkn/plastic?view=OUTBOUND&period=ALL', { agent });
  const data = await res.json();
  const rows = data.data.rows;
  
  let grandTotal = 0;
  let invoices = {};
  
  for (let row of rows) {
      if (row.status === 'VOID') continue;
      if (!invoices[row.invoiceId]) {
          invoices[row.invoiceId] = row.grandTotalRp;
          grandTotal += row.grandTotalRp;
      }
  }
  
  console.log("Total Penjualan (Omset) berdasar OUTBOUND:", grandTotal);
})();
