/* RKN_HUMAN_COPY_V1 */
"use client";

import {
  analyzeOrderFile,
  type OrderFileAnalysis,
} from "../lib/orderFiles";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import RknSmartSelect from "./RknSmartSelect";
import ERPUserBadge from "./ERPUserBadge";
import HppCostingCenter from "./HppCostingCenter";
import MobileAdminShell from "./MobileAdminShell";
import { buildAllZip, buildPatchedWorkbook, downloadBlob, parseMarketplaceInput } from "@/lib/marketplaceFiles";
import type { GenericRow, ImportedMarketplaceFile, MappingRow } from "@/lib/marketplaceFiles";

const RKN_WORKSPACE_DB = "rkn-erp-import-workspace";
const RKN_WORKSPACE_STORE = "marketplace-files";
const RKN_WORKSPACE_VERSION = 1;

type RknWorkspaceRecord = {
  key: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
  parsedFileNames: string[];
  storeAssignments: Record<string, string>;
  savedAt: number;
};

function rknWorkspaceKey(file: File) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function rknWorkspaceOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB tidak tersedia di browser ini."));
      return;
    }

    const request = window.indexedDB.open(
      RKN_WORKSPACE_DB,
      RKN_WORKSPACE_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(RKN_WORKSPACE_STORE)) {
        db.createObjectStore(RKN_WORKSPACE_STORE, {
          keyPath: "key",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Gagal membuka IndexedDB."));
  });
}

function rknWorkspaceTxDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error || new Error("Transaksi IndexedDB gagal."));
    tx.onabort = () =>
      reject(tx.error || new Error("Transaksi IndexedDB dibatalkan."));
  });
}

async function rknWorkspaceGetRecords(): Promise<RknWorkspaceRecord[]> {
  const db = await rknWorkspaceOpen();

  try {
    const tx = db.transaction(RKN_WORKSPACE_STORE, "readonly");
    const done = rknWorkspaceTxDone(tx);
    const request = tx.objectStore(RKN_WORKSPACE_STORE).getAll();

    const rows = await new Promise<RknWorkspaceRecord[]>(
      (resolve, reject) => {
        request.onsuccess = () =>
          resolve((request.result || []) as RknWorkspaceRecord[]);
        request.onerror = () =>
          reject(request.error || new Error("Gagal membaca workspace."));
      }
    );

    await done;

    return rows.sort(
      (a, b) => Number(a.savedAt || 0) - Number(b.savedAt || 0)
    );
  } finally {
    db.close();
  }
}

async function rknWorkspaceSaveFile(
  file: File,
  parsedFileNames: string[],
  storeAssignments: Record<string, string> = {}
) {
  const db = await rknWorkspaceOpen();

  try {
    const tx = db.transaction(RKN_WORKSPACE_STORE, "readwrite");
    const done = rknWorkspaceTxDone(tx);

    const record: RknWorkspaceRecord = {
      key: rknWorkspaceKey(file),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      lastModified: file.lastModified,
      blob: file,
      parsedFileNames,
      storeAssignments,
      savedAt: Date.now(),
    };

    tx.objectStore(RKN_WORKSPACE_STORE).put(record);

    await done;
  } finally {
    db.close();
  }
}

function rknWorkspaceRecordToFile(record: RknWorkspaceRecord) {
  return new File(
    [record.blob],
    record.name,
    {
      type: record.type || "application/octet-stream",
      lastModified: record.lastModified || Date.now(),
    }
  );
}

async function rknWorkspaceSetStoreAssignment(
  parsedFileName: string,
  storeId: string
) {
  const records = await rknWorkspaceGetRecords();
  const targets = records.filter(
    (record) =>
      record.name === parsedFileName ||
      (record.parsedFileNames || []).includes(parsedFileName)
  );

  if (!targets.length) return;

  const db = await rknWorkspaceOpen();

  try {
    const tx = db.transaction(RKN_WORKSPACE_STORE, "readwrite");
    const done = rknWorkspaceTxDone(tx);
    const store = tx.objectStore(RKN_WORKSPACE_STORE);

    for (const record of targets) {
      store.put({
        ...record,
        storeAssignments: {
          ...(record.storeAssignments || {}),
          [parsedFileName]: storeId,
        },
      });
    }

    await done;
  } finally {
    db.close();
  }
}

async function rknWorkspaceDeleteByParsedFileName(
  parsedFileName: string
) {
  const records = await rknWorkspaceGetRecords();

  const targets = records.filter(
    (record) =>
      record.name === parsedFileName ||
      (record.parsedFileNames || []).includes(parsedFileName)
  );

  if (!targets.length) return;

  const db = await rknWorkspaceOpen();

  try {
    const tx = db.transaction(RKN_WORKSPACE_STORE, "readwrite");
    const done = rknWorkspaceTxDone(tx);
    const store = tx.objectStore(RKN_WORKSPACE_STORE);

    for (const record of targets) {
      store.delete(record.key);
    }

    await done;
  } finally {
    db.close();
  }
}

async function rknWorkspaceClearFiles() {
  const db = await rknWorkspaceOpen();

  try {
    const tx = db.transaction(RKN_WORKSPACE_STORE, "readwrite");
    const done = rknWorkspaceTxDone(tx);

    tx.objectStore(RKN_WORKSPACE_STORE).clear();

    await done;
  } finally {
    db.close();
  }
}
type Tab = "hppCosting" | "menuHub" | "marketplaceHub" | "dashboard" | "products" | "skuColors" | "stores" | "importMp" | "massUpdate" | "orders" | "stock";

// RKN_ADMIN_SHELL_V2_START
type AdminNavGroup =
  | "inventory"
  | "finance"
  | "marketplace"
  | "people"
  | "analytics"
  | "system";
// RKN_ADMIN_SHELL_V2_END

const fallback = {
  stores: [
    { STORE_ID: "STR-SHP-01", PLATFORM: "SHOPEE", STORE_NAME: "RKN Hijab Official", OWNER_ID: "OWN001", STATUS: "ACTIVE" },
    { STORE_ID: "STR-TTK-01", PLATFORM: "TIKTOK", STORE_NAME: "RKN Hijab", OWNER_ID: "OWN001", STATUS: "ACTIVE" },
    { STORE_ID: "STR-SHP-02", PLATFORM: "SHOPEE", STORE_NAME: "erkaenscarf", OWNER_ID: "OWN002", STATUS: "ACTIVE" },
    { STORE_ID: "STR-TTK-02", PLATFORM: "TIKTOK", STORE_NAME: "Kharisma Hijab", OWNER_ID: "OWN002", STATUS: "ACTIVE" },
    { STORE_ID: "STR-SHP-03", PLATFORM: "SHOPEE", STORE_NAME: "erkaenveil", OWNER_ID: "OWN001", STATUS: "ACTIVE" },
    { STORE_ID: "STR-TTK-03", PLATFORM: "TIKTOK", STORE_NAME: "erkaenveil", OWNER_ID: "OWN001", STATUS: "ACTIVE" },
    { STORE_ID: "STR-SHP-04", PLATFORM: "SHOPEE", STORE_NAME: "jenna_collection09", OWNER_ID: "OWN003", STATUS: "ACTIVE" },
    { STORE_ID: "STR-SHP-05", PLATFORM: "SHOPEE", STORE_NAME: "Orviellé ID", OWNER_ID: "OWN004", STATUS: "ACTIVE" },
  ],
  products: [] as GenericRow[],
  skuColors: [] as GenericRow[],
  colors: [] as GenericRow[],
};

async function loadResource(resource: string): Promise<GenericRow[]> {
  const res = await fetch(`/api/erp/${resource}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${resource} belum terhubung`);
  const json =
    (await res.json()) as {
      data?: GenericRow[];
    };
  return json.data ?? [];
}

function money(value: unknown) {
  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function isTrue(value: unknown) {
  return value === true || String(value).toUpperCase() === "TRUE";
}

function matches(row: GenericRow | MappingRow, q: string) {
  return Object.values(row).some((v) => String(v).toLowerCase().includes(q));
}

function safeFilePart(text: string) {
  return text.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");
}

export default function ERPApp() {
  const [tab, setTab] = useState<Tab>("dashboard");

  // RKN_ADMIN_NAVIGATION_V2
  const [adminNavGroups, setAdminNavGroups] =
    useState<Record<AdminNavGroup, boolean>>({
      inventory: false,
      finance: false,
      marketplace: true,
      people: false,
      analytics: false,
      system: false,
    });

  const adminTabTitles: Record<Tab, string> = {
    hppCosting: "HPP & Costing",
    menuHub: "Menu",
    marketplaceHub: "Marketplace",
    dashboard: "Dasbor Admin",
    products: "Produk Marketplace",
    skuColors: "SKU & Warna",
    stores: "Toko Marketplace",
    importMp: "Impor Marketplace",
    massUpdate: "Pembaruan Massal",
    orders: "Pesanan Marketplace",
    stock: "Pusat Alokasi Persediaan",
  };

  const adminTabDescriptions: Record<Tab, string> = {
    hppCosting:
      "Kelola HPP manual, costing otomatis, effective date, dan riwayat perubahan.",
    menuHub:
      "Pusat administrasi, domain ERP, akun, dan akses sistem.",
    marketplaceHub:
      "Pusat kendali marketplace, toko, operasional, settlement, dan integrasi API.",
    dashboard:
      "Pusat kendali operasional dan integrasi RKN ERP.",
    products:
      "Master produk kanonis yang digunakan lintas marketplace.",
    skuColors:
      "Master SKU, keluarga produk, warna, dan kesiapan pemetaan.",
    stores:
      "Daftar akun dan toko marketplace yang dikelola RKN.",
    importMp:
      "Impor data marketplace melalui proses lokal yang aman.",
    massUpdate:
      "Pemetaan, validasi, dan kontrol pembaruan data marketplace.",
    orders:
      "Impor, deteksi akun, dan resolusi pesanan marketplace.",
    stock:
      "Pusat alokasi hasil pemetaan menuju persediaan fisik.",
  };

  const marketplaceTabs: Tab[] = [
    "products",
    "skuColors",
    "stores",
    "importMp",
    "massUpdate",
    "orders",
  ];

  const toggleAdminNavGroup = (
    group: AdminNavGroup
  ) => {
    setAdminNavGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  };

  // RKN_SINGLE_SHELL_WORKSPACE_V1
  type AdminWorkspaceState = {
    url: string;
    title: string;
    description: string;
  };

  const [
    adminWorkspace,
    setAdminWorkspace,
  ] = useState<AdminWorkspaceState | null>(
    null
  );

  const openAdminWorkspace = (
    target: string
  ) => {
    const url =
      new URL(
        target,
        window.location.origin
      );

    if (
      !url.searchParams.has(
        "embed"
      )
    ) {
      url.searchParams.set(
        "embed",
        "1"
      );
    }

    let title =
      String(
        url.searchParams.get(
          "title"
        ) ?? ""
      ).trim();

    if (
      url.pathname ===
      "/admin/users"
    ) {
      title =
        url.hash === "#roles"
          ? "Peran & Izin"
          : url.hash === "#scopes"
            ? "Ruang Lingkup Akses"
            : "Pengguna ERP";
    }

    if (
      url.pathname ===
      "/admin/product-master"
    ) {
      title =
        "Product Master";
    }

    if (!title) {
      title =
        "Workspace Admin";
    }

    setAdminWorkspace({
      url:
        url.pathname +
        url.search +
        url.hash,
      title,
      description:
        "",
    });
  };

  const selectAdminTab = (
    nextTab: Tab
  ) => {
    setAdminWorkspace(null);
    setTab(nextTab);
    // RKN_HPP_FINANCE_NAV_V11
    if (nextTab === "hppCosting") {
      setAdminNavGroups((current) => ({
        ...current,
        finance: true,
      }));
    }


    if (nextTab === "stock") {
      setAdminNavGroups((current) => ({
        ...current,
        inventory: true,
      }));
    }

    if (marketplaceTabs.includes(nextTab)) {
      setAdminNavGroups((current) => ({
        ...current,
        marketplace: true,
      }));
    }
  };
  const [stores, setStores] = useState<GenericRow[]>(fallback.stores);
  const [products, setProducts] = useState<GenericRow[]>(fallback.products);
  const [skuColors, setSkuColors] = useState<GenericRow[]>(fallback.skuColors);
  const [colors, setColors] = useState<GenericRow[]>(fallback.colors);
  const [connected, setConnected] = useState(false);
  const [search, setSearch] = useState("");

// RKN_ORDERS_STATE_V1_SAFE
const [orderImportFiles, setOrderImportFiles] = useState<File[]>([]);
const [orderImportMessage, setOrderImportMessage] = useState("");

// RKN_ORDERS_V2_STATE
const [orderAnalyses, setOrderAnalyses] = useState<OrderFileAnalysis[]>([]);
const [orderImportBusy, setOrderImportBusy] = useState(false);

// RKN_ORDERS_V23_MANUAL_ACCOUNT
const [orderStoreOverrides, setOrderStoreOverrides] = useState<Record<string, string>>({});
  const [imports, setImports] = useState<ImportedMarketplaceFile[]>([]);
  const [workspaceRestored, setWorkspaceRestored] = useState(false);

// RKN_ALLOCATION_CENTER_V1
const [allocationStore, setAllocationStore] = useState("");
const [allocationPlatform, setAllocationPlatform] = useState("");
const [allocationStatus, setAllocationStatus] = useState("");
const [allocationOpenKey, setAllocationOpenKey] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([loadResource("stores"), loadResource("products"), loadResource("skuColors"), loadResource("colors")])
      .then(([s, p, sc, c]) => {
        setStores(s.length ? s : fallback.stores);
        setProducts(p);
        setSkuColors(sc);
        setColors(c);
        setConnected(Boolean(p.length && sc.length && c.length));
      })
      .catch(() => setConnected(false));
  }, []);

  useEffect(() => setSearch(""), [tab]);

  const q = search.trim().toLowerCase();
  const filteredProducts = useMemo(() => (!q ? products : products.filter((row) => matches(row, q))), [products, q]);
  const filteredSkuColors = useMemo(() => (!q ? skuColors : skuColors.filter((row) => matches(row, q))), [skuColors, q]);
  const filteredColors = useMemo(() => (!q ? colors : colors.filter((row) => matches(row, q))), [colors, q]);
  const allMappedRows = useMemo(() => imports.flatMap((f) => f.rows), [imports]);

  // RKN_ORDERS_V2_DERIVED
  const orderRows = useMemo(
    () => orderAnalyses.flatMap((analysis) => analysis.rows),
    [orderAnalyses]
  );

  const orderParsedCount = useMemo(
    () =>
      new Set(
        orderRows
          .map((row) => row.ORDER_ID)
          .filter(Boolean)
      ).size,
    [orderRows]
  );

  const orderWaitingCount = orderRows.filter(
    (row) => row.INVENTORY_STATUS === "WAITING_ALLOCATION"
  ).length;

  const orderRandomCount = orderRows.filter(
    (row) => row.INVENTORY_STATUS === "RANDOM_SUGGESTION"
  ).length;

  const orderReviewCount = orderRows.filter(
    (row) => row.MATCH_STATUS !== "MATCHED"
  ).length;
  async function confirmOrderStore(fileName: string) {
    const storeId = orderStoreOverrides[fileName] || "";

    if (!storeId) {
      setOrderImportMessage(
        "Pilih akun pemilik file pesanan terlebih dahulu."
      );
      return;
    }

    const file = orderImportFiles.find(
      (item) => item.name === fileName
    );

    if (!file) {
      setOrderImportMessage(
        "File pesanan tidak ditemukan di sesi aktif."
      );
      return;
    }

    const store = stores.find(
      (item) =>
        String(item.STORE_ID || "") === storeId
    );

    if (!store) {
      setOrderImportMessage(
        "Akun yang dipilih tidak ditemukan di master toko."
      );
      return;
    }

    setOrderImportBusy(true);

    try {
      const analysis = await analyzeOrderFile(
        file,
        stores,
        allMappedRows,
        storeId
      );

      setOrderAnalyses((old) =>
        old.map((item) =>
          item.fileName === fileName
            ? analysis
            : item
        )
      );

      setOrderImportMessage(
        "Akun " +
          String(store.STORE_NAME || storeId) +
          " dikonfirmasi manual. " +
          "Item kemudian diproses ulang terhadap katalog akun tersebut."
      );
    } catch (error) {
      console.error(error);

      setOrderImportMessage(
        "Gagal memproses ulang akun pesanan: " +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    } finally {
      setOrderImportBusy(false);
    }
  }
  const sourceCount = useMemo(() => new Set(imports.map((f) => f.sourceContainerName || f.fileName)).size, [imports]);
  const filteredMapped = useMemo(() => {
    let rows = allMappedRows;
    if (selectedStore) rows = rows.filter((r) => r.STORE_ID === selectedStore);
    if (statusFilter) rows = rows.filter((r) => r.MATCH_STATUS === statusFilter);
    if (inventoryStatusFilter) rows = rows.filter((r) => r.INVENTORY_STATUS === inventoryStatusFilter);
    if (q) rows = rows.filter((r) => matches(r, q));
    return rows;
  }, [allMappedRows, selectedStore, statusFilter, inventoryStatusFilter, q]);

  const activeStores = stores.filter((s) => String(s.STATUS).toUpperCase() === "ACTIVE").length;
  const totalHpp = products.reduce((sum, p) => sum + (Number(p.HPP_DEFAULT) || 0), 0);
  const syncReady = skuColors.filter((row) => isTrue(row.SYNC_ELIGIBLE)).length;
  const syncBlocked = skuColors.length - syncReady;
  const familyCount = new Set(skuColors.map((r) => String(r.PRODUCT_FAMILY || "").trim()).filter(Boolean)).size;
  const mappedReady = allMappedRows.filter((r) => r.MATCH_STATUS === "READY").length;
  const mappedReview = allMappedRows.filter((r) => r.MATCH_STATUS === "REVIEW").length;
  const mappedBlocked = allMappedRows.filter((r) => r.MATCH_STATUS === "BLOCKED").length;
  const mappedArchived = allMappedRows.filter((r) => r.MATCH_STATUS === "ARCHIVED").length;
  const mappedChanges = allMappedRows.filter((r) => r.MATCH_STATUS === "READY" && r.CHANGE === "YES").length;
  const unresolved = mappedReview + mappedBlocked;
  const mappingDecided = mappedReady + mappedArchived;
  const mappingDecisionRate = allMappedRows.length ? Math.round((mappingDecided / allMappedRows.length) * 100) : 0;
  const inventoryReady = allMappedRows.filter((r) => r.INVENTORY_STATUS === "READY").length;
  const inventoryWaiting = allMappedRows.filter((r) => r.INVENTORY_STATUS === "WAITING_ALLOCATION").length;
  const inventoryRandom = allMappedRows.filter((r) => r.INVENTORY_STATUS === "RANDOM_SUGGESTION").length;
  const inventoryReview = allMappedRows.filter((r) => r.INVENTORY_STATUS === "REVIEW" || r.INVENTORY_STATUS === "BLOCKED").length;
  const inventoryArchived = allMappedRows.filter((r) => r.MATCH_STATUS === "ARCHIVED" || r.INVENTORY_STATUS === "ARCHIVED").length;
  const inventoryPending = inventoryWaiting + inventoryRandom + inventoryReview;
  const bundleRows = allMappedRows.filter((r) => Number(r.BUNDLE_QTY) > 1);
  const bundleReady = bundleRows.filter((r) => r.INVENTORY_STATUS === "READY").length;
  const componentSkuCount = new Set(allMappedRows.flatMap((r) => String(r.COMPONENT_SKUS || "").split(" + ").map((x) => x.trim()).filter(Boolean))).size;
  const stockPreviewRows = useMemo(() => {
    let rows = allMappedRows.filter((r) => Number(r.BUNDLE_QTY) > 1 || Boolean(r.COMPONENT_DETAIL));
    if (q) rows = rows.filter((r) => matches(r, q));
    return rows;
  }, [allMappedRows, q]);
  const allStoresAssigned = imports.every((f) => Boolean(f.storeId));
  const finalReady = imports.length > 0 && unresolved === 0 && allStoresAssigned;

  async function reprocessWorkspace(manual = true) {
    if (!skuColors.length) return;

    let records: RknWorkspaceRecord[] = [];

    try {
      records = await rknWorkspaceGetRecords();
    } catch (error) {
      setWorkspaceRestored(true);
      if (manual) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Gagal membaca Persistent Import Workspace."
        );
      }
      return;
    }

    if (!records.length) {
      setWorkspaceRestored(true);

      if (manual) {
        setNotice(
          "Workspace lokal masih kosong. Import file sekali untuk menyimpannya."
        );
      }

      return;
    }

    setBusy(true);
    setNotice(
      `${manual ? "Reprocess" : "Memulihkan"} ${records.length} file dari workspace lokal...`
    );

    try {
      const parsed: ImportedMarketplaceFile[] = [];

      for (const record of records) {
        const file = rknWorkspaceRecordToFile(record);

        let parsedForFile = await parseMarketplaceInput(
          file,
          stores,
          skuColors
        );

        const assignments = record.storeAssignments || {};

        parsedForFile = parsedForFile.map((f) => {
          const manualStoreId = assignments[f.fileName];

          if (!manualStoreId) return f;

          return {
            ...f,
            storeId: manualStoreId,
            storeDetection: "MANUAL",
            storeConfidence: 100,
            detectionReason:
              "Store dipulihkan dari Persistent Import Workspace",
            rows: f.rows.map((r) => ({
              ...r,
              STORE_ID: manualStoreId,
            })),
          };
        });

        parsed.push(...parsedForFile);

        await rknWorkspaceSaveFile(
          file,
          parsedForFile.map((f) => f.fileName),
          assignments
        );
      }

      setImports(parsed);
      setWorkspaceRestored(true);

      const rows = parsed.reduce(
        (n, f) => n + f.rows.length,
        0
      );

      setNotice(
        `${records.length} file workspace berhasil diproses  /  ${parsed.length} worksheet  /  ${rows.toLocaleString("id-ID")} baris.`
      );

      if (manual) {
        setTab("massUpdate");
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Gagal memproses Persistent Import Workspace."
      );
    } finally {
      setBusy(false);
      setWorkspaceRestored(true);
    }
  }

  useEffect(() => {
    if (workspaceRestored || !skuColors.length) return;

    void reprocessWorkspace(false);
  }, [workspaceRestored, skuColors.length]);
  async function onImportFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files || []);
    event.target.value = "";
    if (!chosen.length) return;
    setBusy(true);
    setNotice(`Membaca ${chosen.length} file lokal...`);
    try {
      const parsed: ImportedMarketplaceFile[] = [];

    const stagedWorkspace: Array<{
      file: File;
      parsedFileNames: string[];
    }> = [];

    for (const file of chosen) {
      const parsedForFile = await parseMarketplaceInput(
        file,
        stores,
        skuColors
      );

      parsed.push(...parsedForFile);

      stagedWorkspace.push({
        file,
        parsedFileNames: parsedForFile.map((f) => f.fileName),
      });
    }

    for (const item of stagedWorkspace) {
      await rknWorkspaceSaveFile(
        item.file,
        item.parsedFileNames
      );
    }

    setWorkspaceRestored(true);
    setImports((old) => [...old, ...parsed]);
      const rows = parsed.reduce((n, f) => n + f.rows.length, 0);
      const auto = parsed.filter((f) => f.storeDetection === "AUTO" && f.storeId).length;
      setNotice(`${chosen.length} sumber berhasil dibaca lokal  /  ${parsed.length} worksheet XLSX  /  ${rows.toLocaleString("id-ID")} baris  /  ${auto}/${parsed.length} auto-detect toko.`);
      setTab("massUpdate");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal membaca file Mass Update.");
    } finally {
      setBusy(false);
    }
  }

  function assignStore(fileId: string, storeId: string) {
    const target = imports.find((f) => f.id === fileId);

    if (target?.fileName) {
      void rknWorkspaceSetStoreAssignment(
        target.fileName,
        storeId
      );
    }

    setImports((old) =>
      old.map((f) =>
        f.id === fileId
          ? {
              ...f,
              storeId,
              storeDetection: "MANUAL",
              storeConfidence: 100,
              detectionReason: "Toko dipilih manual oleh operator",
              rows: f.rows.map((r) => ({
                ...r,
                STORE_ID: storeId,
              })),
            }
          : f
      )
    );
  }

  async function removeImport(fileId: string) {
    const target = imports.find((f) => f.id === fileId);

    if (target?.fileName) {
      await rknWorkspaceDeleteByParsedFileName(
        target.fileName
      );

      setImports((old) =>
        old.filter(
          (f) => f.fileName !== target.fileName
        )
      );

      setNotice(
        `${target.fileName} dihapus dari sesi dan workspace lokal.`
      );

      return;
    }

    setImports((old) =>
      old.filter((f) => f.id !== fileId)
    );
  }

  async function clearImports() {
    await rknWorkspaceClearFiles();

    setImports([]);
    setSelectedStore("");
    setStatusFilter("");
    setInventoryStatusFilter("");
    setWorkspaceRestored(true);

    setNotice(
      "Persistent Import Workspace dibersihkan. File asli di laptop tidak berubah."
    );
  }
  async function exportOne(imported: ImportedMarketplaceFile, finalOnly: boolean) {
    setBusy(true);
    try {
      if (!imported.storeId) throw new Error("Pilih toko pemilik file dulu.");
      const blob = await buildPatchedWorkbook(imported, finalOnly);
      const store = stores.find((s) => String(s.STORE_ID) === imported.storeId);
      const unresolvedFile = imported.rows.filter((r) => r.MATCH_STATUS === "REVIEW" || r.MATCH_STATUS === "BLOCKED").length;
      const suffix = finalOnly ? "FINAL" : unresolvedFile ? `DRAFT_${unresolvedFile}_REVIEW` : "READY";
      const base = imported.fileName.replace(/\.xlsx?$/i, "");
      downloadBlob(blob, `${safeFilePart(String(store?.STORE_NAME || imported.storeId))}_${base}_${suffix}.xlsx`);
      setNotice(finalOnly ? "File FINAL berhasil dibuat dari template asli." : "Draft siap. Baris REVIEW/BLOCKED tidak diubah.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function exportAll(finalOnly: boolean) {
    if (!imports.length) return;
    setBusy(true);
    try {
      if (!allStoresAssigned) throw new Error("Masih ada file yang belum dipilih tokonya.");
      const blob = await buildAllZip(imports, finalOnly);
      downloadBlob(blob, `RKN_ERP_MASS_UPDATE_${finalOnly ? "FINAL" : "DRAFT"}.zip`);
      setNotice(finalOnly ? "ZIP FINAL semua akun berhasil dibuat." : "ZIP draft berhasil dibuat. Hanya mapping READY yang ditulis; baris review tidak disentuh.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export semua gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="erp-shell">
      <aside className="sidebar">

        <div className="brand admin-brand">
          <div className="admin-brand-logo">
            <img
              src="/rkn-logo.png"
              alt="RKN"
            />
          </div>

          <div className="admin-brand-copy">
            <strong>RKN ERP</strong>
            <span>PUSAT KENDALI ADMIN</span>
          </div>
        </div>
        <nav
          className="admin-nav"
          aria-label="Navigasi administrator"
        >
          <button
            type="button"
            className={
              tab === "dashboard"
                ? "admin-nav-home active"
                : "admin-nav-home"
            }
            onClick={() =>
              selectAdminTab("dashboard")
            }
          >
            <span className="admin-nav-index">
              01
            </span>

            <span className="admin-nav-home-copy">
              <strong>BERANDA ADMIN</strong>
              <small>
                Ringkasan kendali ERP
              </small>
            </span>

            <span className="admin-nav-signal">
              ●
            </span>
          </button>


          <div className="admin-nav-group">
            <button
              type="button"
              className={
                tab === "stock"
                  ? "admin-nav-group-toggle active"
                  : "admin-nav-group-toggle"
              }
              onClick={() =>
                toggleAdminNavGroup(
                  "inventory"
                )
              }
              aria-expanded={
                adminNavGroups.inventory
              }
            >
              <span className="admin-nav-index">
                02
              </span>

              <span className="admin-nav-group-copy">
                <strong>
                  STOK & PERSEDIAAN
                </strong>
                <small>
                  Stok fisik  /  opname  /  barcode
                </small>
              </span>

              <span
                className={
                  adminNavGroups.inventory
                    ? "admin-nav-chevron open"
                    : "admin-nav-chevron"
                }
              >
                {"\u203A"}
              </span>
            </button>

            {adminNavGroups.inventory && (
              <div className="admin-nav-submenu">
                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=dasbor-persediaan&title=Dasbor%20Persediaan"
                    )
                  }
                >
                  <span>Dasbor Persediaan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  type="button"
                  className={
                    tab === "stock"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab("stock")
                  }
                >
                  <span>
                    Pusat Alokasi
                  </span>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=stok-fisik&title=Stok%20Fisik"
                    )
                  }
                >
                  <span>Stok Fisik</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=barang-masuk&title=Barang%20Masuk"
                    )
                  }
                >
                  <span>Barang Masuk</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=barang-keluar&title=Barang%20Keluar"
                    )
                  }
                >
                  <span>Barang Keluar</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=stok-opname&title=Stok%20Opname"
                    )
                  }
                >
                  <span>Stok Opname</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pusat-barcode&title=Pusat%20Barcode"
                    )
                  }
                >
                  <span>Pusat Barcode</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=aset&title=Aset"
                    )
                  }
                >
                  <span>Aset</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=ledger-persediaan&title=Ledger%20Persediaan"
                    )
                  }
                >
                  <span>Ledger Persediaan</span>
                  <small>AKTIF</small>
                </button>
              </div>
            )}
          </div>


          <div className="admin-nav-group">
            <button
              type="button"
              className="admin-nav-group-toggle"
              onClick={() =>
                toggleAdminNavGroup(
                  "finance"
                )
              }
              aria-expanded={
                adminNavGroups.finance
              }
            >
              <span className="admin-nav-index">
                03
              </span>

              <span className="admin-nav-group-copy">
                <strong>
                  KEUANGAN & OPERASIONAL
                </strong>
                <small>
                  Kas  /  settlement  /  vendor
                </small>
              </span>

              <span
                className={
                  adminNavGroups.finance
                    ? "admin-nav-chevron open"
                    : "admin-nav-chevron"
                }
              >
                {"\u203A"}
              </span>
            </button>

            {adminNavGroups.finance && (
              <div className="admin-nav-submenu">
                {/* RKN_HPP_DESKTOP_NAV_V11 */}
                <button
                  type="button"
                  className={
                    tab === "hppCosting"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab(
                      "hppCosting"
                    )
                  }
                >
                  <span>
                    HPP & Costing
                  </span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=dasbor-keuangan&title=Dasbor%20Keuangan"
                    )
                  }
                >
                  <span>Dasbor Keuangan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=kas-bank&title=Kas%20%26%20Bank"
                    )
                  }
                >
                  <span>Kas & Bank</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pemasukan&title=Pemasukan"
                    )
                  }
                >
                  <span>Pemasukan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pengeluaran&title=Pengeluaran"
                    )
                  }
                >
                  <span>Pengeluaran</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=settlement-marketplace&title=Settlement%20Marketplace"
                    )
                  }
                >
                  <span>Settlement Marketplace</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=rekonsiliasi&title=Rekonsiliasi"
                    )
                  }
                >
                  <span>Rekonsiliasi</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pengadaan-vendor&title=Pengadaan%20%26%20Vendor"
                    )
                  }
                >
                  <span>Pengadaan & Vendor</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=hutang-piutang&title=Hutang%20%26%20Piutang"
                    )
                  }
                >
                  <span>Hutang & Piutang</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=dana-pemilik&title=Dana%20Pemilik"
                    )
                  }
                >
                  <span>Dana Pemilik</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=laba-rugi&title=Laba%20Rugi"
                    )
                  }
                >
                  <span>Laba Rugi</span>
                  <small>AKTIF</small>
                </button>
              </div>
            )}
          </div>


          <div className="admin-nav-group">
            <button
              type="button"
              className={
                marketplaceTabs.includes(tab)
                  ? "admin-nav-group-toggle active"
                  : "admin-nav-group-toggle"
              }
              onClick={() =>
                toggleAdminNavGroup(
                  "marketplace"
                )
              }
              aria-expanded={
                adminNavGroups.marketplace
              }
            >
              <span className="admin-nav-index">
                04
              </span>

              <span className="admin-nav-group-copy">
                <strong>
                  MARKETPLACE
                </strong>
                <small>
                  Shopee  /  TikTok  /  integrasi
                </small>
              </span>

              <span
                className={
                  adminNavGroups.marketplace
                    ? "admin-nav-chevron open"
                    : "admin-nav-chevron"
                }
              >
                {"\u203A"}
              </span>
            </button>

            {adminNavGroups.marketplace && (
              <div className="admin-nav-submenu">
                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=dasbor-marketplace&title=Dasbor%20Marketplace"
                    )
                  }
                >
                  <span>Dasbor Marketplace</span>
                  <small>AKTIF</small>
                </button>

                <button
                  type="button"
                  className={
                    tab === "orders"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab("orders")
                  }
                >
                  <span>Pesanan</span>
                </button>

                <button
                  type="button"
                  className={
                    tab === "products"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab("products")
                  }
                >
                  <span>Produk</span>
                </button>

                <button
                  type="button"
                  className={
                    tab === "skuColors"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab(
                      "skuColors"
                    )
                  }
                >
                  <span>SKU & Warna</span>
                </button>

                <button
                  type="button"
                  className={
                    tab === "stores"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab("stores")
                  }
                >
                  <span>Toko</span>
                </button>

                <button
                  type="button"
                  className={
                    tab === "importMp"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab(
                      "importMp"
                    )
                  }
                >
                  <span>
                    Impor Marketplace
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    tab === "massUpdate"
                      ? "admin-sub-item active"
                      : "admin-sub-item"
                  }
                  onClick={() =>
                    selectAdminTab(
                      "massUpdate"
                    )
                  }
                >
                  <span>
                    Pembaruan Massal
                  </span>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=penjualan&title=Penjualan"
                    )
                  }
                >
                  <span>Penjualan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=settlement-marketplace&title=Settlement%20Marketplace"
                    )
                  }
                >
                  <span>Settlement Marketplace</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pusat-integrasi-api&title=Pusat%20Integrasi%20API"
                    )
                  }
                >
                  <span>Pusat Integrasi API</span>
                  <small>AKTIF</small>
                </button>
              </div>
            )}
          </div>


          <div className="admin-nav-group">
            <button
              type="button"
              className="admin-nav-group-toggle"
              onClick={() =>
                toggleAdminNavGroup(
                  "people"
                )
              }
              aria-expanded={
                adminNavGroups.people
              }
            >
              <span className="admin-nav-index">
                05
              </span>

              <span className="admin-nav-group-copy">
                <strong>
                  SDM & AKSES
                </strong>
                <small>
                  Pengguna  /  izin  /  payroll
                </small>
              </span>

              <span
                className={
                  adminNavGroups.people
                    ? "admin-nav-chevron open"
                    : "admin-nav-chevron"
                }
              >
                {"\u203A"}
              </span>
            </button>

            {adminNavGroups.people && (
              <div className="admin-nav-submenu">
                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=dasbor-sdm&title=Dasbor%20SDM"
                    )
                  }
                >
                  <span>Dasbor SDM</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/users"
                    )
                  }
                >
                  <span>Pengguna ERP</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/users#roles"
                    )
                  }
                >
                  <span>Peran & Izin</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/users#scopes"
                    )
                  }
                >
                  <span>Ruang Lingkup Akses</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=payroll&title=Payroll"
                    )
                  }
                >
                  <span>Payroll</span>
                  <small>AKTIF</small>
                </button>
              </div>
            )}
          </div>


          <div className="admin-nav-group">
            <button
              type="button"
              className="admin-nav-group-toggle"
              onClick={() =>
                toggleAdminNavGroup(
                  "analytics"
                )
              }
              aria-expanded={
                adminNavGroups.analytics
              }
            >
              <span className="admin-nav-index">
                06
              </span>

              <span className="admin-nav-group-copy">
                <strong>
                  LAPORAN & ANALITIK
                </strong>
                <small>
                  Laporan  /  grafik  /  ekspor
                </small>
              </span>

              <span
                className={
                  adminNavGroups.analytics
                    ? "admin-nav-chevron open"
                    : "admin-nav-chevron"
                }
              >
                {"\u203A"}
              </span>
            </button>

            {adminNavGroups.analytics && (
              <div className="admin-nav-submenu">
                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=dasbor-analitik&title=Dasbor%20Analitik"
                    )
                  }
                >
                  <span>Dasbor Analitik</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=laporan-penjualan&title=Laporan%20Penjualan"
                    )
                  }
                >
                  <span>Laporan Penjualan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=laporan-persediaan&title=Laporan%20Persediaan"
                    )
                  }
                >
                  <span>Laporan Persediaan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=laporan-keuangan&title=Laporan%20Keuangan"
                    )
                  }
                >
                  <span>Laporan Keuangan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pusat-ekspor&title=Pusat%20Ekspor"
                    )
                  }
                >
                  <span>Pusat Ekspor</span>
                  <small>AKTIF</small>
                </button>
              </div>
            )}
          </div>


          <div className="admin-nav-group">
            <button
              type="button"
              className="admin-nav-group-toggle"
              onClick={() =>
                toggleAdminNavGroup(
                  "system"
                )
              }
              aria-expanded={
                adminNavGroups.system
              }
            >
              <span className="admin-nav-index">
                07
              </span>

              <span className="admin-nav-group-copy">
                <strong>
                  KENDALI SISTEM
                </strong>
                <small>
                  Audit  /  peringatan  /  status
                </small>
              </span>

              <span
                className={
                  adminNavGroups.system
                    ? "admin-nav-chevron open"
                    : "admin-nav-chevron"
                }
              >
                {"\u203A"}
              </span>
            </button>

            {adminNavGroups.system && (
              <div className="admin-nav-submenu">
                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=dasbor-sistem&title=Dasbor%20Sistem"
                    )
                  }
                >
                  <span>Dasbor Sistem</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pusat-persetujuan&title=Pusat%20Persetujuan"
                    )
                  }
                >
                  <span>Pusat Persetujuan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=pusat-peringatan&title=Pusat%20Peringatan"
                    )
                  }
                >
                  <span>Pusat Peringatan</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=log-audit&title=Log%20Audit"
                    )
                  }
                >
                  <span>Log Audit</span>
                  <small>AKTIF</small>
                </button>

                <button
                  className="admin-sub-item"
                  type="button"
                  onClick={() =>
                    openAdminWorkspace(
                      "/admin/features?feature=status-integrasi&title=Status%20Integrasi"
                    )
                  }
                >
                  <span>Status Integrasi</span>
                  <small>AKTIF</small>
                </button>
              </div>
            )}
          </div>
        </nav>
        <ERPUserBadge />

      </aside>

      {/* RKN_MOBILE_ADMIN_SHELL_V1 */}
      <MobileAdminShell
        activeTab={tab}
        dashboardSummary={{
          activeStores,
          orders: orderParsedCount,
          reviewOrders: orderReviewCount,
          productFamilies:
            products.length || familyCount,
          skuVariants: skuColors.length,
          marketplaceSources: sourceCount,
        }}
        orderSummary={{
          totalOrders: orderParsedCount,
          waitingAllocation:
            orderWaitingCount,
          randomSuggestion:
            orderRandomCount,
          reviewItems:
            orderReviewCount,
        }}
        recentOrderRows={orderAnalyses
          .flatMap((analysis) =>
            analysis.rows.map((row) => ({
              orderId: String(
                row.ORDER_ID || ""
              ),
              orderDate: String(
                row.ORDER_DATE || ""
              ),
              platform:
                analysis.platform,
              storeName:
                analysis.detectedStoreName ||
                "",
              productName: String(
                row.PRODUCT_NAME || ""
              ),
              variationName: String(
                row.VARIATION_NAME || ""
              ),
              canonicalSku: String(
                row.CANONICAL_SKU || ""
              ),
              qty:
                Number(row.QTY) || 0,
              matchStatus: String(
                row.MATCH_STATUS || ""
              ),
              inventoryStatus: String(
                row.INVENTORY_STATUS || ""
              ),
            }))
          )
          .slice(0, 160)}
        stockSummary={{
          ready: inventoryReady,
          pending: inventoryPending,
          waiting: inventoryWaiting,
          random: inventoryRandom,
          review: inventoryReview,
        }}
        stockRows={allMappedRows
          .filter(
            (row) =>
              String(
                row.INVENTORY_STATUS || ""
              ) !== "ARCHIVED"
          )
          .slice(0, 240)
          .map((row, index) => ({
            key:
              String(
                row.STORE_ID || ""
              ) +
              "::" +
              String(
                row.PRODUCT_ID || ""
              ) +
              "::" +
              String(
                row.VARIATION_NAME || ""
              ) +
              "::" +
              index,
            platform: String(
              row.PLATFORM || ""
            ),
            storeName: String(
              stores.find(
                (store) =>
                  String(
                    store.STORE_ID || ""
                  ) ===
                  String(
                    row.STORE_ID || ""
                  )
              )?.STORE_NAME ||
                row.STORE_ID ||
                ""
            ),
            productId: String(
              row.PRODUCT_ID || ""
            ),
            productName: String(
              row.PRODUCT_NAME || ""
            ),
            variationName: String(
              row.VARIATION_NAME || ""
            ),
            family: String(
              row.PRODUCT_FAMILY || ""
            ),
            canonicalSku: String(
              row.SUGGESTED_SKU ||
                row.CURRENT_SKU ||
                ""
            ),
            inventoryStatus: String(
              row.INVENTORY_STATUS || ""
            ),
            detectedColors: String(
              row.DETECTED_COLORS || ""
            ),
            bundleQty:
              Number(
                row.BUNDLE_QTY
              ) || 1,
            fulfillmentAction: String(
              row.FULFILLMENT_ACTION || ""
            ),
            componentDetail: String(
              row.COMPONENT_DETAIL || ""
            ),
          }))}
        marketplaceStores={stores.map(
          (store) => ({
            storeId: String(
              store.STORE_ID || ""
            ),
            storeName: String(
              store.STORE_NAME || ""
            ),
            platform: String(
              store.PLATFORM || ""
            ),
            status: String(
              store.STATUS || ""
            ),
          })
        )}
        catalogProducts={products.map(
          (row) => ({
            productId: String(
              row.PRODUCT_ID || ""
            ),
            sku: String(
              row.SKU || ""
            ),
            productName: String(
              row.PRODUCT_NAME || ""
            ),
            category: String(
              row.CATEGORY || ""
            ),
            variant: String(
              row.VARIANT || ""
            ),
            unit: String(
              row.UNIT || ""
            ),
            hpp: String(
              row.HPP_DEFAULT || ""
            ),
            status: String(
              row.STATUS || ""
            ),
          })
        )}
        catalogSkuRows={skuColors.map(
          (row) => ({
            productName: String(
              row.PRODUCT_NAME || ""
            ),
            family: String(
              row.PRODUCT_FAMILY || ""
            ),
            parentSku: String(
              row.SKU_INDUK || ""
            ),
            variantSku: String(
              row.SKU_VARIAN || ""
            ),
            color: String(
              row.COLOR || ""
            ),
            size: String(
              row.SIZE || ""
            ),
            validationStatus: String(
              row.VALIDATION_STATUS || ""
            ),
            syncEligible: String(
              row.SYNC_ELIGIBLE || ""
            ),
            sourceSheet: String(
              row.SOURCE_SHEET || ""
            ),
            notes: String(
              row.NOTES || ""
            ),
          })
        )}
        catalogStores={stores.map(
          (row) => ({
            storeId: String(
              row.STORE_ID || ""
            ),
            ownerId: String(
              row.OWNER_ID || ""
            ),
            platform: String(
              row.PLATFORM || ""
            ),
            storeName: String(
              row.STORE_NAME || ""
            ),
            storeCode: String(
              row.STORE_CODE || ""
            ),
            status: String(
              row.STATUS || ""
            ),
            apiStatus: String(
              row.API_STATUS || ""
            ),
          })
        )}
        onSelect={(nextTab) =>
          selectAdminTab(nextTab as Tab)
        }
      />

      <main
        className={
          adminWorkspace ? "main" : tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : tab === "orders"
              ? "main rkn-mobile-orders-hidden"
              : tab === "stock"
                ? "main rkn-mobile-stock-hidden"
                : tab === "marketplaceHub"
                  ? "main rkn-mobile-marketplace-hidden"
                  : tab === "menuHub"
                  ? "main rkn-mobile-menu-hidden"
                  : tab === "products" ||
                  tab === "skuColors" ||
                  tab === "stores"
                  ? "main rkn-mobile-catalog-hidden"
                  : tab === "hppCosting"
                  ? "main rkn-hpp-main"
                  : "main"
        }
      >
        <header className="topbar">

          <div className="admin-topbar-copy">
            <span className="admin-topbar-kicker">
              RKN ERP
            </span>

            <h1>
              {adminWorkspace?.title ?? adminTabTitles[tab]}
            </h1>

            <p>
              {adminWorkspace?.description ?? adminTabDescriptions[tab]}
            </p>
          </div>

          <div className="rkn-desktop-topbar-status">
            <span
              className={
                connected
                  ? "rkn-status-dot connected"
                  : "rkn-status-dot"
              }
            />

            <div>
              <strong>
                {connected
                  ? "Master Data Canonical Terhubung"
                  : "Master Data Tidak Terhubung"}
              </strong>

              <small>
                {connected
                  ? "Product, SKU, dan warna siap digunakan"
                  : "Periksa koneksi data utama"}
              </small>
            </div>
          </div>

          {!adminWorkspace && (tab === "products" || tab === "skuColors" || tab === "massUpdate" || tab === "stock") && (
            <input className="search" placeholder={tab === "skuColors" ? "Cari keluarga, SKU, warna..." : tab === "massUpdate" ? "Cari produk, varian, SKU..." : tab === "stock" ? "Cari bundle, komponen SKU, warna..." : "Cari produk, SKU..."} value={search} onChange={(e) => setSearch(e.target.value)} />
          )}
        </header>
        {adminWorkspace ? (
          <section
            className="rkn-admin-workspace"
            aria-label={adminWorkspace.title}
          >
            <iframe
              key={adminWorkspace.url}
              src={adminWorkspace.url}
              title={adminWorkspace.title}
              className="rkn-admin-workspace-frame"
            />
          </section>
        ) : null}

        {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}

        {tab === "dashboard" && (
          <section className="rkn-dashboard-v2">

            <div className="rkn-dashboard-hero">
              <div className="rkn-dashboard-hero-copy">
                <span className="rkn-dashboard-eyebrow">
                  RINGKASAN OPERASIONAL
                </span>

                <h2>
                  Ringkasan operasional RKN
                </h2>

                <p>
                  Pantau toko, produk, SKU, dan aktivitas utama
                  dari satu dashboard.
                </p>
              </div>

              <div className="rkn-dashboard-hero-status">
                <span>STATUS SISTEM</span>
                <strong>
                  {connected ? "AKTIF" : "PERLU DIPERIKSA"}
                </strong>
                <small>
                  {connected
                    ? "Master data terhubung"
                    : "Master data belum terhubung"}
                </small>
              </div>
            </div>


            <div className="rkn-dashboard-kpis">
              <div className="rkn-kpi-card">
                <div className="rkn-kpi-top">
                  <span>TOKO AKTIF</span>
                  <i className="rkn-kpi-dot good" />
                </div>

                <strong>{activeStores}</strong>

                <small>
                  8 akun terdaftar
                </small>
              </div>


              <div className="rkn-kpi-card">
                <div className="rkn-kpi-top">
                  <span>KELUARGA PRODUK</span>
                  <i className="rkn-kpi-dot indigo" />
                </div>

                <strong>
                  {products.length || familyCount}
                </strong>

                <small>
                  Produk pada master
                </small>
              </div>


              <div className="rkn-kpi-card">
                <div className="rkn-kpi-top">
                  <span>VARIAN SKU</span>
                  <i className="rkn-kpi-dot indigo" />
                </div>

                <strong>{skuColors.length}</strong>

                <small>
                  {colors.length} warna master
                </small>
              </div>


              <div className="rkn-kpi-card">
                <div className="rkn-kpi-top">
                  <span>SUMBER DATA</span>
                  <i className={`rkn-kpi-dot ${
                    imports.length ? "good" : "warn"
                  }`} />
                </div>

                <strong>{sourceCount}</strong>

                <small>
                  {imports.length} worksheet  / {" "}
                  {allMappedRows.length.toLocaleString("id-ID")} baris
                </small>
              </div>
            </div>


            <div className="rkn-home-domain-summary">

              <section className="rkn-home-domain-card">
                <div className="rkn-home-domain-head">
                  <div>
                    <span>MARKETPLACE</span>
                    <strong>Pembaruan Marketplace</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab("massUpdate")}
                  >
                    Buka
                  </button>
                </div>

                <div className="rkn-home-domain-rows">
                  <div>
                    <span>Data siap</span>
                    <strong>{mappedReady.toLocaleString("id-ID")}</strong>
                  </div>

                  <div>
                    <span>Perlu ditinjau</span>
                    <strong className={unresolved ? "warn" : ""}>
                      {unresolved.toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div>
                    <span>File aktif</span>
                    <strong>{imports.length.toLocaleString("id-ID")}</strong>
                  </div>
                </div>
              </section>


              <section className="rkn-home-domain-card">
                <div className="rkn-home-domain-head">
                  <div>
                    <span>PESANAN</span>
                    <strong>Pesanan Marketplace</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab("orders")}
                  >
                    Buka
                  </button>
                </div>

                <div className="rkn-home-domain-rows">
                  <div>
                    <span>Order terbaca</span>
                    <strong>
                      {orderParsedCount.toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div>
                    <span>Menunggu alokasi</span>
                    <strong className={orderWaitingCount ? "warn" : ""}>
                      {orderWaitingCount.toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div>
                    <span>Perlu rekomendasi</span>
                    <strong className={orderRandomCount ? "warn" : ""}>
                      {orderRandomCount.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
              </section>


              <section className="rkn-home-domain-card">
                <div className="rkn-home-domain-head">
                  <div>
                    <span>PERSEDIAAN</span>
                    <strong>Kesiapan Stok</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab("stock")}
                  >
                    Buka
                  </button>
                </div>

                <div className="rkn-home-domain-rows">
                  <div>
                    <span>Siap</span>
                    <strong>{inventoryReady.toLocaleString("id-ID")}</strong>
                  </div>

                  <div>
                    <span>Menunggu alokasi</span>
                    <strong className={inventoryWaiting ? "warn" : ""}>
                      {inventoryWaiting.toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div>
                    <span>Perlu ditinjau</span>
                    <strong className={inventoryReview ? "warn" : ""}>
                      {inventoryReview.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
              </section>


              <section className="rkn-home-domain-card">
                <div className="rkn-home-domain-head">
                  <div>
                    <span>PRODUK & BIAYA</span>
                    <strong>Master Produk</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab("products")}
                  >
                    Buka
                  </button>
                </div>

                <div className="rkn-home-domain-rows">
                  <div>
                    <span>Keluarga produk</span>
                    <strong>
                      {(products.length || familyCount).toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div>
                    <span>Varian SKU</span>
                    <strong>{skuColors.length.toLocaleString("id-ID")}</strong>
                  </div>

                  <div>
                    <span>Total HPP master</span>
                    <strong>{money(totalHpp)}</strong>
                  </div>
                </div>
              </section>

            </div>


            <div className="rkn-dashboard-main-grid">

              <div className="rkn-dashboard-card rkn-dashboard-security">
                <div className="rkn-dashboard-card-head">
                  <div>
                    <span>ALUR DATA</span>
                    <h3>Proses Data Marketplace</h3>
                  </div>

                  <div className="rkn-dashboard-pill good">
                    4 TAHAP
                  </div>
                </div>

                <div className="rkn-dashboard-flow">
                  <div>
                    <span>01</span>
                    <strong>Import Data</strong>
                    <small>Marketplace</small>
                  </div>

                  <b>→</b>

                  <div>
                    <span>02</span>
                    <strong>Pemetaan SKU</strong>
                    <small>Otomatis</small>
                  </div>

                  <b>→</b>

                  <div>
                    <span>03</span>
                    <strong>SKU Master</strong>
                    <small>Cocokkan master</small>
                  </div>

                  <b>→</b>

                  <div>
                    <span>04</span>
                    <strong>Data Siap</strong>
                    <small>Siap digunakan</small>
                  </div>
                </div>

                <div className="rkn-dashboard-security-note">
                  <span>●</span>
                  Tidak ada password, OTP, cookie, access token,
                  refresh token, Partner Key, atau login marketplace
                  yang disimpan oleh RKN ERP.
                </div>
              </div>


              <div className="rkn-dashboard-card rkn-dashboard-health">
                <div className="rkn-dashboard-card-head">
                  <div>
                    <span>KONDISI SISTEM</span>
                    <h3>Kesiapan Data</h3>
                  </div>

                  <div className={`rkn-dashboard-pill ${
                    unresolved ? "warn" : "good"
                  }`}>
                    {unresolved ? "PERLU DITINJAU" : "SIAP"}
                  </div>
                </div>

                <div className="rkn-health-list">

                  <div className="rkn-health-row">
                    <span className="rkn-health-icon good">✓</span>
                    <div>
                      <strong>Master Data</strong>
                      <small>Data utama tersedia</small>
                    </div>
                    <b>TERHUBUNG</b>
                  </div>

                  <div className="rkn-health-row">
                    <span className="rkn-health-icon good">✓</span>
                    <div>
                      <strong>SKU Master</strong>
                      <small>
                        {syncReady}/{skuColors.length} varian siap
                      </small>
                    </div>
                    <b>{syncReady}</b>
                  </div>

                  <div className="rkn-health-row">
                    <span className={`rkn-health-icon ${
                      mappedReady ? "good" : "warn"
                    }`}>
                      {mappedReady ? "✓" : "!"}
                    </span>
                    <div>
                      <strong>Pemetaan SKU</strong>
                      <small>Data siap digunakan</small>
                    </div>
                    <b>{mappedReady}</b>
                  </div>

                  <div className="rkn-health-row">
                    <span className={`rkn-health-icon ${
                      unresolved ? "warn" : "good"
                    }`}>
                      {unresolved ? "!" : "✓"}
                    </span>
                    <div>
                      <strong>Perlu Ditinjau</strong>
                      <small>
                        Data yang masih perlu diperiksa
                      </small>
                    </div>
                    <b>{unresolved}</b>
                  </div>

                  <div className="rkn-health-row">
                    <span className="rkn-health-icon good">✓</span>
                    <div>
                      <strong>Marketplace Credential</strong>
                      <small>Tidak disimpan di sistem</small>
                    </div>
                    <b>0</b>
                  </div>

                </div>
              </div>

            </div>


            <div className="rkn-dashboard-bottom-strip">

              <div>
                <span>SKU AKAN BERUBAH</span>
                <strong>{mappedChanges}</strong>
              </div>

              <div>
                <span>FINAL EXPORT</span>
                <strong className={
                  finalReady
                    ? "rkn-text-good"
                    : "rkn-text-warn"
                }>
                  {finalReady ? "READY" : "BELUM"}
                </strong>
              </div>

              <div>
                <span>TOTAL HPP MASTER</span>
                <strong>{money(totalHpp)}</strong>
              </div>

              <div>
                <span>MASTER DATA</span>
                <strong className={
                  connected
                    ? "rkn-text-good"
                    : "rkn-text-warn"
                }>
                  {connected ? "CONNECTED" : "OFFLINE"}
                </strong>
              </div>

            </div>

          </section>
        )}

                {/* RKN_HPP_PAGE_V11 */}
        {tab === "hppCosting" && (
          <HppCostingCenter
            products={products.map(
              (row) => ({
                productId: String(
                  row.PRODUCT_ID || ""
                ),
                sku: String(
                  row.SKU || ""
                ),
                productName: String(
                  row.PRODUCT_NAME || ""
                ),
                category: String(
                  row.CATEGORY || ""
                ),
              })
            )}
          />
        )}

        {tab === "products" && (
          <section className="stack">
            <div className="rkn-canonical-product-control">
              <div>
                <span>PRODUCT MASTER</span>
                <strong>
                  Source of truth produk dan physical SKU
                </strong>
                <small>
                  Status, recovery seed, dan health canonical master.
                </small>
              </div>

              <button
                type="button"
                className="btn primary"
                onClick={() =>
                  openAdminWorkspace(
                    "/admin/product-master?title=Canonical%20Product%20Master"
                  )
                }
              >
                BUKA KENDALI MASTER
              </button>
            </div>

            <TablePanel
              title={`Master Produk  /  ${products.length} keluarga`}
              rows={filteredProducts}
              columns={[
                "PRODUCT_ID",
                "SKU",
                "PRODUCT_NAME",
                "CATEGORY",
                "VARIANT",
                "UNIT",
                "HPP_DEFAULT",
                "STATUS",
              ]}
              empty="Belum ada produk pada master."
            />
          </section>
        )}
        {tab === "skuColors" && (
          <section className="stack">

            <TablePanel title={`Master SKU & Warna  /  ${filteredSkuColors.length} ditampilkan`} rows={filteredSkuColors} columns={["PRODUCT_NAME", "PRODUCT_FAMILY", "SKU_INDUK", "SKU_VARIAN", "COLOR", "SIZE", "VALIDATION_STATUS", "SYNC_ELIGIBLE", "SOURCE_SHEET", "NOTES"]} empty="Belum ada master SKU warna." />
            <TablePanel title={`Master Warna  /  ${filteredColors.length} warna`} rows={filteredColors} columns={["COLOR_ID", "COLOR_NAME", "STATUS", "SYNC_ALLOWED", "NOTES"]} empty="Belum ada master warna." />
          </section>
        )}

        {tab === "stores" && <TablePanel title="MASTER STORE" rows={stores} columns={["STORE_ID", "OWNER_ID", "PLATFORM", "STORE_NAME", "STORE_CODE", "STATUS", "API_STATUS"]} />}

        {tab === "importMp" && (
          <section className="stack">
            <div className="zero-credential-banner"><strong>Pemrosesan Lokal</strong><span>File XLSX diproses di perangkat ini tanpa login marketplace.</span></div>
            <Panel title="Import Mass Update / Sales Information">
              <div className="upload-zone">
                <input id="mp-files" type="file" accept=".xlsx,.xls,.zip" multiple onChange={onImportFiles} disabled={busy || !skuColors.length} />
                <label htmlFor="mp-files" className="upload-button">{busy ? "Sedang membaca..." : "Pilih XLSX Shopee / ZIP TikTok"}</label>
                <p>Boleh pilih 5 file Shopee + 3 ZIP TikTok sekaligus. Shopee dikenali dari fingerprint ID; TikTok dari handle toko di isi XLSX dalam ZIP.</p>
                {!skuColors.length && <small>Master SKU & Warna belum terbaca; muat ulang setelah Master Data terhubung.</small>}
              </div>
            </Panel>
            <Panel title={`File Dalam Sesi  /  ${imports.length}`}>
              <div className="integration-table-wrap"><table><thead><tr><th>Sumber</th><th>Platform</th><th>Auto Detect</th><th>Toko Pemilik</th><th>Baris</th><th>Siap</th><th>Perlu Ditinjau</th><th>Diblokir</th><th>Diarsipkan</th><th>Aksi</th></tr></thead><tbody>
                {imports.length === 0 ? <tr><td colSpan={10} className="empty-cell">Belum ada file. Pilih XLSX Shopee atau ZIP TikTok di atas.</td></tr> : imports.map((f) => {
                  const ready = f.rows.filter((r) => r.MATCH_STATUS === "READY").length;
                  const review = f.rows.filter((r) => r.MATCH_STATUS === "REVIEW").length;
                  const blocked = f.rows.filter((r) => r.MATCH_STATUS === "BLOCKED").length;
                  const archived = f.rows.filter((r) => r.MATCH_STATUS === "ARCHIVED").length;
                  const sourceLabel = f.sourceKind === "TIKTOK_ZIP" ? `${f.sourceContainerName} > ${f.fileName}` : f.fileName;
                  return <tr key={f.id}><td title={sourceLabel}>{sourceLabel}</td><td><span className="badge">{f.platform}</span></td><td title={f.detectionReason}><span className={f.storeDetection === "AUTO" ? "badge badge-good" : f.storeDetection === "CONFLICT" ? "badge badge-bad" : "badge badge-warn"}>{f.storeDetection === "AUTO" ? `AUTO ${f.storeConfidence}%` : f.storeDetection}</span><div className="tiny-muted">{f.storeFingerprint || "—"}</div></td><td><RknSmartSelect className="table-select" value={f.storeId} onChange={(e) => assignStore(f.id, e.target.value)}><option value="">Pilih toko...</option>{stores.filter((s) => String(s.PLATFORM).toUpperCase() === f.platform).map((s) => <option key={String(s.STORE_ID)} value={String(s.STORE_ID)}>{String(s.STORE_NAME)}</option>)}</RknSmartSelect></td><td>{f.rows.length}</td><td><span className="badge badge-good">{ready}</span></td><td><span className={review ? "badge badge-warn" : "badge badge-good"}>{review}</span></td><td><span className={blocked ? "badge badge-bad" : "badge badge-good"}>{blocked}</span></td><td><span className="badge">{archived}</span></td><td><button className="btn" onClick={() => removeImport(f.id)}>Hapus sesi</button></td></tr>;
                })}
              </tbody></table></div>
              {imports.length > 0 && <div className="panel-actions"><button className="btn" onClick={clearImports}>Bersihkan Semua Import</button><button
  className="btn"
  disabled={busy || !skuColors.length}
  onClick={() => void reprocessWorkspace(true)}
  title="Proses ulang semua file tersimpan dengan aturan pemetaan terbaru"
>
  Reprocess Semua
</button><button className="btn primary" onClick={() => setTab("massUpdate")}>Lihat Hasil Mapping</button></div>}
            </Panel>
          </section>
        )}

        {tab === "massUpdate" && (
          <section className="stack">
            <div className="engine-banner">
              <div>
                <span className="eyebrow">Pembaruan Marketplace</span>
                <strong>Pemetaan SKU Multi-Toko</strong>
                <p>Semua toko menggunakan master SKU yang sama, sementara status marketplace dan stok tetap dikelola per toko.</p>
              </div>
              <div className={finalReady ? "readiness-pill ready" : "readiness-pill pending"}>
                <span>Status Pembaruan</span>
                <strong>{finalReady ? "Siap" : "Belum Siap"}</strong>
              </div>
            </div>

            <div className="sync-toolbar pro-toolbar">
              <div className="toolbar-field"><label>Toko</label><RknSmartSelect value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}><option value="">Semua Toko</option>{stores.map((s) => <option key={String(s.STORE_ID)} value={String(s.STORE_ID)}>{String(s.STORE_NAME)}</option>)}</RknSmartSelect></div>
              <div className="toolbar-field"><label>Status SKU</label><RknSmartSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Semua Status</option><option value="READY">Siap</option><option value="REVIEW">Perlu Ditinjau</option><option value="BLOCKED">Diblokir</option><option value="ARCHIVED">Diarsipkan</option></RknSmartSelect></div>
              <div className="toolbar-field"><label>Status Stok</label><RknSmartSelect value={inventoryStatusFilter} onChange={(e) => setInventoryStatusFilter(e.target.value)}><option value="">Semua Inventory</option><option value="READY">Siap</option><option value="WAITING_ALLOCATION">Menunggu Alokasi</option><option value="RANDOM_SUGGESTION">Perlu Rekomendasi</option><option value="REVIEW">Perlu Ditinjau</option><option value="BLOCKED">Diblokir</option><option value="ARCHIVED">Diarsipkan</option></RknSmartSelect></div>
              <div className="toolbar-actions"><button className="btn" onClick={() => setTab("importMp")}>+ Import File</button><button className="btn" disabled={!imports.length || busy || !allStoresAssigned} onClick={() => exportAll(false)}>Unduh Draft</button><button className="btn primary" disabled={!finalReady || busy} onClick={() => exportAll(true)}>Unduh Final</button></div>
            </div>





            <div className={finalReady ? "decision-strip good" : "decision-strip warn"}>
              <div><span className="decision-icon">{finalReady ? "✓" : "!"}</span><div><strong>{finalReady ? "Data siap diperbarui ke marketplace." : "Pembaruan marketplace belum siap."}</strong><p>{finalReady ? `Tidak ada SKU yang perlu ditinjau. Stok tertunda ${inventoryPending.toLocaleString("id-ID")} baris tetap ditangani di menu Stok.` : `Masih ada ${unresolved.toLocaleString("id-ID")} baris SKU yang masih perlu ditinjau.`}</p></div></div>
              <span className="decision-tag">Status SKU  /  {finalReady ? "Siap" : "Tertahan"}</span>
            </div>

        {imports.length > 0 && (
          <Panel title="Dashboard Inventory Per Akun">
            {(() => {
              const grouped = new Map<string, {
                storeId: string;
                storeName: string;
                marketplace: string;
                ready: number;
                waiting: number;
                random: number;
                review: number;
                archived: number;
                pending: number;
              }>();

              for (const f of imports) {
                for (const r of f.rows) {
                  const storeId = String(r.STORE_ID || f.storeId || "").trim();
                  if (!storeId) continue;

                  const storeMeta = stores.find(
                    (s) => String(s.STORE_ID || "").trim() === storeId
                  );

                  const storeName =
                    String(storeMeta?.STORE_NAME || "").trim() ||
                    storeId;

                  const marketplaceRaw =
                    String(r.PLATFORM || "").trim() ||
                    (storeId.includes("-SHP-")
                      ? "SHOPEE"
                      : storeId.includes("-TTK-")
                        ? "TIKTOK"
                        : "");

                  const marketplace = titleCaseWords(marketplaceRaw);

                  const current = grouped.get(storeId) || {
                    storeId,
                    storeName,
                    marketplace,
                    ready: 0,
                    waiting: 0,
                    random: 0,
                    review: 0,
                    archived: 0,
                    pending: 0,
                  };

                  const status = String(r.INVENTORY_STATUS || "").toUpperCase();

                  if (status === "READY") current.ready++;
                  if (status === "WAITING_ALLOCATION") current.waiting++;
                  if (status === "RANDOM_SUGGESTION") current.random++;
                  if (status === "REVIEW" || status === "BLOCKED") current.review++;
                  if (status === "ARCHIVED") current.archived++;

                  if (
                    status === "WAITING_ALLOCATION" ||
                    status === "RANDOM_SUGGESTION" ||
                    status === "REVIEW" ||
                    status === "BLOCKED"
                  ) {
                    current.pending++;
                  }

                  grouped.set(storeId, current);
                }
              }

              const accountRows = Array.from(grouped.values()).sort(
                (a, b) =>
                  a.marketplace.localeCompare(b.marketplace) ||
                  a.storeName.localeCompare(b.storeName)
              );

              return (
                <div>
                  <div className="tiny-muted" style={{ marginBottom: 10 }}>
                    Agregasi inventory berdasarkan Store ID dari seluruh file marketplace yang sedang dimuat.
                  </div>

                  <div className="integration-card" style={{ overflowX: "auto" }}>
                    <table style={{ minWidth: 1250 }}>
                      <thead>
                        <tr>
                          <th>Nama Akun</th>
                          <th>Marketplace</th>
                          <th>Store ID</th>
                          <th>Stok Siap</th>
                          <th>Menunggu Alokasi</th>
                          <th>Perlu Rekomendasi</th>
                          <th>Perlu Ditinjau</th>
                          <th>Stok Diarsipkan</th>
                          <th>Stok Tertunda</th>
                          <th>Kesiapan</th>
                        </tr>
                      </thead>

                      <tbody>
                        {accountRows.map((x) => {
                          const activeInventory = x.ready + x.pending;
                          const readiness =
                            activeInventory > 0
                              ? (x.ready / activeInventory) * 100
                              : 100;

                          return (
                            <tr key={x.storeId}>
                              <td>
                                <strong>{x.storeName}</strong>
                              </td>

                              <td>
                                <span className="badge">{x.marketplace || "-"}</span>
                              </td>

                              <td>
                                <span className="tiny-muted">{x.storeId}</span>
                              </td>

                              <td>
                                <span className="badge badge-good">
                                  {x.ready.toLocaleString("id-ID")}
                                </span>
                              </td>

                              <td>
                                {x.waiting.toLocaleString("id-ID")}
                              </td>

                              <td>
                                {x.random.toLocaleString("id-ID")}
                              </td>

                              <td>
                                {x.review.toLocaleString("id-ID")}
                              </td>

                              <td>
                                {x.archived.toLocaleString("id-ID")}
                              </td>

                              <td>
                                <span
                                  className={`badge ${
                                    x.pending === 0
                                      ? "badge-good"
                                      : "badge-warn"
                                  }`}
                                >
                                  {x.pending.toLocaleString("id-ID")}
                                </span>
                              </td>

                              <td>
                                <strong>{readiness.toFixed(1)}%</strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </Panel>
        )}
            {imports.length > 0 && <Panel title="Kontrol Pembaruan per Toko / File"><div className="integration-table-wrap"><table><thead><tr><th>Toko</th><th>File</th><th>SKU Siap</th><th>SKU Perlu Ditinjau</th><th>Stok Siap</th><th>Stok Tertunda</th><th>Status Pembaruan</th><th>Aksi</th></tr></thead><tbody>{imports.map((f) => {
              const store = stores.find((s) => String(s.STORE_ID) === f.storeId);
              const ready = f.rows.filter((r) => r.MATCH_STATUS === "READY").length;
              const un = f.rows.filter((r) => r.MATCH_STATUS === "REVIEW" || r.MATCH_STATUS === "BLOCKED").length;
              const invReady = f.rows.filter((r) => r.INVENTORY_STATUS === "READY").length;
              const invPending = f.rows.filter((r) => r.INVENTORY_STATUS === "WAITING_ALLOCATION" || r.INVENTORY_STATUS === "RANDOM_SUGGESTION" || r.INVENTORY_STATUS === "REVIEW" || r.INVENTORY_STATUS === "BLOCKED").length;
              return <tr key={f.id}><td><strong>{String(store?.STORE_NAME || "Belum dipilih")}</strong><div className="tiny-muted">{f.storeId || "Store belum assigned"}</div></td><td>{f.fileName}</td><td><span className="badge badge-good">{ready}</span></td><td><span className={un ? "badge badge-warn" : "badge badge-good"}>{un}</span></td><td>{invReady}</td><td><span className={invPending ? "badge badge-warn" : "badge badge-good"}>{invPending}</span></td><td><span className={f.storeId && un === 0 ? "badge badge-good" : "badge badge-warn"}>{f.storeId && un === 0 ? "Siap" : "Tertahan"}</span></td><td className="actions-cell"><button className="btn" disabled={!f.storeId || busy} onClick={() => exportOne(f, false)}>Unduh Draft</button> <button className="btn primary" disabled={!f.storeId || un > 0 || busy} onClick={() => exportOne(f, true)}>Unduh Final</button></td></tr>;
            })}</tbody></table></div></Panel>}

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>

              <button

                className="btn"

                disabled={filteredMapped.length === 0}

                onClick={() => downloadFilteredMappingCsv(filteredMapped)}

                title="Download seluruh Mapping Detail sesuai filter aktif"

              >

                Download Detail CSV  /  {filteredMapped.length.toLocaleString("id-ID")} baris

              </button>

            </div>

            <TablePanel title={`Detail Pemetaan  /  ${filteredMapped.length.toLocaleString("id-ID")} baris${filteredMapped.length > 300 ? "  /  preview 300" : ""}`} rows={filteredMapped.slice(0, 300)} columns={["STORE_ID", "PLATFORM", "PRODUCT_ID", "PRODUCT_NAME", "VARIATION_NAME", "CURRENT_PARENT_SKU", "CURRENT_SKU", "PRODUCT_FAMILY", "SUGGESTED_PARENT_SKU", "SUGGESTED_SKU", "BUNDLE_QTY", "BUNDLE_TYPE", "DETECTED_COLORS", "COMPONENT_DETAIL", "INVENTORY_STATUS", "FULFILLMENT_ACTION", "MATCH_STATUS", "CONFIDENCE", "CHANGE", "REASON"]} empty="Belum ada file marketplace. Masuk menu Import MP." />
          </section>
        )}

        {/* RKN_ORDERS_PAGE_V1_SAFE */}
{tab === "orders" && (
  <section className="stack">

    <div
      style={{
        borderRadius: 16,
        padding: 20,
        background: "linear-gradient(135deg,#123f52,#17616a)",
        color: "white",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Pesanan Marketplace
      </div>

      <h2 style={{ margin: "4px 0 6px" }}>
        Pesanan & Packing
      </h2>

      <div style={{ fontSize: 13, opacity: 0.9 }}>
        Kelola pesanan marketplace dan proses packing dari satu halaman. Import file tetap tersedia sebagai jalur cadangan.
      </div>
    </div>



    <div className="panel rkn-order-manual-import-recovery" style={{ padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <strong>Import Pesanan Marketplace</strong>

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Upload file order dari Seller Center.
          Auto Detector akun akan dipasang pada tahap berikutnya.
        </div>
      </div>

      <label
        style={{
          display: "block",
          border: "2px dashed #cbd5e1",
          borderRadius: 14,
          padding: 28,
          textAlign: "center",
          cursor: "pointer",
          background: "#f8fafc",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          Pilih file pesanan
        </div>

        <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 12 }}>
          XLSX / XLS export dari Seller Center
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          style={{ display: "none" }}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);

            setOrderImportFiles(files);
            setOrderAnalyses([]);

            if (!files.length) {
              setOrderImportMessage("");
              return;
            }

            setOrderImportBusy(true);
            setOrderImportMessage(
              "Menganalisis " +
                files.length +
                " file pesanan..."
            );

            try {
              const analyses = await Promise.all(
                files.map((file) =>
                  analyzeOrderFile(
                    file,
                    stores,
                    allMappedRows
                  )
                )
              );

              setOrderAnalyses(analyses);

              const totalOrders = analyses.reduce(
                (sum, item) =>
                  sum + item.orderCount,
                0
              );

              const totalItems = analyses.reduce(
                (sum, item) =>
                  sum + item.itemCount,
                0
              );

              setOrderImportMessage(
                files.length +
                  " file selesai dianalisis  /  " +
                  totalOrders.toLocaleString("id-ID") +
                  " order  /  " +
                  totalItems.toLocaleString("id-ID") +
                  " item."
              );
            } catch (error) {
              console.error(error);

              setOrderImportMessage(
                "Gagal membaca file pesanan: " +
                  (error instanceof Error
                    ? error.message
                    : String(error))
              );
            } finally {
              setOrderImportBusy(false);
            }
          }}
        />

        <span
          style={{
            display: "inline-block",
            padding: "9px 16px",
            borderRadius: 9,
            background: "#0f766e",
            color: "white",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Pilih File
        </span>
      </label>

      {orderImportMessage && (
        <div className="callout" style={{ marginTop: 14 }}>
          <strong>Order Intake:</strong>{" "}
          {orderImportMessage}
        </div>
      )}

      {orderImportFiles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong style={{ fontSize: 13 }}>
            File yang dipilih
          </strong>

          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {orderImportFiles.map((file, index) => (
              <div
                key={file.name + "-" + index}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {file.name}
                  </div>

                  <div style={{ fontSize: 11, opacity: 0.65 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: "#fff7ed",
                    color: "#9a3412",
                  }}
                >
                  MENUNGGU DETEKSI
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* RKN_ORDERS_V2_RESULTS */}
    {orderImportBusy && (
      <div className="callout">
        <strong>Parser:</strong> Membaca file pesanan...
      </div>
    )}

    {orderAnalyses.length > 0 && (
      <div className="panel" style={{ padding: 18 }}>
        <strong>Hasil Deteksi Pesanan</strong>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gap: 10,
          }}
        >
          {orderAnalyses.map((analysis) => (
            <div
              key={analysis.fileName}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {analysis.fileName}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                      marginTop: 4,
                    }}
                  >
                    {analysis.formatReason}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="badge badge-good">
                    {analysis.platform}
                  </span>

                  <span
                    className={
                      analysis.storeDetection === "AUTO"
                        ? "badge badge-good"
                        : "badge badge-warn"
                    }
                  >
                    {analysis.storeDetection}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(150px,1fr))",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Akun
                  </div>
                  <strong>
                    {analysis.detectedStoreName || "Belum terdeteksi"}
                  </strong>
                </div>

                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Store ID
                  </div>
                  <strong>
                    {analysis.detectedStoreId || "-"}
                  </strong>
                </div>

                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Confidence
                  </div>
                  <strong>
                    {analysis.confidence}%
                  </strong>
                </div>

                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Order
                  </div>
                  <strong>
                    {analysis.orderCount.toLocaleString("id-ID")}
                  </strong>
                </div>

                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Item
                  </div>
                  <strong>
                    {analysis.itemCount.toLocaleString("id-ID")}
                  </strong>
                </div>

                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Matched
                  </div>
                  <strong>
                    {analysis.matchedCount.toLocaleString("id-ID")}
                  </strong>
                </div>

                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Review
                  </div>
                  <strong>
                    {analysis.reviewCount.toLocaleString("id-ID")}
                  </strong>
                </div>
              </div>

              {analysis.storeDetection !== "AUTO" &&
                analysis.candidates.length > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                      marginTop: 12,
                    }}
                  >
                    Kandidat akun:{" "}
                    {analysis.candidates
                      .map(
                        (candidate) =>
                          candidate.storeName +
                          " (" +
                          Math.round(candidate.coverage * 100) +
                          "% coverage)"
                      )
                      .join("  /  ")}
                  </div>
                )}
              {analysis.storeDetection !== "AUTO" &&
                analysis.storeDetection !== "MANUAL" && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      border: "1px solid #fed7aa",
                      borderRadius: 10,
                      background: "#fff7ed",
                    }}
                  >
                    <div style={{ marginBottom: 9 }}>
                      <strong style={{ fontSize: 13 }}>
                        Konfirmasi Akun
                      </strong>

                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.72,
                          marginTop: 3,
                        }}
                      >
                        Auto Detector belum memiliki bukti yang cukup.
                        Pilih akun pemilik file ini secara manual.
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <RknSmartSelect
                        className="table-select"
                        value={
                          orderStoreOverrides[
                            analysis.fileName
                          ] || ""
                        }
                        onChange={(e) =>
                          setOrderStoreOverrides(
                            (old) => ({
                              ...old,
                              [analysis.fileName]:
                                e.target.value,
                            })
                          )
                        }
                      >
                        <option value="">
                          Pilih akun Shopee...
                        </option>

                        {stores
                          .filter(
                            (store) =>
                              String(
                                store.PLATFORM || ""
                              ).toUpperCase() === "SHOPEE"
                          )
                          .map((store) => (
                            <option
                              key={String(
                                store.STORE_ID
                              )}
                              value={String(
                                store.STORE_ID
                              )}
                            >
                              {String(
                                store.STORE_NAME ||
                                  store.STORE_ID
                              )}
                            </option>
                          ))}
                      </RknSmartSelect>

                      <button
                        className="btn primary"
                        disabled={
                          orderImportBusy ||
                          !orderStoreOverrides[
                            analysis.fileName
                          ]
                        }
                        onClick={() =>
                          void confirmOrderStore(
                            analysis.fileName
                          )
                        }
                      >
                        Konfirmasi Akun
                      </button>
                    </div>
                  </div>
                )}

              {analysis.storeDetection === "MANUAL" && (
                <div
                  className="callout"
                  style={{ marginTop: 12 }}
                >
                  <strong>
                    Akun dikonfirmasi manual.
                  </strong>{" "}
                  File ini sudah diproses ulang menggunakan
                  katalog akun yang dipilih. Item historis yang
                  tidak lagi tersedia di katalog aktif tetap
                  berstatus REVIEW.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {orderRows.length > 0 && (
      <div className="panel">
        <div
          style={{
            padding: "14px 16px",
            fontWeight: 700,
          }}
        >
          Pratinjau Pemetaan Pesanan  / {" "}
          {orderRows.length.toLocaleString("id-ID")} item
          {orderRows.length > 100 ? "  /  Preview 100" : ""}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Tanggal</th>
                <th>Source SKU</th>
                <th>Produk</th>
                <th>Variasi</th>
                <th>Qty</th>
                <th>Match</th>
                <th>SKU Master</th>
                <th>Family</th>
                <th>Inventory</th>
              </tr>
            </thead>

            <tbody>
              {orderRows.slice(0, 100).map((row, index) => (
                <tr key={row.LINE_KEY + "-" + index}>
                  <td>{row.ORDER_ID}</td>
                  <td>{row.ORDER_DATE}</td>
                  <td>{row.SOURCE_SKU || "-"}</td>
                  <td>{row.PRODUCT_NAME}</td>
                  <td>{row.VARIATION_NAME || "-"}</td>
                  <td>{row.QTY}</td>
                  <td>
                    <span
                      className={
                        row.MATCH_STATUS === "MATCHED"
                          ? "badge badge-good"
                          : "badge badge-warn"
                      }
                    >
                      {row.MATCH_TYPE}
                    </span>
                  </td>
                  <td>{row.CANONICAL_SKU || "-"}</td>
                  <td>{row.PRODUCT_FAMILY || "-"}</td>
                  <td>{row.INVENTORY_STATUS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orderReviewCount > 0 && (
          <div className="callout warn-callout">
            <strong>Pesanan Perlu Ditinjau:</strong>{" "}
            {orderReviewCount.toLocaleString("id-ID")} item belum
            dapat diputuskan dengan aman. Item lain tetap dapat dibaca.
          </div>
        )}
      </div>
    )}

    <div className="panel" style={{ padding: 18 }}>
      <strong>Auto Detection Pipeline</strong>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        {[
          ["1", "Detect Marketplace", "Marketplace"],
          ["2", "Detect Akun", "Cocokkan katalog 8 akun"],
          ["3", "Parse Order", "Order ID, SKU, Qty, Catatan"],
          ["4", "Deduplicate", "Cegah order ganda"],
          ["5", "Antrean Packing", "Penentuan SKU Fisik"],
        ].map(([no, title, desc]) => (
          <div
            key={no}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 13,
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.55 }}>
              STEP {no}
            </div>

            <div style={{ fontWeight: 700, marginTop: 3 }}>
              {title}
            </div>

            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>
              {desc}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="callout">
      <strong>Mode Aman:</strong>{" "}
      Pesanan v1 belum membuat mutasi stok.
      Stok fisik baru akan dikurangi setelah proses packing dan konfirmasi SKU fisik selesai divalidasi.
    </div>

  </section>
)}
{tab === "stock" && (() => {
          // RKN_ALLOCATION_CENTER_V1
          const pendingBase = allMappedRows.filter((r) =>
            r.INVENTORY_STATUS === "WAITING_ALLOCATION" ||
            r.INVENTORY_STATUS === "RANDOM_SUGGESTION"
          );

          const platformScoped = pendingBase.filter((r) =>
            !allocationPlatform ||
            String(r.PLATFORM || "").toUpperCase() === allocationPlatform
          );

          const storeScoped = platformScoped.filter((r) =>
            !allocationStore ||
            String(r.STORE_ID || "") === allocationStore
          );

          const scopedWaiting = storeScoped.filter(
            (r) => r.INVENTORY_STATUS === "WAITING_ALLOCATION"
          ).length;

          const scopedRandom = storeScoped.filter(
            (r) => r.INVENTORY_STATUS === "RANDOM_SUGGESTION"
          ).length;

          const q = search.trim().toLowerCase();

          const allocationRows = storeScoped
            .filter(
              (r) =>
                !allocationStatus ||
                r.INVENTORY_STATUS === allocationStatus
            )
            .filter((r) => {
              if (!q) return true;

              return [
                r.STORE_ID,
                r.PLATFORM,
                r.PRODUCT_ID,
                r.PRODUCT_NAME,
                r.VARIATION_NAME,
                r.PRODUCT_FAMILY,
                r.SUGGESTED_SKU,
                r.DETECTED_COLORS,
                r.INVENTORY_REASON,
              ]
                .map((v) => String(v ?? "").toLowerCase())
                .join(" ")
                .includes(q);
            });

          return (
            <section className="stack">
              <div className="engine-banner">
                <div>
                  <span className="eyebrow">
                    Persediaan
                  </span>
                  <strong>
                    Alokasi Stok
                  </strong>
                  <p>
                    Antrean SKU jual yang mapping-nya sudah valid tetapi
                    SKU fisiknya baru ditentukan saat picking. Tahap v1
                    belum mengurangi stok.
                  </p>
                </div>

                <div className="readiness-pill pending">
                  <span>Menunggu Alokasi</span>
                  {pendingBase.length > 0 && (
                    <strong>
                      {pendingBase.length.toLocaleString("id-ID")}
                    </strong>
                  )}
                </div>
              </div>



              <div className="sync-toolbar pro-toolbar">
                <div className="toolbar-field">
                  <label>Marketplace</label>
                  <RknSmartSelect
                    value={allocationPlatform}
                    onChange={(e) => {
                      setAllocationPlatform(e.target.value);
                      setAllocationStore("");
                      setAllocationOpenKey("");
                    }}
                  >
                    <option value="">Semua Marketplace</option>
                    <option value="SHOPEE">Shopee</option>
                    <option value="TIKTOK">TikTok</option>
                  </RknSmartSelect>
                </div>

                <div className="toolbar-field">
                  <label>Nama Akun</label>
                  <RknSmartSelect
                    value={allocationStore}
                    onChange={(e) => {
                      setAllocationStore(e.target.value);
                      setAllocationOpenKey("");
                    }}
                  >
                    <option value="">Semua Akun</option>

                    {stores
                      .filter(
                        (s) =>
                          !allocationPlatform ||
                          String(s.PLATFORM || "").toUpperCase() ===
                            allocationPlatform
                      )
                      .map((s) => (
                        <option
                          key={String(s.STORE_ID)}
                          value={String(s.STORE_ID)}
                        >
                          {String(s.STORE_NAME)}  /  {String(s.STORE_ID)}
                        </option>
                      ))}
                  </RknSmartSelect>
                </div>

                <div className="toolbar-field">
                  <label>Status Alokasi</label>
                  <RknSmartSelect
                    value={allocationStatus}
                    onChange={(e) => {
                      setAllocationStatus(e.target.value);
                      setAllocationOpenKey("");
                    }}
                  >
                    <option value="">Semua Pending</option>
                    <option value="WAITING_ALLOCATION">
                      Waiting Allocation
                    </option>
                    <option value="RANDOM_SUGGESTION">
                      Random Suggestion
                    </option>
                  </RknSmartSelect>
                </div>
              </div>

              <div className="callout">
                <strong>Mode Aman:</strong>{" "}
                Menu Alokasi hanya menampilkan antrean dan
                kandidat SKU master. Tombol di halaman ini belum
                mengurangi stok gudang.
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h2>
                    Antrean Alokasi  / {" "}
                    {allocationRows.length.toLocaleString("id-ID")} baris
                  </h2>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Akun</th>
                        <th>Marketplace</th>
                        <th>Product ID</th>
                        <th>Product</th>
                        <th>Variation</th>
                        <th>Family</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Detected Colors</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {allocationRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={10}
                            className="empty-cell"
                          >
                            Tidak ada antrean alokasi untuk filter ini.
                          </td>
                        </tr>
                      )}

                      {allocationRows.map((row, index) => {
                        const key = [
                          row.STORE_ID,
                          row.PRODUCT_ID,
                          row.VARIATION_ID,
                          row.VARIATION_NAME,
                          index,
                        ].join("|");

                        const store = stores.find(
                          (s) =>
                            String(s.STORE_ID) ===
                            String(row.STORE_ID)
                        );

                        const family = String(
                          row.PRODUCT_FAMILY || ""
                        ).trim();

                        const candidates = skuColors
                          .filter(
                            (c) =>
                              String(c.PRODUCT_FAMILY || "").trim() ===
                              family
                          )
                          .filter(
                            (c, i, arr) =>
                              arr.findIndex(
                                (x) =>
                                  String(x.SKU_VARIAN || "") ===
                                  String(c.SKU_VARIAN || "")
                              ) === i
                          )
                          .slice(0, 24);

                        const opened = allocationOpenKey === key;

                        return [
                          <tr key={`${key}-main`}>
                            <td>
                              <strong>
                                {String(
                                  store?.STORE_NAME ||
                                    row.STORE_ID ||
                                    "-"
                                )}
                              </strong>
                              <div className="tiny-muted">
                                {String(row.STORE_ID || "")}
                              </div>
                            </td>

                            <td>
                              <span className="badge">
                                {titleCaseWords(
                                  String(row.PLATFORM || "")
                                )}
                              </span>
                            </td>

                            <td>
                              {String(row.PRODUCT_ID || "-")}
                            </td>

                            <td
                              title={String(
                                row.PRODUCT_NAME || ""
                              )}
                            >
                              {String(
                                row.PRODUCT_NAME || "-"
                              ).slice(0, 70)}
                            </td>

                            <td>
                              {String(row.VARIATION_NAME || "-")}
                            </td>

                            <td>
                              <strong>{family || "-"}</strong>
                            </td>

                            <td>
                              {Number(
                                row.BUNDLE_QTY || 1
                              ).toLocaleString("id-ID")}
                            </td>

                            <td>
                              <span className="badge badge-warn">
                                {row.INVENTORY_STATUS ===
                                "RANDOM_SUGGESTION"
                                  ? "Random"
                                  : "Waiting"}
                              </span>
                            </td>

                            <td>
                              {String(
                                row.DETECTED_COLORS || "-"
                              )}
                            </td>

                            <td>
                              <button
                                className={
                                  opened
                                    ? "btn primary"
                                    : "btn"
                                }
                                onClick={() =>
                                  setAllocationOpenKey(
                                    opened ? "" : key
                                  )
                                }
                              >
                                {opened
                                  ? "Tutup Detail"
                                  : "Buka Alokasi"}
                              </button>
                            </td>
                          </tr>,

                          opened ? (
                            <tr key={`${key}-detail`}>
                              <td colSpan={10}>
                                <div
                                  style={{
                                    padding: 12,
                                  }}
                                >
                                  <strong>
                                    Detail Alokasi
                                  </strong>

                                  <p>
                                    <strong>
                                      Inventory Reason:
                                    </strong>{" "}
                                    {String(
                                      row.INVENTORY_REASON || "-"
                                    )}
                                  </p>

                                  <p>
                                    <strong>
                                      Tindakan Stok:
                                    </strong>{" "}
                                    {String(
                                      row.FULFILLMENT_ACTION || "-"
                                    )}
                                  </p>

                                  <p>
                                    <strong>
                                      Inventory Components:
                                    </strong>{" "}
                                    {String(
                                      row.COMPONENT_DETAIL || "-"
                                    )}
                                  </p>

                                  <div
                                    style={{
                                      marginTop: 10,
                                    }}
                                  >
                                    <strong>
                                      Kandidat SKU Fisik dari Master
                                    </strong>

                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 6,
                                        marginTop: 8,
                                      }}
                                    >
                                      {candidates.length === 0 && (
                                        <span className="tiny-muted">
                                          Belum ada kandidat master
                                          untuk family ini.
                                        </span>
                                      )}

                                      {candidates.map(
                                        (candidate) => (
                                          <span
                                            className="badge"
                                            key={String(
                                              candidate.SKU_VARIAN
                                            )}
                                            title={String(
                                              candidate.COLOR || ""
                                            )}
                                          >
                                            {String(
                                              candidate.SKU_VARIAN ||
                                                "-"
                                            )}{" "}
                                             / {" "}
                                            {String(
                                              candidate.COLOR || "-"
                                            )}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  <div
                                    className="callout warn-callout"
                                    style={{
                                      marginTop: 12,
                                    }}
                                  >
                                    <strong>
                                      Alokasi belum tersedia.
                                    </strong>{" "}
                                    Tahap berikutnya akan menambahkan
                                    pemilihan SKU fisik, rekomendasi
                                    berdasarkan stok, dan Confirm
                                    Setiap alokasi akan dicatat dalam log audit.
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null,
                        ];
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <details className="panel">
                <summary
                  style={{
                    cursor: "pointer",
                    padding: 14,
                    fontWeight: 700,
                  }}
                >
                  Diagnostik Stok
                </summary>

                <div style={{ padding: 14 }}>


                  <TablePanel
                    title={`Komponen Stok  /  ${stockPreviewRows.length.toLocaleString("id-ID")} baris`}
                    rows={
                      stockPreviewRows.length > 300
                        ? stockPreviewRows.slice(0, 300)
                        : stockPreviewRows
                    }
                    columns={[
                      "STORE_ID",
                      "PLATFORM",
                      "PRODUCT_ID",
                      "PRODUCT_NAME",
                      "VARIATION_NAME",
                      "SUGGESTED_SKU",
                      "BUNDLE_QTY",
                      "BUNDLE_TYPE",
                      "DETECTED_COLORS",
                      "COMPONENT_DETAIL",
                      "INVENTORY_STATUS",
                      "FULFILLMENT_ACTION",
                      "INVENTORY_REASON",
                    ]}
                    empty="Belum ada resep SKU satuan/bundle."
                  />
                </div>
              </details>
            </section>
          );
        })()}
      </main>
    </div>
  );
}

function Nav({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>{label}</button>; }
function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "good" | "warn" }) { return <div className={`metric ${tone ? `metric-${tone}` : ""}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="panel"><div className="panel-head"><h2>{title}</h2></div>{children}</div>; }

function titleCaseWords(text: string) {
  const acronyms = new Set(["SKU", "ID", "API", "HPP", "ERP", "MP", "XLSX", "ZIP", "OK"]);
  return text
    .replaceAll("_", " ")
    .trim()
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) return upper;
      if (upper === "TIKTOK") return "TikTok";
      if (upper === "SHOPEE") return "Shopee";
      return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word;
    })
    .join(" ");
}

function displayTechnicalValue(column: string, text: string) {
  const humanizedColumns = new Set([
    "PLATFORM",
    "VALIDATION_STATUS",
    "MATCH_STATUS",
    "INVENTORY_STATUS",
    "FULFILLMENT_ACTION",
    "BUNDLE_TYPE",
    "CHANGE",
    "STATUS",
    "API_STATUS",
    "SYNC_ELIGIBLE",
    "SYNC_ALLOWED"
  ]);

  return humanizedColumns.has(column)
    ? titleCaseWords(text)
    : text;
}

function renderCell(column: string, value: unknown) {
  const text = String(value ?? "");
  if (column === "VALIDATION_STATUS") return <span className={text === "OK" ? "badge badge-good" : "badge badge-warn"}>{text ? displayTechnicalValue(column, text) : "—"}</span>;
  if (column === "SYNC_ELIGIBLE" || column === "SYNC_ALLOWED") return <span className={isTrue(value) ? "badge badge-good" : "badge badge-bad"}>{isTrue(value) ? "Siap" : "Diblokir"}</span>;
  if (column === "MATCH_STATUS") return <span className={text === "READY" ? "badge badge-good" : text === "REVIEW" ? "badge badge-warn" : text === "ARCHIVED" ? "badge" : "badge badge-bad"}>{displayTechnicalValue(column, text)}</span>;
  if (column === "INVENTORY_STATUS") {
    const cls = text === "READY" ? "badge badge-good" : (text === "WAITING_ALLOCATION" || text === "RANDOM_SUGGESTION" || text === "REVIEW") ? "badge badge-warn" : text === "ARCHIVED" ? "badge" : "badge badge-bad";
    return <span className={cls}>{displayTechnicalValue(column, text)}</span>;
  }
  if (column === "CHANGE") return <span className={text === "YES" ? "badge badge-warn" : "badge"}>{displayTechnicalValue(column, text)}</span>;
  if (column === "CONFIDENCE") return `${text}%`;
  if (column === "STATUS") { const active = text.toUpperCase() === "ACTIVE"; return <span className={active ? "badge badge-good" : "badge"}>{text ? displayTechnicalValue(column, text) : "—"}</span>; }
  if (column === "HPP_DEFAULT" || column === "PRICE") return text === "" ? "—" : money(value);
  if (column === "PLATFORM" || column === "BUNDLE_TYPE" || column === "FULFILLMENT_ACTION" || column === "API_STATUS") return displayTechnicalValue(column, text);
  return text;
}

function headerLabel(column: string) {
  const labels: Record<string, string> = {
    STORE_ID: "Store ID", PLATFORM: "Platform", PRODUCT_ID: "Product ID", PRODUCT_NAME: "Product Name", VARIATION_NAME: "Variation Name",
    CURRENT_PARENT_SKU: "SKU Induk Saat Ini", CURRENT_SKU: "SKU Saat Ini", PRODUCT_FAMILY: "Keluarga Produk", SUGGESTED_PARENT_SKU: "SKU Induk Saran",
    SUGGESTED_SKU: "SKU Master", BUNDLE_QTY: "Bundle Qty", BUNDLE_TYPE: "Bundle Type", DETECTED_COLORS: "Detected Colors", COMPONENT_DETAIL: "Inventory Components",
    INVENTORY_STATUS: "Status Stok", FULFILLMENT_ACTION: "Tindakan Stok", MATCH_STATUS: "Status Pemetaan SKU", CONFIDENCE: "Keyakinan", CHANGE: "Perubahan", REASON: "Alasan Pemetaan",
    INVENTORY_REASON: "Inventory Reason"
  };
  return labels[column] || titleCaseWords(column);
}

function downloadFilteredMappingCsv(rows: any[]) {
  if (!rows.length) return;

  const columns = [
    "STORE_ID",
    "PLATFORM",
    "PRODUCT_ID",
    "PRODUCT_NAME",
    "VARIATION_NAME",
    "CURRENT_PARENT_SKU",
    "CURRENT_SKU",
    "PRODUCT_FAMILY",
    "SUGGESTED_PARENT_SKU",
    "SUGGESTED_SKU",
    "BUNDLE_QTY",
    "BUNDLE_TYPE",
    "DETECTED_COLORS",
    "COMPONENT_DETAIL",
    "INVENTORY_STATUS",
    "FULFILLMENT_ACTION",
    "MATCH_STATUS",
    "CONFIDENCE",
    "CHANGE",
    "REASON",
  ];

  const labels: Record<string, string> = {
    STORE_ID: "Store ID",
    PLATFORM: "Marketplace",
    PRODUCT_ID: "Product ID",
    PRODUCT_NAME: "Product Name",
    VARIATION_NAME: "Variation Name",
    CURRENT_PARENT_SKU: "SKU Induk Saat Ini",
    CURRENT_SKU: "SKU Saat Ini",
    PRODUCT_FAMILY: "Keluarga Produk",
    SUGGESTED_PARENT_SKU: "SKU Induk Saran",
    SUGGESTED_SKU: "SKU Master",
    BUNDLE_QTY: "Bundle Qty",
    BUNDLE_TYPE: "Bundle Type",
    DETECTED_COLORS: "Detected Colors",
    COMPONENT_DETAIL: "Inventory Components",
    INVENTORY_STATUS: "Status Stok",
    FULFILLMENT_ACTION: "Tindakan Stok",
    MATCH_STATUS: "Status Pemetaan SKU",
    CONFIDENCE: "Keyakinan",
    CHANGE: "Perubahan",
    REASON: "Alasan Pemetaan",
  };

  const normalizeValue = (value: any) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      return value
        .map((v) => typeof v === "object" ? JSON.stringify(v) : String(v))
        .join(" | ");
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const csvCell = (value: any) =>
    `"${normalizeValue(value).replace(/"/g, '""')}"`;

  const header = columns
    .map((key) => csvCell(labels[key] || key))
    .join(",");

  const body = rows
    .map((row) =>
      columns.map((key) => csvCell(row[key])).join(",")
    )
    .join("\r\n");

  const csv = "\uFEFF" + header + "\r\n" + body;

  const storeIds = Array.from(
    new Set(
      rows
        .map((r) => String(r.STORE_ID || "").trim())
        .filter(Boolean)
    )
  );

  const platforms = Array.from(
    new Set(
      rows
        .map((r) => String(r.PLATFORM || "").trim().toUpperCase())
        .filter(Boolean)
    )
  );

  const storePart =
    storeIds.length === 1 ? storeIds[0] : "SEMUA-AKUN";

  const platformPart =
    platforms.length === 1 ? platforms[0] : "MULTI";

  const stamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, "");

  const fileName =
    `RKN_ERP_Mapping_Detail_${platformPart}_${storePart}_${stamp}.csv`;

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
function TablePanel({ title, rows, columns, empty = "Belum ada data." }: { title: string; rows: Array<GenericRow | MappingRow>; columns: string[]; empty?: string }) {
  return <Panel title={title}><div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{headerLabel(c)}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="empty-cell">{empty}</td></tr> : rows.map((row, i) => <tr key={`${String((row as GenericRow).SKU_VARIAN ?? (row as MappingRow).FILE_ID ?? i)}-${i}`}>{columns.map((c) => <td key={c} title={String((row as any)[c] ?? "")}>{renderCell(c, (row as any)[c])}</td>)}</tr>)}</tbody></table></div></Panel>;
}

function titleFor(tab: Tab) {
  return ({ hppCosting: "HPP & Costing", menuHub: "Menu", marketplaceHub: "Marketplace", dashboard: "Dashboard", products: "Master Produk", skuColors: "SKU & Warna", stores: "Master Toko", importMp: "Import Marketplace", massUpdate: "Mass Update SKU", orders: "Pesanan & Packing", stock: "Stok & Mutasi" } as const)[tab];
}








