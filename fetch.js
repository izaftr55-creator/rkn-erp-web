fetch('http://192.168.10.7:3000/api/rkn/plastic?period=2026-08&view=DASHBOARD')
  .then(res => res.json())
  .then(data => console.log('OK', data.omset))
  .catch(err => console.error(err.message));
