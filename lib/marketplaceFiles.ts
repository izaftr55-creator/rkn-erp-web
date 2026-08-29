import * as XLSX from "xlsx";
import JSZip from "jszip";

export type GenericRow = Record<string, string | number | boolean>;
export type MarketplacePlatform = "SHOPEE" | "TIKTOK" | "UNKNOWN";
export type MappingStatus = "READY" | "REVIEW" | "BLOCKED" | "ARCHIVED";
export type InventoryStatus = "READY" | "WAITING_ALLOCATION" | "RANDOM_SUGGESTION" | "REVIEW" | "BLOCKED" | "ARCHIVED";
export type BundleRecipeType = "SINGLE" | "FIXED_COMBINATION" | "SAME_COLOR_MULTIPACK" | "PARTIAL_ALLOCATION" | "FREE_CHOICE" | "RANDOM" | "UNKNOWN";

export type MappingRow = {
  FILE_ID: string;
  FILE_NAME: string;
  STORE_ID: string;
  PLATFORM: MarketplacePlatform;
  EXCEL_ROW: number;
  PRODUCT_ID: string;
  PRODUCT_NAME: string;
  VARIATION_ID: string;
  VARIATION_NAME: string;
  CURRENT_PARENT_SKU: string;
  CURRENT_SKU: string;
  PRODUCT_FAMILY: string;
  SUGGESTED_PARENT_SKU: string;
  SUGGESTED_SKU: string;
  MATCH_STATUS: MappingStatus;
  CONFIDENCE: number;
  CHANGE: "YES" | "NO";
  REASON: string;
  PRICE: string;
  STOCK: string;
  BUNDLE_QTY: number;
  BUNDLE_TYPE: BundleRecipeType;
  DETECTED_COLORS: string;
  COMPONENT_SKUS: string;
  COMPONENT_DETAIL: string;
  INVENTORY_STATUS: InventoryStatus;
  FULFILLMENT_ACTION: string;
  INVENTORY_REASON: string;
};

export type ImportedMarketplaceFile = {
  id: string;
  file: File;
  fileName: string;
  sourceContainerName: string;
  sourceKind: "XLSX" | "TIKTOK_ZIP";
  sheetName: string;
  platform: MarketplacePlatform;
  storeId: string;
  storeFingerprint: string;
  storeDetection: "AUTO" | "MANUAL" | "UNKNOWN" | "CONFLICT";
  storeConfidence: number;
  detectionReason: string;
  header: string[];
  columns: {
    productId: number;
    productName: number;
    variationId: number;
    variationName: number;
    parentSku: number;
    sellerSku: number;
    price: number;
    stock: number;
  };
  rows: MappingRow[];
};

const aliasReplacements: Array<[RegExp, string]> = [
  [/\bn[àa]vy\b/g, "navy"],
  [/\bnevy\b/g, "navy"],
  [/\bmarun\b/g, "maroon"],
  [/\bmaoon\b/g, "maroon"],
  [/\bburgundi\b/g, "burgundy"],
  [/\bbergundi\b/g, "burgundy"],
  [/\bmokka\b/g, "mocca"],
  [/\bmoka\b/g, "mocca"],
  [/\bmoca\b/g, "mocca"],
  [/\bhanzel\b/g, "hazel"],
  [/\bhanz\b/g, "hazel"],
  [/\bhanze\b/g, "hazel"],
  [/\bhezel\b/g, "hazel"],
  [/\bhazelnut\b/g, "hazel"],
  [/\babumuda\b/g, "abu muda"],
  [/\bdrak\s*choko\b/g, "dark choco"],
  [/\bdarkgrey\b/g, "abu tua"],
  [/\bijobotol\b/g, "hijau botol"],
  [/\bbottle\b/g, "hijau botol"],
  [/\bllilac\b/g, "lilac"],
  [/\bkahaki\b/g, "khaki"],
  [/\bdarkcoklat\b/g, "dark choco"],
  [/\bchoko\b/g, "dark choco"],
  [/\bcoksu\s+cream\b/g, "coksu"],
  [/\babutua\b/g, "abu tua"],
  [/\babu\s*tua\b/g, "abu tua"],
  [/\bdustypink\b/g, "dusty pink"],
  [/\bcoktung\b/g, "dark choco"],
  [/\bcok\s*tung\b/g, "dark choco"],
  [/\bjotol\b/g, "hijau botol"],
  [/\bb\.?w\.?\b/g, "broken white"],
  [/\bputih tulang\b/g, "broken white"],
  [/\bhijau botol tua\b/g, "hijau botol"],
  [/\bdark\s*choko\b/g, "dark choco"],
  [/\bsillver\b/g, "silver"],
  [/\bmustrad\b/g, "mustard"],
  [/\bbotle\b/g, "hijau botol"],
  [/\bijo\s*botol\b/g, "hijau botol"],
  [/\bhijau\s*bottol\b/g, "hijau botol"],
  [/\bgreen\s*botol\b/g, "hijau botol"],
  [/\bmocaa\b/g, "mocca"],
  [/\bdusy\b/g, "dusty pink"],
  [/\bhitan\b/g, "hitam"],
  [/\bhtam\b/g, "hitam"],
  [/\bd[\'’]?asti\b/g, "dusty pink"],
  [/\bdasty\b/g, "dusty pink"],
  [/\bpasmina\b/g, "pashmina"],
  [/\bpastan\b/g, "pashmina instan"],
  [/\bsoft\s*pad\b/g, "softpad"],
  [/\banti\s*budek\b/g, "anti budeg"],
  [/\bantibudeg\b/g, "anti budeg"],
  [/\bturky\b/g, "turki"],
  [/\bsegi\s*tiga\b/g, "segitiga"],
  [/\bscrunchies\b/g, "scrunchie"],
  [/\bscrunchy\b/g, "scrunchie"],
  [/\bnon\s*pet\b/g, "nonpet"],
  [/\bdarck\s*choko\b/g, "dark choco"],
  [/\babu\s*sliver\b/g, "silver"],
  [/\blaveder\b/g, "lavender"],
  [/\blkme\b/g, "lime"],
  [/\bcof+e+\b/g, "kopi"],
  [/\bcoffee\b/g, "kopi"],
  [/\bcoktu\s*coklt\s*prmuka\b/g, "coklat pramuka"],
  [/\bcoklat\s*prmuka\b/g, "coklat pramuka"],
  [/\bputih\s*bw\b/g, "broken white"],
  [/\babu\s*denim\b/g, "denim"],
  [/\bterakota\b/g, "teracotta"],
];

export function normalize(value: unknown) {
  let text = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[|/\\()\[\]{}_.:,+;&-]+/g, " ")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  for (const [pattern, replacement] of aliasReplacements) text = text.replace(pattern, replacement);
  return text.replace(/\s+/g, " ").trim();
}

function headerIndex(header: string[], names: string[]) {
  const normalized = header.map((h) => normalize(h).replace(/\s+/g, "_"));
  for (const name of names) {
    const target = normalize(name).replace(/\s+/g, "_");
    const i = normalized.indexOf(target);
    if (i >= 0) return i;
  }
  return -1;
}

function detectPlatform(header: string[]): MarketplacePlatform {
  if (headerIndex(header, ["et_title_product_id"]) >= 0) return "SHOPEE";
  if (headerIndex(header, ["product_id"]) >= 0 && headerIndex(header, ["seller_sku"]) >= 0) return "TIKTOK";
  return "UNKNOWN";
}

export const SHOPEE_STORE_REGISTRY: Record<string, string> = {
  "195744314": "STR-SHP-01", // RKN Hijab Official
  "1051420542": "STR-SHP-02", // erkaenscarf
  "1638485353": "STR-SHP-03", // erkaenveil
  "19860076": "STR-SHP-04", // jenna_collection09
  "624068340": "STR-SHP-05", // Orviellé ID
};

const TIKTOK_HANDLE_REGISTRY: Array<{ handle: string; storeId: string; label: string }> = [
  { handle: "rknhijab", storeId: "STR-TTK-01", label: "RKN Hijab" },
  { handle: "kharismahijab3", storeId: "STR-TTK-02", label: "Kharisma Hijab" },
  { handle: "erkaenveil", storeId: "STR-TTK-03", label: "erkaenveil" },
];

type StoreDetection = {
  storeId: string;
  fingerprint: string;
  status: "AUTO" | "UNKNOWN" | "CONFLICT";
  confidence: number;
  reason: string;
};

function activeStoreExists(stores: GenericRow[], storeId: string) {
  return stores.some((s) => String(s.STORE_ID) === storeId && String(s.STATUS || "ACTIVE").toUpperCase() === "ACTIVE");
}

async function readSharedStringsText(file: File) {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file("xl/sharedStrings.xml");
    return entry ? await entry.async("text") : "";
  } catch {
    return "";
  }
}

function detectShopeeStore(fileName: string, sharedStrings: string, stores: GenericRow[]): StoreDetection {
  const match = fileName.match(/mass_update_(?:sales|basic)_info_(\d+)_/i) || fileName.match(/(?:^|_)(\d{7,12})(?:_|\.)/);
  const fingerprint = match?.[1] || "";
  if (!fingerprint) return { storeId: "", fingerprint: "", status: "UNKNOWN", confidence: 0, reason: "Fingerprint ID Shopee tidak ditemukan pada nama file" };

  const storeId = SHOPEE_STORE_REGISTRY[fingerprint] || "";
  if (!storeId || !activeStoreExists(stores, storeId)) {
    return { storeId: "", fingerprint, status: "UNKNOWN", confidence: 0, reason: `Fingerprint Shopee ${fingerprint} belum terdaftar` };
  }

  // Shopee menaruh ID yang sama di sharedStrings. Ini menjadi double-check agar file tidak salah akun.
  if (!sharedStrings.includes(fingerprint)) {
    return { storeId: "", fingerprint, status: "CONFLICT", confidence: 0, reason: `ID nama file ${fingerprint} tidak ditemukan di metadata internal XLSX` };
  }

  return { storeId, fingerprint, status: "AUTO", confidence: 100, reason: `Fingerprint Shopee ${fingerprint} cocok di nama file + metadata internal XLSX` };
}

function detectTikTokStore(sharedStrings: string, matrix: string[][], stores: GenericRow[]): StoreDetection {
  const raw = sharedStrings || matrix.slice(0, 600).flat().join(" ");
  const lower = raw.toLowerCase();
  const hits = TIKTOK_HANDLE_REGISTRY.map((r) => {
    const escaped = r.handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const urlRe = new RegExp(`tokopedia\\.com/${escaped}/`, "g");
    const count = (lower.match(urlRe) || []).length;
    return { ...r, count };
  }).filter((r) => r.count > 0 && activeStoreExists(stores, r.storeId));

  if (hits.length) {
    hits.sort((a, b) => b.count - a.count);
    const best = hits[0];
    const second = hits[1];
    if (second && second.count === best.count) {
      return { storeId: "", fingerprint: "", status: "CONFLICT", confidence: 0, reason: `Ditemukan lebih dari satu handle toko TikTok dengan skor sama: ${best.handle}, ${second.handle}` };
    }
    return {
      storeId: best.storeId,
      fingerprint: `tokopedia.com/${best.handle}/`,
      status: "AUTO",
      confidence: 100,
      reason: `Handle katalog TikTok terdeteksi: tokopedia.com/${best.handle}/ (${best.count} link)`,
    };
  }

  // Fallback jika suatu template TikTok tidak lagi menyertakan public product URL.
  const normalized = normalize(raw);
  if (normalized.includes("erkaenveil") && activeStoreExists(stores, "STR-TTK-03")) {
    return { storeId: "STR-TTK-03", fingerprint: "TITLE:ERKAENVEIL", status: "AUTO", confidence: 92, reason: "Fallback judul/deskripsi berulang mengandung Erkaenveil" };
  }
  if ((normalized.includes("rkn hijab") || normalized.includes("rkn hijab official")) && activeStoreExists(stores, "STR-TTK-01")) {
    return { storeId: "STR-TTK-01", fingerprint: "TITLE:RKN_HIJAB", status: "AUTO", confidence: 90, reason: "Fallback judul/deskripsi berulang mengandung RKN Hijab" };
  }
  return { storeId: "", fingerprint: "", status: "UNKNOWN", confidence: 0, reason: "Handle toko TikTok belum dikenali dari isi XLSX" };
}

export function detectStoreId(fileName: string, platform: MarketplacePlatform, stores: GenericRow[]) {
  const n = normalize(fileName);
  const candidates = stores.filter((s) => normalize(s.PLATFORM) === normalize(platform));
  const aliases: Array<[string[], string]> = [
    [["rkn hijab", "rkn_hijab", "rkn"], platform === "SHOPEE" ? "STR-SHP-01" : "STR-TTK-01"],
    [["kharisma", "erkaenscarf"], platform === "SHOPEE" ? "STR-SHP-02" : "STR-TTK-02"],
    [["erkaenveil"], platform === "SHOPEE" ? "STR-SHP-03" : "STR-TTK-03"],
    [["jenna"], "STR-SHP-04"],
    [["orvielle", "orvielle", "orviel"], "STR-SHP-05"],
  ];
  for (const [keys, id] of aliases) {
    if (keys.some((k) => n.includes(normalize(k))) && candidates.some((s) => String(s.STORE_ID) === id)) return id;
  }
  const byName = candidates.find((s) => n.includes(normalize(s.STORE_NAME)));
  return byName ? String(byName.STORE_ID) : "";
}

function detectQty(title: string, variation: string) {
  const source = `${normalize(title)} ${normalize(variation)}`;
  const patterns = [
    /(?:paket|isi|bundling|bundle|hemat)\s*(?:isi\s*)?(\d+)\s*(?:pcs|pc)?\b/,
    /\b(\d+)\s*(?:pcs|pc)\b/,
  ];
  for (const p of patterns) {
    const m = source.match(p);
    if (m) {
      const n = Number(m[1]);
      if (n >= 2 && n <= 20) return n;
    }
  }
  return 1;
}

function bundleQtyFromSku(...values: string[]) {
  for (const raw of values) {
    const value = stripMarketplaceSkuPrefix(raw);
    if (!value) continue;
    const m = value.match(/(?:^|-)PKT-[A-Z0-9-]+?-(\d+)(?:-|$)/) || value.match(/^PKT-[A-Z0-9-]+?-(\d+)(?:-|$)/);
    if (m) {
      const n = Number(m[1]);
      if (n >= 2 && n <= 20) return n;
    }
    const loose = value.match(/\b(\d+)\s*PCS\b/);
    if (loose) {
      const n = Number(loose[1]);
      if (n >= 2 && n <= 20) return n;
    }
  }
  return 1;
}

function sizeHint(text: string) {
  const n = normalize(text);
  if (/\b(?:size\s*)?(?:xl|jumbo)\b/.test(n) || /\bjumbo\b/.test(n)) return "JUMBO";
  if (/\b(?:size\s*)?s\b/.test(n) || /nonpet\s*size\s*s/.test(n)) return "S";
  if (/\b(?:size\s*)?l\b/.test(n)) return "L";
  if (/\b(?:size\s*)?m\b/.test(n) || /\bsport\s*m\b/.test(n) || /\bmedium\b/.test(n)) return "M";
  return "";
}

type FamilyCandidate = { family: string; score: number; reasons: string[] };

const LEGACY_SKU_HINTS: Array<{ pattern: RegExp; family: string; weight: number; label: string }> = [
  { pattern: /^CMT(?:-|$)/, family: "CPT", weight: 70, label: "legacy CMT" },
  { pattern: /^CMP(?:-|$)/, family: "CPD", weight: 58, label: "legacy CMP" },
  { pattern: /^(?:PJ-OVL|PJOVL|PSM-J)(?:-|$)/, family: "PSM-J", weight: 82, label: "legacy Pashmina Jumbo" },
  { pattern: /^PST-OVL(?:-|$)/, family: "PSM-OVL", weight: 96, label: "legacy Pastan/Pashmina Oval" },
  { pattern: /^RND-SCR-J(?:-|$)/, family: "SCR-J", weight: 95, label: "legacy Random Scrunchie Jumbo" },
  { pattern: /^RND-SCR-M(?:-|$)/, family: "SCR-M", weight: 95, label: "legacy Random Scrunchie Medium" },
  { pattern: /^MBTC(?:-|$)/, family: "CPD-AB", weight: 97, label: "legacy Marsha Kuping/MBTC" },
  { pattern: /^CMK(?:-|$)/, family: "CPD-AB", weight: 97, label: "legacy CMK Marsha Kuping" },
  { pattern: /^PKT-CMK(?:-|$)/, family: "CPD-AB", weight: 97, label: "legacy bundle CMK" },
  { pattern: /^PKT-CMP(?:-|$)/, family: "CPD", weight: 92, label: "legacy bundle CMP" },
  { pattern: /^PKT-CMT(?:-|$)/, family: "CPT", weight: 94, label: "legacy bundle CMT" },
  { pattern: /^PKT-PST-OVL(?:-|$)/, family: "PSM-OVL", weight: 98, label: "legacy bundle Pastan Oval" },
  { pattern: /^PKT-PJ-OVL(?:-|$)/, family: "PSM-J", weight: 94, label: "legacy bundle Pashmina Jumbo" },
  { pattern: /^PKT-MST-BOL-J(?:-|$)/, family: "BLR-J", weight: 94, label: "legacy bundle Bolero Jumbo" },
  { pattern: /^PKT-MST-BOL(?:-|$)/, family: "BLR-M", weight: 94, label: "legacy bundle Bolero Medium" },
  { pattern: /^BRG-NP-J(?:-|$)/, family: "BNP-J", weight: 96, label: "legacy Bergo Non Pet Jumbo" },
  { pattern: /^MST-BOL-J(?:-|$)/, family: "BLR-J", weight: 96, label: "legacy Manset Bolero Jumbo" },
  { pattern: /^MST-BOL(?:-|$)/, family: "BLR-M", weight: 94, label: "legacy Manset Bolero Medium" },
  { pattern: /^CIT-RND(?:-|$)/, family: "CIT", weight: 96, label: "legacy Ciput Inner Turki Full Renda" },
  { pattern: /^TILLE\s*MEDIUM(?:-|$)/, family: "SCR-M", weight: 96, label: "legacy Tille Medium" },
];

// Product ID memory confirmed from prior marketplace exports.
// Use only for stable product IDs whose family is proven by canonical parent/SKU history.
const PRODUCT_ID_FAMILY_OVERRIDES: Record<string, string> = {
  // Shopee RKN — confirmed canonical Product ID registry.
  "29337541317": "CPT",     // Ciput Pet Marsha Cepol / Turky Marsha
  "25511412936": "PSM",     // Pastan / Pashmina Instan reguler
  "26674734844": "CBR",     // Ciput Basic Rayon
  "26307617628": "CPT-AB",  // Ciput Turki Anti Budeg / lubang telinga
  "22066873736": "CIT",     // Ciput Inner Turki Full Renda
  "25896326348": "BLR-M",   // Paket 2pcs Manset Sambung Bolero / Handsock
  "24102409353": "BSM-L",   // Paket hemat 2pcs Bergo Softpad Malay Size L
  "28024772905": "CBR",     // Paket 3pcs Ciput Tali Basic Rayon Premium
  "29856161443": "CPT-RYN", // Ciput anti budeg/anti geser bahan rayon
  "42776353410": "BLR-J",   // Manset Bolero JUMBO
  "27639418143": "BLR-M",   // Manset tangan sambung Bolero Handsock medium
  "23061980970": "PSM",     // Paket 3pcs Pashmina/Pastan; audit resmi PSM 3PCS -> PKT-PSM-3
  "43215173274": "CPD-AB", // Marsha Kuping / Tanpa Cepol / Anti Budeg; CMK/MBTC hanya SKU legacy

  // Shopee Kharisma/erkaenscarf — stable listing identity confirmed across the supplied exports.
  "26850467203": "PSM",
  "22757122300": "BHM-M",
  "22982614905": "BHM-L",
  "22782616119": "BHM-M",
  "23182615148": "BSM-M",
  "18584986616": "HJB-JIS-2IN1",
  "20093919262": "HJB-JIS-2IN1",
  "57305071125": "PSM",
  "15798257944": "PSH-JRS",
  "23582616998": "PSH-JRS",
  "29300461823": "PSM-J",
  "29800461894": "BNP-J",
  "28500466756": "SGI-ANK",
  "19193919948": "SGI-DWS",
  "22657117604": "PSM",
  "24281024400": "PSM",
  "24431020480": "PSM",
  "25181020925": "BSM-L",
  "26050647028": "BSM-L",
  "27194101012": "BHM-L",
  "29350467158": "PSM",
  "22861272803": "BSM-M",
  "23261271109": "BSM-L",
  "24001481018": "PSM",
  "25375019369": "PSM",
  "25475023674": "BSM-S",
  "40078242659": "PSM-J",
  "40478222001": "PSM",
  "40128223310": "BSM-M",
  "48605082234": "PSM",
  "57355059939": "BHM-L",
  "43359015307": "CPD",
  "44258880846": "CPT",
  "45505069847": "CPD",
  "46855088727": "CPT-AB",
  "49155100166": "CPD",
  "53305060473": "CPD",
  "53955061040": "CPT-AB",
  "28694086205": "CPT-AB",

  // Cross-account calibration — Shopee Jenna / Orvielle / Erkaenveil / Kharisma.
  "54157141125": "BHM-M",   // Jenna Bergo Size M; warna cocok BHM-M termasuk Kopi->Milo dan Denim
  "47351564491": "CPD",     // Erkaenveil Ciput Pet Marsha Anti Letoy reguler
  "49651564284": "PSM",     // Erkaenveil Paket 3pcs Pashmina Softpad Malay
  "43072133766": "SCR-M",   // Erkaenveil Scrunchie Medium
  "56201534691": "SGI-DWS", // Erkaenveil Segitiga Dewasa
  "23982616793": "BHM-L",   // Kharisma Hamidah semi-jumbo/Size L
  "26050642610": "BSM-L",   // Kharisma Bergo Softpad Malay Size L (actual Product ID)
  "28223447567": "CPT-AB",  // RKN: official grouping proves Turki Anti Budeg despite short title

  // New canonical physical families created from the supplied multi-account Mass Update files.

  "53808325516": "NAY-M",       // Jenna Naya Serial Bergo Daily Non Pet Size M
  "43677707855": "NAY-M",       // Bundle 3pcs Naya
  "54701539922": "DER-M",       // Erkaenveil Deera Rayon Airflow Size M
  "20684965516": "BHM-ANK",     // Hamidah Kids / Bergo Sport Anak
  "19184976041": "BHM-ANK",     // Bergo Anak Hamidah
  "21784964616": "BHM-ANK",     // Bergo Anak Hamidah / Kids Jersey
  "23382614087": "BRG-TLI-ANK", // Bergo Tali Anak
  "23982613630": "BRG-MRY",     // Bergo Maryam
  "16496298245": "HSP-PML",     // Pamela Sport Non Pet
  "23482616916": "HSP-PML",     // Pamela Sport Non Pet
  "15898262879": "HSP-SRY",     // Sriya Non Pet
  "18784981054": "HSP-SRY",     // Sriya / Khimar Malay Dagu
  "21893913077": "BRG-TLI",     // Bergo Tali Instan
  "23182614906": "BRG-TLI",     // Bergo Jersey Tali
  "22882613073": "HJB-TUL",     // Tali Kepang / Ulir Dewasa
  "23282612009": "HJB-TUL-ANK", // Tali Kepang / Ulir Anak
  "20793913894": "PSH-CBD",     // Pashmina Ceruti Babydoll 180x75
  "23682617011": "PIT-RND",     // Pashmina Inner Turki Full Renda
  "21284964608": "PSH-STN",     // Pashmina Silk/Cardenza/Satin
  "22857121760": "HJB-SQ-2L",   // Square Turki 2Layer
  "19393919988": "S4-BEL",      // Bella Square
  "19984966043": "S4-PRS",      // Paris Polos
  "22557117526": "SGI-PET",     // Segitiga Pet Antem
  "20693913878": "SGI-ANK-14",  // Segitiga Kids 1-4 tahun

  // TikTok — stable product IDs from the three official ZIPs supplied in this calibration.
  "1729628359274497460": "PSM-J",
  "1729633588227114420": "BNP-J",
  "1729655992954292660": "MST-JMP",
  "1729655997493840308": "CIT",
  "1729657460559022516": "HSP-M",
  "1729657441894631860": "SGI-ANK", // TikTok RKN Segitiga Instan Kids 6-15
  "1729735812998858164": "CPT-RYN",
  "1732097168965797300": "BLR-M",
  "1733201460099319220": "BLR-J",
  "1733309094557615540": "HJB-JIS-2IN1",
  "1729646241915832489": "CIT",
  "1734153669248124340": "CPT",
  "1729723300154149033": "HSP-SRY",
  "1729643966993959081": "HJB-TUL-ANK",
  "1729657712779167913": "BHM-L",
};

// Some legacy marketplace titles hide the bundle quantity in styled Unicode text or omit it
// entirely. These exact Product IDs have bundle quantities proven by official SKU/bundle history.
const PRODUCT_ID_BUNDLE_QTY_OVERRIDES: Record<string, number> = {
  "24102409353": 2, // PKT-BSM-L-2
  "28024772905": 3, // PKT-CBR-3
  "23061980970": 3, // audit resmi: PSM 3PCS -> PKT-PSM-3
  "43359015307": 3,
  "40078242659": 3,
  "40478222001": 3,
  "40128223310": 3,
  "48605082234": 3,
  "53305060473": 3,
  "53955061040": 3,
  "57355059939": 3,
  "24431020480": 5,
  "1731311777031816628": 5,
  "43677707855": 3,
  "26850467203": 2,
};

// Listing lama RKN Shopee yang sudah tidak dijual/ditampilkan.
// Tetap dibaca untuk audit histori, tetapi tidak perlu canonical SKU dan tidak memblokir FINAL export.
const ARCHIVED_PRODUCT_IDS: Record<string, string> = {
  "26250462137": "Legacy custom listing - tidak dipakai lagi",
  "27350462041": "Legacy custom bundle listing - tidak dipakai lagi",
  "26350467249": "Legacy custom listing - tidak dipakai lagi",
  "26000647028": "Legacy custom listing - tidak dipakai lagi",
  "24731020489": "Legacy custom listing - tidak dipakai lagi",
  "13446171282": "Saudia Rawis Polos",
  "15155706729": "Hijab Tali Ulir / Tali Kepang",
  "18718220656": "Inner / Daleman Jersey Premium",
  "23941383520": "Jilbab Instan Non Pet Sriya",
  "19471694706": "Hijab Oval Pinguin / Bergo Hamidah legacy",
  "24251971700": "Pashmina Inner 2in1 / Ceruty Baby Doll legacy",
  "11469559614": "Scrunchie legacy / listing lama tidak ditampilkan",
};

// Produk fisik yang memang belum punya family canonical di Blueprint.
// Ini sengaja REVIEW (bukan dipaksa ke family mirip) sampai user menetapkan family/SKU master baru.
const MASTER_EXPANSION_REVIEW_PRODUCT_IDS: Record<string, string> = {
  "48001564420": "Scrunchie Tille Jumbo & Medium tanpa discriminator ukuran per varian",
};

function isLegacyMarshaKuping(productId: string, title: string, currentParent: string, currentSku: string) {
  if (productId === "43215173274") return true;
  const t = normalize(title);
  const sku = String(currentSku || "").toUpperCase().trim();
  const parent = String(currentParent || "").toUpperCase().trim();
  const legacyTitle =
    t.includes("marsha") &&
    t.includes("kuping") &&
    (t.includes("tanpa cepol") || t.includes("anti budeg"));

  return legacyTitle ||
    /^MBTC(?:-|$)/.test(sku) ||
    /^CMK(?:-|$)/.test(sku) ||
    /^PKT-CMK(?:-|$)/.test(sku) ||
    /^PKT-CMK(?:-|$)/.test(parent);
}

function cleanLegacyVariation(productId: string, title: string, currentParent: string, currentSku: string, variation: string) {
  if (!isLegacyMarshaKuping(productId, title, currentParent, currentSku)) return variation;
  // 27/28 adalah kode legacy marketplace, bukan size/model/SKU fisik.
  return String(variation || "")
    .replace(/(?:^|[,;\s])(?:27|28)(?=$|[,;\s])/g, " ")
    .replace(/\s*,\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Structured SKU evidence is stronger than noisy marketplace titles.
// Examples: PKT-BHM-M-3 -> BHM-M, RKN-PRD-PKT-BHM-M-3 -> BHM-M.
function stripMarketplaceSkuPrefix(raw: string) {
  return String(raw || "")
    .toUpperCase()
    .trim()
    .replace(/^RKN-PRD-/, "")
    .replace(/^DFT-(?:KH|EV)(?:-SH)?-/, "");
}

function legacyHintFromSku(raw: string) {
  const value = stripMarketplaceSkuPrefix(raw);
  for (const hint of LEGACY_SKU_HINTS) {
    if (hint.pattern.test(value)) return hint;
  }
  return null;
}


function semanticFamilyOverride(input: {
  productId: string;
  title: string;
  variation: string;
  currentParent: string;
  currentSku: string;
  families: Set<string>;
}): ProductFamilyLock | null {
  const { productId, title, variation, currentParent, currentSku, families } = input;
  const t = normalize(title);
  const v = normalize(variation);
  const all = `${t} ${v}`.trim();
  const hasFamily = (family: string) => families.has(family);
  const lock = (family: string, reason: string, confidence = 100): ProductFamilyLock | null =>
    hasFamily(family) ? { family, confidence, reason } : null;

    if (productId === "27450467066") {
    return lock("BSM-S", "Product ID registry 27450467066: Hijab Sport Nonpet Size S = BSM-S");
  }
// Row-level identities for marketplace listings that intentionally combine physical sizes.
  if (productId === "22782616177") {
    const rowSize = sizeHint(v);
    if (rowSize === "L") return lock("BHM-L", "Product ID mixed-size registry: Size L = BHM-L");
    if (rowSize === "M") return lock("BSM-M", "Product ID mixed-size registry: Size M = BSM-M");
    if (rowSize === "S") return lock("BSM-S", "Product ID mixed-size registry: Size S = BSM-S");
  }
  if (productId === "23482616830") {
    const rowSize = sizeHint(v);
    if (rowSize === "S") return lock("HSP-ANK-S", "Product ID Sporty Anak: Size S");
    if (rowSize === "M") return lock("HSP-ANK-M", "Product ID Sporty Anak: Size M");
  }

  // Confirmed Product ID memory is the strongest identity layer. It beats noisy or shortened
  // marketplace titles unless the row variation explicitly contradicts the locked family.
  const rememberedFamily = PRODUCT_ID_FAMILY_OVERRIDES[productId] || "";
  if (rememberedFamily && !variationContradictsLockedFamily(variation, rememberedFamily)) {
    const remembered = lock(rememberedFamily, `Product ID registry ${productId} → ${rememberedFamily}`);
    if (remembered) return remembered;
  }

  // Official families that must not be collapsed into similar legacy families.
  if (/\bciput\b/.test(all) && /\bbasic\s+rayon\b/.test(all)) return lock("CBR", "Semantic canonical: Ciput Basic Rayon");
  if (/\bciput\b/.test(all) && /\b(?:iner|inner)\s+turki\b/.test(all) && /\bfull\s+renda\b/.test(all)) {
    return lock("CIT", "Semantic canonical: Ciput Inner Turki Full Renda");
  }
  if (/\bciput\b/.test(all) && /\brayon\b/.test(all) && /\banti\s+budeg\b/.test(all)) {
    return lock("CPT-RYN", "Semantic canonical: Rayon + Anti Budeg = CPT-RYN");
  }
  if (/\b(?:pashmina|hijab)\b/.test(all) && /\b(?:inner\s*2\s*in\s*1|2\s*in\s*1|ceruty\s*baby\s*doll|ceruty\s*babydoll)\b/.test(all)) {
    return lock("HJB-JIS-2IN1", "Semantic canonical: Hijab/Pashmina Inner 2in1 Ceruty Baby Doll");
  }

  // Pashmina Jersey regular 180x75 is a different physical family from Pashmina Instan.
  const jerseyPashmina = /\bpashmina\b/.test(t) && (
    /\b180\s*x\s*75\b/.test(t) ||
    (/\b(?:jersey|jersy|flowly|stretch|strech|shawl|kaos)\b/.test(t) &&
      !/\b(?:instan|oval|softpad|jahitan\s+.*dagu|inner\s*2\s*in\s*1|2\s*in\s*1)\b/.test(t))
  );
  if (jerseyPashmina) return lock("PSH-JRS", "Semantic canonical: Pashmina Jersey regular/non-instan");

  if (/\bhijab\s+sporty\b/.test(t) && /\bsize\s*m\b/.test(t) && /\bjersey\b/.test(t)) {
    return lock("HSP-M", "Semantic canonical: Hijab Sporty Size M Jersey Premium");
  }
  if (/\bmanset\s+jempol\b/.test(t)) return lock("MST-JMP", "Semantic canonical: Manset Jempol");
  if (/\bbergo\b/.test(t) && /\bnonpet\b/.test(t) && /\bjumbo\b/.test(t)) {
    return lock("BNP-J", "Semantic canonical: Bergo Non Pet Jumbo");
  }

  // Exact user-approved Marsha Kuping rule. CMK/MBTC are legacy labels only.
  if (isLegacyMarshaKuping(productId, title, currentParent, currentSku)) {
    return lock("CPD-AB", "Semantic canonical: Marsha Kuping/Tanpa Cepol = CPD-AB");
  }

  // Mixed marketplace listings can carry Reguler + Anti Budeg in one Product ID.
  // Variation-level type is authoritative for each row.
  const ciput = /\bciput\b|\bmarsha\b/.test(all);
  if (ciput) {
    const rayon = /\brayon\b/.test(all);
    const turki = /\bturki\b|\bcepol\s+turki\b/.test(t);
    const varAnti = /\banti\s+budeg\b|\blubang\s+telinga\b|\bkuping\b|\btanpa\s+cepol\b/.test(v);
    const titleAnti = /\banti\s+budeg\b|\blubang\s+telinga\b|\bkuping\b/.test(t);
    const varRegular = /\breguler\b|\bregular\b/.test(v);

    if (rayon && (varAnti || titleAnti)) return lock("CPT-RYN", "Variation semantic: Rayon Anti Budeg = CPT-RYN");
    if (varRegular) return lock(turki ? "CPT" : "CPD", `Variation semantic: Reguler ${turki ? "Turki" : "Marsha"}`);
    if (varAnti) return lock(turki ? "CPT-AB" : "CPD-AB", `Variation semantic: Anti Budeg ${turki ? "Turki" : "non-Turki"}`);
    if (titleAnti) return lock(turki ? "CPT-AB" : "CPD-AB", `Title semantic: Anti Budeg ${turki ? "Turki" : "non-Turki"}`);
    if (turki) return lock("CPT", "Title semantic: Ciput Turki reguler");
  }

  // Generic single-unit ciput fallback after the specific CBR/CIT/CPT-RYN/Anti-Budeg rules above.
  if (ciput) {
    const turki = /\bturki\b|\bcepol\s+turki\b/.test(t);
    if (turki) return lock("CPT", "Semantic canonical: Ciput Turki reguler");
    return lock("CPD", "Semantic canonical: Ciput Marsha/Dagu reguler");
  }

  // RKN_PASHMINA_SPLIT_V15_4
  // Pashmina Softpad (PSM) and Pashmina Oval (PSM-OVL) are different physical families.
  // Mixed marketing titles are resolved by canonical/legacy SKU evidence; otherwise they stay unresolved.
  const pashminaInstan = /\bpashmina\b/.test(t) && /\b(?:instan|softpad|oval|jahitan\s+.*dagu)\b/.test(t);
  if (pashminaInstan) {
    if (/\bjumbo\b/.test(all) || sizeHint(v) === "JUMBO") return lock("PSM-J", "Semantic canonical: Pashmina Instan Jumbo");

    const pashminaSoftpad = /\bsoftpad\b|\bsoft\s+pad\b|\bmalay\b/.test(all);
    const pashminaOval = /\boval\b|\bjahitan\s+.*dagu\b/.test(all);
    const skuUpper = String(currentSku || "").toUpperCase().trim();
    const parentUpper = String(currentParent || "").toUpperCase().trim();

    const legacyOvalEvidence =
      /^PST-OVL(?:-|$)/.test(skuUpper) ||
      /^PKT-PST-OVL(?:-|$)/.test(skuUpper) ||
      /^RKN-PRD-PST-OVL(?:-|$)/.test(parentUpper) ||
      /^RKN-PRD-PKT-PST-OVL(?:-|$)/.test(parentUpper);

    const canonicalSoftpadEvidence =
      /^PSM-\d+$/.test(skuUpper) ||
      parentUpper === "RKN-PRD-PSM";

    if (pashminaSoftpad && pashminaOval) {
      if (legacyOvalEvidence) return lock("PSM-OVL", "Mixed title resolved by legacy Oval SKU/Parent evidence");
      if (canonicalSoftpadEvidence) return lock("PSM", "Mixed title resolved by canonical Softpad SKU/Parent evidence");
      return null;
    }

    if (pashminaOval) return lock("PSM-OVL", "Semantic canonical: Pashmina Oval / jahitan dagu");
    if (pashminaSoftpad) return lock("PSM", "Semantic canonical: Pashmina Softpad Malay");
    return lock("PSM", "Semantic canonical: Pashmina Instan generic/legacy");
  }
  // Size/type discriminators inside mixed listings.
  const size = sizeHint(v) || sizeHint(t);
  const isScrunch = /\bscrunchie\b|\bcepol\b.*\b(?:tille|tile)\b|\bikat\s+rambut\b.*\b(?:tille|tile)\b/.test(all);
  if (isScrunch) {
    if (/\bjumbo\b/.test(v) || size === "JUMBO") return lock("SCR-J", "Variation semantic: Scrunchie Jumbo");
    if (/\bmedium\b|\bsedang\b/.test(v)) return lock("SCR-M", "Variation semantic: Scrunchie Medium");
    const skuN = normalize(currentSku);
    if (/^jumbo\b/.test(skuN)) return lock("SCR-J", "SKU row semantic: Jumbo");
    if (/^medium\b/.test(skuN) || /\btille\s+medium\b/.test(skuN)) return lock("SCR-M", "SKU row semantic: Medium");
  }

  const hamidah = /\bhamidah\b|\boval\s+pinguin\b|\bkhimar\s+penguin\b|\bkhimar\s+pinguin\b/.test(all);
  if (hamidah && size === "L") return lock("BHM-L", "Variation semantic: Hamidah Size L");
  if (hamidah && size === "M") return lock("BHM-M", "Variation semantic: Hamidah Size M");

  const softBergo = /\bbergo\b.*\bsoftpad\b|\bsoftpad\b.*\bmalay\b|\bbergo\s+sport\b/.test(all);
  if (softBergo && size === "L") return lock("BSM-L", "Variation semantic: Softpad Malay Size L");
  if (softBergo && size === "M") return lock("BSM-M", "Variation semantic: Softpad Malay Size M");
  if (softBergo && size === "S") return lock("BSM-S", "Variation semantic: Softpad Malay Size S");

  const segitiga = /\bsegitiga\b/.test(all);
  if (segitiga && (/\banak\b|\bkids?\b/.test(all) || /\b2\s*6\s*thn\b|\b6\s*15\b/.test(v))) {
    return lock("SGI-ANK", "Semantic canonical: Hijab Segitiga Anak");
  }
  if (segitiga && /\bdewasa\b/.test(all)) return lock("SGI-DWS", "Semantic canonical: Hijab Segitiga Dewasa");

  const bolero = /\bbolero\b|\bhandsock\b|\bmanset\s+tangan\s+sambung\b/.test(all);
  if (bolero && (/\bjumbo\b/.test(v) || /\bjumbo\b/.test(t))) return lock("BLR-J", "Semantic canonical: Bolero Jumbo");
  if (bolero && !/\bjumbo\b/.test(all)) return lock("BLR-M", "Semantic canonical: Bolero Medium/reguler", 98);

  return null;
}

// Structured SKU evidence is stronger than noisy marketplace titles, but marketplace export
// prefixes (DFT-KH-, DFT-EV-, etc.) are stripped first so the same physical SKU can be
// recognized across all stores.
function structuredFamilyFromSku(raw: string, families: Set<string>) {
  const value = stripMarketplaceSkuPrefix(raw);
  if (!value) return "";
  const ordered = Array.from(families).sort((a, b) => b.length - a.length);
  for (const family of ordered) {
    const f = family.toUpperCase();

    if (value === f || value.startsWith(`${f}-`)) return family;

    // Bundle SKU format may be canonical or carry a marketplace suffix:
    // PKT-CPD-3, PKT-CPD-3-S123, PKT-CPD-3-T456.
    const bundlePrefix = `PKT-${f}-`;
    if (value === `PKT-${f}`) return family;
    if (value.startsWith(bundlePrefix)) {
      const tail = value.slice(bundlePrefix.length);
      if (/^\d+(?:-|$)/.test(tail)) return family;
    }
  }

  const legacy = legacyHintFromSku(value);
  return legacy && families.has(legacy.family) ? legacy.family : "";
}

type ProductFamilyLock = { family: string; confidence: number; reason: string };

function strongFamilyEvidence(input: {
  productId: string;
  title: string;
  variation: string;
  currentParent: string;
  currentSku: string;
  skuColors: GenericRow[];
  families: Set<string>;
}): ProductFamilyLock | null {
  const { productId, title, variation, currentParent, currentSku, skuColors, families } = input;
  const semantic = semanticFamilyOverride({ productId, title, variation, currentParent, currentSku, families });
  if (semantic) return semantic;

  const skuUpper = String(currentSku || "").toUpperCase().trim();
  const exact = skuColors.find((r) => String(r.SKU_VARIAN || "").toUpperCase().trim() === skuUpper);
  if (exact) return { family: String(exact.PRODUCT_FAMILY || ""), confidence: 100, reason: `SKU canonical exact ${skuUpper}` };

  const byParent = structuredFamilyFromSku(currentParent, families);
  if (byParent) return { family: byParent, confidence: 100, reason: `Parent SKU terstruktur ${currentParent}` };

  const bySku = structuredFamilyFromSku(currentSku, families);
  if (bySku) return { family: bySku, confidence: 99, reason: `SKU terstruktur ${currentSku}` };

  const legacyHint = legacyHintFromSku(currentSku) || legacyHintFromSku(currentParent);
  if (legacyHint) {
    const confidence = legacyHint.label === "legacy CMT" ? 96 : Math.max(90, Math.min(98, legacyHint.weight));
    return { family: legacyHint.family, confidence, reason: `${legacyHint.label} pada SKU/Parent legacy` };
  }

  const detected = detectFamily(title, variation, currentSku, families, currentParent);
  if (detected.family && detected.confidence >= 97) {
    return { family: detected.family, confidence: detected.confidence, reason: `Discriminator kuat: ${detected.reason}` };
  }
  return null;
}

function buildProductFamilyLocks(rawRows: Array<{
  productId: string; title: string; variation: string; currentParent: string; currentSku: string;
}>, skuColors: GenericRow[]) {
  const families = new Set(skuColors.map((r) => String(r.PRODUCT_FAMILY || "").trim()).filter(Boolean));
  const evidence = new Map<string, ProductFamilyLock[]>();
  for (const row of rawRows) {
    const hit = strongFamilyEvidence({ ...row, skuColors, families });
    if (!hit || !hit.family) continue;
    const list = evidence.get(row.productId) || [];
    list.push(hit);
    evidence.set(row.productId, list);
  }

  const locks = new Map<string, ProductFamilyLock>();

  // Confirmed Product ID memory wins over noisy title scoring, but still respects an
  // explicit variation-level size contradiction for safety.
  for (const productId of new Set(rawRows.map((r) => r.productId).filter(Boolean))) {
    const family = PRODUCT_ID_FAMILY_OVERRIDES[productId] || "";
    if (!family || !families.has(family)) continue;
    const productRows = rawRows.filter((r) => r.productId === productId);
    if (productRows.some((r) => variationContradictsLockedFamily(r.variation, family))) continue;
    locks.set(productId, {
      family,
      confidence: 100,
      reason: `Product ID registry ${productId} → ${family} (confirmed canonical marketplace history)`,
    });
  }

  for (const [productId, list] of evidence.entries()) {
    if (locks.has(productId)) continue;
    const familySet = new Set(list.map((x) => x.family));
    // Product IDs that legitimately mix sibling families (e.g. one Scrunchie listing
    // with Medium + Jumbo variations) are deliberately NOT locked globally.
    if (familySet.size !== 1) continue;
    const family = list[0].family;

    // Safety cross-check: marketplace titles are noisy marketing text, so they must NOT
    // veto a consistent structured Parent/SKU lock by themselves. Only a direct variation
    // discriminator may invalidate the lock (e.g. Size L against a locked Size M family).
    const productRows = rawRows.filter((r) => r.productId === productId);
    const hardConflict = productRows.some((r) => variationContradictsLockedFamily(r.variation, family));
    if (hardConflict) continue;

    const strongest = [...list].sort((a, b) => b.confidence - a.confidence)[0];
    const sourceCount = list.length;
    locks.set(productId, {
      family,
      confidence: Math.max(98, strongest.confidence),
      reason: `Product ID ${productId} konsisten sebagai ${family} dari ${sourceCount} bukti SKU/parent/variasi · ${strongest.reason}`,
    });
  }
  return locks;
}


function variationContradictsLockedFamily(variation: string, family: string) {
  const v = normalize(variation);
  const size = sizeHint(v);
  const f = String(family || "").toUpperCase();

  if (size === "M" && /-(?:L|S|J)$/.test(f)) return true;
  if (size === "L" && /-(?:M|S|J)$/.test(f)) return true;
  if (size === "S" && /-(?:M|L|J)$/.test(f)) return true;
  if (size === "JUMBO" && /-(?:M|L|S)$/.test(f)) return true;

  if ((((f === "PSM") || (f === "PSM-OVL")) && /\b(?:jumbo|xl)\b/.test(v)) || (f === "PSM-J" && /\b(?:reguler|regular)\b/.test(v))) return true;
  if ((f === "SCR-M" && /\bjumbo\b/.test(v)) || (f === "SCR-J" && /\b(?:medium|sedang)\b/.test(v))) return true;
  if ((f === "BLR-M" && /\bjumbo\b/.test(v)) || (f === "BLR-J" && /\b(?:medium|sedang)\b/.test(v))) return true;
  if ((f === "SGI-DWS" && /\b(?:anak|kids?)\b/.test(v)) || (f === "SGI-ANK" && /\bdewasa\b/.test(v))) return true;

  return false;
}

export function detectFamily(title: string, variation: string, currentSku: string, families: Set<string>, currentParent = "", productLock?: ProductFamilyLock | null) {
  const titleN = normalize(title);
  const varN = normalize(variation);
  const all = `${titleN} ${varN}`.trim();
  const scores = new Map<string, FamilyCandidate>();

  const add = (family: string, score: number, reason: string) => {
    if (!families.has(family) || !score) return;
    const row = scores.get(family) || { family, score: 0, reasons: [] };
    row.score += score;
    if (reason && !row.reasons.includes(reason)) row.reasons.push(reason);
    scores.set(family, row);
  };
  const has = (text: string, re: RegExp) => re.test(text);

  // Canonical physical models from the official SKU guide.
  // If Blueprint has not been restored yet, block unsafe collapsing into a similar family.
  // Once CBR/CIT exist in MASTER_SKU_COLOR, the same engine will recognize them directly.
  const cbrTitle = has(all, /\bciput\s+(?:tali\s+)?basic\s+rayon\b/);
  const citTitle = has(all, /\bciput\s+(?:iner|inner)\s+turki\b/) && has(all, /\bfull\s+renda\b/);
  const cptRynTitle = has(all, /\bciput\b/) && has(all, /\brayon\b/) && has(all, /\banti\s*budeg\b/);
  const jisoo2in1Title = has(all, /\b(?:pashmina|hijab)\b/) && has(all, /\b(?:inner\s*2\s*in\s*1|2\s*in\s*1|ceruty\s*baby\s*doll|ceruty\s*babydoll)\b/);
  if (cbrTitle && !families.has("CBR")) {
    return familyResult("", 0, "Ciput Basic Rayon adalah family canonical CBR tetapi belum tersedia di MASTER_SKU_COLOR; jangan dipaksa ke CPD");
  }
  if (citTitle && !families.has("CIT")) {
    return familyResult("", 0, "Ciput Inner Turki Full Renda adalah family canonical CIT tetapi belum tersedia di MASTER_SKU_COLOR; jangan dipaksa ke CPT");
  }
  if (cptRynTitle && !families.has("CPT-RYN")) {
    return familyResult("", 0, "Ciput Rayon Anti-Budeg adalah family canonical CPT-RYN tetapi belum tersedia di MASTER_SKU_COLOR; jangan dipaksa ke CPD-AB/CPT-AB");
  }
  if (jisoo2in1Title && !families.has("HJB-JIS-2IN1")) {
    return familyResult("", 0, "Pashmina Inner 2in1 / Ceruty Baby Doll adalah Hijab Jisoo 2in1 (HJB-JIS-2IN1), tetapi family belum tersedia di MASTER_SKU_COLOR; jangan dipaksa ke PSM");
  }

  // Layer 0 — product-level memory built from stable Product ID + SKU/parent evidence.
  // It is only created when all strong evidence inside the same Product ID agrees.
  if (productLock?.family) add(productLock.family, 185, productLock.reason);
  if (cbrTitle) add("CBR", 195, "Ciput Basic Rayon canonical");
  if (citTitle) add("CIT", 195, "Ciput Inner Turki Full Renda canonical");
  if (cptRynTitle) {
    add("CPT-RYN", 210, "Ciput Rayon Anti-Budeg canonical");
    add("CPD-AB", -110, "bukan CPD-AB: bahan Rayon punya family CPT-RYN");
    add("CPT-AB", -110, "bukan CPT-AB: bahan Rayon punya family CPT-RYN");
    add("CPD", -80, "bukan CPD reguler: Rayon Anti-Budeg");
    add("CPT", -80, "bukan CPT reguler: Rayon Anti-Budeg");
  }
  if (jisoo2in1Title) {
    add("HJB-JIS-2IN1", 225, "Hijab Jisoo/Pashmina Inner 2in1 Ceruty Baby Doll canonical");
    add("PSM", -115, "bukan PSM reguler: model Inner 2in1/Ceruty Baby Doll punya family HJB-JIS-2IN1");
    add("PSM-J", -100, "bukan PSM Jumbo: model Inner 2in1/Ceruty Baby Doll punya family HJB-JIS-2IN1");
  }

  // Layer 1 — canonical/legacy SKU and parent hints. These are evidence, not absolute truth,
  // unless the exact SKU was already matched to MASTER_SKU_COLOR before this function is called.
  const skuUpper = String(currentSku || "").toUpperCase().trim();
  const parentUpper = String(currentParent || "").toUpperCase().trim();
  for (const familyName of Array.from(families).sort((a, b) => b.length - a.length)) {
    if (skuUpper.startsWith(`${familyName}-`) || skuUpper === familyName) add(familyName, 78, `prefix SKU ${familyName}`);
    if (parentUpper === `RKN-PRD-${familyName}` || parentUpper.endsWith(`-${familyName}`)) add(familyName, 82, `parent SKU ${familyName}`);
  }
  const structuredSkuFamily = structuredFamilyFromSku(currentSku, families);
  if (structuredSkuFamily) add(structuredSkuFamily, 145, `SKU bundle/canonical terstruktur ${currentSku}`);
  const structuredParentFamily = structuredFamilyFromSku(currentParent, families);
  if (structuredParentFamily) add(structuredParentFamily, 155, `Parent bundle/canonical terstruktur ${currentParent}`);
  const legacySkuHint = legacyHintFromSku(currentSku) || legacyHintFromSku(currentParent);
  if (legacySkuHint) add(legacySkuHint.family, legacySkuHint.weight, legacySkuHint.label);

  // Layer 2 — product identity phrases. Generic aliases seed multiple candidates;
  // variation-level discriminators below decide the exact family/size.
  const pashminaBase = has(all, /\bpashmina\b|\bpashmina instan\b|\bpashmina oval\b/);
  const pashminaOval = has(all, /\boval\b|\bjahitan\s+.*dagu\b/);
  const pashminaSoftpad = has(all, /\bsoftpad\b|\bsoft\s+pad\b|\bmalay\b/);

  if (pashminaBase) {
    add("PSM-J", 42, "alias pashmina/pastan");

    if (pashminaOval && !pashminaSoftpad) {
      add("PSM-OVL", 92, "Pashmina Oval / jahitan dagu");
      add("PSM", -40, "bukan Softpad: discriminator Oval");
    } else if (pashminaSoftpad && !pashminaOval) {
      add("PSM", 92, "Pashmina Softpad Malay");
      add("PSM-OVL", -40, "bukan Oval: discriminator Softpad");
    } else if (pashminaOval && pashminaSoftpad) {
      add("PSM", 62, "judul campuran Softpad + Oval");
      add("PSM-OVL", 62, "judul campuran Softpad + Oval");
    } else {
      add("PSM", 62, "alias pashmina/pastan");
    }
  }
  const scrunchBase = has(all, /\bscrunchie\b|\bcepol\b.*\b(?:tille|tile)\b|\bikat rambut\b.*\b(?:tille|tile)\b/);
  if (scrunchBase) {
    add("SCR-J", 55, "scrunchie/cepol tille");
    add("SCR-M", 55, "scrunchie/cepol tille");

    // Some marketplace listings intentionally mix Jumbo + Medium under one Product ID.
    // The row-level legacy SKU ("jumbo" / "medium") is therefore a discriminator for
    // that variation, but must not become the final canonical SKU itself.
    const scrunchSku = normalize(currentSku);
    if (/^jumbo\b/.test(scrunchSku)) {
      add("SCR-J", 125, "SKU marketplace baris = jumbo");
      add("SCR-M", -70, "bukan medium: SKU marketplace baris = jumbo");
    } else if (/^medium\b/.test(scrunchSku)) {
      add("SCR-M", 125, "SKU marketplace baris = medium");
      add("SCR-J", -70, "bukan jumbo: SKU marketplace baris = medium");
    }
  }

  const hamidahBase = has(all, /\bhamidah\b|\boval pinguin\b|\bkhimar penguin\b|\bkhimar pinguin\b/);
  if (hamidahBase) {
    add("BHM-L", 58, "bergo Hamidah/Pinguin");
    add("BHM-M", 58, "bergo Hamidah/Pinguin");
  }

  const softBergoBase = has(all, /\bbergo\b.*\bsoftpad\b|\bsoftpad\b.*\bmalay\b|\bbergo sport\b|\bhijab sport\b.*\bsoftpad\b/);
  if (softBergoBase) {
    add("BSM-S", 55, "bergo sport/softpad Malay");
    add("BSM-M", 55, "bergo sport/softpad Malay");
    add("BSM-L", 55, "bergo sport/softpad Malay");
  }

  if (has(all, /\bbergo\b.*\bnonpet\b.*\bjumbo\b|\bnonpet\b.*\bjumbo\b/)) add("BNP-J", 145, "bergo non-pet jumbo");

  const segitigaBase = has(all, /\bsegitiga\b|\bhijab segitiga\b/);
  if (segitigaBase) {
    add("SGI-DWS", 58, "hijab segitiga");
    add("SGI-ANK", 45, "hijab segitiga");
  }

  const boleroBase = has(all, /\bbolero\b|\bhandsock\b|\bmanset tangan sambung\b/);
  if (boleroBase) {
    add("BLR-J", 55, "bolero/handsock");
    add("BLR-M", 55, "bolero/handsock");
  }

  const ciputBase = has(all, /\bciput\b|\bmarsha\b|\binner\b.*\bmarsha\b/);
  const antiBudeg = has(all, /\banti budeg\b|\blubang telinga\b|\bkuping\b/);
  const turki = has(all, /\bturki\b|\bcepol turki\b/);
  if (ciputBase) {
    add("CPD", 36, "ciput/Marsha");
    add("CPD-AB", 22, "ciput/Marsha");
    add("CPT", 22, "ciput/Marsha");
    add("CPT-AB", 18, "ciput/Marsha");
    if (!antiBudeg && !turki) add("CPD", 58, "Marsha/Ciput reguler tanpa Turki/Anti Budeg");
  }
  if (has(all, /\bciput dagu\b/)) add("CPD", 75, "ciput dagu");
  if (turki) {
    add("CPT", 105, "Turki");
    add("CPT-AB", 78, "Turki");
    add("CPD", -80, "bukan CPD: ada Turki");
    add("CPD-AB", -70, "bukan CPD-AB: ada Turki");
  }
  if (antiBudeg) {
    add("CPD-AB", 100, "anti budeg/lubang telinga");
    add("CPT-AB", turki ? 105 : 20, turki ? "anti budeg + konteks Turki" : "anti budeg tanpa bukti Turki");
    if (!turki) add("CPD-AB", 35, "non-Turki anti budeg = CPD-AB");
    add("CPD", -55, "bukan reguler: anti budeg");
    add("CPT", -45, "lebih cocok AB: anti budeg");
  }
  if (turki && antiBudeg) add("CPT-AB", 95, "kombinasi Turki + anti budeg");
  if (has(all, /\brayon\b/) && antiBudeg) {
    add("CPT-RYN", 95, "rayon + anti budeg");
    add("CPD-AB", -70, "bukan CPD-AB: rayon anti-budeg");
    add("CPT-AB", -70, "bukan CPT-AB: rayon anti-budeg");
  }

  // Layer 3 — variation-first discriminators. This is critical for listings whose title
  // contains multiple sizes/types (e.g. "medium dan jumbo"). Variation wins over title.
  const varSize = sizeHint(varN);
  const titleSize = sizeHint(titleN);
  const applySize = (size: string, strong: boolean) => {
    const w = strong ? 92 : 48;
    const neg = strong ? -62 : -30;
    if (size === "JUMBO") {
      add("PSM-J", w, strong ? "variasi jumbo/XL" : "judul jumbo/XL"); add("PSM", neg, "bukan reguler: jumbo");
      add("SCR-J", w, strong ? "variasi jumbo" : "judul jumbo"); add("SCR-M", neg, "bukan medium: jumbo");
      add("BLR-J", w, strong ? "variasi jumbo" : "judul jumbo"); add("BLR-M", neg, "bukan medium: jumbo");
    }
    if (size === "M") {
      add("BHM-M", w, strong ? "variasi Size M" : "judul Size M"); add("BHM-L", neg, "bukan L: Size M");
      add("BSM-M", w, strong ? "variasi Size M" : "judul Size M"); add("BSM-L", neg, "bukan L: Size M"); add("BSM-S", neg, "bukan S: Size M");
    }
    if (size === "L") {
      add("BHM-L", w, strong ? "variasi Size L" : "judul Size L"); add("BHM-M", neg, "bukan M: Size L");
      add("BSM-L", w, strong ? "variasi Size L" : "judul Size L"); add("BSM-M", neg, "bukan M: Size L"); add("BSM-S", neg, "bukan S: Size L");
    }
    if (size === "S") {
      add("BSM-S", w, strong ? "variasi Size S" : "judul Size S"); add("BSM-M", neg, "bukan M: Size S"); add("BSM-L", neg, "bukan L: Size S");
    }
  };
  if (varSize) applySize(varSize, true);
  else if (titleSize) applySize(titleSize, false);

  // Scrunchie size words often appear without the word "size".
  if (has(varN, /\bjumbo\b/)) { add("SCR-J", 105, "variasi scrunchie Jumbo"); add("SCR-M", -70, "variasi bukan Medium"); }
  if (has(varN, /\bmedium\b|\bsedang\b/)) { add("SCR-M", 105, "variasi scrunchie Medium"); add("SCR-J", -70, "variasi bukan Jumbo"); }
  if (!has(varN, /\bjumbo\b|\bmedium\b|\bsedang\b/)) {
    if (has(titleN, /\bjumbo\b/) && !has(titleN, /\bmedium\b|\bsedang\b/)) add("SCR-J", 45, "judul hanya Jumbo");
    if (has(titleN, /\bmedium\b|\bsedang\b/) && !has(titleN, /\bjumbo\b/)) add("SCR-M", 45, "judul hanya Medium");
  }

  // Segitiga: age/recipient is a stronger discriminator than generic title.
  if (has(varN, /\banak\b|\bkids?\b|\b2\s*6\s*thn\b/) || has(titleN, /\banak\b|\bkids?\b/)) {
    add("SGI-ANK", 105, "anak/kids"); add("SGI-DWS", -70, "bukan dewasa: anak/kids");
  } else if (has(varN, /\bdewasa\b/) || has(titleN, /\bdewasa\b/)) {
    add("SGI-DWS", 90, "dewasa"); add("SGI-ANK", -55, "bukan anak: dewasa");
  } else if (segitigaBase) add("SGI-DWS", 28, "default segitiga tanpa penanda anak");

  // Product-specific jumbo pashmina language that may not include explicit "size".
  if (pashminaBase && has(varN, /\bxl\b|\bjumbo\b/)) { add("PSM-J", 105, "variasi Pashmina XL/Jumbo"); add("PSM", -75, "bukan PSM reguler"); add("PSM-OVL", -75, "bukan PSM-OVL reguler"); }
  else if (pashminaBase && has(titleN, /\bjumbo\b/) && !has(varN, /\breguler\b|\bregular\b/)) { add("PSM-J", 72, "judul Pashmina Jumbo"); add("PSM", -40, "judul Jumbo"); add("PSM-OVL", -40, "judul Jumbo"); }

  // Layer 4 — choose winner only when score AND margin are safe.
  const ranked = Array.from(scores.values()).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const second = ranked[1];
  if (!top || top.score < 45) return familyResult("", 0, "Keluarga produk belum dikenali");
  const margin = top.score - (second?.score ?? 0);
  let confidence = 0;
  if (top.score >= 145 && margin >= 35) confidence = 99;
  else if (top.score >= 115 && margin >= 28) confidence = 97;
  else if (top.score >= 90 && margin >= 22) confidence = 95;
  else if (top.score >= 72 && margin >= 18) confidence = 91;
  else if (top.score >= 58 && margin >= 14) confidence = 87;

  if (!confidence) {
    const candidates = ranked.slice(0, 3).map((r) => `${r.family}:${Math.round(r.score)}`).join(" vs ");
    return familyResult("", 72, `Ambigu antar keluarga (${candidates}); perlu review`);
  }

  const positiveReasons = top.reasons.filter((r) => !r.startsWith("bukan ")).slice(0, 4);
  return familyResult(top.family, confidence, `${positiveReasons.join(" + ")} · skor ${Math.round(top.score)}, margin ${Math.round(margin)}`);

  function familyResult(f: string, confidence: number, reason: string) {
    return { family: families.has(f) ? f : "", confidence: families.has(f) ? confidence : Math.min(confidence, 65), reason };
  }
}

type ColorHit = {
  color: string;
  sku: string;
  parent: string;
  start: number;
  end: number;
  explicitQty: number;
  ambiguous: boolean;
};

const COLOR_ALIAS_OVERRIDES: Record<string, string[]> = {
  "hitam": ["black"],
  "abu": ["abu-abu", "abu abu", "grey", "gray"],
  "cream": ["krem"],
  "putih": ["white", "putih bersih"],
  "broken white": ["brokenwhite", "putih tulang", "bw"],
  "abu muda": ["abu muda", "light grey", "light gray"],
  "abu tua": ["abutua", "abu tua", "dark grey", "dark gray"],
  "abu muda silver": ["abu muda silver", "abu silver"],
  "mocca": ["moka", "mokka", "moca", "mocha"],
  "khaki": ["khaky", "kaki"],
  "coklat": ["cokelat"],
  "hazel": ["hanzel", "hezel", "hanz", "hanze"],
  "navy": ["nevy", "navi"],
  "maroon": ["marun", "maron"],
  "burgundy": ["burgundi", "burgundy"],
  "dusty pink": ["dustypink", "dusty"],
  "dark choco": ["dark choko", "dark chocolate", "coktung", "cok tung"],
  "hijau botol": ["botle", "bottle", "botol", "jotol", "hijau botol tua"],
  "mustard": ["mustrad"],
  "silver": ["sillver", "siler"],
  "coksu": ["cok susu", "creami coksu", "cream coksu"],
  "coklat susu": ["cokelat susu"],
  "cokelat tua": ["coklat tua"],
  "sage": ["sage green"],
  "army": ["army green"],
  "wardah": ["biru wardah"],
  "biru wardah": ["blue wardah"],
  "baby pink": ["babypink", "pink muda"],
};


// Alias warna khusus keluarga. Dipakai hanya jika user sudah menetapkan bahwa nama marketplace
// tersebut menunjuk ke barang fisik yang sama di family itu, sehingga tidak mencemari family lain.
const FAMILY_COLOR_ALIAS_OVERRIDES: Record<string, Record<string, string[]>> = {
  "PSM": {
    "dark choco": ["cokelat tua", "coklat tua"],
  },
  "CPT": {
    // Marketplace legacy CMT uses label Silver / Abu Muda for the physical Abu variant.
    // Canonical inventory is CPT-06 (Abu).
    "abu": ["silver", "siler", "sillver", "abu muda", "abumuda"],
  },
  "BHM-L": {
    "abu muda": ["silver", "siler", "sillver"],
    "milo": ["kopi", "coffee", "cofee", "coffe", "coklat kopi", "cokelat kopi"],
    "army": ["hijau tua army"],
    "coklat susu": ["coksu", "cream coksu", "creami coksu"],
    "dark choco": ["coklat pramuka"],
  },
  "BHM-M": {
    "abu muda": ["silver", "siler", "sillver", "darkgrey", "dark grey", "dark gray"],
    // Marketplace RKN/Kharisma memakai nama Kopi / Coklat-Kopi untuk warna fisik Milo.
    // Canonical inventory tetap Milo => BHM-M-11.
    "milo": ["kopi", "coffee", "cofee", "coffe", "coklat kopi", "cokelat kopi"],
  },
  "BSM-M": {
    "dark choco": ["coklat pramuka"],
  },
  "BSM-S": {
    "abu muda": ["silver", "siler", "sillver"],
    "dark choco": ["coklat pramuka"],
  },
  "BSM-L": {
    // Listing Orvielle memakai Hijau Tua untuk warna fisik Army pada varian Size L.
    "army": ["hijau tua"],
    "dark choco": ["cokelat tua", "coklat tua"],
  },
  "SGI-DWS": {
    // Cross-store evidence: label Silver pada segitiga dewasa memakai SGI-DWS-04 (Abu Muda).
    "abu muda": ["silver", "siler", "sillver", "abu silver"],
    "denim": ["abu denim"],
  },
  "SCR-M": {
    "navy": ["biru tua"],
    "baby pink": ["pink peach", "pink muda"],
  },
  "SCR-J": {
    // Verified against the cross-store canonical grouping for this legacy mixed listing.
    "abu": ["abu-abu"],
    "brown": ["cokelat", "coklat"],
    "navy": ["biru tua"],
    "baby pink": ["pink muda", "pink peach"],
    "dark choco": ["cokelat tua", "coklat tua"],
  },
  "MST-JMP": {
    "baby pink": ["pink muda", "babypink"],
  },
};

// Jika sumber master lama memiliki dua SKU untuk warna fisik yang sama, jangan memilih
// berdasarkan urutan baris. Override ini hanya diisi setelah ada bukti lintas marketplace.
// BHM-M Army aktif dan konsisten sebagai BHM-M-17; BHM-M-32 adalah duplikat master lama.
const CANONICAL_COLOR_SKU_OVERRIDES: Record<string, Record<string, string>> = {
  "BHM-M": {
    "army": "BHM-M-17",
  },
};
function escapeRe(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function colorAliases(color: string) {
  const canonical = normalize(color);
  return Array.from(new Set([canonical, ...(COLOR_ALIAS_OVERRIDES[canonical] || []).map(normalize)]))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function detectColorSequence(familyName: string, variation: string, skuColors: GenericRow[]): ColorHit[] {
  const text = normalize(variation);
  if (!text) return [];
  const candidates = skuColors.filter((r) => String(r.PRODUCT_FAMILY || "").trim() === familyName && String(r.SKU_VARIAN || "").trim());
  const byColor = new Map<string, GenericRow[]>();
  for (const row of candidates) {
    const key = normalize(String(row.COLOR || ""));
    if (!key) continue;
    const rows = byColor.get(key) || [];
    rows.push(row);
    byColor.set(key, rows);
  }

  const aliases: Array<{ alias: string; colorKey: string; colorLabel: string; exact: boolean }> = [];
  for (const [key, rows] of byColor.entries()) {
    const label = String(rows[0].COLOR || "");
    const familyAliases = FAMILY_COLOR_ALIAS_OVERRIDES[familyName]?.[key] || [];
    const local = new Set([...colorAliases(label), ...familyAliases.map(normalize)]);
    // Fallback hanya jika sinonim canonical yang lebih spesifik TIDAK tersedia di keluarga ini.
    // Ini membuat bahasa marketplace tetap fleksibel tanpa mencampur dua warna master yang sama-sama valid.
    if (key === "biru wardah" && !byColor.has("wardah")) local.add("wardah");
    if (key === "coklat susu" && !byColor.has("coksu")) { local.add("coksu"); local.add("cok susu"); }
    if (key === "abu muda silver") {
      if (!byColor.has("silver")) local.add("silver");
      if (!byColor.has("abu muda")) local.add("abu muda");
    }
    for (const alias of local) aliases.push({ alias, colorKey: key, colorLabel: label, exact: alias === key });
  }
  aliases.sort((a, b) => b.alias.length - a.alias.length || Number(b.exact) - Number(a.exact));
  const hits: ColorHit[] = [];
  const occupied: Array<[number, number]> = [];
  const overlaps = (a: number, b: number) => occupied.some(([x, y]) => a < y && b > x);
  for (const item of aliases) {
    const re = new RegExp(`(?:^|\\s)(${escapeRe(item.alias)})(?=\\s|$)`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const aliasStart = m.index + m[0].indexOf(m[1]);
      const aliasEnd = aliasStart + m[1].length;
      if (overlaps(aliasStart, aliasEnd)) continue;
      const rows = byColor.get(item.colorKey) || [];
      const skus = Array.from(new Set(rows.map((r) => String(r.SKU_VARIAN || "").trim()).filter(Boolean)));
      const overrideSku = CANONICAL_COLOR_SKU_OVERRIDES[familyName]?.[item.colorKey] || "";
      const overrideRow = overrideSku ? rows.find((r) => String(r.SKU_VARIAN || "").trim() === overrideSku) : undefined;
      const resolvedSku = skus.length === 1 ? skus[0] : overrideRow ? overrideSku : "";
      const resolvedRows = resolvedSku ? rows.filter((r) => String(r.SKU_VARIAN || "").trim() === resolvedSku) : rows;
      const parents = Array.from(new Set(resolvedRows.map((r) => String(r.SKU_INDUK || "").trim()).filter(Boolean)));
      const tail = text.slice(aliasEnd, aliasEnd + 18);
      const qtyMatch = tail.match(/^\s*(?:x\s*)?(\d+)\s*(?:pcs|pc|x)?\b/);
      const numericRangeLike = /^\s*\d+\s*(?:[-–—]|\s)\s*\d+\b/.test(tail);
      // RKN_REVIEW_ZERO_FINAL_V1
      const qtyHasExplicitMarker = /^\s*(?:(?:x|×)\s*\d+|\d+\s*(?:pcs|pc|x)\b)/.test(tail);
      hits.push({
        color: item.colorLabel,
        sku: resolvedSku,
        parent: parents.length === 1 ? parents[0] : "",
        start: aliasStart,
        end: aliasEnd,
        explicitQty: qtyMatch && qtyHasExplicitMarker && !numericRangeLike ? Math.max(1, Number(qtyMatch[1])) : 1,
        ambiguous: !resolvedSku,
      });
      occupied.push([aliasStart, aliasEnd]);
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

export function buildInventoryRecipe(familyName: string, variation: string, qty: number, skuColors: GenericRow[]) {
  const n = normalize(variation);
  const freeChoice = /\b(?:bebas pilih warna|pilih warna|bebas warna|request warna|req warna|request color)\b/.test(n) || (qty > 1 && /\bcustom\b/.test(n));
  const random = /\b(?:random|acak|mix random|warna random)\b/.test(n);
  const hits = detectColorSequence(familyName, variation, skuColors);
  const colors = hits.map((h) => h.color);

  // FREE_CHOICE bukan error dan bukan stok paket fisik. SKU jual boleh READY,
  // sedangkan stok gudang menunggu warna aktual saat fulfillment/picking.
  if (freeChoice) {
    return inv(
      "WAITING_ALLOCATION",
      "FREE_CHOICE",
      colors,
      [],
      "WAITING_COLOR_ALLOCATION",
      `Bundle ${qty} pcs bebas pilih warna: jangan kurangi stok sekarang; alokasikan ${qty} SKU warna satuan saat picking/order fulfillment`
    );
  }

  // RANDOM juga tidak boleh mengarang SKU. Nanti ERP Inventory akan menyarankan
  // warna berdasarkan stok gudang (mis. stok berlebih) dan staf mengonfirmasi.
  if (random) {
    return inv(
      "RANDOM_SUGGESTION",
      "RANDOM",
      colors,
      [],
      "SUGGEST_FROM_WAREHOUSE_STOCK",
      `Bundle ${qty} pcs random: tunggu stok gudang aktual, sarankan warna stok berlebih, lalu staf konfirmasi sebelum stok dikurangi`
    );
  }

  if (!hits.length) {

    if (qty > 1) {

      return inv(

        "WAITING_ALLOCATION",

        "UNKNOWN",

        [],

        [],

        "WAITING_COLOR_ALLOCATION",

        "Bundle " + qty + " pcs sudah memiliki SKU jual canonical tetapi warna fisik belum cukup pasti; alokasi SKU fisik ditunda ke picking/fulfillment"
      );

    }


    return inv(

      "REVIEW",

      "UNKNOWN",

      [],

      [],

      "REVIEW_COLOR",

      "Warna canonical belum terdeteksi dari nama variasi"

    );

  }
  if (hits.some((h) => h.ambiguous || !h.sku)) {
    return inv("REVIEW", "UNKNOWN", colors, [], "REVIEW_MASTER_COLOR", "Ada warna yang memiliki SKU master ganda/ambigu; perlu rapikan MASTER_SKU_COLOR");
  }

  const counts = new Map<string, { sku: string; color: string; qty: number }>();
  const explicitTotal = hits.reduce((sum, h) => sum + h.explicitQty, 0);
  const effectiveHits = hits.map((h) => ({ ...h }));

  // Satu warna pada bundle seperti "Hitam 3pcs" = satu SKU fisik dikonsumsi beberapa unit.
  if (qty > 1 && hits.length === 1 && explicitTotal === 1) effectiveHits[0].explicitQty = qty;

  const totalUnits = effectiveHits.reduce((sum, h) => sum + h.explicitQty, 0);

  for (const h of effectiveHits) {
    const prev = counts.get(h.sku) || { sku: h.sku, color: h.color, qty: 0 };
    prev.qty += h.explicitQty;
    counts.set(h.sku, prev);
  }

  const components = Array.from(counts.values());

  // Jika bundle 3pcs hanya menulis dua warna, jangan menebak unit ketiga.
  // Komponen yang sudah jelas tetap disimpan, sedangkan sisa slot dialokasikan saat picking.
  if (qty > 1 && totalUnits < qty) {
    const missing = qty - totalUnits;
    return inv(
      "WAITING_ALLOCATION",
      "PARTIAL_ALLOCATION",
      colors,
      components,
      `ALLOCATE_${missing}_COMPONENT${missing > 1 ? "S" : ""}`,
      `Bundle ${qty} pcs sudah memiliki ${totalUnits} komponen pasti (${components.map((c) => `${c.sku} x${c.qty}`).join(" + ")}); alokasikan ${missing} pcs sisanya saat picking sebelum stok final dikurangi`
    );
  }
  if (qty > 1 && totalUnits > qty) {
    return inv("REVIEW", "UNKNOWN", colors, components, "REVIEW_BUNDLE_COMPONENTS", `Bundle terdeteksi ${qty} pcs tetapi variasi menyebut ${totalUnits} unit; perlu review karena komponen melebihi quantity jual`);
  }
  if (qty === 1 && totalUnits !== 1) {
    return inv("REVIEW", "UNKNOWN", colors, components, "REVIEW_COMPONENTS", "Varian satuan mengandung lebih dari satu komponen warna; perlu review");
  }
  const recipeType: BundleRecipeType =
    qty <= 1 ? "SINGLE" :
    hits.length === 1 ? "SAME_COLOR_MULTIPACK" :
    "FIXED_COMBINATION";

  const action = qty > 1 ? "AUTO_DEDUCT_COMPONENTS" : "AUTO_DEDUCT_SINGLE_SKU";
  const reason = qty > 1
    ? `${recipeType === "SAME_COLOR_MULTIPACK" ? "Multipack satu warna" : "Kombinasi warna tetap"} ${qty} pcs berhasil dipecah menjadi ${components.map((c) => `${c.sku} x${c.qty}`).join(" + ")}`
    : `SKU satuan terdeteksi: ${components[0].sku}`;

  return inv("READY", recipeType, colors, components, action, reason);

  function inv(
    status: InventoryStatus,
    recipeType: BundleRecipeType,
    colorNames: string[],
    components: Array<{ sku: string; color: string; qty: number }>,
    fulfillmentAction: string,
    reason: string
  ) {
    return {
      status,
      recipeType,
      fulfillmentAction,
      colorNames,
      components,
      skus: components.map((c) => c.sku),
      detail: components.map((c) => `${c.sku} (${c.color}) x${c.qty}`).join(" + "),
      reason,
    };
  }
}

function findColorMatch(familyName: string, variation: string, skuColors: GenericRow[]) {
  const hits = detectColorSequence(familyName, variation, skuColors);
  if (hits.length !== 1 || hits[0].ambiguous || !hits[0].sku) return null;
  return skuColors.find((r) => String(r.PRODUCT_FAMILY || "").trim() === familyName && String(r.SKU_VARIAN || "").trim() === hits[0].sku) || null;
}

function canonicalParentForFamily(familyName: string, skuColors: GenericRow[]) {
  const parents = Array.from(new Set(
    skuColors
      .filter((r) => String(r.PRODUCT_FAMILY || "").trim() === familyName)
      .map((r) => String(r.SKU_INDUK || "").trim())
      .filter(Boolean)
  ));
  if (parents.length === 1) return { parent: parents[0], consistent: true };
  if (parents.length === 0) return { parent: `RKN-PRD-${familyName}`, consistent: true };
  return { parent: "", consistent: false };
}

function canonicalBundleSku(family: string, qty: number) {
  // Preserve the already-established cross-account SGI virtual SKU namespace.
  if (family === "SGI-DWS") return `PKT-SGI-${qty}`;
  return `PKT-${family}-${qty}`;
}

function mappingFor(input: {
  productId: string;
  title: string;
  variation: string;
  currentParent: string;
  currentSku: string;
  skuColors: GenericRow[];
  productLock?: ProductFamilyLock | null;
}) {
  const { productId, title, variation, currentParent, currentSku, skuColors, productLock } = input;
  const archivedVariationKeys = new Set<string>([
    "18584986616|dark choko",
    "18584986616|lilac",
    "18584986616|avocado",
    "18584986616|putih bw",
    "18584986616|mustrad",
    "18584986616|lavender",
    "18584986616|pink fanta",
    "18584986616|army",
    "18584986616|biru electrik",
    "18584986616|lime",
    "20093919262|abu muda",
    "20093919262|darck choko",
    "20093919262|mustard",
    "20093919262|army",
    "20093919262|lime",
    "20093919262|hijau botol",
    "20093919262|lavender",
  ].map((key) => {
    const separator = key.indexOf("|");
    const id = key.slice(0, separator);
    const rawVariation = key.slice(separator + 1);
    return `${id}|${normalize(rawVariation)}`;
  }));


  const archivedVariationKey = `${productId}|${normalize(variation)}`;

  if (archivedVariationKeys.has(archivedVariationKey)) {
    return result("", "", "", "ARCHIVED", 100, `ARCHIVED_RKN_SHOPEE_VARIATION: ${productId} / ${variation} sudah tidak dijual/ditampilkan; tidak perlu canonical SKU`, 1, emptyInventory("ARCHIVED", "Listing legacy/inactive variation: simpan histori saja, jangan potong stok dan jangan blokir export aktif"));
  }
  if (ARCHIVED_PRODUCT_IDS[productId]) {
    const label = ARCHIVED_PRODUCT_IDS[productId];
    return result("", "", "", "ARCHIVED", 100, `ARCHIVED_RKN_SHOPEE: ${label} sudah tidak dijual/ditampilkan; tidak perlu canonical SKU`, 1, emptyInventory("ARCHIVED", "Listing legacy/inactive: simpan histori saja, jangan potong stok dan jangan blokir export aktif"));
  }
  if (productId === "1735241403532608932") {
    const inv = emptyInventory("RANDOM_SUGGESTION", "Scrunchie Mini dijual sebagai Random; warna fisik dipilih saat fulfillment dari stok gudang");
    inv.recipeType = "RANDOM";
    inv.fulfillmentAction = "SUGGEST_FROM_WAREHOUSE_STOCK";
    return result(
      "SCR-MINI",
      "RKN-PRD-RND-SCR-MINI",
      "RND-SCR-MINI-1",
      "READY",
      100,
      "Product ID TikTok erkaenveil dikunci sebagai Scrunchie Mini; Random memakai SKU virtual canonical RND-SCR-MINI-1",
      1,
      inv
    );
  }
  // Shopee erkaenveil 48001564420:
  // Listing satuan Scrunchie Tille dengan tier marketplace JUMBO dan Medium.
  // Export Shopee meratakan kedua tier menjadi variation seperti "hitam,mocca",
  // sehingga family fisik SCR-J vs SCR-M tidak boleh ditebak dari variation text.
  // Marketplace SKU dianggap valid, tetapi alokasi SKU fisik ditahan di Inventory Review.
  if (productId === "48001564420") {
    const marketplaceVariantKey = normalize(variation)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase();

    const virtualSku =
      `MP-EV-48001564420-${marketplaceVariantKey || "VAR"}`;

    const inv = emptyInventory(
      "WAITING_ALLOCATION",
      "Shopee 48001564420 memakai tier JUMBO/Medium yang diratakan menjadi satu variation; jangan potong SCR-J/SCR-M sampai tier fisik dapat ditentukan dengan aman"
    );

    return result(
      "",
      "",
      virtualSku,
      "READY",
      100,
      "Marketplace sell-SKU valid; identity fisik Jumbo/Medium ditunda ke Waiting Allocation agar stok tidak salah potong",
      1,
      inv
    );
  }
  if (MASTER_EXPANSION_REVIEW_PRODUCT_IDS[productId]) {
    const label = MASTER_EXPANSION_REVIEW_PRODUCT_IDS[productId];
    return result("", "", "", "REVIEW", 80, `MASTER_EXPANSION_REQUIRED: ${label} adalah model fisik tersendiri dan belum memiliki family canonical di Blueprint`, detectQty(title, variation), emptyInventory("BLOCKED", "Family fisik belum dibuat di master; jangan potong stok atau memaksa ke family mirip"));
  }

  const effectiveVariation = cleanLegacyVariation(productId, title, currentParent, currentSku, variation);
  const families = new Set(skuColors.map((r) => String(r.PRODUCT_FAMILY || "").trim()).filter(Boolean));
  const qty = PRODUCT_ID_BUNDLE_QTY_OVERRIDES[productId] || Math.max(detectQty(title, effectiveVariation), bundleQtyFromSku(currentSku, currentParent));
  const semantic = semanticFamilyOverride({ productId, title, variation: effectiveVariation, currentParent, currentSku, families });

  const bySku = new Map(skuColors.map((r) => [String(r.SKU_VARIAN || "").toUpperCase().trim(), r]));
  const exact = bySku.get(String(currentSku).toUpperCase().trim());
  if (exact && (!semantic || semantic.family === String(exact.PRODUCT_FAMILY || ""))) {
    const suggestedSku = String(exact.SKU_VARIAN);
    const suggestedParent = String(exact.SKU_INDUK);
    const exactInventoryColor = String(exact.COLOR || "").trim();
    const inv = buildInventoryRecipe(
      String(exact.PRODUCT_FAMILY),
      exactInventoryColor || effectiveVariation,
      1,
      skuColors
    );
    return result(String(exact.PRODUCT_FAMILY), suggestedParent, suggestedSku, "READY", 100, "SKU marketplace sudah exact dengan master canonical", 1, inv);
  }

  // V3.2 DIRECT STRUCTURED LOCK:
  // A canonical/package SKU already encodes the family and must beat noisy marketplace titles.
  // Example: PKT-BHM-M-3 / RKN-PRD-PKT-BHM-M-3 => BHM-M.
  // We only refuse the direct lock when Parent and SKU disagree, or when the variation itself
  // explicitly contradicts the encoded family (e.g. Size L against BHM-M).
  const directParentFamily = structuredFamilyFromSku(currentParent, families);
  const directSkuFamily = structuredFamilyFromSku(currentSku, families);
  if (!semantic && directParentFamily && directSkuFamily && directParentFamily !== directSkuFamily) {
    return result(
      "", "", "", "REVIEW", 70,
      `Konflik SKU terstruktur: Parent=${directParentFamily} tetapi SKU=${directSkuFamily}; perlu review`,
      qty,
      emptyInventory("BLOCKED", "Parent/SKU terstruktur berbeda sehingga family inventory belum aman")
    );
  }

  const directFamily = directParentFamily || directSkuFamily;
  if (!semantic && directFamily && variationContradictsLockedFamily(effectiveVariation, directFamily)) {
    return result(
      "", "", "", "REVIEW", 72,
      `SKU/Parent mengarah ke ${directFamily}, tetapi variasi memberi discriminator yang bertentangan; perlu review`,
      qty,
      emptyInventory("BLOCKED", "Variasi bertentangan dengan family pada SKU/Parent")
    );
  }

  const familyHit = semantic
    ? semantic
    : directFamily
      ? {
          family: directFamily,
          confidence: 100,
          reason: `Family dikunci dari SKU/Parent terstruktur (${directParentFamily ? currentParent : currentSku})`,
        }
      : detectFamily(title, effectiveVariation, currentSku, families, currentParent, productLock);

  if (!familyHit.family) {
    return result("", "", "", familyHit.confidence ? "REVIEW" : "BLOCKED", familyHit.confidence, familyHit.reason, qty, emptyInventory("BLOCKED", "Keluarga produk belum terkunci sehingga komponen stok belum dapat ditentukan"));
  }

  const inv = buildInventoryRecipe(familyHit.family, effectiveVariation, qty, skuColors);
  // Existing random seller SKU is already a virtual canonical identity. Some TikTok listings
  // use variation labels only as "Medium" / "Jumbo", so the word Random is not present in
  // the variation even though the seller SKU proves the random virtual SKU.
  const currentSkuUpper = String(currentSku || "").toUpperCase().trim();
  const randomVirtualByFamily: Record<string, string> = {
    "SCR-J": "RND-SCR-J-1",
    "SCR-M": "RND-SCR-M-1",
    "MST-JMP": "RND-MST-JMP-1",
    "HJB-JIS-2IN1": "RND-HJB-JIS-2IN1-1",
  };
  const expectedRandomVirtual = randomVirtualByFamily[familyHit.family] || "";
  if (expectedRandomVirtual && currentSkuUpper === expectedRandomVirtual) {
    const randomInv = emptyInventory("RANDOM_SUGGESTION", "SKU jual Random canonical; warna fisik ditentukan saat fulfillment dari stok gudang");
    randomInv.recipeType = "RANDOM";
    randomInv.fulfillmentAction = "SUGGEST_FROM_WAREHOUSE_STOCK";
    return result(
      familyHit.family,
      familyHit.family === "MST-JMP" ? "RKN-PRD-RND-MST-JMP" :
      familyHit.family === "HJB-JIS-2IN1" ? "RKN-PRD-RND-HJB-JIS-2IN1" : "RKN-PRD-RND-SCR",
      expectedRandomVirtual,
      "READY",
      100,
      `${familyHit.reason}; SKU Random virtual canonical sudah dikenali`,
      qty,
      randomInv
    );
  }

  // Shopee erkaenscarf: "Custom" pada Hijab Sport Nonpet Size S berarti bebas pilih warna.
  // SKU jual diselesaikan sebagai virtual request SKU; warna fisik dialokasikan saat picking.
  if (
    productId === "27450467066" &&
    familyHit.family === "BSM-S" &&
    /\bcustom\b/.test(normalize(effectiveVariation))
  ) {
    const requestInv = emptyInventory(
      "WAITING_ALLOCATION",
      "Custom = bebas pilih warna BSM-S; warna fisik dialokasikan saat picking/fulfillment"
    );

    return result(
      "BSM-S",
      "RKN-PRD-BSM-S",
      "REQ-BSM-S-1",
      "READY",
      100,
      "Product ID registry 27450467066: BSM-S free-choice color; memakai virtual sell SKU REQ-BSM-S-1",
      qty,
      requestInv
    );
  }
  // Canonical virtual SKU for single-item request/free-choice variants. The physical color
  // remains waiting allocation and is never guessed from the marketplace label.
  if (inv.status === "WAITING_ALLOCATION" && familyHit.family === "SCR-M" && /\b(?:req|request)\s+warna\b/.test(normalize(effectiveVariation))) {
    return result(
      familyHit.family,
      "RKN-PRD-REQ-SCR-M",
      "REQ-SCR-M-1",
      "READY",
      Math.min(Math.max(familyHit.confidence, 97), 100),
      `${familyHit.reason}; request warna memakai SKU virtual canonical REQ-SCR-M-1; warna fisik dialokasikan saat fulfillment`,
      qty,
      inv
    );
  }

  // Mapping SKU jual dan status inventory sengaja dipisah.
  // Semua akun WAJIB memakai virtual bundle SKU canonical yang sama. Legacy SKU toko
  // seperti PKT-CMP-3-S..., PKT-CMT-2-T..., DFT-KH-PKT-... hanya bukti identitas dan
  // tidak pernah dipertahankan sebagai SKU FINAL.
  if (qty > 1) {
    const bundleSku = canonicalBundleSku(familyHit.family, qty);
    return result(
      familyHit.family,
      `RKN-PRD-${bundleSku}`,
      bundleSku,
      "READY",
      Math.min(Math.max(familyHit.confidence, 94), 100),
      `Paket ${qty} PCS dinormalisasi ke virtual bundle SKU canonical lintas akun ${bundleSku}. Inventory: ${inv.reason}`,
      qty,
      inv
    );
  }

  const parentHit = canonicalParentForFamily(familyHit.family, skuColors);
  if (!parentHit.consistent) {
    return result(familyHit.family, "", "", "BLOCKED", 0, `MASTER_SKU_COLOR memiliki lebih dari satu SKU Induk untuk keluarga ${familyHit.family}; diblokir agar Parent SKU tidak mencar`, qty, inv);
  }

  // Random sell variants use one canonical virtual SKU per physical family.
  if (inv.status === "RANDOM_SUGGESTION" && (familyHit.family === "SCR-J" || familyHit.family === "SCR-M" || familyHit.family === "MST-JMP" || familyHit.family === "HJB-JIS-2IN1")) {
    const virtualSku =
      familyHit.family === "SCR-J" ? "RND-SCR-J-1" :
      familyHit.family === "SCR-M" ? "RND-SCR-M-1" :
      familyHit.family === "MST-JMP" ? "RND-MST-JMP-1" :
      "RND-HJB-JIS-2IN1-1";
    const virtualParent = familyHit.family === "MST-JMP" ? "RKN-PRD-RND-MST-JMP" :
      familyHit.family === "HJB-JIS-2IN1" ? "RKN-PRD-RND-HJB-JIS-2IN1" : "RKN-PRD-RND-SCR";
    return result(
      familyHit.family,
      virtualParent,
      virtualSku,
      "READY",
      Math.min(Math.max(familyHit.confidence, 97), 100),
      `${familyHit.reason}; varian Random memakai SKU virtual canonical ${virtualSku}; ${inv.reason}`,
      qty,
      inv
    );
  }

  // FREE_CHOICE / RANDOM are valid sell-SKU states, not mapping errors. Keep the existing
  // marketplace SKU as a virtual sell SKU and defer physical unit-SKU allocation to fulfillment.
  if (inv.status === "WAITING_ALLOCATION" || inv.status === "RANDOM_SUGGESTION") {
    const virtualSku = String(currentSku || "").trim();
    if (virtualSku) {
      return result(
        familyHit.family,
        currentParent || parentHit.parent,
        virtualSku,
        "READY",
        Math.min(familyHit.confidence, 97),
        `${familyHit.reason}; SKU jual virtual dipertahankan; ${inv.reason}`,
        qty,
        inv
      );
    }
  }

  const color = findColorMatch(familyHit.family, effectiveVariation, skuColors);
  if (color) {
    return result(
      familyHit.family,
      parentHit.parent,
      String(color.SKU_VARIAN),
      "READY",
      Math.min(familyHit.confidence, 97),
      `${familyHit.reason}; warna cocok ke ${String(color.COLOR)}; parent dikunci ${parentHit.parent}`,
      qty,
      inv
    );
  }

  return result(familyHit.family, parentHit.parent, "", "REVIEW", Math.min(82, familyHit.confidence), `${familyHit.reason}; keluarga sudah terkunci tetapi warna/varian belum cocok ke master`, qty, inv);

  function emptyInventory(status: InventoryStatus, reason: string) {
    return {
      status,
      recipeType: "UNKNOWN" as BundleRecipeType,
      fulfillmentAction: status === "BLOCKED" ? "BLOCKED" : "REVIEW",
      colorNames: [] as string[],
      components: [] as Array<{ sku: string; color: string; qty: number }>,
      skus: [] as string[],
      detail: "",
      reason,
    };
  }

  function result(fam: string, parent: string, sku: string, status: MappingStatus, confidence: number, reason: string, bundleQty: number, inv: ReturnType<typeof buildInventoryRecipe> | ReturnType<typeof emptyInventory>) {
    return {
      family: fam,
      parent,
      sku,
      status,
      confidence,
      reason,
      bundleQty,
      bundleType: inv.recipeType,
      detectedColors: inv.colorNames.join(" + "),
      componentSkus: inv.skus.join(" + "),
      componentDetail: inv.detail,
      inventoryStatus: inv.status,
      fulfillmentAction: inv.fulfillmentAction,
      inventoryReason: inv.reason,
    };
  }
}


function columnIndexFromCellRef(ref: string) {
  const letters = String(ref || "").match(/^[A-Z]+/)?.[0] || "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + ch.charCodeAt(0) - 64;
  return Math.max(0, n - 1);
}

async function readFirstWorksheetMatrixExact(bytes: ArrayBuffer) {
  const zip = await JSZip.loadAsync(bytes);
  const parser = new DOMParser();

  const shared: string[] = [];
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("text");
  if (sharedXml) {
    const doc = parser.parseFromString(sharedXml, "application/xml");
    for (const si of Array.from(doc.getElementsByTagNameNS("*", "si"))) {
      shared.push(Array.from(si.getElementsByTagNameNS("*", "t")).map((t) => t.textContent || "").join(""));
    }
  }

  let sheetPath = "xl/worksheets/sheet1.xml";
  let sheetName = "Sheet1";
  const wbXml = await zip.file("xl/workbook.xml")?.async("text");
  const relXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("text");
  if (wbXml && relXml) {
    const wb = parser.parseFromString(wbXml, "application/xml");
    const rels = parser.parseFromString(relXml, "application/xml");
    const firstSheet = Array.from(wb.getElementsByTagNameNS("*", "sheet"))[0];
    if (firstSheet) {
      sheetName = firstSheet.getAttribute("name") || sheetName;
      const rid = firstSheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || firstSheet.getAttribute("r:id") || "";
      const relation = Array.from(rels.getElementsByTagNameNS("*", "Relationship")).find((r) => r.getAttribute("Id") === rid);
      const target = relation?.getAttribute("Target") || "";
      if (target) {
        sheetPath = target.startsWith("/")
          ? target.replace(/^\/+/, "")
          : `xl/${target}`.replace(/\/\.\//g, "/");
      }
    }
  }

  const sheetXml = await zip.file(sheetPath)?.async("text");
  if (!sheetXml) return null;
  const doc = parser.parseFromString(sheetXml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return null;

  const matrix: string[][] = [];
  for (const row of Array.from(doc.getElementsByTagNameNS("*", "row"))) {
    const rowNumber = Math.max(1, Number(row.getAttribute("r") || matrix.length + 1));
    while (matrix.length < rowNumber) matrix.push([]);
    const target = matrix[rowNumber - 1];
    for (const cell of Array.from(row.getElementsByTagNameNS("*", "c"))) {
      const col = columnIndexFromCellRef(cell.getAttribute("r") || "A1");
      const type = cell.getAttribute("t") || "";
      let value = "";
      if (type === "inlineStr") {
        value = Array.from(cell.getElementsByTagNameNS("*", "t")).map((t) => t.textContent || "").join("");
      } else {
        const raw = Array.from(cell.getElementsByTagNameNS("*", "v"))[0]?.textContent || "";
        if (type === "s") value = shared[Number(raw)] ?? raw;
        else if (type === "b") value = raw === "1" ? "TRUE" : "FALSE";
        else value = raw;
      }
      while (target.length <= col) target.push("");
      target[col] = value;
    }
  }
  return { sheetName, matrix };
}

function findHeaderRowIndex(matrix: string[][]) {
  const limit = Math.min(matrix.length, 15);
  for (let i = 0; i < limit; i++) {
    if (detectPlatform((matrix[i] || []).map((v) => String(v ?? ""))) !== "UNKNOWN") return i;
  }
  return 0;
}

export async function parseMarketplaceFile(
  file: File,
  stores: GenericRow[],
  skuColors: GenericRow[],
  sourceContainerName = file.name,
  sourceKind: "XLSX" | "TIKTOK_ZIP" = "XLSX"
): Promise<ImportedMarketplaceFile> {
  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array", cellDates: false, cellStyles: false });
  let sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  let matrix = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(sheet, { header: 1, raw: false, defval: "" }) as unknown as string[][];

  // TikTok uses 17-19 digit IDs plus multi-row instruction headers. Read the raw XLSX XML
  // for ZIP imports so IDs are preserved as exact strings and never collapse to scientific
  // notation/precision-lost JS numbers.
  if (sourceKind === "TIKTOK_ZIP") {
    const exact = await readFirstWorksheetMatrixExact(bytes);
    if (exact?.matrix?.length) {
      matrix = exact.matrix;
      sheetName = exact.sheetName;
    }
  }

  const headerRowIndex = findHeaderRowIndex(matrix);
  const header = (matrix[headerRowIndex] || []).map((v) => String(v ?? ""));
  const platform = detectPlatform(header);
  const sharedStrings = await readSharedStringsText(file);
  const detection = platform === "SHOPEE"
    ? detectShopeeStore(sourceContainerName || file.name, sharedStrings, stores)
    : platform === "TIKTOK"
      ? detectTikTokStore(sharedStrings, matrix, stores)
      : { storeId: "", fingerprint: "", status: "UNKNOWN" as const, confidence: 0, reason: "Format marketplace belum dikenali" };
  const storeId = detection.storeId || detectStoreId(sourceContainerName || file.name, platform, stores);

  const columns = platform === "SHOPEE"
    ? {
        productId: headerIndex(header, ["et_title_product_id"]),
        productName: headerIndex(header, ["et_title_product_name"]),
        variationId: headerIndex(header, ["et_title_variation_id"]),
        variationName: headerIndex(header, ["et_title_variation_name"]),
        parentSku: headerIndex(header, ["et_title_parent_sku"]),
        sellerSku: headerIndex(header, ["et_title_variation_sku"]),
        price: headerIndex(header, ["et_title_variation_price"]),
        stock: headerIndex(header, ["et_title_variation_stock"]),
      }
    : {
        productId: headerIndex(header, ["product_id"]),
        productName: headerIndex(header, ["product_name"]),
        variationId: headerIndex(header, ["sku_id"]),
        variationName: headerIndex(header, ["variation_value"]),
        parentSku: -1,
        sellerSku: headerIndex(header, ["seller_sku"]),
        price: headerIndex(header, ["price"]),
        stock: headerIndex(header, ["quantity"]),
      };

  if (platform === "UNKNOWN" || columns.productId < 0 || columns.productName < 0 || columns.sellerSku < 0) {
    throw new Error(`${file.name}: format belum dikenali sebagai Mass Update Shopee/TikTok.`);
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const rawRows: Array<{
    source: string[]; excelRow: number; productId: string; title: string; variation: string; currentParent: string; currentSku: string;
  }> = [];
  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const source = matrix[i] || [];
    const productId = String(source[columns.productId] ?? "").trim();
    const title = String(source[columns.productName] ?? "").trim();
    if (!/^\d{6,}$/.test(productId) || !title) continue;
    rawRows.push({
      source,
      excelRow: i + 1,
      productId,
      title,
      variation: String(source[columns.variationName] ?? "").trim(),
      currentParent: columns.parentSku >= 0 ? String(source[columns.parentSku] ?? "").trim() : "",
      currentSku: String(source[columns.sellerSku] ?? "").trim(),
    });
  }

  const productLocks = buildProductFamilyLocks(rawRows, skuColors);
  const rows: MappingRow[] = [];
  for (const raw of rawRows) {
    const { source, excelRow, productId, title: productName, variation, currentParent, currentSku } = raw;
    const mapped = mappingFor({
      productId,
      title: productName,
      variation,
      currentParent,
      currentSku,
      skuColors,
      productLock: productLocks.get(productId) || null,
    });
    rows.push({
      FILE_ID: id,
      FILE_NAME: file.name,
      STORE_ID: storeId,
      PLATFORM: platform,
      EXCEL_ROW: excelRow,
      PRODUCT_ID: productId,
      PRODUCT_NAME: productName,
      VARIATION_ID: String(source[columns.variationId] ?? "").trim(),
      VARIATION_NAME: variation,
      CURRENT_PARENT_SKU: currentParent,
      CURRENT_SKU: currentSku,
      PRODUCT_FAMILY: mapped.family,
      SUGGESTED_PARENT_SKU: mapped.parent,
      SUGGESTED_SKU: mapped.sku,
      MATCH_STATUS: mapped.status,
      CONFIDENCE: mapped.confidence,
      CHANGE: mapped.sku && normalize(mapped.sku) !== normalize(currentSku) ? "YES" : "NO",
      REASON: mapped.reason,
      PRICE: String(source[columns.price] ?? "").trim(),
      STOCK: String(source[columns.stock] ?? "").trim(),
      BUNDLE_QTY: mapped.bundleQty,
      BUNDLE_TYPE: mapped.bundleType,
      DETECTED_COLORS: mapped.detectedColors,
      COMPONENT_SKUS: mapped.componentSkus,
      COMPONENT_DETAIL: mapped.componentDetail,
      INVENTORY_STATUS: mapped.inventoryStatus,
      FULFILLMENT_ACTION: mapped.fulfillmentAction,
      INVENTORY_REASON: mapped.inventoryReason,
    });
  }

  return {
    id,
    file,
    fileName: file.name,
    sourceContainerName,
    sourceKind,
    sheetName,
    platform,
    storeId,
    storeFingerprint: detection.fingerprint,
    storeDetection: detection.status,
    storeConfidence: detection.confidence,
    detectionReason: detection.reason,
    header,
    columns,
    rows,
  };
}

export async function parseMarketplaceInput(file: File, stores: GenericRow[], skuColors: GenericRow[]): Promise<ImportedMarketplaceFile[]> {
  if (!/\.zip$/i.test(file.name)) return [await parseMarketplaceFile(file, stores, skuColors)];

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.keys(zip.files)
    .map((name) => zip.files[name])
    .filter((entry) => !entry.dir && /\.xlsx?$/i.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!entries.length) throw new Error(`${file.name}: ZIP TikTok tidak berisi file XLSX.`);

  const parsed: ImportedMarketplaceFile[] = [];
  for (const entry of entries) {
    const bytes = await entry.async("uint8array");
    const innerName = entry.name.split("/").pop() || entry.name;
    const inner = new File([bytes], innerName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    parsed.push(await parseMarketplaceFile(inner, stores, skuColors, file.name, "TIKTOK_ZIP"));
  }

  if (parsed.some((p) => p.platform !== "TIKTOK")) throw new Error(`${file.name}: ZIP hanya didukung untuk export TikTok.`);

  // Jika salah satu bagian ZIP membawa URL toko yang jelas, propagasikan identitas itu ke semua bagian ZIP.
  const autoIds = Array.from(new Set(parsed.filter((p) => p.storeDetection === "AUTO" && p.storeId).map((p) => p.storeId)));
  if (autoIds.length === 1) {
    const storeId = autoIds[0];
    const seed = parsed.find((p) => p.storeId === storeId && p.storeDetection === "AUTO");
    return parsed.map((p) => ({
      ...p,
      storeId,
      storeFingerprint: p.storeFingerprint || seed?.storeFingerprint || "",
      storeDetection: "AUTO",
      storeConfidence: Math.max(p.storeConfidence, seed?.storeConfidence || 100),
      detectionReason: p.storeId === storeId && p.storeDetection === "AUTO"
        ? p.detectionReason
        : `Identitas diwariskan dari file lain dalam ZIP yang sama · ${seed?.detectionReason || "fingerprint TikTok valid"}`,
      rows: p.rows.map((r) => ({ ...r, STORE_ID: storeId })),
    }));
  }
  if (autoIds.length > 1) {
    return parsed.map((p) => ({ ...p, storeId: "", storeDetection: "CONFLICT", storeConfidence: 0, detectionReason: `ZIP mengandung fingerprint lebih dari satu toko: ${autoIds.join(", ")}`, rows: p.rows.map((r) => ({ ...r, STORE_ID: "" })) }));
  }
  return parsed;
}

function colLetter(index: number) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function setInlineString(xml: Document, rowNumber: number, colIndex: number, value: string) {
  if (colIndex < 0) return;
  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const addr = `${colLetter(colIndex)}${rowNumber}`;
  const rows = Array.from(xml.getElementsByTagNameNS(ns, "row"));
  let row = rows.find((r) => r.getAttribute("r") === String(rowNumber));
  if (!row) return;
  let cell = Array.from(row.getElementsByTagNameNS(ns, "c")).find((c) => c.getAttribute("r") === addr) || null;
  const style = cell?.getAttribute("s") || "";
  if (!cell) {
    cell = xml.createElementNS(ns, "c");
    cell.setAttribute("r", addr);
    const targetCol = colIndex;
    const cells = Array.from(row.getElementsByTagNameNS(ns, "c"));
    const before = cells.find((c) => {
      const ref = c.getAttribute("r") || "";
      const letters = ref.match(/^[A-Z]+/)?.[0] || "A";
      let idx = 0;
      for (const ch of letters) idx = idx * 26 + ch.charCodeAt(0) - 64;
      return idx - 1 > targetCol;
    });
    if (before) row.insertBefore(cell, before); else row.appendChild(cell);
  } else {
    while (cell.firstChild) cell.removeChild(cell.firstChild);
  }
  if (style) cell.setAttribute("s", style);
  cell.setAttribute("t", "inlineStr");
  const is = xml.createElementNS(ns, "is");
  const t = xml.createElementNS(ns, "t");
  if (/^\s|\s$/.test(value)) t.setAttribute("xml:space", "preserve");
  t.textContent = value;
  is.appendChild(t);
  cell.appendChild(is);
}

export async function buildPatchedWorkbook(imported: ImportedMarketplaceFile, finalOnly = false) {
  const unresolved = imported.rows.filter((r) => r.MATCH_STATUS === "REVIEW" || r.MATCH_STATUS === "BLOCKED").length;
  if (finalOnly && unresolved) throw new Error(`${imported.fileName}: masih ada ${unresolved} baris REVIEW/BLOCKED aktif.`);

  const zip = await JSZip.loadAsync(await imported.file.arrayBuffer());
  const sheetPath = "xl/worksheets/sheet1.xml";
  const entry = zip.file(sheetPath);
  if (!entry) throw new Error(`${imported.fileName}: worksheet utama tidak ditemukan.`);
  const xmlText = await entry.async("text");
  const xml = new DOMParser().parseFromString(xmlText, "application/xml");
  if (xml.getElementsByTagName("parsererror").length) throw new Error(`${imported.fileName}: gagal membaca struktur worksheet.`);

  const firstRowByProduct = new Map<string, number>();
  for (const row of imported.rows) {
    if (!firstRowByProduct.has(row.PRODUCT_ID)) firstRowByProduct.set(row.PRODUCT_ID, row.EXCEL_ROW);
  }

  for (const row of imported.rows) {
    if (row.MATCH_STATUS !== "READY" || !row.SUGGESTED_SKU) continue;
    setInlineString(xml, row.EXCEL_ROW, imported.columns.sellerSku, row.SUGGESTED_SKU);
    if (imported.platform === "SHOPEE" && imported.columns.parentSku >= 0 && firstRowByProduct.get(row.PRODUCT_ID) === row.EXCEL_ROW && row.SUGGESTED_PARENT_SKU) {
      setInlineString(xml, row.EXCEL_ROW, imported.columns.parentSku, row.SUGGESTED_PARENT_SKU);
    }
  }

  const outXml = new XMLSerializer().serializeToString(xml);
  zip.file(sheetPath, outXml);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function buildAllZip(files: ImportedMarketplaceFile[], finalOnly: boolean) {
  const out = new JSZip();
  for (const imported of files) {
    const blob = await buildPatchedWorkbook(imported, finalOnly);
    const base = imported.fileName.replace(/\.xlsx?$/i, "");
    const unresolved = imported.rows.filter((r) => r.MATCH_STATUS === "REVIEW" || r.MATCH_STATUS === "BLOCKED").length;
    const suffix = finalOnly ? "FINAL" : unresolved ? `DRAFT_${unresolved}_REVIEW` : "READY";
    const folder = imported.storeId || "UNKNOWN_STORE";
    const source = imported.sourceKind === "TIKTOK_ZIP" ? imported.sourceContainerName.replace(/\.zip$/i, "") : "SHOPEE";
    out.file(`${folder}/${source}/${base}_${suffix}.xlsx`, blob);
  }
  return out.generateAsync({ type: "blob", compression: "DEFLATE" });
}
