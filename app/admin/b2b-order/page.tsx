'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function B2BOrderPage() {
  const router = useRouter();
  const [customerId] = useState('CUST-001');
  const [paymentMethod, setPaymentMethod] = useState('TEMPO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cart] = useState([
    { sku: 'HITAM-15x25', name: 'Plastik Hitam 15x25', qty: 100, price: 17000 },
    { sku: 'THERMAL-GOLDWIN-100x150', name: 'Thermal Goldwin 100x150', qty: 20, price: 42000 }
  ]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/erp/b2b/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, paymentMethod, items: cart, totalAmount })
      });

      const data: any = await res.json();
      
      if (data.success) {
        alert('✅ Pesanan Berhasil Disimpan! Invoice: ' + data.invoiceNumber);
        router.push('/admin/b2b-invoice/' + data.orderId);
      } else {
        alert('❌ Gagal: ' + data.error);
      }
    } catch (err) {
      alert('❌ Terjadi kesalahan jaringan / server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-800">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Kasir B2B (Live Mode)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#1A1F2E] p-6 rounded-lg shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-200">Keranjang Belanja</h2>
          
          <table className="w-full text-left border-collapse text-gray-300">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2">Produk</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Harga</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="py-4 font-medium">{item.name} <br/><span className="text-xs text-gray-500">{item.sku}</span></td>
                  <td className="py-4">{item.qty}</td>
                  <td className="py-4">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="py-4 text-right font-bold">Rp {(item.qty * item.price).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#1A1F2E] p-6 rounded-lg shadow border border-gray-700 h-fit">
          <h2 className="text-xl font-bold mb-6 text-gray-200">Ringkasan</h2>
          
          <div className="flex justify-between mb-6 pb-4 border-b border-gray-700 text-gray-200">
            <span>Total Tagihan</span>
            <span className="font-bold text-xl text-green-400">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Metode Pembayaran</label>
            <select 
              className="w-full bg-gray-800 border-gray-600 text-white rounded p-3 focus:ring-blue-500"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="LUNAS">Cash / Lunas</option>
              <option value="TEMPO">Tempo (Masuk Piutang)</option>
            </select>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
          >
            {isSubmitting ? 'Memproses ke Database...' : 'Simpan & Cetak Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}