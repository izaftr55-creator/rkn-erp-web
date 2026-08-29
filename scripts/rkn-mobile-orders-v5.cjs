const fs = require("node:fs");

const appFile =
  process.argv[2];

const mobileFile =
  process.argv[3];

let app =
  fs.readFileSync(
    appFile,
    "utf8"
  );

let mobile =
  fs.readFileSync(
    mobileFile,
    "utf8"
  );


/*
 * ========================================================
 * TYPES
 * ========================================================
 */

if (
  !mobile.includes(
    "type MobileOrderRow ="
  )
) {
  const propsMarker =
    "type Props = {";

  if (
    !mobile.includes(propsMarker)
  ) {
    throw new Error(
      "MOBILE_PROPS_NOT_FOUND"
    );
  }

  const types = `type MobileOrderSummary = {
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

`;

  mobile =
    mobile.replace(
      propsMarker,
      types + propsMarker
    );
}


/*
 * Add props.
 */
if (
  !mobile.includes(
    "orderSummary?: MobileOrderSummary;"
  )
) {
  const dashboardProp =
    "  dashboardSummary?: DashboardSummary;";

  if (
    !mobile.includes(dashboardProp)
  ) {
    throw new Error(
      "DASHBOARD_SUMMARY_PROP_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      dashboardProp,
      `${dashboardProp}
  orderSummary?: MobileOrderSummary;
  recentOrderRows?: MobileOrderRow[];`
    );
}


/*
 * Function parameters.
 */
if (
  !mobile.includes(
    "recentOrderRows,"
  )
) {
  const functionEnd =
    `  dashboardSummary,
}: Props) {`;

  if (
    !mobile.includes(functionEnd)
  ) {
    throw new Error(
      "MOBILE_FUNCTION_PROPS_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      functionEnd,
      `  dashboardSummary,
  orderSummary,
  recentOrderRows,
}: Props) {`
    );
}


/*
 * ========================================================
 * ORDER STATE
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_ORDERS_V5_STATE"
  )
) {
  const toastState =
    `  const [toast, setToast] =
    useState("");`;

  if (
    !mobile.includes(toastState)
  ) {
    throw new Error(
      "TOAST_STATE_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      toastState,
      `${toastState}

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
  ] = useState("");`
    );
}


/*
 * ========================================================
 * ORDER DERIVED DATA
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_ORDERS_V5_DERIVED"
  )
) {
  const effectAnchor =
    `  useEffect(() => {
    return () => {`;

  const effectIndex =
    mobile.indexOf(effectAnchor);

  if (
    effectIndex < 0
  ) {
    throw new Error(
      "FIRST_EFFECT_NOT_FOUND"
    );
  }

  const derived = `  // RKN_MOBILE_ORDERS_V5_DERIVED
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

`;

  mobile =
    mobile.slice(
      0,
      effectIndex
    ) +
    derived +
    mobile.slice(
      effectIndex
    );
}


/*
 * ========================================================
 * MOBILE ORDERS PAGE
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_ORDERS_V5_PAGE"
  )
) {
  const panelAnchor =
    `      {panel && (`;

  const panelIndex =
    mobile.indexOf(
      panelAnchor
    );

  if (
    panelIndex < 0
  ) {
    throw new Error(
      "MOBILE_PANEL_ANCHOR_NOT_FOUND"
    );
  }

  const ordersPage = `      {/* RKN_MOBILE_ORDERS_V5_PAGE */}
      {activeTab === "orders" && (
        <section className={styles.ordersPage}>
          <div className={styles.ordersIntro}>
            <span className={styles.eyebrow}>
              MARKETPLACE OPERATIONS
            </span>

            <h1>Pesanan</h1>

            <p>
              Pusat pesanan marketplace,
              allocation dan fulfillment.
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
                          item ·{" "}
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

`;

  mobile =
    mobile.slice(
      0,
      panelIndex
    ) +
    ordersPage +
    mobile.slice(
      panelIndex
    );
}


/*
 * ========================================================
 * ORDER DETAIL BOTTOM SHEET
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_ORDER_DETAIL_V5"
  )
) {
  const toastAnchor =
    `      {toast && (`;

  const toastIndex =
    mobile.indexOf(
      toastAnchor
    );

  if (
    toastIndex < 0
  ) {
    throw new Error(
      "TOAST_RENDER_NOT_FOUND"
    );
  }

  const detail = `      {/* RKN_MOBILE_ORDER_DETAIL_V5 */}
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
                    ? \` · \${selectedOrder.storeName}\`
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
                  SKU ·{" "}
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

`;

  mobile =
    mobile.slice(
      0,
      toastIndex
    ) +
    detail +
    mobile.slice(
      toastIndex
    );
}


/*
 * ========================================================
 * ERP DATA BRIDGE
 * ========================================================
 */

if (
  !app.includes(
    "orderSummary={{"
  )
) {
  const shellIndex =
    app.indexOf(
      "<MobileAdminShell"
    );

  if (
    shellIndex < 0
  ) {
    throw new Error(
      "MOBILE_SHELL_RENDER_NOT_FOUND"
    );
  }

  const onSelectIndex =
    app.indexOf(
      "        onSelect=",
      shellIndex
    );

  if (
    onSelectIndex < 0
  ) {
    throw new Error(
      "MOBILE_ONSELECT_NOT_FOUND"
    );
  }

  const props = `        orderSummary={{
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
`;

  app =
    app.slice(
      0,
      onSelectIndex
    ) +
    props +
    app.slice(
      onSelectIndex
    );
}


/*
 * ========================================================
 * HIDE DESKTOP ORDER VIEW ON MOBILE
 * ========================================================
 */

if (
  !app.includes(
    "rkn-mobile-orders-hidden"
  )
) {
  const dashboardMain =
    /<main\s+className=\{\s*tab\s*===\s*"dashboard"\s*\?\s*"main rkn-mobile-dashboard-hidden"\s*:\s*"main"\s*\}\s*>/;

  if (
    dashboardMain.test(app)
  ) {
    app =
      app.replace(
        dashboardMain,
        `<main
        className={
          tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : tab === "orders"
              ? "main rkn-mobile-orders-hidden"
              : "main"
        }
      >`
      );
  }
  else {
    const plainMain =
      '<main className="main">';

    if (
      !app.includes(plainMain)
    ) {
      throw new Error(
        "ERP_MAIN_NOT_FOUND"
      );
    }

    app =
      app.replace(
        plainMain,
        `<main
        className={
          tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : tab === "orders"
              ? "main rkn-mobile-orders-hidden"
              : "main"
        }
      >`
      );
  }
}


fs.writeFileSync(
  appFile,
  app,
  "utf8"
);

fs.writeFileSync(
  mobileFile,
  mobile,
  "utf8"
);

console.log(
  "MOBILE_ORDERS_PAGE_PATCH_PASS"
);

console.log(
  "ORDER_DATA_BRIDGE_PASS"
);

console.log(
  "ORDER_DETAIL_SHEET_PASS"
);