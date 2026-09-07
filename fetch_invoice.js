fetch('http://127.0.0.1:3000/api/rkn/plastic?period=2026-08')
  .then(res => res.json())
  .then(data => {
     const inv = data.sales.find(s => s.invoiceNo === 'PTR-20260826-864117');
     console.log(inv);
  })
  .catch(err => console.error(err.message));
