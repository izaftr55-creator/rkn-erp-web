(async function() {
  for (let month of ['2026-07', '2026-08']) {
    const res = await fetch('http://localhost:3000/api/rkn/plastic?view=OUTBOUND&period=' + month);
    const json = await res.json();
    if (!json.data || !json.data.rows) continue;
    
    // Look for lines that equal 418500
    for(let r of json.data.rows) {
        if(r.lineTotalRp === 418500 || r.unitPriceRp === 418500) {
            console.log("Found 418500 in:", r);
        }
    }
  }
})();
