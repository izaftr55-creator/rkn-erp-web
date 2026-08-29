import { NextRequest, NextResponse } from "next/server";
import type { RknRawIntegrationEvent } from "@/lib/integrations/contracts";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const receivedTimestamp = new Date().toISOString();

    // 1. Verifikasi Signature Shopee (TODO: Implementasi HMAC menggunakan App Secret)
    // Shopee akan mengirimkan signature di header, kita harus memvalidasinya agar aman.
    const signature = req.headers.get("authorization") || req.headers.get("x-shopee-signature");
    
    // 2. Normalisasi Event menjadi Canonical Raw Event
    // Sesuai aturan handoff, ini adalah fase RAW_EVENT sebelum memicu transaksi bisnis.
    const rawEvent: RknRawIntegrationEvent = {
      provider: "SHOPEE",
      // Kita gunakan kombinasi timestamp dan shop_id sebagai temporary idempotency key awal
      eventKey: "SHP_RAW_" + ((payload as any).shop_id || "shop") + "_" + ((payload as any).timestamp || Date.now()),
      eventType: (payload as any).code ? String((payload as any).code) : "UNKNOWN_WEBHOOK_EVENT",
      occurredAt: (payload as any).timestamp ? new Date((payload as any).timestamp * 1000).toISOString() : receivedTimestamp,
      receivedAt: receivedTimestamp,
      storeId: (payload as any).shop_id ? String((payload as any).shop_id) : undefined,
      payload: payload,
    };

    // 3. Simpan ke sistem (Log Audit / Edge Storage)
    // Saat ini kita catat untuk memastikan event masuk. 
    // Pada Priority 2, data ini akan didorong ke Automation Control Center & Review Queue.
    console.log("[RKN_GATEWAY] Menerima Raw Event Shopee:", JSON.stringify(rawEvent, null, 2));

    // 4. Selalu kembalikan 200 OK dengan cepat
    // Marketplace bisa memutus koneksi atau memicu retry loop jika ERP merespons terlalu lama.
    return NextResponse.json({ message: "RKN_RAW_EVENT_RECEIVED" }, { status: 200 });

  } catch (error) {
    console.error("[RKN_GATEWAY_ERROR] Gagal memproses webhook Shopee:", error);
    // Kita tetap kembalikan 200 untuk payload yang cacat agar Shopee tidak melakukan retry terus-menerus
    // untuk event yang memang invalid dari awal.
    return NextResponse.json({ error: "RKN_PAYLOAD_PARSE_ERROR" }, { status: 200 });
  }
}
