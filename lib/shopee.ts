import crypto from "crypto";
import {
  getShopeeConnection,
  ShopeeConnection,
  upsertShopeeConnection
} from "@/lib/marketplaceStore";

const DEFAULT_HOST = "https://partner.shopeemobile.com";

function config() {
  const partnerId = Number(process.env.SHOPEE_PARTNER_ID || 0);
  const partnerKey = process.env.SHOPEE_PARTNER_KEY || "";
  const host = process.env.SHOPEE_HOST || DEFAULT_HOST;
  const redirectUrl = process.env.SHOPEE_REDIRECT_URL || "";
  return { partnerId, partnerKey, host, redirectUrl };
}

export function getShopeeConfigStatus() {
  const { partnerId, partnerKey, host, redirectUrl } = config();
  return {
    partnerIdConfigured: partnerId > 0,
    partnerKeyConfigured: Boolean(partnerKey),
    redirectUrlConfigured: Boolean(redirectUrl),
    redirectUrl,
    host,
    ready: partnerId > 0 && Boolean(partnerKey) && Boolean(redirectUrl)
  };
}

function hmac(base: string, key: string) {
  return crypto.createHmac("sha256", key).update(base).digest("hex");
}

function publicSign(apiPath: string, timestamp: number) {
  const { partnerId, partnerKey } = config();
  return hmac(`${partnerId}${apiPath}${timestamp}`, partnerKey);
}

function privateSign(apiPath: string, timestamp: number, accessToken: string, shopId: number) {
  const { partnerId, partnerKey } = config();
  return hmac(`${partnerId}${apiPath}${timestamp}${accessToken}${shopId}`, partnerKey);
}

function ensureConfig() {
  const current = getShopeeConfigStatus();
  if (!current.ready) {
    throw new Error("Shopee belum dikonfigurasi. Isi SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, dan SHOPEE_REDIRECT_URL di .env.local.");
  }
}

export function createShopeeAuthUrl() {
  ensureConfig();
  const { partnerId, host, redirectUrl } = config();
  const apiPath = "/api/v2/shop/auth_partner";
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = publicSign(apiPath, timestamp);
  const url = new URL(`${host}${apiPath}`);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);
  url.searchParams.set("redirect", redirectUrl);
  return url.toString();
}

async function parseShopeeResponse(res: Response) {
  const raw = await res.text();
  let json: any;
  try { json = JSON.parse(raw); } catch { throw new Error(`Shopee mengembalikan respons non-JSON: ${raw.slice(0, 240)}`); }
  if (!res.ok || json?.error) {
    const detail = json?.message || json?.debug_message || json?.error || `HTTP ${res.status}`;
    throw new Error(`Shopee API: ${detail}`);
  }
  return json;
}

export async function exchangeShopeeCode(code: string, shopId: number) {
  ensureConfig();
  const { partnerId, host } = config();
  const apiPath = "/api/v2/auth/token/get";
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = publicSign(apiPath, timestamp);
  const url = new URL(`${host}${apiPath}`);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, shop_id: shopId, partner_id: partnerId }),
    cache: "no-store"
  });
  return parseShopeeResponse(res);
}

export async function refreshShopeeConnection(connection: ShopeeConnection) {
  ensureConfig();
  const { partnerId, host } = config();
  const apiPath = "/api/v2/auth/access_token/get";
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = publicSign(apiPath, timestamp);
  const url = new URL(`${host}${apiPath}`);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: connection.refreshToken,
      partner_id: partnerId,
      shop_id: connection.shopId
    }),
    cache: "no-store"
  });
  const json = await parseShopeeResponse(res);
  const now = Date.now();
  const updated: ShopeeConnection = {
    ...connection,
    accessToken: json.access_token,
    refreshToken: json.refresh_token || connection.refreshToken,
    expiresAt: now + Number(json.expire_in || 14400) * 1000,
    updatedAt: new Date().toISOString()
  };
  upsertShopeeConnection(updated);
  return updated;
}

export async function getFreshShopeeConnection(storeId: string) {
  const connection = getShopeeConnection(storeId);
  if (!connection) throw new Error("Toko Shopee ini belum dihubungkan.");
  if (connection.expiresAt > Date.now() + 5 * 60 * 1000) return connection;
  return refreshShopeeConnection(connection);
}

export async function shopeeGet(apiPath: string, connection: ShopeeConnection, params: Record<string, string | number | boolean> = {}) {
  const { partnerId, host } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = privateSign(apiPath, timestamp, connection.accessToken, connection.shopId);
  const url = new URL(`${host}${apiPath}`);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);
  url.searchParams.set("access_token", connection.accessToken);
  url.searchParams.set("shop_id", String(connection.shopId));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const res = await fetch(url, { cache: "no-store" });
  return parseShopeeResponse(res);
}

export async function getShopeeItemIds(connection: ShopeeConnection) {
  const statuses = ["NORMAL", "UNLIST", "BANNED"];
  const byId = new Map<number, { item_id: number; item_status: string; update_time?: number }>();
  for (const itemStatus of statuses) {
    let offset = 0;
    let hasNext = true;
    while (hasNext) {
      const json = await shopeeGet("/api/v2/product/get_item_list", connection, {
        offset,
        page_size: 100,
        item_status: itemStatus
      });
      const response = json.response || {};
      for (const item of response.item || []) byId.set(Number(item.item_id), item);
      hasNext = Boolean(response.has_next_page);
      offset = Number(response.next_offset ?? offset + 100);
      if (byId.size > 10000) throw new Error("Pengaman ERP: jumlah listing melebihi 10.000 item.");
    }
  }
  return Array.from(byId.values());
}

export async function getShopeeItemBaseInfo(connection: ShopeeConnection, itemId: number) {
  const json = await shopeeGet("/api/v2/product/get_item_base_info", connection, {
    item_id_list: itemId,
    need_tax_info: false,
    need_complaint_policy: false
  });
  return (json.response?.item_list || [])[0] || null;
}

export async function getShopeeModelList(connection: ShopeeConnection, itemId: number) {
  const json = await shopeeGet("/api/v2/product/get_model_list", connection, { item_id: itemId });
  return json.response || { tier_variation: [], model: [] };
}

export function getModelName(model: any, tierVariation: any[]) {
  if (model?.model_name) return String(model.model_name);
  const indexes = Array.isArray(model?.tier_index) ? model.tier_index : [];
  return indexes
    .map((optionIndex: number, tierIndex: number) => {
      const option = tierVariation?.[tierIndex]?.option_list?.[optionIndex];
      return option?.option || option?.option_name || option?.name || "";
    })
    .filter(Boolean)
    .join(" / ");
}

export function pickPrice(source: any) {
  const list = Array.isArray(source?.price_info) ? source.price_info : [];
  const row = list[0] || {};
  return row.current_price ?? row.original_price ?? row.inflated_price_of_current_price ?? "";
}

export function pickStock(source: any) {
  const stockInfo = Array.isArray(source?.stock_info) ? source.stock_info : [];
  for (const row of stockInfo) {
    if (row?.current_stock != null) return row.current_stock;
    if (row?.normal_stock != null) return row.normal_stock;
    if (Array.isArray(row?.seller_stock) && row.seller_stock[0]?.stock != null) return row.seller_stock[0].stock;
  }
  if (Array.isArray(source?.seller_stock)) {
    return source.seller_stock.reduce((sum: number, row: any) => sum + Number(row?.stock || 0), 0);
  }
  return "";
}
