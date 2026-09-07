const { getPlatformProxy } = require('wrangler');
(async () => {
  const proxy = await getPlatformProxy({ configPath: 'wrangler.jsonc' });
  try {
     const stub = proxy.env.RKN_ERP_CORE.getByName('rkn-f8c-local-only');
     const res = await stub.fetch('http://do/api/rpc/kernelStatus');
     console.log('Status:', res.status);
     const text = await res.text();
     console.log('Body:', text);
  } catch(e) {
     console.log('Error:', e);
  }
  process.exit(0);
})();
