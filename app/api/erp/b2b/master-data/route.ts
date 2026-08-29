import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: Connect ke rkn-erp-core.ts (Cloudflare D1 RPC) untuk query live database.
    // Saat ini kita kembalikan struktur data dummy yang identik dengan skema database.
    const data = {
      customers: [
        { customer_id: 'CUST-001', name: 'Toko Plastik Makmur', phone: '0812345678', type: 'TEMPO' },
        { customer_id: 'CUST-002', name: 'Toko Budi Grosir', phone: '0899123456', type: 'CASH' }
      ],
      products: [
        { sku: 'HITAM-15x25', name: 'Plastik Hitam 15x25', unit: 'ROLL', price: 17000 },
        { sku: 'PINK-17x30', name: 'Plastik Pink 17x30', unit: 'ROLL', price: 23500 },
        { sku: 'THERMAL-GOLDWIN-100x150', name: 'Thermal Goldwin 100x150', unit: 'STACK', price: 42000 },
        { sku: 'THERMAL-DPANJANG-100x150', name: 'Thermal Dus Panjang (Polos)', unit: 'STACK', price: 40000 }
      ]
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil master data B2B' }, { status: 500 });
  }
}