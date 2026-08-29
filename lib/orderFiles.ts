import * as XLSX from "xlsx";

export type OrderStoreCandidate = {
  storeId: string;
  storeName: string;
  score: number;
  coverage: number;
};

export type NormalizedOrderRow = {
  FILE_NAME: string;
  SOURCE_ROW: number;

  PLATFORM: string;
  STORE_ID: string;
  STORE_NAME: string;
  STORE_DETECTION: string;

  ORDER_ID: string;
  ORDER_DATE: string;
  ORDER_STATUS: string;

  PARENT_SKU: string;
  SOURCE_SKU: string;

  PRODUCT_NAME: string;
  VARIATION_NAME: string;
  QTY: number;

  BUYER_NOTE: string;
  TRACKING_NO: string;

  MATCH_STATUS: string;
  MATCH_TYPE: string;

  CANONICAL_PARENT_SKU: string;
  CANONICAL_SKU: string;
  PRODUCT_FAMILY: string;

  INVENTORY_STATUS: string;
  INVENTORY_REASON: string;

  LINE_KEY: string;
};

export type OrderFileAnalysis = {
  fileName: string;
  platform: "SHOPEE" | "TIKTOK" | "UNKNOWN";
  formatValid: boolean;
  formatReason: string;

  detectedStoreId: string;
  detectedStoreName: string;
  storeDetection: "AUTO" | "REVIEW" | "UNKNOWN" | "MANUAL";
  confidence: number;

  orderCount: number;
  itemCount: number;
  matchedCount: number;
  reviewCount: number;
  waitingCount: number;
  randomCount: number;

  candidates: OrderStoreCandidate[];
  rows: NormalizedOrderRow[];
};

type SourceOrderRow = {
  sourceRow: number;
  orderId: string;
  orderDate: string;
  orderStatus: string;

  parentSku: string;
  sourceSku: string;

  productName: string;
  variationName: string;
  qty: number;

  buyerNote: string;
  trackingNo: string;
};

type CatalogRecord = Record<string, unknown>;

function rec(value: unknown): CatalogRecord {
  return (value && typeof value === "object"
    ? value
    : {}) as CatalogRecord;
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function norm(value: unknown): string {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: unknown): string {
  return norm(value).replace(/\s+/g, "");
}

function qtyValue(value: unknown): number {
  const raw = text(value).replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function get(
  headers: string[],
  row: unknown[],
  aliases: string[]
): string {
  const wanted = new Set(aliases.map(norm));

  for (let i = 0; i < headers.length; i += 1) {
    if (wanted.has(norm(headers[i]))) {
      return text(row[i]);
    }
  }

  return "";
}

function findShopeeSheet(workbook: ReturnType<typeof XLSX.read>): {
  matrix: unknown[][];
  headerIndex: number;
} | null {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];

    const maxScan = Math.min(matrix.length, 20);

    for (let r = 0; r < maxScan; r += 1) {
      const headers = (matrix[r] || []).map(text);
      const normalized = headers.map(norm);

      const hasOrder =
        normalized.includes(norm("No. Pesanan"));

      const hasProduct =
        normalized.includes(norm("Nama Produk"));

      const hasQty =
        normalized.includes(norm("Jumlah"));

      if (hasOrder && hasProduct && hasQty) {
        return {
          matrix,
          headerIndex: r,
        };
      }
    }
  }

  return null;
}

function parseShopeeRows(
  fileName: string,
  matrix: unknown[][],
  headerIndex: number
): SourceOrderRow[] {
  const headers = (matrix[headerIndex] || []).map(text);
  const out: SourceOrderRow[] = [];

  for (let r = headerIndex + 1; r < matrix.length; r += 1) {
    const row = matrix[r] || [];

    const orderId = get(headers, row, [
      "No. Pesanan",
      "Nomor Pesanan",
      "Order ID",
    ]);

    const productName = get(headers, row, [
      "Nama Produk",
      "Product Name",
    ]);

    const variationName = get(headers, row, [
      "Nama Variasi",
      "Variasi",
      "Variation Name",
      "Variation",
    ]);

    const sourceSku = get(headers, row, [
      "Nomor Referensi SKU",
      "SKU",
      "Seller SKU",
    ]);

    if (
      !orderId &&
      !productName &&
      !variationName &&
      !sourceSku
    ) {
      continue;
    }

    out.push({
      sourceRow: r + 1,

      orderId,

      orderDate: get(headers, row, [
        "Waktu Pesanan Dibuat",
        "Tanggal Pesanan",
        "Created Time",
      ]),

      orderStatus: get(headers, row, [
        "Status Pesanan",
        "Order Status",
      ]),

      parentSku: get(headers, row, [
        "SKU Induk",
        "Parent SKU",
      ]),

      sourceSku,

      productName,
      variationName,

      qty: qtyValue(
        get(headers, row, [
          "Jumlah",
          "Qty",
          "Quantity",
        ])
      ),

      buyerNote: get(headers, row, [
        "Catatan dari Pembeli",
        "Catatan Pembeli",
        "Buyer Note",
        "Buyer Message",
      ]),

      trackingNo: get(headers, row, [
        "No. Resi",
        "Nomor Resi",
        "Tracking Number",
      ]),
    });
  }

  return out;
}

function catalogRowsForStore(
  catalogRows: readonly unknown[],
  storeId: string
): CatalogRecord[] {
  return catalogRows
    .map(rec)
    .filter(
      (row) =>
        text(row.STORE_ID) === storeId &&
        text(row.PLATFORM).toUpperCase() === "SHOPEE"
    );
}

function variationMatchLevel(
  orderVariation: unknown,
  catalogVariation: unknown
): number {
  const a = norm(orderVariation);
  const b = norm(catalogVariation);

  if (!a || !b) return 0;

  // Exact variation.
  if (a === b) return 3;

  const generic = new Set([
    "jumbo",
    "medium",
    "mini",
    "small",
    "large",
    "xl",
    "xxl",
    "s",
    "m",
    "l",
    "random",
    "custom",
    "bebas",
    "pilih",
    "warna",
  ]);

  const tokenizeVariation = (value: string): string[] =>
    value
      .replace(/[,;/|:+()[\]{}_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);

  const aTokens = tokenizeVariation(a);
  const bTokens = tokenizeVariation(b);

  const shorter =
    aTokens.length <= bTokens.length ? aTokens : bTokens;

  const longer =
    aTokens.length <= bTokens.length ? bTokens : aTokens;

  const allShorterInside = shorter.every((token) =>
    longer.includes(token)
  );

  const meaningfulShorter = shorter.filter(
    (token) => !generic.has(token)
  );

  // Example:
  // "abu abu jumbo" <-> "abu abu"
  // "hitam jumbo"   <-> "hitam"
  //
  // Strong compatible match only when there is a meaningful
  // discriminator such as a color, not merely "jumbo".
  if (
    allShorterInside &&
    meaningfulShorter.length > 0
  ) {
    return 2;
  }

  const aMeaningful = new Set(
    aTokens.filter((token) => !generic.has(token))
  );

  const bMeaningful = new Set(
    bTokens.filter((token) => !generic.has(token))
  );

  if (
    aMeaningful.size > 0 &&
    bMeaningful.size > 0
  ) {
    const intersection = [...aMeaningful].filter((token) =>
      bMeaningful.has(token)
    ).length;

    const denominator = Math.max(
      aMeaningful.size,
      bMeaningful.size
    );

    const ratio =
      denominator > 0
        ? intersection / denominator
        : 0;

    if (ratio >= 0.75) return 1;
  }

  return 0;
}

function productMatchLevel(
  orderProduct: unknown,
  catalogProduct: unknown
): number {
  const a = norm(orderProduct);
  const b = norm(catalogProduct);

  if (!a || !b) return 0;

  // Exact normalized title.
  if (a === b) return 3;

  const aTokens = new Set(
    a.split(" ").filter((token) => token.length > 1)
  );

  const bTokens = new Set(
    b.split(" ").filter((token) => token.length > 1)
  );

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  const intersection = [...aTokens].filter((token) =>
    bTokens.has(token)
  ).length;

  const smaller = Math.min(aTokens.size, bTokens.size);
  const larger = Math.max(aTokens.size, bTokens.size);

  const containment =
    smaller > 0 ? intersection / smaller : 0;

  const coverage =
    larger > 0 ? intersection / larger : 0;

  // Strong historical-title compatibility.
  // Allows a small typo / added marketing word without
  // turning broad product-family names into an automatic match.
  if (
    intersection >= 4 &&
    containment >= 0.9 &&
    coverage >= 0.78
  ) {
    return 2;
  }

  // Conservative weaker compatibility.
  // This only becomes useful together with strong variation evidence.
  if (
    intersection >= 4 &&
    containment >= 0.8 &&
    coverage >= 0.68
  ) {
    return 1;
  }

  return 0;
}

function rowMatchScore(
  order: SourceOrderRow,
  mapping: CatalogRecord
): number {
  const sourceSku = norm(order.sourceSku);
  const parentSku = norm(order.parentSku);
  const product = norm(order.productName);
  const variation = norm(order.variationName);

  const currentSku = norm(mapping.CURRENT_SKU);
  const suggestedSku = norm(mapping.SUGGESTED_SKU);

  const currentParent = norm(mapping.CURRENT_PARENT_SKU);
  const suggestedParent = norm(mapping.SUGGESTED_PARENT_SKU);

  const productLevel = productMatchLevel(
    order.productName,
    mapping.PRODUCT_NAME
  );

  const variationLevel = variationMatchLevel(
    order.variationName,
    mapping.VARIATION_NAME
  );

  let score = 0;

  // ========================================================
  // Layer 1 - Exact / legacy SKU
  // ========================================================

  if (sourceSku) {
    if (sourceSku === currentSku) {
      score = Math.max(score, 100);
    }

    if (sourceSku === suggestedSku) {
      score = Math.max(score, 98);
    }
  }

  // ========================================================
  // Layer 2 - Parent SKU + variation
  // ========================================================

  if (
    parentSku &&
    (parentSku === currentParent ||
      parentSku === suggestedParent)
  ) {
    if (variationLevel === 3) {
      score = Math.max(score, 92);
    } else if (variationLevel === 2) {
      score = Math.max(score, 88);
    } else if (variationLevel === 1) {
      score = Math.max(score, 78);
    }
  }

  // ========================================================
  // Layer 3 - Product identity + variation
  // ========================================================

  if (product && productLevel === 3) {
    if (variationLevel === 3) {
      score = Math.max(score, 90);
    } else if (variationLevel === 2) {
      score = Math.max(score, 84);
    } else if (variationLevel === 1) {
      score = Math.max(score, 76);
    } else if (!variation) {
      score = Math.max(score, 45);
    }
  }

  // Historical product title, strong similarity.
  if (product && productLevel === 2) {
    if (variationLevel === 3) {
      score = Math.max(score, 86);
    } else if (variationLevel === 2) {
      score = Math.max(score, 82);
    } else if (variationLevel === 1) {
      score = Math.max(score, 77);
    }
  }

  // Weaker historical title compatibility is only accepted
  // when variation evidence is also strong.
  if (product && productLevel === 1) {
    if (variationLevel === 3) {
      score = Math.max(score, 79);
    } else if (variationLevel === 2) {
      score = Math.max(score, 76);
    }
  }

  // Small supporting bonus only for truly exact title.
  if (
    score >= 75 &&
    productLevel === 3
  ) {
    score += 3;
  }

  return Math.min(score, 100);
}
function scoreStore(
  orders: SourceOrderRow[],
  store: CatalogRecord,
  catalogRows: readonly unknown[],
  fileName: string
): OrderStoreCandidate {
  const storeId = text(store.STORE_ID);
  const storeName = text(store.STORE_NAME);

  const catalog = catalogRowsForStore(
    catalogRows,
    storeId
  );

  let score = 0;
  let matched = 0;

  for (const order of orders) {
    let best = 0;
    let bestMapping: CatalogRecord | null = null;

    for (const mapping of catalog) {
      const candidateScore = rowMatchScore(
        order,
        mapping
      );

      if (candidateScore > best) {
        best = candidateScore;
        bestMapping = mapping;
      }
    }

    const scrunchieCatalog = catalog
      .filter((mapping) =>
        norm(mapping.PRODUCT_NAME).includes("scrunch")
      )
      .slice(0, 20)
      .map((mapping) => ({
        productId: mapping.PRODUCT_ID || "",
        productName: mapping.PRODUCT_NAME || "",
        variationName: mapping.VARIATION_NAME || "",
        currentSku: mapping.CURRENT_SKU || "",
        suggestedSku: mapping.SUGGESTED_SKU || "",
        family: mapping.PRODUCT_FAMILY || "",
      }));

    const scrJCatalog = catalog
      .filter((mapping) =>
        norm(mapping.PRODUCT_FAMILY).includes("scr j") ||
        norm(mapping.SUGGESTED_SKU).includes("scr j") ||
        norm(mapping.CURRENT_SKU).includes("scr j")
      )
      .slice(0, 30)
      .map((mapping) => ({
        productId: mapping.PRODUCT_ID || "",
        productName: mapping.PRODUCT_NAME || "",
        variationName: mapping.VARIATION_NAME || "",
        currentSku: mapping.CURRENT_SKU || "",
        suggestedSku: mapping.SUGGESTED_SKU || "",
        family: mapping.PRODUCT_FAMILY || "",
        inventoryStatus: mapping.INVENTORY_STATUS || "",
      }));

    const knownScrunchieProducts = catalog
      .filter((mapping) =>
        ["48001564420", "23083039781"].includes(
          text(mapping.PRODUCT_ID)
        )
      )
      .map((mapping) => ({
        productId: mapping.PRODUCT_ID || "",
        productName: mapping.PRODUCT_NAME || "",
        variationName: mapping.VARIATION_NAME || "",
        currentSku: mapping.CURRENT_SKU || "",
        suggestedSku: mapping.SUGGESTED_SKU || "",
        family: mapping.PRODUCT_FAMILY || "",
        inventoryStatus: mapping.INVENTORY_STATUS || "",
      }));

    console.log("[RKN_KNOWN_SCRUNCHIE_IDS]", {
      storeId,
      storeName,
      rows: knownScrunchieProducts,
    });

    console.log("[RKN_SCRJ_CATALOG]", {
      storeId,
      storeName,
      count: catalog.filter((mapping) =>
        norm(mapping.PRODUCT_FAMILY).includes("scr j") ||
        norm(mapping.SUGGESTED_SKU).includes("scr j") ||
        norm(mapping.CURRENT_SKU).includes("scr j")
      ).length,
      rows: scrJCatalog,
    });

    console.log("[RKN_SCRUNCHIE_CATALOG]", {
      storeId,
      storeName,
      count: catalog.filter((mapping) =>
        norm(mapping.PRODUCT_NAME).includes("scrunch")
      ).length,
      rows: scrunchieCatalog,
    });

    console.log("[RKN_ORDER_DEBUG]", {
      storeId,
      storeName,
      catalogCount: catalog.length,
      orderId: order.orderId,
      orderProduct: order.productName,
      orderVariation: order.variationName,
      bestScore: best,
      bestCatalogProduct:
        bestMapping?.PRODUCT_NAME || "",
      bestCatalogVariation:
        bestMapping?.VARIATION_NAME || "",
      bestCurrentSku:
        bestMapping?.CURRENT_SKU || "",
      bestSuggestedSku:
        bestMapping?.SUGGESTED_SKU || "",
    });

    if (best >= 75) {
      matched += 1;
    }

    score += best;
  }

  const fileCompact = compact(fileName);
  const storeCompact = compact(storeName);

  if (
    storeCompact.length >= 4 &&
    fileCompact.includes(storeCompact)
  ) {
    score += 150;
  }

  const coverage =
    orders.length > 0
      ? matched / orders.length
      : 0;

  return {
    storeId,
    storeName,
    score,
    coverage,
  };
}

function detectStore(
  orders: SourceOrderRow[],
  stores: readonly unknown[],
  catalogRows: readonly unknown[],
  fileName: string
): {
  storeId: string;
  storeName: string;
  detection: "AUTO" | "REVIEW" | "UNKNOWN";
  confidence: number;
  candidates: OrderStoreCandidate[];
} {
  const shopeeStores = stores
    .map(rec)
    .filter(
      (store) =>
        text(store.PLATFORM).toUpperCase() === "SHOPEE"
    );

  const scored = shopeeStores
    .map((store) =>
      scoreStore(
        orders,
        store,
        catalogRows,
        fileName
      )
    )
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];

  if (!top || top.score <= 0) {
    return {
      storeId: "",
      storeName: "",
      detection: "UNKNOWN",
      confidence: 0,
      candidates: scored.slice(0, 3),
    };
  }

  const margin =
    top.score > 0
      ? Math.max(
          0,
          (top.score - (second?.score || 0)) /
            top.score
        )
      : 0;

  const filenameMatched =
    compact(top.storeName).length >= 4 &&
    compact(fileName).includes(
      compact(top.storeName)
    );

  let confidence = Math.round(
    Math.min(
      100,
      top.coverage * 70 +
        margin * 30 +
        (filenameMatched ? 15 : 0)
    )
  );

  if (filenameMatched && orders.length === 0) {
    confidence = 100;
  }

  const detection =
    filenameMatched ||
    (confidence >= 90 &&
      top.coverage >= 0.6 &&
      margin >= 0.15)
      ? "AUTO"
      : "REVIEW";

  return {
    storeId:
      detection === "AUTO"
        ? top.storeId
        : "",
    storeName:
      detection === "AUTO"
        ? top.storeName
        : "",
    detection,
    confidence,
    candidates: scored.slice(0, 3),
  };
}

function resolveOrder(
  order: SourceOrderRow,
  catalog: CatalogRecord[]
): {
  matchStatus: string;
  matchType: string;
  mapping: CatalogRecord | null;
} {
  const ranked = catalog
    .map((mapping) => ({
      mapping,
      score: rowMatchScore(order, mapping),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  if (!best) {
    return {
      matchStatus: "REVIEW",
      matchType: "UNMATCHED",
      mapping: null,
    };
  }

  const sameBest = ranked.filter(
    (item) => item.score === best.score
  );

  const canonicalSet = new Set(
    sameBest.map((item) =>
      text(
        item.mapping.SUGGESTED_SKU ||
          item.mapping.CURRENT_SKU
      )
    )
  );

  if (
    sameBest.length > 1 &&
    canonicalSet.size > 1
  ) {
    return {
      matchStatus: "REVIEW",
      matchType: "AMBIGUOUS",
      mapping: null,
    };
  }

  const mapping = best.mapping;

  const sourceSku = norm(order.sourceSku);
  const currentSku = norm(mapping.CURRENT_SKU);
  const suggestedSku = norm(mapping.SUGGESTED_SKU);

  let matchType = "PRODUCT_VARIATION";

  if (
    sourceSku &&
    sourceSku === currentSku &&
    currentSku !== suggestedSku
  ) {
    matchType = "LEGACY_SKU";
  } else if (
    sourceSku &&
    sourceSku === suggestedSku
  ) {
    matchType = "CANONICAL_SKU";
  } else if (
    order.parentSku &&
    order.variationName
  ) {
    matchType = "PARENT_VARIATION";
  }

  return {
    matchStatus: "MATCHED",
    matchType,
    mapping,
  };
}

export async function analyzeOrderFile(
  file: File,
  stores: readonly unknown[],
  catalogRows: readonly unknown[],
  forcedStoreId = ""
): Promise<OrderFileAnalysis> {
  const bytes = new Uint8Array(
    await file.arrayBuffer()
  );

  const workbook = XLSX.read(bytes, {
    type: "array",
    cellDates: false,
    cellStyles: false,
  });

  const shopeeSheet = findShopeeSheet(workbook);

  if (!shopeeSheet) {
    return {
      fileName: file.name,
      platform: "UNKNOWN",
      formatValid: false,
      formatReason:
        'Header Shopee "No. Pesanan / Nama Produk / Jumlah" tidak ditemukan.',

      detectedStoreId: "",
      detectedStoreName: "",
      storeDetection: "UNKNOWN",
      confidence: 0,

      orderCount: 0,
      itemCount: 0,
      matchedCount: 0,
      reviewCount: 0,
      waitingCount: 0,
      randomCount: 0,

      candidates: [],
      rows: [],
    };
  }

  const parsed = parseShopeeRows(
    file.name,
    shopeeSheet.matrix,
    shopeeSheet.headerIndex
  );

  const autoDetected = detectStore(
    parsed,
    stores,
    catalogRows,
    file.name
  );

  const forcedStore = forcedStoreId
    ? stores
        .map(rec)
        .find(
          (store) =>
            text(store.STORE_ID) === forcedStoreId &&
            text(store.PLATFORM).toUpperCase() === "SHOPEE"
        )
    : undefined;

  const detected = forcedStore
    ? {
        storeId: text(forcedStore.STORE_ID),
        storeName: text(forcedStore.STORE_NAME),
        detection: "MANUAL" as const,
        confidence: 100,
        candidates: autoDetected.candidates,
      }
    : autoDetected;

  const catalog = detected.storeId
    ? catalogRowsForStore(
        catalogRows,
        detected.storeId
      )
    : [];

  const rows: NormalizedOrderRow[] =
    parsed.map((order) => {
      const resolved = resolveOrder(
        order,
        catalog
      );

      const mapping = resolved.mapping;

      const canonicalSku = mapping
        ? text(
            mapping.SUGGESTED_SKU ||
              mapping.CURRENT_SKU
          )
        : "";

      const canonicalParent = mapping
        ? text(
            mapping.SUGGESTED_PARENT_SKU ||
              mapping.CURRENT_PARENT_SKU
          )
        : "";

      const inventoryStatus = mapping
        ? text(mapping.INVENTORY_STATUS)
        : "REVIEW";

      return {
        FILE_NAME: file.name,
        SOURCE_ROW: order.sourceRow,

        PLATFORM: "SHOPEE",
        STORE_ID: detected.storeId,
        STORE_NAME: detected.storeName,
        STORE_DETECTION: detected.detection,

        ORDER_ID: order.orderId,
        ORDER_DATE: order.orderDate,
        ORDER_STATUS: order.orderStatus,

        PARENT_SKU: order.parentSku,
        SOURCE_SKU: order.sourceSku,

        PRODUCT_NAME: order.productName,
        VARIATION_NAME: order.variationName,
        QTY: order.qty,

        BUYER_NOTE: order.buyerNote,
        TRACKING_NO: order.trackingNo,

        MATCH_STATUS: resolved.matchStatus,
        MATCH_TYPE:
          detected.detection === "REVIEW" &&
          detected.candidates.some(
            (candidate) => candidate.coverage > 0
          )
            ? "ACCOUNT_REVIEW"
            : resolved.matchType,

        CANONICAL_PARENT_SKU: canonicalParent,
        CANONICAL_SKU: canonicalSku,
        PRODUCT_FAMILY: mapping
          ? text(mapping.PRODUCT_FAMILY)
          : "",

        INVENTORY_STATUS: inventoryStatus,
        INVENTORY_REASON: mapping
          ? text(mapping.INVENTORY_REASON)
          : "Order item belum dapat dicocokkan dengan katalog marketplace.",

        LINE_KEY: [
          detected.storeId,
          order.orderId,
          order.sourceSku,
          order.productName,
          order.variationName,
        ]
          .map(norm)
          .join("|"),
      };
    });

  const orderCount = new Set(
    rows
      .map((row) => row.ORDER_ID)
      .filter(Boolean)
  ).size;

  return {
    fileName: file.name,
    platform: "SHOPEE",
    formatValid: true,
    formatReason:
      parsed.length > 0
        ? "Format Shopee valid."
        : "Format Shopee valid, tetapi file tidak memiliki baris transaksi.",

    detectedStoreId: detected.storeId,
    detectedStoreName: detected.storeName,
    storeDetection: detected.detection,
    confidence: detected.confidence,

    orderCount,
    itemCount: rows.length,

    matchedCount: rows.filter(
      (row) => row.MATCH_STATUS === "MATCHED"
    ).length,

    reviewCount: rows.filter(
      (row) => row.MATCH_STATUS !== "MATCHED"
    ).length,

    waitingCount: rows.filter(
      (row) =>
        row.INVENTORY_STATUS ===
        "WAITING_ALLOCATION"
    ).length,

    randomCount: rows.filter(
      (row) =>
        row.INVENTORY_STATUS ===
        "RANDOM_SUGGESTION"
    ).length,

    candidates: detected.candidates,
    rows,
  };
}