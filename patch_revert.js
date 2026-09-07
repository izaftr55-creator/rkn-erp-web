(async function() {
  const targetNo = "PTR-20260822-BFF96C";
  const res = await fetch('/api/rkn/plastic?view=OUTBOUND&period=2026-08');
  const json = await res.json();
  const allRows = json.data.rows;
  const invoiceLines = allRows.filter(r => r.invoiceNo === targetNo);
  const head = invoiceLines[0];

  const payloadLines = invoiceLines.map(line => {
    let variantName = String(line.variantName || "").toUpperCase();
    let price = Number(line.unitPriceRp);
    // Revert prices back
    if (variantName.includes("PUTIH B 20X30")) price = 1300000;
    if (variantName.includes("PUTIH B 17X30")) price = 1175000;
    return {
       variantId: line.variantId,
       qty: Number(line.qty || line.qtyInput),
       inputUnit: line.unit || line.inputUnit,
       unitPriceRp: price
    };
  });

  const payload = {
      invoiceId: head.invoiceId,
      reason: "Revert salah koreksi A dan B",
      dateKey: head.dateKey,
      customerId: head.customerId,
      customerName: head.customerName,
      discountRp: Number(head.discountRp || 0),
      note: head.note || "",
      lines: payloadLines
  };

  const updateRes = await fetch('/api/rkn/plastic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'UPDATE_SALE', payload: payload })
  });
  console.log("REVERT SUCCESS:", await updateRes.json());
})();
