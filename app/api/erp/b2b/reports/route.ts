import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: Connect ke D1 Database via rkn-erp-core.ts
    // Rencana Query Database yang akan dieksekusi:
    
    // 1. Query Stok Akhir (Join tabel current_stock dan products)
    /*
      SELECT p.sku, p.product_name, p.unit, cs.qty_on_hand 
      FROM products p 
      LEFT JOIN current_stock cs ON p.sku = cs.sku 
      WHERE p.category IN ('Plastik Kemasan', 'Thermal');
    */

    // 2. Query Piutang Pelanggan
    /*
      SELECT debt_id, counterparty_name, amount_total, amount_paid, status, due_date 
      FROM trade_debts 
      WHERE debt_type = 'RECEIVABLE' AND status != 'PAID';
    */

    // Dummy data sementara untuk memvalidasi UI sebelum disambung ke query live
    const data = {
      stocks: [
        { sku: 'HITAM-15x25', name: 'Plastik Hitam 15x25', unit: 'ROLL', qtyOnHand: 1500 },
        { sku: 'PINK-17x30', name: 'Plastik Pink 17x30', unit: 'ROLL', qtyOnHand: 450 },
        { sku: 'THERMAL-GOLDWIN-100x150', name: 'Thermal Goldwin 100x150', unit: 'STACK', qtyOnHand: 120 },
      ],
      receivables: [
        { debtId: 'DBT-001', customer: 'Toko Plastik Makmur', total: 2540000, paid: 0, status: 'UNPAID', dueDate: '2026-09-05' },
        { debtId: 'DBT-002', customer: 'CV Thermal Berkah', total: 4200000, paid: 2000000, status: 'PARTIAL', dueDate: '2026-09-10' }
      ]
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat laporan' }, { status: 500 });
  }
}