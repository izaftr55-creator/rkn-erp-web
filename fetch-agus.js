const http = require('http');

http.get('http://127.0.0.1:3000/api/rkn/plastic?view=DASHBOARD&period=2026-08', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
     try {
       const json = JSON.parse(data);
       const sales = json.data.sales || [];
       const agus = sales.find(s => s.invoiceNo.includes('A9E605'));
       if (!agus) {
          console.log('Agus not found');
          return;
       }
       console.log('Invoice ID:', agus.invoiceId);
       
       http.get('http://127.0.0.1:3000/api/rkn/plastic?view=SALE_DETAIL&invoiceId=' + agus.invoiceId, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => {
             const json2 = JSON.parse(data2);
             console.log(JSON.stringify(json2.data.lines, null, 2));
          });
       });
     } catch(e) { console.log('Err', e); }
  });
});
