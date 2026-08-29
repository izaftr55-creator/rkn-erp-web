"use client";

/* RKN_PLASTIC_TRADING_UI_V2G_ADMIN_PARITY */
/* RKN_PLASTIC_GLOBAL_GOLIVE_UI_V2I */

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import styles from "./PlasticTradingApp.module.css";

type Row = Record<string, any>;
type Column = [string, string, ((row: Row) => ReactNode)?];

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const qtyFmt = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

const today = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const menus = [
  ["DASHBOARD", "Dashboard", "dashboard"],
  ["OPENING", "Opening", "opening"],
  ["INBOUND", "Masuk", "inbound"],
  ["OUTBOUND", "Keluar", "outbound"],
  ["INVENTORY", "Stok", "inventory"],
  ["PRODUCTS", "Produk", "products"],
  ["CUSTOMERS", "Customer", "customers"],
  ["RECEIVABLES", "Piutang", "receivables"],
  ["OPNAME", "Opname", "opname"],
  ["RECONCILIATION", "Rekonsiliasi", "reconciliation"],
  ["REPORTS", "Laporan", "reports"],
  ["CLOSING", "Closing", "closing"],
  ["AUDIT", "Audit", "audit"],
] as const;

const pageDescriptions: Record<string, string> = {
  DASHBOARD: "Ringkasan bisnis.",
  OPENING: "Saldo awal 28/07.",
  INBOUND: "Penerimaan barang.",
  OUTBOUND: "Penjualan dan piutang.",
  INVENTORY: "Stok dan nilai barang.",
  PRODUCTS: "Master produk dan UOM.",
  CUSTOMERS: "Daftar customer.",
  RECEIVABLES: "Sisa piutang dan pembayaran.",
  OPNAME: "Cocokkan stok fisik.",
  RECONCILIATION: "Cek fisik 28/08.",
  REPORTS: "Laporan dan PDF.",
  CLOSING: "Tutup periode.",
  AUDIT: "Riwayat perubahan.",
};

/* RKN_PLASTIC_MENU_ICONS_V2N2 */
function MenuIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "opening":
      return (
        <svg {...common}>
          <path d="M4 7.5 12 3l8 4.5" />
          <path d="M5 8v10.5h14V8" />
          <path d="M9 18.5v-6h6v6" />
        </svg>
      );
    case "inbound":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
          <path d="M4 20h16" />
        </svg>
      );
    case "outbound":
      return (
        <svg {...common}>
          <path d="M12 21V9" />
          <path d="m7.5 13.5 4.5-4.5 4.5 4.5" />
          <path d="M4 4h16" />
        </svg>
      );
    case "inventory":
      return (
        <svg {...common}>
          <path d="M4 7h16v13H4z" />
          <path d="M3 7 5 3h14l2 4" />
          <path d="M9 11h6" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="m4.5 7.8 7.5 4.2 7.5-4.2" />
          <path d="M12 12v9" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M15.5 14.5c3.1-.2 4.8 1.5 5 4.5" />
        </svg>
      );
    case "receivables":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 9h18" />
          <path d="M7 15h4" />
          <circle cx="17" cy="14" r="1.5" />
        </svg>
      );
    case "opname":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5" />
          <path d="m8.5 12 2 2 5-5" />
          <path d="M9 17h6" />
        </svg>
      );
    case "reconciliation":
      return (
        <svg {...common}>
          <path d="M4 7h12" />
          <path d="m13 4 3 3-3 3" />
          <path d="M20 17H8" />
          <path d="m11 14-3 3 3 3" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M5 3h10l4 4v14H5z" />
          <path d="M15 3v5h5" />
          <path d="M8 17v-4" />
          <path d="M12 17V9" />
          <path d="M16 17v-6" />
        </svg>
      );
    case "closing":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "audit":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="m15.5 15.5 4 4" />
          <path d="M8.5 11h5M11 8.5v5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}


async function read(view: string, period: string) {
  const response = await fetch(
    `/api/rkn/plastic?view=${encodeURIComponent(view)}&period=${encodeURIComponent(period)}`,
    { cache: "no-store" }
  );
  const json = (await response.json()) as any;
  if (!response.ok || !json.ok) {
    throw new Error(json.error || "LOAD_FAILED");
  }
  return json.data;
}

async function write(command: string, payload: any) {
  const response = await fetch("/api/rkn/plastic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command, payload }),
  });
  const json = (await response.json()) as any;
  if (!response.ok || !json.ok) {
    throw new Error(json.error || "SAVE_FAILED");
  }
  return json.data;
}

/* RKN_PLASTIC_SELECT_ORDER_V2J */
const productLabel = (product: Row) =>
  [
    product.color,
    product.size,
    product.productName,
  ]
    .filter(Boolean)
    .join(" / ");

const unitOptions = (product?: Row) => {
  if (!product) return [];
  return [
    product.packUnit,
    product.midUnit,
    product.baseUnit,
  ]
    .map((value) => String(value || "").toUpperCase())
    .filter(
      (value, index, all) =>
        Boolean(value) && all.indexOf(value) === index
    );
};

const defaultPrice = (product: Row | undefined, unit: string) => {
  if (!product) return 0;
  const normalized = String(unit || "").toUpperCase();
  if (
    normalized &&
    normalized === String(product.packUnit || "").toUpperCase()
  ) {
    return Number(product.defaultSellPricePackRp || 0);
  }
  if (
    normalized &&
    normalized === String(product.midUnit || "").toUpperCase()
  ) {
    return Number(product.defaultSellPriceMidRp || 0);
  }
  return Number(product.defaultSellPriceBaseRp || 0);
};

const stockText = (row: Row) => {
  const base = String(row.baseUnit || "").toUpperCase();
  const mid = String(row.midUnit || "").toUpperCase();
  const pack = String(row.packUnit || "").toUpperCase();
  const baseQty = Math.max(0, Number(row.qtyBase || 0));
  const unitsPerMid = Math.max(1, Number(row.unitsPerMid || 1));
  const unitsPerPack = Math.max(1, Number(row.unitsPerPack || 1));

  if (!pack) {
    return `${qtyFmt.format(baseQty)} ${base}`;
  }

  let remaining = baseQty;
  const parts: string[] = [];

  const packQty = Math.floor((remaining + 1e-9) / unitsPerPack);
  if (packQty > 0) {
    parts.push(`${qtyFmt.format(packQty)} ${pack}`);
    remaining -= packQty * unitsPerPack;
  }

  if (mid && remaining > 1e-9) {
    const midQty = Math.floor((remaining + 1e-9) / unitsPerMid);
    if (midQty > 0) {
      parts.push(`${qtyFmt.format(midQty)} ${mid}`);
      remaining -= midQty * unitsPerMid;
    }
  }

  if (remaining > 1e-9 || !parts.length) {
    parts.push(`${qtyFmt.format(Math.max(0, remaining))} ${base}`);
  }

  return parts.join(" + ");
};

function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`${styles.field} ${className}`}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.panelActions}>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function DataTable({
  rows,
  columns,
}: {
  rows: Row[];
  columns: Column[];
}) {
  if (!rows.length) {
    return (
      <div className={styles.emptyState}>
        <strong>Belum ada data</strong>
        <span>Transaksi atau data master akan tampil di sini.</span>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={
                row.variantId ||
                row.customerId ||
                row.invoiceId ||
                row.inboundId ||
                row.id ||
                index
              }
            >
              {columns.map(([key, , render]) => (
                <td key={key}>
                  {render
                    ? render(row)
                    : String(row[key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <strong>{value}</strong>
      <span>{note || "Periode aktif"}</span>
    </article>
  );
}

export default function PlasticTradingApp({
  initialDashboard,
}: {
  initialDashboard: Row;
}) {
  const [tab, setTab] = useState("DASHBOARD");
  const [period, setPeriod] = useState(
    String(initialDashboard.periodKey || today().slice(0, 7))
  );
  const [data, setData] = useState<Row>(initialDashboard);
  const [dashboard, setDashboard] = useState<Row>(initialDashboard);
  const [products, setProducts] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const actor = initialDashboard.actor || {};
  const readOnly =
    actor.accessLevel === "VIEW" && !actor.isSystemAdmin;
  const canManage =
    actor.isSystemAdmin ||
    ["MANAGE", "OWNER"].includes(actor.accessLevel);
  const canClose =
    actor.isSystemAdmin || actor.accessLevel === "OWNER";

  const loadMasters = useCallback(async () => {
    try {
      const [productData, customerData] = await Promise.all([
        read("PRODUCTS", period),
        read("CUSTOMERS", period),
      ]);
      setProducts(productData.rows || []);
      setCustomers(customerData.rows || []);
    } catch {
      // Main screen loader will surface connection errors.
    }
  }, [period]);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const next = await read(tab, period);
      setData(next);
      if (tab === "DASHBOARD") {
        setDashboard(next);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "LOAD_FAILED"
      );
    } finally {
      setBusy(false);
    }
  }, [tab, period]);

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(
    command: string,
    payload: any,
    view = tab
  ) {
    setBusy(true);
    setMessage("");
    try {
      const result = await write(command, payload);
      setMessage(
        `BERHASIL / ${
          result.invoiceNo ||
          result.inboundNo ||
          result.opnameNo ||
          result.periodKey ||
          result.variantId ||
          result.customerId ||
          "DATA TERSIMPAN"
        }`
      );

      await loadMasters();

      const [nextView, nextDashboard] = await Promise.all([
        read(view, period),
        read("DASHBOARD", period),
      ]);
      setData(nextView);
      setDashboard(nextDashboard);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "SAVE_FAILED"
      );
    } finally {
      setBusy(false);
    }
  }

  /* RKN_PLASTIC_GLOBAL_UI_STATE_V2N */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentMenu = menus.find(([key]) => key === tab);

  return (
    <div className={styles.shell}>
      <aside
        className={
          mobileNavOpen
            ? `${styles.sidebar} ${styles.sidebarOpen}`
            : styles.sidebar
        }
      >
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img src="/rkn-logo.png" alt="RKN" />
          </div>
          <div className={styles.brandText}>
            <strong>RKN ERP</strong>
            <span>PLASTIC TRADING</span>
          </div>
        </div>

        <div className={styles.environment}>
          <span className={styles.statusDot} />
          LIVE
        </div>

        <nav className={styles.nav}>
          <div className={styles.navGroupLabel}>OPERASI</div>
          {menus.slice(0, 8).map(([key, label, glyph]) => (
            <button
              key={key}
              type="button"
              className={
                tab === key ? styles.navActive : styles.navButton
              }
              onClick={() => {
                setTab(key);
                setMobileNavOpen(false);
              }}
            >
              <span className={styles.navGlyph}><MenuIcon name={glyph} /></span>
              <span>{label}</span>
            </button>
          ))}

          <div className={styles.navGroupLabel}>KONTROL</div>
          {menus.slice(8).map(([key, label, glyph]) => (
            <button
              key={key}
              type="button"
              className={
                tab === key ? styles.navActive : styles.navButton
              }
              onClick={() => {
                setTab(key);
                setMobileNavOpen(false);
              }}
            >
              <span className={styles.navGlyph}><MenuIcon name={glyph} /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.accessCard}>
            <span>AKSES</span>
            <strong>{actor.accessLevel || "-"}</strong>
            <small>{actor.roleCode || "-"}</small>
          </div>

          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {String(actor.fullName || "R").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{actor.fullName || "RKN User"}</strong>
              <span>{readOnly ? "READ ONLY" : "AUTHORIZED"}</span>
            </div>
          </div>

          {actor.isSystemAdmin ? (
            <Link className={styles.adminLink} href="/">
              Kembali ke System Admin
            </Link>
          ) : null}
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          type="button"
          className={styles.mobileOverlay}
          aria-label="Tutup menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-label="Buka menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            ☰
          </button>

          <div className={styles.topbarTitle}>
            <span className={styles.breadcrumb}>
              RKN / PLASTIC
            </span>
            <h1>{currentMenu?.[1] || "Plastic Trading"}</h1>
            <p>{pageDescriptions[tab]}</p>
          </div>

          <div className={styles.topbarTools}>
            <Field label="PERIODE">
              <input
                type="month"
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value)
                }
              />
            </Field>
            <div
              className={
                dashboard.periodStatus === "CLOSED"
                  ? styles.periodClosed
                  : styles.periodOpen
              }
            >
              <span />
              {dashboard.periodStatus || "OPEN"}
            </div>
          </div>
        </header>

        {message ? (
          <div
            className={
              message.startsWith("BERHASIL")
                ? styles.noticeSuccess
                : styles.noticeError
            }
          >
            {message}
          </div>
        ) : null}

        {busy ? (
          <div className={styles.progress}>
            <span />
            Memproses data...
          </div>
        ) : null}

        <div className={styles.content}>
          {tab === "DASHBOARD" ? (
            <Dashboard data={dashboard} />
          ) : null}

          {tab === "OPENING" ? (
            <OpeningStock
              rows={data.rows || []}
              products={products}
              canManage={canManage}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "PRODUCTS" ? (
            <Products
              rows={data.rows || []}
              canManage={canManage}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "CUSTOMERS" ? (
            <Customers
              rows={data.rows || []}
              canWrite={!readOnly}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "INBOUND" ? (
            <Inbound
              rows={data.rows || []}
              products={products}
              canWrite={!readOnly}
              canEdit={canManage}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "OUTBOUND" ? (
            <Outbound
              rows={data.rows || []}
              products={products}
              customers={customers}
              canWrite={!readOnly}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "INVENTORY" ? (
            <Inventory rows={data.rows || []} />
          ) : null}

          {tab === "RECEIVABLES" ? (
            <Receivables
              rows={data.rows || []}
              canWrite={!readOnly}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "OPNAME" ? (
            <Opname
              rows={data.rows || []}
              products={products}
              canManage={canManage}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "RECONCILIATION" ? (
            <Reconciliation data={data} />
          ) : null}

          {tab === "REPORTS" ? (
            <Reports data={data} period={period} />
          ) : null}

          {tab === "CLOSING" ? (
            <Closing
              data={data}
              period={period}
              canClose={canClose}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "AUDIT" ? (
            <Panel
              title="Audit Trail"
              subtitle="Jejak transaksi dan perubahan data Plastic Trading."
            >
              <DataTable
                rows={data.rows || []}
                columns={[
                  ["createdAt", "Waktu"],
                  ["action", "Action"],
                  ["entityType", "Entity"],
                  ["entityId", "ID"],
                  ["actorUserId", "Actor"],
                  ["reason", "Reason"],
                ]}
              />
            </Panel>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ data }: { data: Row }) {
  const metrics = data.metrics || {};

  return (
    <>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Barang Masuk"
          value={qtyFmt.format(Number(metrics.inboundQty || 0))}
          note="Base quantity periode ini"
        />
        <MetricCard
          label="Barang Keluar"
          value={qtyFmt.format(Number(metrics.outboundQty || 0))}
          note="Base quantity periode ini"
        />
        <MetricCard
          label="Sales"
          value={money.format(Number(metrics.salesRp || 0))}
        />
        <MetricCard
          label="Gross Profit"
          value={money.format(Number(metrics.grossProfitRp || 0))}
        />
        <MetricCard
          label="Piutang"
          value={money.format(Number(metrics.receivableRp || 0))}
        />
        <MetricCard
          label="Stock Value"
          value={money.format(Number(metrics.stockValueRp || 0))}
          note={`${qtyFmt.format(
            Number(metrics.stockQty || 0)
          )} base unit`}
        />
      </section>

      <div className={styles.twoColumn}>
        <Panel
          title="Top Customers"
          subtitle="Customer dengan nilai transaksi terbesar pada periode aktif."
        >
          <DataTable
            rows={data.topCustomers || []}
            columns={[
              ["customerName", "Customer"],
              [
                "salesRp",
                "Sales",
                (row) => money.format(Number(row.salesRp || 0)),
              ],
              [
                "outstandingRp",
                "Piutang",
                (row) => money.format(Number(row.outstandingRp || 0)),
              ],
            ]}
          />
        </Panel>

        <Panel
          title="Aktivitas Stok"
          subtitle="Perbandingan barang masuk dan keluar berdasarkan tanggal."
        >
          {(data.movementTrend || []).length ? (
            <div className={styles.activityList}>
              {(data.movementTrend || []).map((row: Row) => (
                <div className={styles.activityRow} key={row.dateKey}>
                  <span>{row.dateKey}</span>
                  <div>
                    <b>IN {qtyFmt.format(Number(row.inboundQty || 0))}</b>
                    <b>OUT {qtyFmt.format(Number(row.outboundQty || 0))}</b>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>Belum ada movement</strong>
              <span>Barang masuk dan keluar akan tampil di sini.</span>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Products({
  rows,
  canManage,
  busy,
  run,
}: {
  rows: Row[];
  canManage: boolean;
  busy: boolean;
  run: any;
}) {
  const [form, setForm] = useState({
    productName: "Polymailer",
    category: "POLYMAILER",
    color: "",
    size: "",
    grade: "",
    baseUnit: "ROLL",
    midUnit: "",
    packUnit: "BALL",
    unitsPerMid: "1",
    unitsPerPack: "50",
    defaultBuyPriceRp: "",
    defaultSellPriceBaseRp: "",
    defaultSellPriceMidRp: "",
    defaultSellPricePackRp: "",
    lowStockBaseQty: "0",
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(
      "UPSERT_PRODUCT",
      {
        ...form,
        unitsPerMid: Number(form.unitsPerMid || 1),
        unitsPerPack: Number(form.unitsPerPack || 1),
        defaultBuyPriceRp: Number(form.defaultBuyPriceRp || 0),
        defaultSellPriceBaseRp: Number(
          form.defaultSellPriceBaseRp || 0
        ),
        defaultSellPriceMidRp: Number(
          form.defaultSellPriceMidRp || 0
        ),
        defaultSellPricePackRp: Number(
          form.defaultSellPricePackRp || 0
        ),
        lowStockBaseQty: Number(form.lowStockBaseQty || 0),
      },
      "PRODUCTS"
    );
  };

  return (
    <>
      {canManage ? (
        <Panel
          title="Tambah Variant"
          subtitle="Gunakan form ini hanya untuk produk baru di luar master Google Sheet."
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid4}>
              <Field label="Nama Produk">
                <input
                  value={form.productName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      productName: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Kategori">
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Warna">
                <input
                  value={form.color}
                  onChange={(event) =>
                    setForm({ ...form, color: event.target.value })
                  }
                />
              </Field>
              <Field label="Ukuran">
                <input
                  value={form.size}
                  onChange={(event) =>
                    setForm({ ...form, size: event.target.value })
                  }
                />
              </Field>
              <Field label="Base Unit">
                <input
                  value={form.baseUnit}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      baseUnit: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Mid Unit">
                <input
                  value={form.midUnit}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      midUnit: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Pack Unit">
                <input
                  value={form.packUnit}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      packUnit: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Isi / Pack">
                <input
                  type="number"
                  min="1"
                  value={form.unitsPerPack}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      unitsPerPack: event.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={busy}>
                Simpan Variant
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title="Master Produk"
        subtitle={`${rows.length} variant aktif dari master Plastic Trading.`}
      >
        <DataTable
          rows={rows}
          columns={[
            ["category", "Kategori"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            ["baseUnit", "Base"],
            ["midUnit", "Mid"],
            ["packUnit", "Pack"],
            ["unitsPerMid", "Isi / Mid"],
            ["unitsPerPack", "Isi / Pack"],
            [
              "defaultSellPriceBaseRp",
              "Harga Base",
              (row) =>
                money.format(
                  Number(row.defaultSellPriceBaseRp || 0)
                ),
            ],
            [
              "defaultSellPriceMidRp",
              "Harga Mid",
              (row) =>
                money.format(
                  Number(row.defaultSellPriceMidRp || 0)
                ),
            ],
            [
              "defaultSellPricePackRp",
              "Harga Pack",
              (row) =>
                money.format(
                  Number(row.defaultSellPricePackRp || 0)
                ),
            ],
            ["qtyBase", "Stock", (row) => stockText(row)],
          ]}
        />
      </Panel>
    </>
  );
}

function Customers({
  rows,
  canWrite,
  busy,
  run,
}: {
  rows: Row[];
  canWrite: boolean;
  busy: boolean;
  run: any;
}) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    notes: "",
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run("UPSERT_CUSTOMER", form, "CUSTOMERS");
  };

  return (
    <>
      {canWrite ? (
        <Panel
          title="Tambah Customer"
          subtitle="Opsional. Customer baru juga otomatis dibuat saat nama diketik di Barang Keluar."
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid4}>
              <Field label="Nama Customer">
                <input
                  required
                  value={form.customerName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customerName: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="No. HP">
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Alamat">
                <input
                  value={form.address}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      address: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Catatan">
                <input
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes: event.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={busy}>
                Simpan Customer
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title="Customer Ledger"
        subtitle="Termasuk customer yang dibuat otomatis dari transaksi."
      >
        <DataTable
          rows={rows}
          columns={[
            ["customerName", "Customer"],
            ["phone", "HP"],
            [
              "totalSalesRp",
              "Total Sales",
              (row) => money.format(Number(row.totalSalesRp || 0)),
            ],
            [
              "outstandingRp",
              "Piutang",
              (row) => money.format(Number(row.outstandingRp || 0)),
            ],
            ["lastPurchaseDate", "Last Order"],
          ]}
        />
      </Panel>
    </>
  );
}

function OpeningStock({
  rows,
  products,
  canManage,
  busy,
  run,
}: {
  rows: Row[];
  products: Row[];
  canManage: boolean;
  busy: boolean;
  run: any;
}) {
  /* RKN_PLASTIC_OPENING_ADDITIVE_UI_V2M */
  const [dateKey, setDateKey] = useState("2026-07-28");
  const [note, setNote] = useState(
    "Opening Stock berdasarkan stock opname 28/07/2026"
  );
  const [lines, setLines] = useState([
    {
      variantId: "",
      qty: "1",
      unit: "",
      unitCostRp: "",
    },
  ]);
  const [editVariantId, setEditVariantId] = useState("");
  const [historyVariantId, setHistoryVariantId] = useState("");
  const [historyRows, setHistoryRows] = useState<Row[]>([]);
  const [historyBusy, setHistoryBusy] = useState(false);

  const resetForm = () => {
    setEditVariantId("");
    setDateKey("2026-07-28");
    setNote("Opening Stock berdasarkan stock opname 28/07/2026");
    setLines([
      {
        variantId: "",
        qty: "1",
        unit: "",
        unitCostRp: "",
      },
    ]);
  };

  const qtyInBestUnit = (row: Row) => {
    const qtyBase = Math.max(0, Number(row.qtyBase || 0));
    const pack = String(row.packUnit || "").toUpperCase();
    const mid = String(row.midUnit || "").toUpperCase();
    const base = String(row.baseUnit || "").toUpperCase();
    const unitsPerPack = Math.max(1, Number(row.unitsPerPack || 1));
    const unitsPerMid = Math.max(1, Number(row.unitsPerMid || 1));

    if (
      pack &&
      unitsPerPack > 1 &&
      Math.abs(qtyBase % unitsPerPack) < 0.0000001
    ) {
      return { qty: qtyBase / unitsPerPack, unit: pack };
    }

    if (
      mid &&
      unitsPerMid > 1 &&
      Math.abs(qtyBase % unitsPerMid) < 0.0000001
    ) {
      return { qty: qtyBase / unitsPerMid, unit: mid };
    }

    return { qty: qtyBase, unit: base };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const command = editVariantId
      ? "SET_OPENING_BALANCE"
      : "POST_OPENING_BALANCE";

    await run(
      command,
      {
        dateKey,
        note,
        lines: lines.map((line) => ({
          ...line,
          qty: Number(line.qty),
          unitCostRp: Number(line.unitCostRp || 0),
        })),
      },
      "OPENING"
    );

    resetForm();
  };

  const editOpeningRow = (row: Row) => {
    const product =
      products.find((item) => item.variantId === row.variantId) || row;
    const best = qtyInBestUnit(row);

    setEditVariantId(String(row.variantId || ""));
    setDateKey("2026-07-28");
    setNote(
      `Revisi TOTAL Opening Stock 28/07/2026 • ${productLabel(product)}`
    );
    setLines([
      {
        variantId: String(row.variantId || ""),
        qty: String(best.qty),
        unit: best.unit,
        unitCostRp: String(Number(row.unitCostRp || 0)),
      },
    ]);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openHistory = async (row: Row) => {
    setHistoryBusy(true);
    try {
      const history = await read("OPENING_HISTORY", "2026-07");
      const allRows = Array.isArray(history?.rows) ? history.rows : [];
      const variantId = String(row.variantId || "");
      setHistoryVariantId(variantId);
      setHistoryRows(
        allRows.filter(
          (item: Row) => String(item.variantId || "") === variantId
        )
      );
    } finally {
      setHistoryBusy(false);
    }
  };

  const deletePosting = async (row: Row) => {
    if (typeof window === "undefined") return;

    const reason = window.prompt(
      "Alasan menghapus posting Opening ini? Data tidak dihapus permanen; sistem membuat reversal."
    );

    if (!reason?.trim()) return;

    const ok = window.confirm(
      `Hapus/reverse posting ${String(row.postingNo || "")}?`
    );

    if (!ok) return;

    await run(
      "DELETE_OPENING_POST",
      {
        sourceKey: String(row.postingNo || ""),
        variantId: String(row.variantId || ""),
        reason: reason.trim(),
      },
      "OPENING"
    );

    setHistoryRows([]);
    setHistoryVariantId("");
  };
  /* RKN_PLASTIC_OPENING_RESET_ALL_UI_V2M1 */
  const resetAllOpening = async () => {
    if (typeof window === "undefined") return;

    if (!rows.length) {
      window.alert("Opening Stock sudah kosong.");
      return;
    }

    const reason = window.prompt(
      "Alasan reset seluruh Opening Stock? Semua saldo opening aktif akan direversal agar kamu bisa input ulang dari awal."
    );

    if (!reason?.trim()) return;

    const confirmToken = window.prompt(
      'Ketik persis "RESET OPENING" untuk melanjutkan.'
    );

    if (String(confirmToken || "").trim().toUpperCase() !== "RESET OPENING") {
      window.alert("Reset dibatalkan. Konfirmasi tidak cocok.");
      return;
    }

    const ok = window.confirm(
      "Reset SEMUA Opening Stock aktif sekarang? Riwayat tetap tersimpan di Audit Trail."
    );

    if (!ok) return;

    await run(
      "RESET_OPENING_BALANCE",
      {
        reason: reason.trim(),
        confirmToken: "RESET OPENING",
      },
      "OPENING"
    );

    setHistoryRows([]);
    setHistoryVariantId("");
    resetForm();
  };



  return (
    <>
      {canManage ? (
        <Panel
          title={
            editVariantId
              ? "Edit Total Opening Stock"
              : "Tambah Opening Stock"
          }
          subtitle={
            editVariantId
              ? "Mode Edit menetapkan TOTAL saldo opening final untuk SKU ini."
              : "Mode Tambah bersifat additive. Contoh: sudah 3 BALL lalu input 5 BALL, saldo efektif menjadi 8 BALL."
          }
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid3}>
              <Field label="Tanggal Saldo Awal">
                <input
                  required
                  type="date"
                  value={dateKey}
                  onChange={(event) => setDateKey(event.target.value)}
                />
              </Field>

              <Field
                label="Catatan"
                hint={
                  editVariantId
                    ? "Edit = total final."
                    : "Tambah = menambah saldo opening yang sudah ada."
                }
                className={styles.customerField}
              >
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
            </div>

            <div className={styles.lineSection}>
              <div className={styles.lineSectionHead}>
                <div>
                  <strong>
                    {editVariantId
                      ? "Total Opening yang Benar"
                      : "Tambahan Saldo Awal"}
                  </strong>
                  <span>
                    Gunakan BALL / ROLL atau DUS / STACK / LEMBAR sesuai
                    catatan fisik.
                  </span>
                </div>

                {!editVariantId ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setLines([
                        ...lines,
                        {
                          variantId: "",
                          qty: "1",
                          unit: "",
                          unitCostRp: "",
                        },
                      ])
                    }
                  >
                    + Tambah Item
                  </button>
                ) : null}
              </div>

              {lines.map((line, index) => {
                const product = products.find(
                  (item) => item.variantId === line.variantId
                );
                const units = unitOptions(product);

                return (
                  <div className={styles.lineItem} key={index}>
                    <span className={styles.lineNo}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <Field
                      label="Warna / Ukuran / Produk"
                      className={styles.itemProduct}
                    >
                      <select
                        required
                        value={line.variantId}
                        disabled={Boolean(editVariantId)}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            variantId: event.target.value,
                            unit: "",
                          };
                          setLines(next);
                        }}
                      >
                        <option value="">
                          Pilih warna / ukuran / produk
                        </option>
                        {products.map((item) => (
                          <option
                            key={item.variantId}
                            value={item.variantId}
                          >
                            {productLabel(item)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Qty">
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.qty}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            qty: event.target.value,
                          };
                          setLines(next);
                        }}
                      />
                    </Field>

                    <Field label="UOM">
                      <select
                        required
                        value={line.unit}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unit: event.target.value,
                          };
                          setLines(next);
                        }}
                      >
                        <option value="">Pilih unit</option>
                        {units.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </Field>

                    <Field
                      label="HPP / UOM"
                      hint="Bukan harga jual. Isi HPP aktual jika tersedia."
                    >
                      <input
                        type="number"
                        min="0"
                        value={line.unitCostRp}
                        placeholder="0 jika belum diketahui"
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unitCostRp: event.target.value,
                          };
                          setLines(next);
                        }}
                      />
                    </Field>

                    <div className={styles.itemAction}>
                      {!editVariantId && lines.length > 1 ? (
                        <button
                          type="button"
                          className={styles.iconDanger}
                          onClick={() =>
                            setLines(
                              lines.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                        >
                          Hapus
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.actions}>
              {!editVariantId && rows.length ? (
                <button
                  type="button"
                  className={styles.inlineDangerButton}
                  disabled={busy}
                  onClick={resetAllOpening}
                >
                  Reset Semua Opening
                </button>
              ) : null}

              {editVariantId ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={busy}
                  onClick={resetForm}
                >
                  Batal Edit
                </button>
              ) : null}

              <button className={styles.primaryButton} disabled={busy}>
                {editVariantId
                  ? "Simpan Revisi Total"
                  : "Tambah Opening Stock"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title="Opening Balance Efektif"
        subtitle="Satu baris per SKU. Posting tambahan otomatis digabung ke saldo efektif."
      >
        <DataTable
          rows={rows}
          columns={[
            ["dateKey", "Tanggal"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "qtyBase",
              "Opening Efektif",
              (row) => stockText(row),
            ],
            [
              "unitCostRp",
              "HPP / Base",
              (row) => money.format(Number(row.unitCostRp || 0)),
            ],
            [
              "stockValueRp",
              "Nilai",
              (row) => money.format(Number(row.stockValueRp || 0)),
            ],
            [
              "openingAction",
              "Aksi",
              (row) =>
                canManage ? (
                  <div className={styles.inlineActionGroup}>
                    <button
                      type="button"
                      className={styles.inlineEditButton}
                      onClick={() => editOpeningRow(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.inlineEditButton}
                      onClick={() => openHistory(row)}
                    >
                      Riwayat
                    </button>
                  </div>
                ) : (
                  "-"
                ),
            ],
          ]}
        />
      </Panel>

      {historyVariantId ? (
        <Panel
          title="Riwayat Posting Opening"
          subtitle="Posting asli tetap tersimpan untuk audit. Hapus menggunakan reversal, bukan hard delete."
        >
          {historyBusy ? (
            <div className={styles.empty}>MEMUAT RIWAYAT...</div>
          ) : (
            <DataTable
              rows={historyRows}
              columns={[
                ["postingNo", "Opening No"],
                ["dateKey", "Tanggal"],
                [
                  "postedQtyBase",
                  "Diposting",
                  (row) =>
                    stockText({
                      ...row,
                      qtyBase: Number(row.postedQtyBase || 0),
                    }),
                ],
                [
                  "voidedQtyBase",
                  "Dihapus",
                  (row) =>
                    stockText({
                      ...row,
                      qtyBase: Number(row.voidedQtyBase || 0),
                    }),
                ],
                [
                  "netQtyBase",
                  "Net",
                  (row) =>
                    stockText({
                      ...row,
                      qtyBase: Number(row.netQtyBase || 0),
                    }),
                ],
                ["status", "Status"],
                [
                  "deleteOpening",
                  "Aksi",
                  (row) =>
                    canManage && row.status === "ACTIVE" ? (
                      <button
                        type="button"
                        className={styles.inlineDangerButton}
                        onClick={() => deletePosting(row)}
                      >
                        Hapus
                      </button>
                    ) : (
                      "-"
                    ),
                ],
              ]}
            />
          )}
        </Panel>
      ) : null}
    </>
  );
}

function Inbound({
  rows,
  products,
  canWrite,
  canEdit,
  busy,
  run,
}: {
  rows: Row[];
  products: Row[];
  canWrite: boolean;
  canEdit: boolean;
  busy: boolean;
  run: any;
}) {
  /* RKN_PLASTIC_INBOUND_EDIT_UI_V2N */
  const emptyLine = () => ({
    variantId: "",
    qty: "1",
    unit: "",
    unitCostRp: "",
  });

  const [dateKey, setDateKey] = useState(today());
  const [supplierName, setSupplierName] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [editInboundId, setEditInboundId] = useState("");
  const [editInboundNo, setEditInboundNo] = useState("");
  const [editReason, setEditReason] = useState("");

  const resetForm = () => {
    setDateKey(today());
    setSupplierName("");
    setSupplierRef("");
    setNote("");
    setLines([emptyLine()]);
    setEditInboundId("");
    setEditInboundNo("");
    setEditReason("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const payload = {
      dateKey,
      supplierName,
      supplierRef,
      note,
      lines: lines.map((line) => ({
        ...line,
        qty: Number(line.qty),
        unitCostRp: Number(line.unitCostRp || 0),
      })),
    };

    if (editInboundId) {
      if (!editReason.trim()) {
        if (typeof window !== "undefined") {
          window.alert("Alasan edit Barang Masuk wajib diisi.");
        }
        return;
      }

      await run(
        "UPDATE_INBOUND",
        {
          ...payload,
          inboundId: editInboundId,
          reason: editReason.trim(),
        },
        "INBOUND"
      );
      resetForm();
      return;
    }

    await run("CREATE_INBOUND", payload, "INBOUND");
    resetForm();
  };

  const startEdit = (row: Row) => {
    const inboundId = String(row.inboundId || "");
    const documentRows = rows.filter(
      (item) => String(item.inboundId || "") === inboundId
    );

    if (!documentRows.length) return;

    const header = documentRows[0];

    setEditInboundId(inboundId);
    setEditInboundNo(String(header.inboundNo || ""));
    setDateKey(String(header.dateKey || today()));
    setSupplierName(String(header.supplierName || ""));
    setSupplierRef(String(header.supplierRef || ""));
    setNote(String(header.note || ""));
    setEditReason("");

    setLines(
      documentRows.map((item) => {
        const qtyInput = Number(item.qtyInput || 0);
        const lineTotalRp = Number(item.lineTotalRp || 0);
        const inputCost =
          qtyInput > 0 ? Math.round(lineTotalRp / qtyInput) : 0;

        return {
          variantId: String(item.variantId || ""),
          qty: String(qtyInput || 1),
          unit: String(item.inputUnit || "").toUpperCase(),
          unitCostRp: String(inputCost),
        };
      })
    );

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {canWrite ? (
        <Panel
          title={
            editInboundId
              ? `Edit Barang Masuk / ${editInboundNo}`
              : "Input Barang Masuk"
          }
          subtitle={
            editInboundId
              ? "Edit aman; stok dan audit ikut disesuaikan."
              : "HPP mengikuti UOM."
          }
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid3}>
              <Field label="Tanggal">
                <input
                  required
                  type="date"
                  value={dateKey}
                  onChange={(event) => setDateKey(event.target.value)}
                />
              </Field>

              <Field label="Supplier">
                <input
                  placeholder="Nama supplier"
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                />
              </Field>

              <Field label="Invoice / Surat Jalan">
                <input
                  placeholder="Nomor referensi"
                  value={supplierRef}
                  onChange={(event) => setSupplierRef(event.target.value)}
                />
              </Field>

              <Field label="Catatan">
                <input
                  placeholder="Catatan transaksi"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>

              {editInboundId ? (
                <Field
                  label="Alasan Edit"
                  hint="Wajib untuk Audit Trail."
                >
                  <input
                    required
                    placeholder="Contoh: salah qty / supplier / HPP"
                    value={editReason}
                    onChange={(event) => setEditReason(event.target.value)}
                  />
                </Field>
              ) : null}
            </div>

            <div className={styles.lineSection}>
              <div className={styles.lineSectionHead}>
                <div>
                  <strong>
                    {editInboundId ? "Item Setelah Edit" : "Item Masuk"}
                  </strong>
                  <span>
                    Produk, qty, UOM, dan HPP bisa diedit.
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setLines([...lines, emptyLine()])}
                >
                  + Tambah Item
                </button>
              </div>

              {lines.map((line, index) => {
                const product = products.find(
                  (item) => item.variantId === line.variantId
                );
                const units = unitOptions(product);

                return (
                  <div className={styles.lineItem} key={index}>
                    <span className={styles.lineNo}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <Field
                      label="Warna / Ukuran / Produk"
                      className={styles.itemProduct}
                    >
                      <select
                        required
                        value={line.variantId}
                        onChange={(event) => {
                          const chosen = products.find(
                            (item) => item.variantId === event.target.value
                          );
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            variantId: event.target.value,
                            unit: String(
                              chosen?.packUnit ||
                                chosen?.midUnit ||
                                chosen?.baseUnit ||
                                ""
                            ).toUpperCase(),
                          };
                          setLines(next);
                        }}
                      >
                        <option value="">Pilih warna / ukuran / produk</option>
                        {products.map((item) => (
                          <option
                            key={item.variantId}
                            value={item.variantId}
                          >
                            {productLabel(item)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Qty">
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.qty}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            qty: event.target.value,
                          };
                          setLines(next);
                        }}
                      />
                    </Field>

                    <Field label="UOM">
                      <select
                        required
                        value={line.unit}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unit: event.target.value,
                          };
                          setLines(next);
                        }}
                      >
                        <option value="">Pilih unit</option>
                        {units.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </Field>

                    <Field
                      label="HPP / UOM"
                      hint="Harga beli per UOM yang dipilih."
                    >
                      <input
                        type="number"
                        min="0"
                        value={line.unitCostRp}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unitCostRp: event.target.value,
                          };
                          setLines(next);
                        }}
                      />
                    </Field>

                    <div className={styles.itemAction}>
                      {lines.length > 1 ? (
                        <button
                          type="button"
                          className={styles.iconDanger}
                          onClick={() =>
                            setLines(
                              lines.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                        >
                          Hapus
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.actions}>
              {editInboundId ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={busy}
                  onClick={resetForm}
                >
                  Batal Edit
                </button>
              ) : null}

              <button className={styles.primaryButton} disabled={busy}>
                {editInboundId
                  ? "Simpan Perubahan Barang Masuk"
                  : "Simpan Barang Masuk"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title="Riwayat Barang Masuk"
        subtitle="Edit sesuai akses. Periode tutup tetap terkunci."
      >
        <DataTable
          rows={rows}
          columns={[
            ["dateKey", "Tanggal"],
            ["inboundNo", "No. IN"],
            ["supplierName", "Supplier"],
            ["supplierRef", "Invoice / Ref"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "qtyInput",
              "Qty",
              (row) =>
                `${qtyFmt.format(Number(row.qtyInput || 0))} ${
                  row.inputUnit || ""
                }`,
            ],
            [
              "lineTotalRp",
              "Nilai",
              (row) => money.format(Number(row.lineTotalRp || 0)),
            ],
            [
              "inboundAction",
              "Aksi",
              (row) =>
                canEdit ? (
                  <button
                    type="button"
                    className={styles.inlineEditButton}
                    onClick={() => startEdit(row)}
                  >
                    Edit
                  </button>
                ) : (
                  "-"
                ),
            ],
          ]}
        />
      </Panel>
    </>
  );
}

function Outbound({
  rows,
  products,
  customers,
  canWrite,
  busy,
  run,
}: {
  rows: Row[];
  products: Row[];
  customers: Row[];
  canWrite: boolean;
  busy: boolean;
  run: any;
}) {
  /* RKN_PLASTIC_OUTBOUND_SIMPLE_NO_SHIPPING_NO_DUE_V2N2 */
  const [dateKey, setDateKey] = useState(today());
  const [customerName, setCustomerName] = useState("");
  const [discountRp, setDiscountRp] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER");
  const [lines, setLines] = useState([
    { variantId: "", qty: "1", unit: "", unitPriceRp: "" },
  ]);

  const exactCustomer = useMemo(() => {
    const normalized = customerName.trim().toLocaleLowerCase("id-ID");
    if (!normalized) return undefined;
    return customers.find(
      (customer) =>
        String(customer.customerName || "")
          .trim()
          .toLocaleLowerCase("id-ID") === normalized
    );
  }, [customerName, customers]);

  const estimatedSubtotal = useMemo(() => {
    return lines.reduce((total, line) => {
      const product = products.find(
        (item) => item.variantId === line.variantId
      );
      const price =
        Number(line.unitPriceRp || 0) ||
        defaultPrice(product, line.unit);
      return total + Number(line.qty || 0) * price;
    }, 0);
  }, [lines, products]);

  const estimatedGrand = Math.max(
    0,
    estimatedSubtotal - Number(discountRp || 0)
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(
      "CREATE_SALE",
      {
        dateKey,
        customerId: exactCustomer?.customerId || "",
        customerName: customerName.trim(),
        discountRp: Number(discountRp || 0),
        paymentStatus,
        paymentMethod:
          paymentStatus === "PAID" ? paymentMethod : "",
        lines: lines.map((line) => ({
          ...line,
          qty: Number(line.qty),
          unitPriceRp: Number(line.unitPriceRp || 0),
        })),
      },
      "OUTBOUND"
    );
  };

  return (
    <>
      {canWrite ? (
        <Panel
          title="Barang Keluar"
          subtitle="PAID = lunas. NOT PAID = piutang."
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid4}>
              <Field label="Tanggal">
                <input
                  required
                  type="date"
                  value={dateKey}
                  onChange={(event) => setDateKey(event.target.value)}
                />
              </Field>

              <Field label="Customer" className={styles.customerField}>
                <input
                  required
                  list="plastic-customer-options"
                  placeholder="Nama customer"
                  value={customerName}
                  autoComplete="off"
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
                />
                <datalist id="plastic-customer-options">
                  {customers.map((customer) => (
                    <option
                      key={customer.customerId}
                      value={customer.customerName}
                    />
                  ))}
                </datalist>
              </Field>

              <Field label="Pembayaran">
                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value)
                  }
                >
                  <option value="PAID">LUNAS</option>
                  <option value="NOT_PAID">PIUTANG</option>
                </select>
              </Field>

              {paymentStatus === "PAID" ? (
                <Field label="Metode">
                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                  >
                    <option>TRANSFER</option>
                    <option>CASH</option>
                    <option>QRIS</option>
                  </select>
                </Field>
              ) : (
                <div className={styles.simpleInfoCard}>
                  <span>PIUTANG</span>
                  <strong>{money.format(estimatedGrand)}</strong>
                </div>
              )}
            </div>

            <div className={styles.lineSection}>
              <div className={styles.lineSectionHead}>
                <strong>Item</strong>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    setLines([
                      ...lines,
                      {
                        variantId: "",
                        qty: "1",
                        unit: "",
                        unitPriceRp: "",
                      },
                    ])
                  }
                >
                  + Item
                </button>
              </div>

              {lines.map((line, index) => {
                const selected = products.find(
                  (product) => product.variantId === line.variantId
                );
                const units = unitOptions(selected);

                return (
                  <div className={styles.lineItem} key={index}>
                    <span className={styles.lineNo}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <Field label="Produk" className={styles.itemProduct}>
                      <select
                        required
                        value={line.variantId}
                        onChange={(event) => {
                          const chosen = products.find(
                            (product) =>
                              product.variantId === event.target.value
                          );
                          const chosenUnit = String(
                            chosen?.packUnit ||
                              chosen?.midUnit ||
                              chosen?.baseUnit ||
                              ""
                          ).toUpperCase();
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            variantId: event.target.value,
                            unit: chosenUnit,
                            unitPriceRp: String(
                              defaultPrice(chosen, chosenUnit) || ""
                            ),
                          };
                          setLines(next);
                        }}
                      >
                        <option value="">Pilih produk</option>
                        {products.map((product) => (
                          <option
                            key={product.variantId}
                            value={product.variantId}
                          >
                            {productLabel(product)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Qty">
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.qty}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            qty: event.target.value,
                          };
                          setLines(next);
                        }}
                      />
                    </Field>

                    <Field label="UOM">
                      <select
                        required
                        value={line.unit}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unit: event.target.value,
                            unitPriceRp: String(
                              defaultPrice(
                                selected,
                                event.target.value
                              ) || ""
                            ),
                          };
                          setLines(next);
                        }}
                      >
                        <option value="">Unit</option>
                        {units.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Harga">
                      <input
                        required
                        type="number"
                        min="0"
                        value={line.unitPriceRp}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unitPriceRp: event.target.value,
                          };
                          setLines(next);
                        }}
                      />
                    </Field>

                    <div className={styles.itemAction}>
                      {lines.length > 1 ? (
                        <button
                          type="button"
                          className={styles.iconDanger}
                          onClick={() =>
                            setLines(
                              lines.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                        >
                          Hapus
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.saleSummary}>
              <div>
                <span>SUBTOTAL</span>
                <strong>{money.format(estimatedSubtotal)}</strong>
              </div>

              <Field label="Diskon">
                <input
                  type="number"
                  min="0"
                  value={discountRp}
                  onChange={(event) =>
                    setDiscountRp(event.target.value)
                  }
                />
              </Field>

              <div className={styles.saleGrand}>
                <span>TOTAL</span>
                <strong>{money.format(estimatedGrand)}</strong>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={busy}>
                Simpan
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Riwayat Keluar">
        <DataTable
          rows={rows}
          columns={[
            ["dateKey", "Tanggal"],
            ["invoiceNo", "Invoice"],
            ["customerName", "Customer"],
            [
              "grandTotalRp",
              "Sales",
              (row) =>
                money.format(Number(row.grandTotalRp || 0)),
            ],
            [
              "cogsRp",
              "HPP",
              (row) => money.format(Number(row.cogsRp || 0)),
            ],
            [
              "grossProfitRp",
              "Profit",
              (row) =>
                money.format(Number(row.grossProfitRp || 0)),
            ],
            [
              "outstandingRp",
              "Piutang",
              (row) =>
                money.format(Number(row.outstandingRp || 0)),
            ],
            [
              "status",
              "Status",
              (row) =>
                Number(row.outstandingRp || 0) > 0
                  ? "BELUM LUNAS"
                  : "LUNAS",
            ],
          ]}
        />
      </Panel>
    </>
  );
}


function Inventory({ rows }: { rows: Row[] }) {
  return (
    <Panel
      title="Inventory On Hand"
      subtitle={`${rows.length} variant aktif. Tampilan stock mengikuti konversi unit master.`}
    >
      <DataTable
        rows={rows}
        columns={[
          ["category", "Kategori"],
          ["productName", "Produk"],
          ["color", "Warna"],
          ["size", "Ukuran"],
          ["qtyBase", "Stock", (row) => stockText(row)],
          [
            "avgCostRp",
            "Avg Cost / Base",
            (row) => money.format(Number(row.avgCostRp || 0)),
          ],
          [
            "stockValueRp",
            "Stock Value",
            (row) => money.format(Number(row.stockValueRp || 0)),
          ],
        ]}
      />
    </Panel>
  );
}

function Receivables({
  rows,
  canWrite,
  busy,
  run,
}: {
  rows: Row[];
  canWrite: boolean;
  busy: boolean;
  run: any;
}) {
  /* RKN_PLASTIC_RECEIVABLES_NO_DUE_DATE_V2N2 */
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("TRANSFER");

  const totalReceivable = rows.reduce(
    (total, row) => total + Number(row.outstandingRp || 0),
    0
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await run(
      "ADD_PAYMENT",
      {
        invoiceId,
        amountRp: Number(amount || 0),
        paymentMethod: method,
        dateKey: today(),
      },
      "RECEIVABLES"
    );
    setAmount("");
  };

  return (
    <>
      <div className={styles.receivableSummary}>
        <span>TOTAL PIUTANG</span>
        <strong>{money.format(totalReceivable)}</strong>
      </div>

      {canWrite && rows.length ? (
        <Panel title="Pembayaran">
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid3}>
              <Field label="Piutang">
                <select
                  required
                  value={invoiceId}
                  onChange={(event) =>
                    setInvoiceId(event.target.value)
                  }
                >
                  <option value="">Pilih transaksi</option>
                  {rows.map((row) => (
                    <option
                      key={row.invoiceId}
                      value={row.invoiceId}
                    >
                      {row.invoiceNo} / {row.customerName} /{" "}
                      {money.format(
                        Number(row.outstandingRp || 0)
                      )}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nominal">
                <input
                  required
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                />
              </Field>

              <Field label="Metode">
                <select
                  value={method}
                  onChange={(event) =>
                    setMethod(event.target.value)
                  }
                >
                  <option>TRANSFER</option>
                  <option>CASH</option>
                  <option>QRIS</option>
                </select>
              </Field>
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={busy}>
                Simpan
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Piutang Aktif">
        <DataTable
          rows={rows}
          columns={[
            ["invoiceNo", "Invoice"],
            ["dateKey", "Tanggal"],
            ["customerName", "Customer"],
            [
              "grandTotalRp",
              "Total",
              (row) =>
                money.format(Number(row.grandTotalRp || 0)),
            ],
            [
              "paidRp",
              "Dibayar",
              (row) =>
                money.format(Number(row.paidRp || 0)),
            ],
            [
              "outstandingRp",
              "Sisa",
              (row) =>
                money.format(Number(row.outstandingRp || 0)),
            ],
          ]}
        />
      </Panel>
    </>
  );
}


function Opname({
  rows,
  products,
  canManage,
  busy,
  run,
}: {
  rows: Row[];
  products: Row[];
  canManage: boolean;
  busy: boolean;
  run: any;
}) {
  const [variantId, setVariantId] = useState("");
  const [physicalQty, setPhysicalQty] = useState("");
  const [reason, setReason] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(
      "POST_OPNAME",
      {
        dateKey: today(),
        reason,
        lines: [
          {
            variantId,
            physicalQtyBase: Number(physicalQty || 0),
          },
        ],
      },
      "OPNAME"
    );
  };

  return (
    <>
      {canManage ? (
        <Panel
          title="Stock Opname"
          subtitle="Input stok fisik dalam base unit dan sistem akan membuat adjustment."
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid3}>
              <Field label="Produk">
                <select
                  required
                  value={variantId}
                  onChange={(event) =>
                    setVariantId(event.target.value)
                  }
                >
                  <option value="">Pilih warna / ukuran / produk</option>
                  {products.map((product) => (
                    <option
                      key={product.variantId}
                      value={product.variantId}
                    >
                      {productLabel(product)} /{" "}
                      {stockText(product)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Stok Fisik / Base Unit">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={physicalQty}
                  onChange={(event) =>
                    setPhysicalQty(event.target.value)
                  }
                />
              </Field>
              <Field label="Alasan">
                <input
                  required
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                />
              </Field>
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={busy}>
                Posting Opname
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title="Riwayat Stock Opname"
        subtitle="Selisih stok fisik dan stok sistem."
      >
        <DataTable
          rows={rows}
          columns={[
            ["opnameNo", "SO"],
            ["dateKey", "Tanggal"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            ["systemQtyBase", "System"],
            ["physicalQtyBase", "Fisik"],
            ["varianceQtyBase", "Selisih"],
            ["reason", "Alasan"],
          ]}
        />
      </Panel>
    </>
  );
}

function Reconciliation({ data }: { data: Row }) {
  /* RKN_PLASTIC_RECON_UI_V2M */
  const summary = data.summary || {};
  const rows = data.rows || [];
  const reviewRows = data.reviewRows || [];

  const polyRows = rows.filter(
    (row: Row) => String(row.category || "") !== "THERMAL"
  );
  const thermalRows = rows.filter(
    (row: Row) => String(row.category || "") === "THERMAL"
  );

  const reconQty = (row: Row, key: string) =>
    stockText({
      ...row,
      qtyBase: Number(row[key] || 0),
    });

  const reconColumns: Column[] = [
    ["productName", "Produk"],
    ["color", "Warna"],
    ["size", "Ukuran"],
    ["systemQtyBase", "System", (row) => reconQty(row, "systemQtyBase")],
    ["physicalQtyBase", "SO Fisik", (row) => reconQty(row, "physicalQtyBase")],
    [
      "varianceQtyBase",
      "Variance",
      (row) => {
        const value = Number(row.varianceQtyBase || 0);
        const absRow = { ...row, qtyBase: Math.abs(value) };
        const text = stockText(absRow);
        return value < 0 ? `-${text}` : text;
      },
    ],
    [
      "status",
      "Status",
      (row) => (
        <span
          className={
            row.status === "BALANCE"
              ? styles.statusPaid
              : styles.statusOpen
          }
        >
          {row.status}
        </span>
      ),
    ],
  ];

  return (
    <>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Polymailer System"
          value={qtyFmt.format(Number(summary.polySystemQtyBase || 0))}
          note="base ROLL"
        />
        <MetricCard
          label="Polymailer Physical"
          value={qtyFmt.format(Number(summary.polyPhysicalQtyBase || 0))}
          note="SO fisik 28/08"
        />
        <MetricCard
          label="Polymailer Variance"
          value={qtyFmt.format(Number(summary.polyVarianceQtyBase || 0))}
          note="Physical - System / ROLL"
        />
        <MetricCard
          label="Thermal System"
          value={stockText({
            baseUnit: "LEMBAR",
            midUnit: "STACK",
            packUnit: "DUS",
            unitsPerMid: 500,
            unitsPerPack: 10000,
            qtyBase: Number(summary.thermalSystemQtyBase || 0),
          })}
          note="Dus / Stack / Lembar"
        />
        <MetricCard
          label="Thermal Physical"
          value={stockText({
            baseUnit: "LEMBAR",
            midUnit: "STACK",
            packUnit: "DUS",
            unitsPerMid: 500,
            unitsPerPack: 10000,
            qtyBase: Number(summary.thermalPhysicalQtyBase || 0),
          })}
          note="3 Dus Panjang + 9 Dus Kotak"
        />
        <MetricCard
          label="SKU Balance"
          value={`${Number(summary.balancedVariants || 0)} / ${Number(
            summary.totalVariants || 0
          )}`}
          note={`${Number(summary.varianceVariants || 0)} SKU masih selisih`}
        />
      </section>

      <Panel
        title="Rekonsiliasi Polymailer / 28-08-2026"
        subtitle="System dari movement ledger sampai 28/08/2026. Spreadsheet IN/OUT tidak dipakai."
      >
        <DataTable rows={polyRows} columns={reconColumns} />
      </Panel>

      <Panel
        title="Rekonsiliasi Thermal / 28-08-2026"
        subtitle="Thermal Polos = Thermal Dus Panjang (3 DUS). Thermal Kotak = Thermal Dus Kotak (9 DUS)."
      >
        <DataTable rows={thermalRows} columns={reconColumns} />
      </Panel>

      {reviewRows.length ? (
        <Panel title="Mapping Review" subtitle="Baris yang masih membutuhkan mapping manual.">
          <DataTable
            rows={reviewRows}
            columns={[
              ["sourceLabel", "Label SO"],
              ["sourceQty", "Qty Raw"],
              ["sourceUnit", "Unit"],
              ["mappingStatus", "Status"],
              ["sourceRef", "Sumber"],
            ]}
          />
        </Panel>
      ) : null}
    </>
  );
}

function Reports({
  data,
  period,
}: {
  data: Row;
  period: string;
}) {
  /* RKN_PLASTIC_REPORTS_UI_PDF_V2N */
  const stockRows = Array.isArray(data.stock) ? data.stock : [];
  const inboundRows = Array.isArray(data.inbound) ? data.inbound : [];
  const outboundRows = Array.isArray(data.outbound) ? data.outbound : [];

  const polymailer = stockRows.filter(
    (row: Row) => String(row.category || "").toUpperCase() !== "THERMAL"
  );

  const thermal = stockRows.filter(
    (row: Row) => String(row.category || "").toUpperCase() === "THERMAL"
  );

  const number2 = (value: unknown) =>
    qtyFmt.format(Number(value || 0));

  const pdfAscii = (value: unknown) =>
    String(value ?? "")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const pdfCell = (value: unknown, width: number) => {
    const raw = pdfAscii(value);
    const clipped =
      raw.length > width ? raw.slice(0, Math.max(0, width - 1)) + "~" : raw;
    return clipped.padEnd(width, " ");
  };

  const buildPdf = (
    title: string,
    lines: string[],
    filename: string
  ) => {
    const clean = [
      title,
      `RKN / PLASTIC / PERIODE ${period}`,
      `Generated: ${new Date().toLocaleString("id-ID")}`,
      "",
      ...lines,
    ].map(pdfAscii);

    const pageLines = 48;
    const pages: string[][] = [];

    for (let index = 0; index < clean.length; index += pageLines) {
      pages.push(clean.slice(index, index + pageLines));
    }

    if (!pages.length) pages.push(["Tidak ada data."]);

    const escapePdf = (value: string) =>
      value
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

    const objects: string[] = [];
    const pageRefs: string[] = [];

    const fontObject = 3;
    let nextObject = 4;

    for (const page of pages) {
      const pageObject = nextObject++;
      const contentObject = nextObject++;

      pageRefs.push(`${pageObject} 0 R`);

      const commands = [
        "BT",
        "/F1 8 Tf",
        "28 560 Td",
        "10.5 TL",
        ...page.flatMap((line, index) =>
          index === 0
            ? [`(${escapePdf(line)}) Tj`]
            : ["T*", `(${escapePdf(line)}) Tj`]
        ),
        "ET",
      ].join("\n");

      objects[pageObject] =
        `${pageObject} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] ` +
        `/Resources << /Font << /F1 ${fontObject} 0 R >> >> ` +
        `/Contents ${contentObject} 0 R >>\nendobj\n`;

      objects[contentObject] =
        `${contentObject} 0 obj\n` +
        `<< /Length ${commands.length} >>\nstream\n` +
        `${commands}\nendstream\nendobj\n`;
    }

    objects[1] =
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

    objects[2] =
      `2 0 obj\n<< /Type /Pages /Count ${pages.length} ` +
      `/Kids [${pageRefs.join(" ")}] >>\nendobj\n`;

    objects[fontObject] =
      `${fontObject} 0 obj\n` +
      "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";

    const maxObject = objects.length - 1;
    let pdf = "%PDF-1.4\n";
    const offsets = new Array(maxObject + 1).fill(0);

    for (let objectNo = 1; objectNo <= maxObject; objectNo++) {
      if (!objects[objectNo]) continue;
      offsets[objectNo] = pdf.length;
      pdf += objects[objectNo];
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${maxObject + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let objectNo = 1; objectNo <= maxObject; objectNo++) {
      pdf +=
        String(offsets[objectNo] || 0).padStart(10, "0") +
        " 00000 n \n";
    }

    pdf +=
      `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  const downloadPdf = () => {
    const lines: string[] = [];

    lines.push("POLYMAILER");
    lines.push(
      [
        pdfCell("WARNA", 14),
        pdfCell("UKURAN", 10),
        pdfCell("BALL", 10),
        pdfCell("ISI/BALL", 10),
        pdfCell("TOTAL ROLL", 12),
        pdfCell("HARGA/BALL", 15),
      ].join(" ")
    );

    lines.push("-".repeat(78));

    for (const row of polymailer) {
      const unitsPerPack = Math.max(1, Number(row.unitsPerPack || 1));
      const qtyBase = Number(row.qtyBase || 0);

      lines.push(
        [
          pdfCell(row.color || "-", 14),
          pdfCell(row.size || "-", 10),
          pdfCell(number2(qtyBase / unitsPerPack), 10),
          pdfCell(number2(unitsPerPack), 10),
          pdfCell(number2(qtyBase), 12),
          pdfCell(
            `Rp ${Number(row.defaultSellPricePackRp || 0).toLocaleString("id-ID")}`,
            15
          ),
        ].join(" ")
      );
    }

    lines.push("");
    lines.push("THERMAL");
    lines.push(
      [
        pdfCell("PRODUK", 26),
        pdfCell("DUS", 10),
        pdfCell("STACK", 10),
        pdfCell("LEMBAR", 12),
        pdfCell("HARGA/DUS", 15),
      ].join(" ")
    );

    lines.push("-".repeat(78));

    for (const row of thermal) {
      const unitsPerPack = Math.max(1, Number(row.unitsPerPack || 1));
      const unitsPerMid = Math.max(1, Number(row.unitsPerMid || 1));
      const qtyBase = Number(row.qtyBase || 0);

      lines.push(
        [
          pdfCell(row.productName || "-", 26),
          pdfCell(number2(qtyBase / unitsPerPack), 10),
          pdfCell(number2(qtyBase / unitsPerMid), 10),
          pdfCell(number2(qtyBase), 12),
          pdfCell(
            `Rp ${Number(row.defaultSellPricePackRp || 0).toLocaleString("id-ID")}`,
            15
          ),
        ].join(" ")
      );
    }

    lines.push("");
    lines.push(`BARANG MASUK / ${inboundRows.length} BARIS`);
    lines.push(`BARANG KELUAR / ${outboundRows.length} BARIS`);

    buildPdf(
      "RKN ERP - LAPORAN PLASTIC TRADING",
      lines,
      `RKN_PLASTIC_REPORT_${period}.pdf`
    );
  };

  return (
    <>
      <div className={styles.reportToolbar}>
        <div>
          <strong>Laporan Plastic Trading</strong>
          <span>
            Format mengikuti master UOM.
          </span>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={downloadPdf}
        >
          Download PDF
        </button>
      </div>

      <Panel
        title="Stock Polymailer"
        subtitle="Ball dihitung dari isi per Ball."
      >
        <DataTable
          rows={polymailer}
          columns={[
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "ball",
              "Ball",
              (row) =>
                number2(
                  Number(row.qtyBase || 0) /
                    Math.max(1, Number(row.unitsPerPack || 1))
                ),
            ],
            [
              "unitsPerPack",
              "Isi / Ball",
              (row) => number2(row.unitsPerPack),
            ],
            [
              "qtyBase",
              "Total Roll",
              (row) => number2(row.qtyBase),
            ],
            [
              "defaultSellPricePackRp",
              "Harga Master / Ball",
              (row) =>
                money.format(Number(row.defaultSellPricePackRp || 0)),
            ],
            [
              "avgCostRp",
              "Avg HPP / Roll",
              (row) => money.format(Number(row.avgCostRp || 0)),
            ],
            [
              "stockValueRp",
              "Nilai Stock",
              (row) => money.format(Number(row.stockValueRp || 0)),
            ],
          ]}
        />
      </Panel>

      <Panel
        title="Stock Thermal"
        subtitle="Dus / Stack / Lembar sesuai master."
      >
        <DataTable
          rows={thermal}
          columns={[
            ["productName", "Produk"],
            [
              "dus",
              "Dus",
              (row) =>
                number2(
                  Number(row.qtyBase || 0) /
                    Math.max(1, Number(row.unitsPerPack || 1))
                ),
            ],
            [
              "stack",
              "Stack",
              (row) =>
                number2(
                  Number(row.qtyBase || 0) /
                    Math.max(1, Number(row.unitsPerMid || 1))
                ),
            ],
            [
              "qtyBase",
              "Lembar",
              (row) => number2(row.qtyBase),
            ],
            [
              "defaultSellPricePackRp",
              "Harga Master / Dus",
              (row) =>
                money.format(Number(row.defaultSellPricePackRp || 0)),
            ],
            [
              "avgCostRp",
              "Avg HPP / Lembar",
              (row) => money.format(Number(row.avgCostRp || 0)),
            ],
            [
              "stockValueRp",
              "Nilai Stock",
              (row) => money.format(Number(row.stockValueRp || 0)),
            ],
          ]}
        />
      </Panel>

      <Panel
        title="Barang Masuk"
        subtitle="Periode aktif."
      >
        <DataTable
          rows={inboundRows}
          columns={[
            ["dateKey", "Tanggal"],
            ["referenceNo", "No. IN"],
            ["partyName", "Supplier"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "qty",
              "Qty",
              (row) =>
                `${number2(row.qty)} ${row.unit || ""}`,
            ],
            [
              "totalRp",
              "Nilai",
              (row) => money.format(Number(row.totalRp || 0)),
            ],
          ]}
        />
      </Panel>

      <Panel
        title="Barang Keluar"
        subtitle="Periode aktif."
      >
        <DataTable
          rows={outboundRows}
          columns={[
            ["dateKey", "Tanggal"],
            ["referenceNo", "Invoice"],
            ["partyName", "Customer"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            ["qtyBase", "Qty Base", (row) => number2(row.qtyBase)],
            [
              "totalRp",
              "Sales",
              (row) => money.format(Number(row.totalRp || 0)),
            ],
            [
              "cogsRp",
              "HPP",
              (row) => money.format(Number(row.cogsRp || 0)),
            ],
            [
              "grossProfitRp",
              "Gross Profit",
              (row) =>
                money.format(Number(row.grossProfitRp || 0)),
            ],
          ]}
        />
      </Panel>
    </>
  );
}

function Closing({
  data,
  period,
  canClose,
  busy,
  run,
}: {
  data: Row;
  period: string;
  canClose: boolean;
  busy: boolean;
  run: any;
}) {
  const current = data.current || { status: "OPEN" };
  const [reason, setReason] = useState("");
  const closed = current.status === "CLOSED";

  return (
    <>
      <Panel
        title={`Monthly Closing / ${period}`}
        subtitle="Closing mengunci transaksi pada periode yang dipilih."
      >
        <div className={styles.closingCard}>
          <div>
            <span>STATUS PERIODE</span>
            <strong>{current.status || "OPEN"}</strong>
          </div>
          <div>
            <span>SALES</span>
            <strong>
              {money.format(Number(current.sales_rp || 0))}
            </strong>
          </div>
          <div>
            <span>GROSS PROFIT</span>
            <strong>
              {money.format(
                Number(current.gross_profit_rp || 0)
              )}
            </strong>
          </div>
          <div>
            <span>PIUTANG</span>
            <strong>
              {money.format(Number(current.receivable_rp || 0))}
            </strong>
          </div>
        </div>

        {canClose ? (
          <div className={styles.closeActions}>
            <Field
              label={closed ? "Alasan Reopen" : "Catatan Closing"}
              className={styles.closeReason}
            >
              <input
                value={reason}
                placeholder={
                  closed
                    ? "Wajib diisi untuk reopen"
                    : "Opsional"
                }
                onChange={(event) =>
                  setReason(event.target.value)
                }
              />
            </Field>

            {closed ? (
              <button
                type="button"
                className={styles.dangerButton}
                disabled={busy || !reason.trim()}
                onClick={() =>
                  run(
                    "REOPEN_PERIOD",
                    { periodKey: period, reason },
                    "CLOSING"
                  )
                }
              >
                Reopen Period
              </button>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                disabled={busy}
                onClick={() =>
                  run(
                    "CLOSE_PERIOD",
                    { periodKey: period, reason },
                    "CLOSING"
                  )
                }
              >
                Close Period
              </button>
            )}
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Closing History"
        subtitle="Snapshot period yang pernah ditutup."
      >
        <DataTable
          rows={data.history || []}
          columns={[
            ["period_key", "Periode"],
            ["status", "Status"],
            [
              "sales_rp",
              "Sales",
              (row) => money.format(Number(row.sales_rp || 0)),
            ],
            [
              "cogs_rp",
              "HPP",
              (row) => money.format(Number(row.cogs_rp || 0)),
            ],
            [
              "gross_profit_rp",
              "Gross Profit",
              (row) =>
                money.format(Number(row.gross_profit_rp || 0)),
            ],
            [
              "receivable_rp",
              "Piutang",
              (row) =>
                money.format(Number(row.receivable_rp || 0)),
            ],
            ["closed_at", "Closed At"],
          ]}
        />
      </Panel>
    </>
  );
}
