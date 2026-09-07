(async function() {
  for (let month of ['2026-07', '2026-08']) {
    const res = await fetch(/api/rkn/plastic?view=DASHBOARD&period= + month);
    const data = await res.json();
    if (!data || !data.data || !data.data.sales) continue;
    
    for (let sale of data.data.sales) {
      if (sale.status === 'VOID') continue;
      const detRes = await fetch(/api/rkn/plastic?view=SALE_DETAIL&invoiceId= + sale.invoiceId);
      const detData = await detRes.json();
      const det = detData.data;
      if (!det || !det.lines) continue;
      
      for (let line of det.lines) {
        let unit = (line.inputUnit || "").toUpperCase();
        if (unit === 'BALL' || unit === 'DUS') {
          if (line.variantId.includes('PUTIH') || line.variantId.includes('TOSCA') || line.variantId.includes('THERMAL')) {
             console.log(sale.invoiceNo, line.variantId, line.unitPriceRp);
          }
        }
      }
    }
  }
})();
