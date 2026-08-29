import { NextRequest, NextResponse } from 'next/server';
import { createB2BCore } from '@/cloudflare/core/b2bCore';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const customerId = body.customerId;
    const items = body.items;
    const paymentMethod = body.paymentMethod;
    
    // @ts-ignore
    const db = (req as any).env?.DB || (globalThis as any).DB;
    const b2bEngine = createB2BCore(db);

    const result = b2bEngine.processB2BOrder({
      customerId,
      items,
      paymentMethod
    });

    console.log('[B2B_ENGINE] Pesanan berhasil diproses:', result.orderId);

    return NextResponse.json({ 
      success: true, 
      orderId: result.orderId, 
      invoiceNumber: result.invoiceNumber, 
      totalAmount: result.totalAmount 
    }, { status: 200 });

  } catch (error) {
    console.error('[B2B_ENGINE_ERROR]', error);
    return NextResponse.json({ error: 'Gagal memproses pesanan B2B' }, { status: 500 });
  }
}