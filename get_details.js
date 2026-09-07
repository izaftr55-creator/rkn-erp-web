(async function() {
  for (let month of ['2026-07', '2026-08']) {
    const res = await fetch('/api/rkn/plastic?view=OUTBOUND&period=' + month);
    const json = await res.json();
    console.log(month, json.data?.rows?.length);
  }
})();
