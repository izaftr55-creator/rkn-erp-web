(async function() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://rkngroup.my.id/api/rkn/plastic?view=OUTBOUND&period=ALL');
  const data = await res.json();
  const rows = data.data.rows;
  
  const targetInvoices = ['PTR-20260826-8BCD5C', 'PTR-20260825-3BE337', 'PTR-20260822-BFF96C', 'PTR-20260822-3BBB13', 'PTR-20260811-3F19FB', 'PTR-20260730-AC6275', 'PTR-20260730-A4769A', 'PTR-20260730-FE5337'];
  
  for (let row of rows) {
      if (targetInvoices.includes(row.invoiceNo)) {
          console.log(row.invoiceNo, row.variantId, row.qtyInput, row.inputUnit, row.unitPriceRp, row.discountRp);
      }
  }
})();
