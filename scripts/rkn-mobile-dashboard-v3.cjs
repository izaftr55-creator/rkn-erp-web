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
 * MOBILE DASHBOARD SUMMARY TYPE
 * ========================================================
 */

if (
  !mobile.includes(
    "type DashboardSummary"
  )
) {
  const oldProps = `type Props = {
  activeTab: string;
  onSelect: (tab: string) => void;
};`;

  const newProps = `type DashboardSummary = {
  activeStores: number;
  orders: number;
  reviewOrders: number;
  productFamilies: number;
  skuVariants: number;
  marketplaceSources: number;
};

type Props = {
  activeTab: string;
  onSelect: (tab: string) => void;
  dashboardSummary?: DashboardSummary;
};`;

  if (
    !mobile.includes(oldProps)
  ) {
    throw new Error(
      "MOBILE_PROPS_BLOCK_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      oldProps,
      newProps
    );
}


/*
 * ========================================================
 * FUNCTION PROP
 * ========================================================
 */

if (
  !mobile.includes(
    "dashboardSummary,"
  )
) {
  const oldFunction = `export default function MobileAdminShell({
  activeTab,
  onSelect,
}: Props) {`;

  const newFunction = `export default function MobileAdminShell({
  activeTab,
  onSelect,
  dashboardSummary,
}: Props) {`;

  if (
    !mobile.includes(oldFunction)
  ) {
    throw new Error(
      "MOBILE_FUNCTION_SIGNATURE_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      oldFunction,
      newFunction
    );
}


/*
 * ========================================================
 * DEFAULT SUMMARY
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_DASHBOARD_SUMMARY_V3"
  )
) {
  const anchor = `  const marketplaceActive =
    marketplaceTabs.includes(activeTab);`;

  const replacement = `${anchor}

  // RKN_MOBILE_DASHBOARD_SUMMARY_V3
  const summary =
    dashboardSummary ?? {
      activeStores: 0,
      orders: 0,
      reviewOrders: 0,
      productFamilies: 0,
      skuVariants: 0,
      marketplaceSources: 0,
    };`;

  if (
    !mobile.includes(anchor)
  ) {
    throw new Error(
      "MARKETPLACE_ACTIVE_ANCHOR_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      anchor,
      replacement
    );
}


/*
 * ========================================================
 * MOBILE NATIVE DASHBOARD CONTENT
 * ========================================================
 */

if (
  !mobile.includes(
    "RKN_MOBILE_DASHBOARD_V3"
  )
) {
  const dashboardEnd = `          </div>
        </section>
      )}

      {panel && (`;

  const dashboardV3 = `          </div>

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
                  canonical product
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
                  ? \`\${styles.statusCard} \${styles.statusWarn}\`
                  : \`\${styles.statusCard} \${styles.statusGood}\`
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
                    ? \`\${summary.reviewOrders.toLocaleString(
                        "id-ID"
                      )} item perlu review\`
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
                  ? \`\${summary.marketplaceSources.toLocaleString(
                      "id-ID"
                    )} sumber sesi\`
                  : "Belum ada impor sesi"}
              </strong>
            </div>
          </div>
        </section>
      )}

      {panel && (`;

  if (
    !mobile.includes(
      dashboardEnd
    )
  ) {
    throw new Error(
      "MOBILE_DASHBOARD_END_NOT_FOUND"
    );
  }

  mobile =
    mobile.replace(
      dashboardEnd,
      dashboardV3
    );
}


/*
 * ========================================================
 * SEND REAL ERP DATA INTO MOBILE SHELL
 * ========================================================
 */

if (
  !app.includes(
    "dashboardSummary={{"
  )
) {
  const mobileShellAnchor =
    `        activeTab={tab}`;

  const summaryProp =
    `        activeTab={tab}
        dashboardSummary={{
          activeStores,
          orders: orderParsedCount,
          reviewOrders: orderReviewCount,
          productFamilies:
            products.length || familyCount,
          skuVariants: skuColors.length,
          marketplaceSources: sourceCount,
        }}`;

  if (
    !app.includes(
      mobileShellAnchor
    )
  ) {
    throw new Error(
      "ERPAPP_MOBILE_SHELL_PROP_ANCHOR_NOT_FOUND"
    );
  }

  app =
    app.replace(
      mobileShellAnchor,
      summaryProp
    );
}


/*
 * ========================================================
 * HIDE SHARED DESKTOP DASHBOARD ONLY ON MOBILE
 * ========================================================
 */

if (
  !app.includes(
    "rkn-mobile-dashboard-hidden"
  )
) {
  const mainAnchor =
    `<main className="main">`;

  const mainReplacement =
    `<main
        className={
          tab === "dashboard"
            ? "main rkn-mobile-dashboard-hidden"
            : "main"
        }
      >`;

  if (
    !app.includes(
      mainAnchor
    )
  ) {
    throw new Error(
      "ERPAPP_MAIN_ANCHOR_NOT_FOUND"
    );
  }

  app =
    app.replace(
      mainAnchor,
      mainReplacement
    );
}


fs.writeFileSync(
  mobileFile,
  mobile,
  "utf8"
);

fs.writeFileSync(
  appFile,
  app,
  "utf8"
);

console.log(
  "MOBILE_DASHBOARD_COMPONENT_PATCH_PASS"
);

console.log(
  "ERP_DATA_BRIDGE_PASS"
);

console.log(
  "MOBILE_DESKTOP_DASHBOARD_SEPARATION_PASS"
);