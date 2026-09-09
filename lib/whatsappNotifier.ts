/**
 * RKN WhatsApp Notification Helper
 * Sends non-blocking webhook notifications to RKN WA Gateway bot.
 */

export interface SaleNotificationPayload {
  invoiceNo: string;
  customerName: string;
  grandTotalRp: number;
  status: string;
  itemsSummary?: string;
  actorName?: string;
}

export interface InboundNotificationPayload {
  inboundNo: string;
  supplierName: string;
  dateKey: string;
  totalQtyBase?: number;
  itemsSummary?: string;
  actorName?: string;
}

export async function sendWaGroupMessage(message: string): Promise<boolean> {
  try {
    const gatewayUrl = process.env.WA_GATEWAY_URL;
    const apiKey = process.env.WA_GATEWAY_API_KEY || "rkn_secret_wa_token_2026";
    const groupId = process.env.WA_GROUP_ID;

    if (!gatewayUrl || !groupId) {
      // Gracefully skip if WA bot is not configured yet
      return false;
    }

    const cleanUrl = gatewayUrl.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/api/send-group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        groupId,
        message,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("WA_NOTIFICATION_FAILED:", err);
      return false;
    }

    return true;
  } catch (error: any) {
    console.warn("WA_NOTIFICATION_ERROR:", error?.message || error);
    return false;
  }
}

export async function notifySaleCreated(payload: SaleNotificationPayload) {
  const formattedRupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(payload.grandTotalRp);

  const text = [
    `??? *[PENJUALAN BARU - RKN ERP]*`,
    `No Invoice: *${payload.invoiceNo}*`,
    `Customer: ${payload.customerName || "-"}`,
    `Total: *${formattedRupiah}* (${payload.status})`,
    payload.itemsSummary ? `Barang: ${payload.itemsSummary}` : "",
    payload.actorName ? `Kasir: ${payload.actorName}` : "",
    `Waktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendWaGroupMessage(text);
}

export async function sendWaPersonalMessage(phone: string, message: string): Promise<boolean> {
  try {
    const gatewayUrl = process.env.WA_GATEWAY_URL;
    const apiKey = process.env.WA_GATEWAY_API_KEY || "rkn_secret_wa_token_2026";

    if (!gatewayUrl || !phone) return false;

    // Normalize phone number: remove non-digits, replace leading 0 with 62
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);
    
    if (!cleanPhone.endsWith("@s.whatsapp.net")) {
        cleanPhone = cleanPhone + "@s.whatsapp.net";
    }

    const cleanUrl = gatewayUrl.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/api/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        number: cleanPhone,
        message,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("WA_PERSONAL_FAILED:", err);
      return false;
    }

    return true;
  } catch (error: any) {
    console.warn("WA_PERSONAL_ERROR:", error?.message || error);
    return false;
  }
}
export async function notifyInboundReceived(payload: InboundNotificationPayload) {
  const text = [
    `?? *[BARANG MASUK - RKN ERP]*`,
    `No Surat Jalan / Ref: *${payload.inboundNo}*`,
    `Supplier: *${payload.supplierName}*`,
    `Tanggal: ${payload.dateKey}`,
    payload.totalQtyBase ? `Total Unit: *${payload.totalQtyBase.toLocaleString("id-ID")}*` : "",
    payload.itemsSummary ? `Rincian: ${payload.itemsSummary}` : "",
    payload.actorName ? `Penerima: ${payload.actorName}` : "",
    `Waktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendWaGroupMessage(text);
}
