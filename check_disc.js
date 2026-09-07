(async function() {
  const invoiceNos = ["PTR-20260730-FE5337", "PTR-20260730-A4769A", "PTR-20260730-AC6275", "PTR-20260811-3F19FB", "PTR-20260822-3BBB13", "PTR-20260822-BFF96C", "PTR-20260825-3BE337", "PTR-20260826-8BCD5C"];
  for (let month of ['2026-07', '2026-08']) {
    const res = await fetch('http://localhost:3000/api/rkn/plastic?view=OUTBOUND&period=' + month);
    const json = await res.json();
    if (!json.data || !json.data.rows) continue;
    let seen = new Set();
    for(let r of json.data.rows) {
        if(invoiceNos.includes(r.invoiceNo) && !seen.has(r.invoiceNo)) {
            seen.add(r.invoiceNo);
            console.log(r.invoiceNo, "Discount:", r.discountRp, "GrandTotal:", r.grandTotalRp);
        }
    }
  }
})();
