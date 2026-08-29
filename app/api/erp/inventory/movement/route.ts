import { NextRequest, NextResponse } from 'next/server';
import { createB2BCore } from '@/cloudflare/core/b2bCore';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const sku = body.sku;
    const qty = body.qty;
    const movementType = body.movementType;
    const warehouseId = body.warehouseId;
    const note = body.note;

    // @ts-ignore
    const db = (req as any).env?.DB || (globalThis as any).DB;
    const b2bEngine = createB2BCore(db);

    const result = b2bEngine.recordManualMovement({
      sku,
      qty: Number(qty),
      movementType,
      warehouseId,
      note
    });

    console.log('[INVENTORY_ENGINE] Mutasi stok berhasil:', result.sku, result.delta);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[INVENTORY_ENGINE_ERROR]', error);
    return NextResponse.json({ error: 'Gagal mencatat mutasi stok' }, { status: 500 });
  }
}