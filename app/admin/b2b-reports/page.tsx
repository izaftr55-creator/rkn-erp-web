import React from 'react';

export default function B2BReportsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Laporan Operasional B2B</h1>
        <p className="text-gray-600 mt-1">Pantau stok akhir (Plastik & Thermal) dan daftar tagihan piutang pelanggan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TABEL 1: STOK AKHIR */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">📦 Stok Akhir Gudang</h2>
            <button className="text-sm bg-gray-100 px-3 py-1 rounded border hover:bg-gray-200">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-2 px-3 font-semibold text-sm text-gray-600">SKU / Produk</th>
                  <th className="py-2 px-3 font-semibold text-sm text-gray-600 text-right">Stok Fisik</th>
                  <th className="py-2 px-3 font-semibold text-sm text-gray-600">Satuan</th>
                </tr>
              </thead>
              <tbody>
                {/* Dummy row: Nantinya diisi dari API */}
                <tr className="border-b">
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-800">Plastik Hitam 15x25</p>
                    <p className="text-xs text-gray-500">HITAM-15x25</p>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-blue-600 text-lg">1.500</td>
                  <td className="py-3 px-3 text-gray-600">ROLL</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-800">Thermal Goldwin 100x150</p>
                    <p className="text-xs text-gray-500">THERMAL-GOLDWIN-100x150</p>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-blue-600 text-lg">120</td>
                  <td className="py-3 px-3 text-gray-600">STACK</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL 2: PIUTANG PELANGGAN */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">💰 Daftar Piutang (Belum Lunas)</h2>
            <button className="text-sm bg-gray-100 px-3 py-1 rounded border hover:bg-gray-200">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-2 px-3 font-semibold text-sm text-gray-600">Pelanggan</th>
                  <th className="py-2 px-3 font-semibold text-sm text-gray-600 text-right">Sisa Tagihan</th>
                  <th className="py-2 px-3 font-semibold text-sm text-gray-600 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Dummy row: Nantinya diisi dari API */}
                <tr className="border-b">
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-800">Toko Plastik Makmur</p>
                    <p className="text-xs text-gray-500">Jatuh Tempo: 05 Sep 2026</p>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-red-600">Rp 2.540.000</td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">UNPAID</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-800">CV Thermal Berkah</p>
                    <p className="text-xs text-gray-500">Jatuh Tempo: 10 Sep 2026</p>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-orange-600">Rp 2.200.000</td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">PARTIAL</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}