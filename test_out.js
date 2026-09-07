(async function() {
  const res = await fetch('http://localhost:3000/api/rkn/plastic?view=OUTBOUND&period=2026-07');
  const json = await res.json();
  const row = json.data.rows.find(r => r.invoiceNo === "PTR-20260730-FE5337");
  console.log(row);
})();
