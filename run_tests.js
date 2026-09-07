const http = require('http');

http.get('http://localhost:3000/api/rkn/plastic', (r) => {
   console.log('plastic status:', r.statusCode);
   
   http.get('http://localhost:3000/api/rkn/debug', (r2) => {
      let body = '';
      r2.on('data', d => body += d);
      r2.on('end', () => {
         const data = JSON.parse(body);
         const phases = data.auditLog ? data.auditLog.filter(l => l.reason.includes('PHASE')) : [];
         console.log('RAN PHASES:', phases.map(p => p.reason).join(', '));
      });
   });
});
