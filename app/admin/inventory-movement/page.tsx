import React from 'react';

export default function InventoryMovementPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">In / Out Barang (Mutasi Stok)</h1>
        <p className="text-gray-600 mt-1">Gunakan form ini untuk mencatat stok masuk dari supplier atau penyesuaian barang keluar/rusak.</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pergerakan</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500">
              <option value="IN">Stok Masuk (IN - Tambah Stok)</option>
              <option value="OUT">Stok Keluar (OUT - Kurangi Stok)</option>
              <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk / SKU</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm p-3 border">
              <option>-- Pilih Produk Plastik / Thermal --</option>
              <option value="HITAM-15x25">HITAM-15x25 (Plastik Hitam 15x25)</option>
              <option value="THERMAL-GOLDWIN-100x150">THERMAL-GOLDWIN-100x150</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Qty)</label>
            <input 
              type="number" 
              min="1"
              placeholder="Masukkan jumlah..." 
              className="w-full border-gray-300 rounded-md shadow-sm p-3 border"
            />
            <p className="text-xs text-gray-500 mt-1">Pastikan menggunakan Base Unit (misal: Roll / Stack)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gudang / Lokasi</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm p-3 border">
              <option value="WH-UTAMA">Gudang Utama RKN</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Alasan</label>
          <textarea 
            rows={3}
            placeholder="Misal: Barang retur, stok masuk dari pabrik, barang rusak..." 
            className="w-full border-gray-300 rounded-md shadow-sm p-3 border"
          />
        </div>

        <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-bold hover:bg-blue-700">
          Catat Pergerakan Stok
        </button>
      </div>
    </div>
  );
}