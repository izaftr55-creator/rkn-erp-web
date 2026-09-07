fetch('http://127.0.0.1:3000/api/rkn/business-engine/shadow-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        sql: "SELECT variant_id, default_sell_price_base_rp, qty_per_ball FROM plastic_master"
    })
}).then(r => r.text()).then(console.log);
