(async function() {
  let totalSales = 0;
  let allInvoices = [];
  for (let month of ['2026-07', '2026-08']) {
    const res = await fetch('/api/rkn/plastic?view=OUTBOUND&period=' + month);
    const json = await res.json();
    if (!json.data || !json.data.rows) continue;
    
    // Group lines by invoice
    let invoices = {};
    for(let r of json.data.rows) {
        if(!invoices[r.invoiceNo]) {
            invoices[r.invoiceNo] = {
                invoiceNo: r.invoiceNo,
                date: r.dateKey,
                grandTotal: r.grandTotalRp,
                lines: []
            };
        }
        invoices[r.invoiceNo].lines.push({
            name: r.productName + ' ' + (r.color||'') + ' ' + (r.size||''),
            qty: r.qtyInput,
            unit: r.inputUnit,
            price: r.unitPriceRp,
            total: r.lineTotalRp
        });
    }
    
    for (let inv of Object.values(invoices)) {
        totalSales += inv.grandTotal;
        allInvoices.push(inv);
    }
  }
  
  console.log("TOTAL OMSET JULI-AGUSTUS:", totalSales);
  console.log("Rincian Invoice:");
  allInvoices.sort((a,b) => a.date.localeCompare(b.date));
  allInvoices.forEach(inv => {
      console.log(\\ | \ | Total: \\);
  });
})();
