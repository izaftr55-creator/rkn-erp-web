"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./MobileAdminShell.module.css";

import MobileCatalogView, {
  type MobileProductRow,
  type MobileSkuRow,
  type MobileCatalogStore,
} from "./MobileCatalogView";

import MobileMenuView from "./MobileMenuView";

import MobileMarketplaceView, {
  type MobileMarketplaceStore,
} from "./MobileMarketplaceView";

import MobileStockView, {
  type MobileStockRow,
  type MobileStockSummary,
} from "./MobileStockView";

type MobilePanel =
  | "marketplace"
  | "menu"
  | null;

type DashboardSummary = {
  activeStores: number;
  orders: number;
  reviewOrders: number;
  productFamilies: number;
  skuVariants: number;
  marketplaceSources: number;
};

type MobileOrderSummary = {
  totalOrders: number;
  waitingAllocation: number;
  randomSuggestion: number;
  reviewItems: number;
};

type MobileOrderRow = {
  orderId: string;
  orderDate: string;
  platform: string;
  storeName: string;
  productName: string;
  variationName: string;
  canonicalSku: string;
  qty: number;
  matchStatus: string;
  inventoryStatus: string;
};

type Props = {
  activeTab: string;
  onSelect: (tab: string) => void;
  dashboardSummary?: DashboardSummary;
  orderSummary?: MobileOrderSummary;
  recentOrderRows?: MobileOrderRow[];
  stockSummary?: MobileStockSummary;
  stockRows?: MobileStockRow[];
  marketplaceStores?: MobileMarketplaceStore[];
  catalogProducts?: MobileProductRow[];
  catalogSkuRows?: MobileSkuRow[];
  catalogStores?: MobileCatalogStore[];
};

type MenuItem = {
  label: string;
  description: string;
  tab?: string;
  badge?: string;
};

type IconName =
  | "home"
  | "orders"
  | "stock"
  | "marketplace"
  | "menu"
  | "import"
  | "products"
  | "finance"
  | "people"
  | "report"
  | "system"
  | "chevron"
  | "close";

const marketplaceTabs = [
  "products",
  "skuColors",
  "stores",
  "importMp",
  "massUpdate",
];

const marketplaceItems: MenuItem[] = [
  {
    label: "Pesanan",
    description: "Pesanan masuk dan proses packing",
    tab: "orders",
  },
  {
    label: "Produk",
    description: "Katalog dan produk marketplace",
    tab: "products",
  },
  {
    label: "SKU & Warna",
    description: "SKU master dan varian warna",
    tab: "skuColors",
  },
  {
    label: "Toko",
    description: "Akun dan kanal marketplace",
    tab: "stores",
  },
  {
    label: "Import Marketplace",
    description: "Impor file Shopee dan TikTok",
    tab: "importMp",
  },
  {
    label: "Pembaruan Massal",
    description: "Mass Update marketplace",
    tab: "massUpdate",
  },
  {
    label: "Penjualan",
    description: "Analitik penjualan per akun",
    badge: "SEGERA",
  },
  {
    label: "Settlement",
    description: "Pencairan dan rekonsiliasi",
    badge: "SEGERA",
  },
  {
    label: "Integrasi API",
    description: "Status integrasi dan sinkronisasi",
    badge: "SEGERA",
  },
];

const systemItems: Array<
  MenuItem & { icon: IconName }
> = [
  {
    label: "Keuangan & Operasional",
    description:
      "Kas, settlement, vendor, hutang dan piutang",
    icon: "finance",
    badge: "SEGERA",
  },
  {
    label: "SDM & Akses",
    description:
      "Pengguna ERP, payroll dan perizinan",
    icon: "people",
    badge: "SEGERA",
  },
  {
    label: "Laporan & Analitik",
    description:
      "Laporan bisnis dan pusat ekspor",
    icon: "report",
    badge: "SEGERA",
  },
  {
    label: "Kendali Sistem",
    description:
      "Approval, alert, audit dan integrasi",
    icon: "system",
    badge: "SEGERA",
  },
];

function titleForTab(tab: string) {
  switch (tab) {
    case "dashboard":
      return "Beranda Admin";

    case "hppCosting":
      return "HPP & Costing";

    case "menuHub":
      return "Menu";

    case "marketplaceHub":
      return "Marketplace";
    case "orders":
      return "Pesanan";
    case "stock":
      return "Stok & Persediaan";
    case "products":
      return "Produk";
    case "skuColors":
      return "SKU & Warna";
    case "stores":
      return "Toko";
    case "importMp":
      return "Import Marketplace";
    case "massUpdate":
      return "Pembaruan Massal";
    default:
      return "Administrator Sistem";
  }
}

function Icon({
  name,
}: {
  name: IconName;
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
          <path d="M9.5 20v-6h5v6" />
        </svg>
      );

    case "orders":
      return (
        <svg {...common}>
          <path d="M7 4h10" />
          <path d="M6 7h12l-1 13H7L6 7Z" />
          <path d="M9 11h6" />
          <path d="M9 15h4" />
        </svg>
      );

    case "stock":
      return (
        <svg {...common}>
          <path d="m4 8 8-4 8 4-8 4-8-4Z" />
          <path d="m4 8v8l8 4 8-4V8" />
          <path d="M12 12v8" />
        </svg>
      );

    case "marketplace":
      return (
        <svg {...common}>
          <path d="M4 9h16" />
          <path d="m5 9 1-5h12l1 5" />
          <path d="M6 9v11h12V9" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );

    case "import":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m8 11 4 4 4-4" />
          <path d="M5 20h14" />
        </svg>
      );

    case "products":
      return (
        <svg {...common}>
          <path d="m4 7 8-4 8 4-8 4-8-4Z" />
          <path d="M4 7v10l8 4 8-4V7" />
        </svg>
      );

    case "finance":
      return (
        <svg {...common}>
          <path d="M4 8h16" />
          <path d="M6 8v10" />
          <path d="M10 8v10" />
          <path d="M14 8v10" />
          <path d="M18 8v10" />
          <path d="M3 18h18" />
          <path d="m12 3 9 4H3l9-4Z" />
        </svg>
      );

    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6" />
          <path d="M15 6.5a3 3 0 0 1 0 5.5" />
          <path d="M16 14c2.5.5 4 2.5 4.5 6" />
        </svg>
      );

    case "report":
      return (
        <svg {...common}>
          <path d="M5 20V10" />
          <path d="M10 20V4" />
          <path d="M15 20v-7" />
          <path d="M20 20V7" />
        </svg>
      );

    case "system":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="m4.9 4.9 2.1 2.1" />
          <path d="m17 17 2.1 2.1" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
          <path d="m4.9 19.1 2.1-2.1" />
          <path d="m17 7 2.1-2.1" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
  }
}

export default function MobileAdminShell({
  activeTab,
  onSelect,
  dashboardSummary,
  orderSummary,
  recentOrderRows,
  stockSummary,
  stockRows,
  marketplaceStores,
  catalogProducts,
  catalogSkuRows,
  catalogStores,
}: Props) {
  const [panel, setPanel] =
    useState<MobilePanel>(null);

  const [toast, setToast] =
    useState("");

  // RKN_MOBILE_ORDERS_V5_STATE
  const [orderQuery, setOrderQuery] =
    useState("");

  const [orderPlatform, setOrderPlatform] =
    useState<
      "ALL" | "SHOPEE" | "TIKTOK"
    >("ALL");

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState("");

  const toastTimer =
    useRef<number | null>(null);

  const title =
    useMemo(
      () => titleForTab(activeTab),
      [activeTab]
    );

  const marketplaceActive =
    marketplaceTabs.includes(activeTab);

  // RKN_MOBILE_TAB_SCROLL_RESET_V1102
  useEffect(() => {
    window.scrollTo(0, 0);

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // RKN_MOBILE_DASHBOARD_SUMMARY_V3
  const summary =
    dashboardSummary ?? {
      activeStores: 0,
      orders: 0,
      reviewOrders: 0,
      productFamilies: 0,
      skuVariants: 0,
      marketplaceSources: 0,
    };

  // RKN_MOBILE_ORDERS_V5_DERIVED
  const mobileOrderSummary =
    orderSummary ?? {
      totalOrders: 0,
      waitingAllocation: 0,
      randomSuggestion: 0,
      reviewItems: 0,
    };

  const mobileOrders =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            orderId: string;
            orderDate: string;
            platform: string;
            storeName: string;
            itemCount: number;
            qty: number;
            firstProduct: string;
            variationName: string;
            canonicalSku: string;
            hasReview: boolean;
            hasWaiting: boolean;
            hasRandom: boolean;
          }
        >();

      for (
        const row of
        recentOrderRows ?? []
      ) {
        const orderId =
          String(
            row.orderId || ""
          ).trim();

        if (!orderId) {
          continue;
        }

        const existing =
          map.get(orderId);

        if (existing) {
          existing.itemCount += 1;

          existing.qty +=
            Number(row.qty) || 0;

          existing.hasReview =
            existing.hasReview ||
            row.matchStatus !==
              "MATCHED";

          existing.hasWaiting =
            existing.hasWaiting ||
            row.inventoryStatus ===
              "WAITING_ALLOCATION";

          existing.hasRandom =
            existing.hasRandom ||
            row.inventoryStatus ===
              "RANDOM_SUGGESTION";

          continue;
        }

        map.set(
          orderId,
          {
            orderId,
            orderDate:
              row.orderDate || "",
            platform:
              row.platform || "UNKNOWN",
            storeName:
              row.storeName || "",
            itemCount: 1,
            qty:
              Number(row.qty) || 0,
            firstProduct:
              row.productName || "-",
            variationName:
              row.variationName || "",
            canonicalSku:
              row.canonicalSku || "",
            hasReview:
              row.matchStatus !==
              "MATCHED",
            hasWaiting:
              row.inventoryStatus ===
              "WAITING_ALLOCATION",
            hasRandom:
              row.inventoryStatus ===
              "RANDOM_SUGGESTION",
          }
        );
      }

      return Array.from(
        map.values()
      );
    }, [recentOrderRows]);

  const filteredMobileOrders =
    useMemo(() => {
      const query =
        orderQuery
          .trim()
          .toLowerCase();

      return mobileOrders.filter(
        (order) => {
          if (
            orderPlatform !== "ALL" &&
            order.platform !==
              orderPlatform
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            order.orderId,
            order.storeName,
            order.firstProduct,
            order.variationName,
            order.canonicalSku,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        }
      );
    }, [
      mobileOrders,
      orderPlatform,
      orderQuery,
    ]);

  const selectedOrder =
    mobileOrders.find(
      (order) =>
        order.orderId ===
        selectedOrderId
    ) ?? null;

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(
          toastTimer.current
        );
      }
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      panel ? "hidden" : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [panel]);

  const showToast = (
    message: string
  ) => {
    setToast(message);

    if (toastTimer.current) {
      window.clearTimeout(
        toastTimer.current
      );
    }

    toastTimer.current =
      window.setTimeout(() => {
        setToast("");
      }, 2200);
  };

  const choose = (tab: string) => {
    setPanel(null);
    onSelect(tab);
  };

  const openPlanned = (
    label: string
  ) => {
    showToast(
      `${label} sedang disiapkan.`
    );
  };

  return (
    <div className={styles.shell}>
      <header className={styles.appBar}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <img
              src="/rkn-logo.png"
              alt="RKN"
            />
          </div>

          <div className={styles.brandCopy}>
            <strong>RKN ERP</strong>
            <span>
              Administrator Sistem
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.accountButton}
          onClick={() =>
            choose("menuHub")
          }
          aria-label="Buka menu akun"
        >
          LF
        </button>
      </header>

      {activeTab === "dashboard" && (
        <section className={styles.mobileHome}>
          <div className={styles.welcome}>
            <span className={styles.eyebrow}>
              RINGKASAN
            </span>

            <h1>
              Selamat datang kembali.
            </h1>

            <p>
              Akses cepat untuk aktivitas
              operasional RKN hari ini.
            </p>
          </div>

          <div className={styles.quickSection}>
            <div className={styles.sectionHead}>
              <strong>Akses Cepat</strong>
              <span>Operasional</span>
            </div>

            <div className={styles.quickActions}>
              <button
                type="button"
                onClick={() =>
                  choose("orders")
                }
              >
                <span className={styles.quickIcon}>
                  <Icon name="orders" />
                </span>

                <strong>Pesanan</strong>
                <small>Packing</small>
              </button>

              <button
                type="button"
                onClick={() =>
                  choose("importMp")
                }
              >
                <span className={styles.quickIcon}>
                  <Icon name="import" />
                </span>

                <strong>Import</strong>
                <small>Marketplace</small>
              </button>

              <button
                type="button"
                onClick={() =>
                  choose("stock")
                }
              >
                <span className={styles.quickIcon}>
                  <Icon name="stock" />
                </span>

                <strong>Stok</strong>
                <small>Persediaan</small>
              </button>

              <button
                type="button"
                onClick={() =>
                  choose("products")
                }
              >
                <span className={styles.quickIcon}>
                  <Icon name="products" />
                </span>

                <strong>Produk</strong>
                <small>Katalog</small>
              </button>
            </div>
          </div>

          {/* RKN_MOBILE_DASHBOARD_V3 */}
          <div className={styles.overviewSection}>
            <div className={styles.sectionHead}>
              <strong>Ringkasan Hari Ini</strong>
              <span>DATA ERP</span>
            </div>

            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <span>Toko Aktif</span>
                  <i />
                </div>

                <strong>
                  {summary.activeStores.toLocaleString(
                    "id-ID"
                  )}
                </strong>

                <small>
                  akun marketplace aktif
                </small>
              </article>

              <article className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <span>Pesanan</span>
                  <i />
                </div>

                <strong>
                  {summary.orders.toLocaleString(
                    "id-ID"
                  )}
                </strong>

                <small>
                  order terbaca
                </small>
              </article>

              <article className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <span>Keluarga Produk</span>
                  <i />
                </div>

                <strong>
                  {summary.productFamilies.toLocaleString(
                    "id-ID"
                  )}
                </strong>

                <small>
                  produk master
                </small>
              </article>

              <article className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <span>Varian SKU</span>
                  <i />
                </div>

                <strong>
                  {summary.skuVariants.toLocaleString(
                    "id-ID"
                  )}
                </strong>

                <small>
                  SKU dan warna
                </small>
              </article>
            </div>

            <button
              type="button"
              className={
                summary.reviewOrders > 0
                  ? `${styles.statusCard} ${styles.statusWarn}`
                  : `${styles.statusCard} ${styles.statusGood}`
              }
              onClick={() =>
                choose("orders")
              }
            >
              <span className={styles.statusIcon}>
                <Icon name="orders" />
              </span>

              <span className={styles.statusCopy}>
                <small>
                  {summary.reviewOrders > 0
                    ? "PERLU DITINJAU"
                    : "STATUS PESANAN"}
                </small>

                <strong>
                  {summary.reviewOrders > 0
                    ? `${summary.reviewOrders.toLocaleString(
                        "id-ID"
                      )} item perlu review`
                    : "Tidak ada review tertunda"}
                </strong>
              </span>

              <span className={styles.statusChevron}>
                <Icon name="chevron" />
              </span>
            </button>

            <div className={styles.systemStrip}>
              <span>
                <i />
                Marketplace
              </span>

              <strong>
                {summary.marketplaceSources > 0
                  ? `${summary.marketplaceSources.toLocaleString(
                      "id-ID"
                    )} sumber sesi`
                  : "Belum ada impor sesi"}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* RKN_MOBILE_ORDERS_V5_PAGE */}
      {activeTab === "orders" && (
        <section className={styles.ordersPage}>
          <div className={styles.ordersIntro}>
            <span className={styles.eyebrow}>
              MARKETPLACE OPERATIONS
            </span>

            <h1>Pesanan</h1>

            <p>
              Pusat pesanan marketplace,
              alokasi stok dan packing.
            </p>

            <div className={styles.apiStatus}>
              <span>
                <i />
                {mobileOrderSummary.totalOrders > 0
                  ? "Data pesanan tersedia"
                  : "Menunggu integrasi API"}
              </span>

              <small>
                API-FIRST
              </small>
            </div>
          </div>

          <div className={styles.orderMetrics}>
            <article>
              <span>Pesanan</span>

              <strong>
                {mobileOrderSummary.totalOrders.toLocaleString(
                  "id-ID"
                )}
              </strong>

              <small>order terbaca</small>
            </article>

            <article>
              <span>Butuh Alokasi</span>

              <strong>
                {mobileOrderSummary.waitingAllocation.toLocaleString(
                  "id-ID"
                )}
              </strong>

              <small>item custom</small>
            </article>

            <article>
              <span>Saran SKU</span>

              <strong>
                {mobileOrderSummary.randomSuggestion.toLocaleString(
                  "id-ID"
                )}
              </strong>

              <small>item menunggu</small>
            </article>

            <article>
              <span>Item Review</span>

              <strong>
                {mobileOrderSummary.reviewItems.toLocaleString(
                  "id-ID"
                )}
              </strong>

              <small>perlu tindakan</small>
            </article>
          </div>

          <div className={styles.orderTools}>
            <input
              type="search"
              value={orderQuery}
              onChange={(event) =>
                setOrderQuery(
                  event.target.value
                )
              }
              placeholder="Cari nomor pesanan atau produk..."
              aria-label="Cari pesanan"
            />

            <div className={styles.orderFilters}>
              {(
                [
                  ["ALL", "Semua"],
                  ["SHOPEE", "Shopee"],
                  ["TIKTOK", "TikTok"],
                ] as const
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      orderPlatform ===
                      value
                        ? styles.orderFilterActive
                        : undefined
                    }
                    onClick={() =>
                      setOrderPlatform(
                        value
                      )
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          <div className={styles.orderSectionHead}>
            <strong>
              Pesanan Terbaru
            </strong>

            <span>
              {filteredMobileOrders.length.toLocaleString(
                "id-ID"
              )}{" "}
              ditampilkan
            </span>
          </div>

          {filteredMobileOrders.length === 0 ? (
            <div className={styles.orderEmpty}>
              <span className={styles.orderEmptyIcon}>
                <Icon name="orders" />
              </span>

              <strong>
                Belum ada pesanan tersinkron
              </strong>

              <p>
                Setelah konektor Shopee,
                TikTok dan marketplace lain
                aktif, pesanan akan masuk
                otomatis ke halaman ini.
              </p>

              <button
                type="button"
                onClick={() =>
                  setPanel("marketplace")
                }
              >
                Lihat Marketplace
              </button>
            </div>
          ) : (
            <div className={styles.orderList}>
              {filteredMobileOrders.map(
                (order) => {
                  const status =
                    order.hasReview
                      ? "Perlu Review"
                      : order.hasWaiting
                        ? "Butuh Alokasi"
                        : order.hasRandom
                          ? "Saran SKU"
                          : "Terbaca";

                  return (
                    <button
                      key={order.orderId}
                      type="button"
                      className={styles.orderCard}
                      onClick={() =>
                        setSelectedOrderId(
                          order.orderId
                        )
                      }
                    >
                      <div className={styles.orderCardTop}>
                        <span className={styles.orderPlatform}>
                          {order.platform}
                        </span>

                        <small>
                          {order.orderDate || "-"}
                        </small>
                      </div>

                      <div className={styles.orderCardMain}>
                        <span className={styles.orderCardCopy}>
                          <strong>
                            #{order.orderId}
                          </strong>

                          <small>
                            {order.storeName ||
                              "Akun marketplace"}
                          </small>

                          <em>
                            {order.firstProduct}
                          </em>
                        </span>

                        <span className={styles.orderArrow}>
                          <Icon name="chevron" />
                        </span>
                      </div>

                      <div className={styles.orderCardFoot}>
                        <span>
                          {order.itemCount.toLocaleString(
                            "id-ID"
                          )}{" "}
                          item  / {" "}
                          {order.qty.toLocaleString(
                            "id-ID"
                          )}{" "}
                          pcs
                        </span>

                        <strong
                          className={
                            order.hasReview
                              ? styles.orderReview
                              : order.hasWaiting ||
                                  order.hasRandom
                                ? styles.orderWaiting
                                : styles.orderReady
                          }
                        >
                          {status}
                        </strong>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </section>
      )}

      {/* RKN_MOBILE_STOCK_V6 */}
      {activeTab === "stock" && (
        <MobileStockView
          summary={stockSummary}
          rows={stockRows}
        />
      )}

      {/* RKN_MOBILE_MARKETPLACE_V71 */}
      {activeTab === "marketplaceHub" && (
        <MobileMarketplaceView
          stores={marketplaceStores}
          onSelect={choose}
          onPlanned={openPlanned}
        />
      )}

      {/* RKN_MOBILE_MENU_V8 */}
      {activeTab === "menuHub" && (
        <MobileMenuView
          onSelect={choose}
          onPlanned={openPlanned}
        />
      )}

      {/* RKN_MOBILE_CATALOG_V9 */}
      {(activeTab === "products" ||
        activeTab === "skuColors" ||
        activeTab === "stores") && (
        <MobileCatalogView
          mode={
            activeTab as
              | "products"
              | "skuColors"
              | "stores"
          }
          products={catalogProducts}
          skuRows={catalogSkuRows}
          stores={catalogStores}
          onSelect={choose}
        />
      )}

      {panel && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Tutup menu"
            onClick={() =>
              setPanel(null)
            }
          />

          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={
              panel === "marketplace"
                ? "Menu Marketplace"
                : "Menu RKN ERP"
            }
          >
            <div className={styles.sheetHandle} />

            <div className={styles.sheetHeader}>
              <div>
                <span className={styles.eyebrow}>
                  {panel === "marketplace"
                    ? "DOMAIN"
                    : "RKN ERP"}
                </span>

                <h2>
                  {panel === "marketplace"
                    ? "Marketplace"
                    : "Menu"}
                </h2>

                <p>
                  {panel === "marketplace"
                    ? "Kelola kanal dan operasional marketplace."
                    : "Akses modul administrasi RKN."}
                </p>
              </div>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() =>
                  setPanel(null)
                }
                aria-label="Tutup"
              >
                <Icon name="close" />
              </button>
            </div>

            {panel === "marketplace" && (
              <div className={styles.sheetList}>
                {marketplaceItems.map(
                  (item) => {
                    const active =
                      item.tab === activeTab;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={
                          active
                            ? `${styles.sheetItem} ${styles.sheetItemActive}`
                            : styles.sheetItem
                        }
                        onClick={() => {
                          if (item.tab) {
                            choose(item.tab);
                          }
                          else {
                            openPlanned(
                              item.label
                            );
                          }
                        }}
                      >
                        <span
                          className={
                            styles.sheetItemIcon
                          }
                        >
                          <Icon name="marketplace" />
                        </span>

                        <span
                          className={
                            styles.sheetItemCopy
                          }
                        >
                          <strong>
                            {item.label}
                          </strong>

                          <small>
                            {item.description}
                          </small>
                        </span>

                        <span
                          className={
                            styles.sheetItemEnd
                          }
                        >
                          {item.badge ? (
                            <em>
                              {item.badge}
                            </em>
                          ) : (
                            <Icon name="chevron" />
                          )}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}

            {panel === "menu" && (
              <>
                <div className={styles.sheetList}>
                  {systemItems.map(
                    (item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={styles.sheetItem}
                        onClick={() =>
                          openPlanned(
                            item.label
                          )
                        }
                      >
                        <span
                          className={
                            styles.sheetItemIcon
                          }
                        >
                          <Icon name={item.icon} />
                        </span>

                        <span
                          className={
                            styles.sheetItemCopy
                          }
                        >
                          <strong>
                            {item.label}
                          </strong>

                          <small>
                            {item.description}
                          </small>
                        </span>

                        <span
                          className={
                            styles.sheetItemEnd
                          }
                        >
                          <Icon name="chevron" />
                        </span>
                      </button>
                    )
                  )}
                </div>

                <div className={styles.profileCard}>
                  <div className={styles.profileAvatar}>
                    LF
                  </div>

                  <div className={styles.profileCopy}>
                    <strong>
                      Lutfirza Faturahman
                    </strong>

                    <span>
                      System Admin
                    </span>

                    <small>
                      RKN ERP Administrator
                    </small>
                  </div>
                </div>
              <form
                action="/api/rkn/native-logout"
                method="post"
                className={styles.logoutForm}
              >
                <button
                  type="submit"
                  className={styles.logoutButton}
                >
                  <span
                    className={styles.logoutIcon}
                    aria-hidden="true"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 5H5v14h5" />
                      <path d="M14 8l4 4-4 4" />
                      <path d="M18 12H9" />
                    </svg>
                  </span>

                  <span
                    className={styles.logoutCopy}
                  >
                    <strong>
                      Keluar dari RKN ERP
                    </strong>

                    <small>
                      Akhiri sesi di perangkat ini
                    </small>
                  </span>

                  <span
                    className={styles.logoutArrow}
                    aria-hidden="true"
                  >
                    {"\u203A"}
                  </span>
                </button>
              </form>

              </>
            )}
          </section>
        </>
      )}

      {/* RKN_MOBILE_ORDER_DETAIL_V5 */}
      {selectedOrder && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Tutup detail pesanan"
            onClick={() =>
              setSelectedOrderId("")
            }
          />

          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Detail pesanan"
          >
            <div className={styles.sheetHandle} />

            <div className={styles.sheetHeader}>
              <div>
                <span className={styles.eyebrow}>
                  DETAIL PESANAN
                </span>

                <h2>
                  #{selectedOrder.orderId}
                </h2>

                <p>
                  {selectedOrder.platform}
                  {selectedOrder.storeName
                    ? `  /  ${selectedOrder.storeName}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() =>
                  setSelectedOrderId("")
                }
                aria-label="Tutup"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className={styles.orderDetailGrid}>
              <div>
                <small>Tanggal</small>
                <strong>
                  {selectedOrder.orderDate || "-"}
                </strong>
              </div>

              <div>
                <small>Jumlah Item</small>
                <strong>
                  {selectedOrder.itemCount.toLocaleString(
                    "id-ID"
                  )}
                </strong>
              </div>

              <div>
                <small>Total Qty</small>
                <strong>
                  {selectedOrder.qty.toLocaleString(
                    "id-ID"
                  )} pcs
                </strong>
              </div>

              <div>
                <small>Status</small>
                <strong>
                  {selectedOrder.hasReview
                    ? "Perlu Review"
                    : selectedOrder.hasWaiting
                      ? "Butuh Alokasi"
                      : selectedOrder.hasRandom
                        ? "Saran SKU"
                        : "Terbaca"}
                </strong>
              </div>
            </div>

            <div className={styles.orderProductCard}>
              <small>Produk</small>

              <strong>
                {selectedOrder.firstProduct}
              </strong>

              {selectedOrder.variationName && (
                <span>
                  {selectedOrder.variationName}
                </span>
              )}

              {selectedOrder.canonicalSku && (
                <em>
                  SKU  / {" "}
                  {selectedOrder.canonicalSku}
                </em>
              )}
            </div>

            <div className={styles.orderApiNote}>
              <span>
                <i />
                API READY
              </span>

              <p>
                Status marketplace, pembayaran,
                biaya, refund dan return akan
                melengkapi detail ini setelah
                konektor API aktif.
              </p>
            </div>
          </section>
        </>
      )}

      {toast && (
        <div
          className={styles.toast}
          role="status"
        >
          {toast}
        </div>
      )}

      <nav
        className={styles.bottomNav}
        aria-label="Navigasi utama mobile"
      >
        <button
          type="button"
          className={
            activeTab === "dashboard" &&
            panel === null
              ? styles.bottomActive
              : undefined
          }
          onClick={() =>
            choose("dashboard")
          }
        >
          <Icon name="home" />
          <small>Beranda</small>
        </button>

        <button
          type="button"
          className={
            activeTab === "orders" &&
            panel === null
              ? styles.bottomActive
              : undefined
          }
          onClick={() =>
            choose("orders")
          }
        >
          <Icon name="orders" />
          <small>Pesanan</small>
        </button>

        <button
          type="button"
          className={
            activeTab === "stock" &&
            panel === null
              ? styles.bottomActive
              : undefined
          }
          onClick={() =>
            choose("stock")
          }
        >
          <Icon name="stock" />
          <small>Stok</small>
        </button>

        <button
          type="button"
          className={
            [
              "marketplaceHub",
              "products",
              "skuColors",
              "stores",
            ].includes(activeTab)
              ? styles.bottomActive
              : undefined
          }
          onClick={() =>
            choose("marketplaceHub")
          }
          aria-current={
            activeTab === "marketplaceHub"
              ? "page"
              : undefined
          }
        >
          <Icon name="marketplace" />
          <small>Marketplace</small>
        </button>

        <button
          type="button"
          className={
            activeTab === "menuHub" || activeTab === "hppCosting"
              ? styles.bottomActive
              : undefined
          }
          onClick={() =>
            choose("menuHub")
          }
          aria-current={
            activeTab === "menuHub"
              ? "page"
              : undefined
          }
        >
          <Icon name="menu" />
          <small>Menu</small>
        </button>
      </nav>
    </div>
  );
}
