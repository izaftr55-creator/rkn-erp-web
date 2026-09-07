fetch('http://127.0.0.1:3000/api/rkn/debug')
.then(res => res.json())
.then(data => {
   const movs = data.inventoryMovement || [];
   const thermal = movs.filter(m => m.variantId === 'PL-THERMAL-THERMAL-DUS-PANJANG-TANPA-MERK');
   console.log('Thermal Dus Panjang movements:');
   thermal.forEach(m => console.log(m.dateKey, m.movementType, m.qtyBase));
}).catch(console.error);
