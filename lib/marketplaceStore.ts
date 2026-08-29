import fs from "fs";
import path from "path";

export type ShopeeConnection = {
  storeId: string;
  shopId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  connectedAt: string;
  updatedAt: string;
};

export type MarketplaceSnapshotRow = {
  STORE_ID: string;
  PLATFORM: "SHOPEE";
  SHOP_ID: number;
  ITEM_ID: number;
  ITEM_NAME: string;
  ITEM_STATUS: string;
  ITEM_SKU: string;
  HAS_MODEL: boolean;
  MODEL_ID: number;
  MODEL_NAME: string;
  MODEL_SKU: string;
  PRICE: number | string;
  STOCK: number | string;
  SYNCED_AT: string;
};

type StoreData = {
  pendingStoreId?: string;
  connections: ShopeeConnection[];
};

const dataDir = path.join(process.cwd(), ".data");
const connectionFile = path.join(dataDir, "shopee-connections.json");
const snapshotFile = path.join(dataDir, "marketplace-snapshots.json");

function ensureDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  ensureDir();
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(temp, file);
}

export function readShopeeStoreData(): StoreData {
  ensureDir();
  return readJson<StoreData>(connectionFile, { connections: [] });
}

export function setPendingShopeeStore(storeId: string) {
  const data = readShopeeStoreData();
  data.pendingStoreId = storeId;
  writeJson(connectionFile, data);
}

export function consumePendingShopeeStore() {
  const data = readShopeeStoreData();
  const storeId = data.pendingStoreId || "";
  delete data.pendingStoreId;
  writeJson(connectionFile, data);
  return storeId;
}

export function upsertShopeeConnection(connection: ShopeeConnection) {
  const data = readShopeeStoreData();
  const index = data.connections.findIndex((row) => row.storeId === connection.storeId);
  if (index >= 0) data.connections[index] = connection;
  else data.connections.push(connection);
  writeJson(connectionFile, data);
}

export function getShopeeConnection(storeId: string) {
  return readShopeeStoreData().connections.find((row) => row.storeId === storeId);
}

export function getShopeeConnections() {
  return readShopeeStoreData().connections;
}

export function replaceStoreSnapshot(storeId: string, rows: MarketplaceSnapshotRow[]) {
  const existing = readMarketplaceSnapshot();
  const next = existing.filter((row) => row.STORE_ID !== storeId).concat(rows);
  writeJson(snapshotFile, next);
}

export function readMarketplaceSnapshot() {
  ensureDir();
  return readJson<MarketplaceSnapshotRow[]>(snapshotFile, []);
}
