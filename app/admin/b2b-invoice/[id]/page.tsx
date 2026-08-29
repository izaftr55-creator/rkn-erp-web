import React from 'react';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:bg-white print:py-0">
      {/* Container A4 */}
      <div className="max-w-[21cm] min-h-[29.7cm] mx-auto bg-white p-12 shadow-lg print:shadow-none print:p-0">
        
        {/* Header Invoice */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">RKN ERP</h1>
            <p className="text-gray-500 mt-1">Multi-Marketplace & Wholesale Operations</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest">INVOICE</h2>
            <p className="text-gray-600 mt-2 font-medium">#{orderId.toUpperCase()}</p>
            <p className="text-gray-500 text-sm">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Info Pelanggan & Status */}
        <div className="flex justify-between mb-10">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Ditagihkan Kepada:</h3>
            <p className="text-lg font-bold text-gray-800">Toko Plastik Makmur</p>
            <p className="text-gray-600">Jl. Perdagangan No. 123</p>
            <p className="text-gray-600">Telp: 0812345678</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Status Pembayaran:</h3>
            <div className="inline-block px-4 py-2 rounded-md font-bold text-lg bg-red-100 text-red-700 border border-red-200 print:border-2">
              BELUM LUNAS (TEMPO)
            </div>
            <p className="text-sm text-gray-500 mt-2">Jatuh Tempo: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Tabel Barang */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-gray-800">
              <th className="py-3 px-4 font-semibold text-sm">Deskripsi Produk</th>
              <th className="py-3 px-4 font-semibold text-sm text-center">Qty</th>
              <th className="py-3 px-4 font-semibold text-sm text-right">Harga Satuan</th>
              <th className="py-3 px-4 font-semibold text-sm text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4">
                <p className="font-bold text-gray-800">Plastik Hitam 15x25</p>
                <p className="text-xs text-gray-500">SKU: HITAM-15x25</p>
              </td>
              <td className="py-4 px-4 text-center text-gray-700">100 ROLL</td>
              <td className="py-4 px-4 text-right text-gray-700">Rp 17.000</td>
              <td className="py-4 px-4 text-right font-bold text-gray-800">Rp 1.700.000</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4">
                <p className="font-bold text-gray-800">Thermal Goldwin 100x150</p>
                <p className="text-xs text-gray-500">SKU: THERMAL-GOLDWIN-100x150</p>
              </td>
              <td className="py-4 px-4 text-center text-gray-700">20 STACK</td>
              <td className="py-4 px-4 text-right text-gray-700">Rp 42.000</td>
              <td className="py-4 px-4 text-right font-bold text-gray-800">Rp 840.000</td>
            </tr>
          </tbody>
        </table>

        {/* Ringkasan Total */}
        <div className="flex justify-end">
          <div className="w-1/2">
            <div className="flex justify-between py-2 text-gray-600">
              <span>Subtotal</span>
              <span>Rp 2.540.000</span>
            </div>
            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-300 mb-2">
              <span>Pajak (0%)</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between py-2 text-2xl font-bold text-gray-900">
              <span>TOTAL TAGIHAN</span>
              <span>Rp 2.540.000</span>
            </div>
          </div>
        </div>

        {/* Footer / Tombol Aksi (Disembunyikan saat di-print) */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-gray-500 text-sm text-center print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-gray-800 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-700 shadow-md"
          >
            🖨️ Cetak Invoice (Ctrl + P)
          </button>
          <p className="mt-4">Dokumen ini dihasilkan secara otomatis oleh sistem RKN ERP.</p>
        </div>
      </div>
    </div>
  );
}