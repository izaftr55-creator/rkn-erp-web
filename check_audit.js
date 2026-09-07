fetch('http://127.0.0.1:3000/api/rkn/debug')
.then(res => res.json())
.then(data => {
   const logs = data.auditLog || [];
   const phases = logs.filter(l => l.reason.includes('PHASE'));
   console.log('RAN PHASES:');
   phases.forEach(l => console.log(l.reason, l.createdAt));
}).catch(console.error);
