"use client";

/* RKN_PLASTIC_TRADING_DASHBOARD_UI_V1 */

import Link from "next/link";
import styles from "./PlasticTradingDashboard.module.css";

type Report = {
  generatedAt?: string;
  timeZone?: string;
  periodKey?: string;
  periodStatus?: string;
  businessUnit?: {
    id?: string;
    code?: string;
    name?: string;
  };
  actor?: {
    fullName?: string;
    roleCode?: string;
    accessLevel?: string;
    isSystemAdmin?: boolean;
  };
  metrics?: {
    inboundQty?: number;
    outboundQty?: number;
    stockQty?: number;
    salesRp?: number;
    cogsRp?: number;
    grossProfitRp?: number;
    receivableRp?: number;
    stockValueRp?: number;
  };
  movementTrend?: Array<{
    dateKey?: string;
    inboundQty?: number;
    outboundQty?: number;
  }>;
  salesTrend?: Array<{
    dateKey?: string;
    salesRp?: number;
  }>;
  topCustomers?: Array<{
    customerName?: string;
    invoiceCount?: number;
    salesRp?: number;
    outstandingRp?: number;
  }>;
  lowStock?: Array<{
    productName?: string;
    color?: string;
    size?: string;
    baseUnit?: string;
    packUnit?: string;
    unitsPerPack?: number;
    qtyBase?: number;
    lowStockBaseQty?: number;
  }>;
};

const qty = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function monthLabel(periodKey: string) {
  const [year, month] = periodKey.split("-").map(Number);
  if (!year || !month) return periodKey;
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function packText(
  baseQty: number,
  unitsPerPack: number,
  packUnit: string,
  baseUnit: string
) {
  const perPack = Math.max(1, Number(unitsPerPack || 1));
  const packs = Math.floor(baseQty / perPack);
  const remainder = baseQty - packs * perPack;

  if (packs <= 0) {
    return `${qty.format(baseQty)} ${baseUnit}`;
  }

  if (Math.abs(remainder) < 0.000001) {
    return `${qty.format(packs)} ${packUnit}`;
  }

  return `${qty.format(packs)} ${packUnit} + ${qty.format(remainder)} ${baseUnit}`;
}

function movementMax(report: Report) {
  const rows = report.movementTrend ?? [];
  return Math.max(
    1,
    ...rows.flatMap((row) => [
      Number(row.inboundQty ?? 0),
      Number(row.outboundQty ?? 0),
    ])
  );
}

function salesMax(report: Report) {
  return Math.max(
    1,
    ...(report.salesTrend ?? []).map((row) =>
      Number(row.salesRp ?? 0)
    )
  );
}

export default function PlasticTradingDashboard({
  report,
}: {
  report: Report;
}) {
  const metrics = report.metrics ?? {};
  const periodKey = String(report.periodKey ?? "");
  const movementScale = movementMax(report);
  const salesScale = salesMax(report);

  const cards = [
    {
      label: "BARANG MASUK",
      value: qty.format(Number(metrics.inboundQty ?? 0)),
      note: "base unit periode ini",
    },
    {
      label: "BARANG KELUAR",
      value: qty.format(Number(metrics.outboundQty ?? 0)),
      note: "base unit periode ini",
    },
    {
      label: "SALES",
      value: money.format(Number(metrics.salesRp ?? 0)),
      note: "net sales",
    },
    {
      label: "GROSS PROFIT",
      value: money.format(Number(metrics.grossProfitRp ?? 0)),
      note: "sales - COGS",
    },
    {
      label: "PIUTANG",
      value: money.format(Number(metrics.receivableRp ?? 0)),
      note: "outstanding customer",
    },
    {
      label: "STOCK VALUE",
      value: money.format(Number(metrics.stockValueRp ?? 0)),
      note: `${qty.format(Number(metrics.stockQty ?? 0))} base unit`,
    },
  ];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}>R</div>
          <div>
            <strong>RKN</strong>
            <span>PLASTIC TRADING</span>
          </div>
        </div>

        <div className={styles.scopeCard}>
          <span>BUSINESS UNIT</span>
          <strong>PLASTIC_TRADING</strong>
          <small>{report.actor?.accessLevel ?? "VIEW"}</small>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navActive}>Dashboard</div>
          <div className={styles.navLocked}>Barang Masuk <small>NEXT</small></div>
          <div className={styles.navLocked}>Barang Keluar <small>NEXT</small></div>
          <div className={styles.navLocked}>Inventory <small>NEXT</small></div>
          <div className={styles.navLocked}>Customers <small>NEXT</small></div>
          <div className={styles.navLocked}>Piutang <small>NEXT</small></div>
          <div className={styles.navLocked}>Stock Opname <small>NEXT</small></div>
          <div className={styles.navLocked}>Reports <small>NEXT</small></div>
          <div className={styles.navLocked}>Monthly Closing <small>NEXT</small></div>
        </nav>

        <div className={styles.sidebarFooter}>
          <strong>{report.actor?.fullName || "RKN User"}</strong>
          <span>{report.actor?.roleCode || "PRIVATE"}</span>
          {report.actor?.isSystemAdmin ? (
            <Link href="/" className={styles.adminLink}>
              Kembali ke Admin
            </Link>
          ) : null}
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>PLASTIC TRADING MANAGER</span>
            <h1>Dashboard</h1>
            <p>
              Pergerakan stok, sales, margin, dan piutang Plastic Trading.
            </p>
          </div>

          <div className={styles.periodBox}>
            <span>PERIODE</span>
            <strong>{monthLabel(periodKey)}</strong>
            <small
              className={
                String(report.periodStatus).toUpperCase() === "CLOSED"
                  ? styles.closed
                  : styles.open
              }
            >
              {String(report.periodStatus ?? "OPEN").toUpperCase()}
            </small>
          </div>
        </header>

        <section className={styles.metrics}>
          {cards.map((card) => (
            <article key={card.label} className={styles.metric}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </article>
          ))}
        </section>

        <section className={styles.grid2}>
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span>MOVEMENT</span>
                <h2>Barang Masuk vs Keluar</h2>
              </div>
              <small>{monthLabel(periodKey)}</small>
            </div>

            {(report.movementTrend ?? []).length ? (
              <div className={styles.chartRows}>
                {(report.movementTrend ?? []).map((row) => {
                  const incoming = Number(row.inboundQty ?? 0);
                  const outgoing = Number(row.outboundQty ?? 0);
                  return (
                    <div key={row.dateKey} className={styles.chartRow}>
                      <span>{String(row.dateKey ?? "").slice(-2)}</span>
                      <div className={styles.bars}>
                        <div
                          className={styles.barIn}
                          style={{
                            width:
                              incoming > 0
                                ? `${Math.max(
                                    2,
                                    (incoming / movementScale) * 100
                                  )}%`
                                : "0%",
                          }}
                          title={`IN ${qty.format(incoming)}`}
                        />
                        <div
                          className={styles.barOut}
                          style={{
                            width:
                              outgoing > 0
                                ? `${Math.max(
                                    2,
                                    (outgoing / movementScale) * 100
                                  )}%`
                                : "0%",
                          }}
                          title={`OUT ${qty.format(outgoing)}`}
                        />
                      </div>
                      <strong>
                        {qty.format(incoming)} / {qty.format(outgoing)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.empty}>
                Belum ada movement Plastic Trading pada periode ini.
              </div>
            )}

            <div className={styles.legend}>
              <span><i className={styles.dotIn} /> IN</span>
              <span><i className={styles.dotOut} /> OUT</span>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span>REVENUE</span>
                <h2>Sales Harian</h2>
              </div>
              <small>{money.format(Number(metrics.salesRp ?? 0))}</small>
            </div>

            {(report.salesTrend ?? []).length ? (
              <div className={styles.salesChart}>
                {(report.salesTrend ?? []).map((row) => {
                  const value = Number(row.salesRp ?? 0);
                  return (
                    <div key={row.dateKey} className={styles.salesBarWrap}>
                      <div
                        className={styles.salesBar}
                        style={{
                          height: `${Math.max(
                            4,
                            (value / salesScale) * 100
                          )}%`,
                        }}
                        title={money.format(value)}
                      />
                      <span>{String(row.dateKey ?? "").slice(-2)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.empty}>
                Belum ada sales Plastic Trading pada periode ini.
              </div>
            )}
          </article>
        </section>

        <section className={styles.grid2}>
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span>CUSTOMER</span>
                <h2>Top Customers</h2>
              </div>
            </div>

            {(report.topCustomers ?? []).length ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Invoice</th>
                      <th>Sales</th>
                      <th>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.topCustomers ?? []).map((row, index) => (
                      <tr key={`${row.customerName}-${index}`}>
                        <td>{row.customerName}</td>
                        <td>{qty.format(Number(row.invoiceCount ?? 0))}</td>
                        <td>{money.format(Number(row.salesRp ?? 0))}</td>
                        <td>{money.format(Number(row.outstandingRp ?? 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.empty}>
                Belum ada customer sales pada periode ini.
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span>INVENTORY</span>
                <h2>Low Stock</h2>
              </div>
            </div>

            {(report.lowStock ?? []).length ? (
              <div className={styles.stockList}>
                {(report.lowStock ?? []).map((row, index) => (
                  <div
                    key={`${row.productName}-${row.color}-${row.size}-${index}`}
                    className={styles.stockItem}
                  >
                    <div>
                      <strong>{row.productName}</strong>
                      <span>
                        {[row.color, row.size].filter(Boolean).join(" Â· ") || "-"}
                      </span>
                    </div>
                    <div>
                      <strong>
                        {packText(
                          Number(row.qtyBase ?? 0),
                          Number(row.unitsPerPack ?? 1),
                          String(row.packUnit ?? "BALL"),
                          String(row.baseUnit ?? "ROLL")
                        )}
                      </strong>
                      <span>
                        min {qty.format(Number(row.lowStockBaseQty ?? 0))}{" "}
                        {row.baseUnit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                Belum ada variant low-stock. Master produk belum dimigrasikan
                atau semua stok di atas batas minimum.
              </div>
            )}
          </article>
        </section>

        <footer className={styles.footer}>
          <span>
            {report.businessUnit?.name ?? "Plastic Trading"} Â· BU-PLASTIC
          </span>
          <span>
            Data aktual ERP Â· {report.timeZone ?? "Asia/Jakarta"}
          </span>
        </footer>
      </main>
    </div>
  );
}