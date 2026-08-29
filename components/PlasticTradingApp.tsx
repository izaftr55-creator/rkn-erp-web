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

/* RKN_PLASTIC_HUMANIZE_DISPLAY_V2O3 */
function humanizeDisplay(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value)
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
                    : humanizeDisplay(row[key])}
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
            <strong>{humanizeDisplay(actor.accessLevel)}</strong>
            <small>{humanizeDisplay(actor.roleCode)}</small>
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
            {humanizeDisplay(message)}
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
              canEdit={canManage}
              busy={busy}
              run={run}
            />
          ) : null}


{tab === "INVENTORY" ? (
            <Inventory rows={data.rows || []} />
          ) : null}

          {tab === "RECEIVABLES" ? (
            <Receivables
              data={data}
              canWrite={!readOnly}
              canManage={canManage}
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
  /* RKN_PLASTIC_DASHBOARD_UI_V2O */
  const metrics = data.metrics || {};
  const topReceivables = Array.isArray(data.topReceivables)
    ? data.topReceivables
    : [];

  return (
    <>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Stock Value"
          value={money.format(Number(metrics.stockValueRp || 0))}
        />
        <MetricCard
          label="Piutang"
          value={money.format(Number(metrics.receivableRp || 0))}
        />
        <MetricCard
          label="Sales"
          value={money.format(Number(metrics.salesRp || 0))}
        />
        <MetricCard
          label="Gross Profit"
          value={money.format(Number(metrics.grossProfitRp || 0))}
        />
      </section>

      <Panel title="Piutang Customer">
        <DataTable
          rows={topReceivables}
          columns={[
            ["customerName", "Customer"],
            [
              "salesRp",
              "Transaksi",
              (row) => money.format(Number(row.salesRp || 0)),
            ],
            [
              "paidRp",
              "Dibayar",
              (row) => money.format(Number(row.paidRp || 0)),
            ],
            [
              "outstandingRp",
              "Sisa",
              (row) => money.format(Number(row.outstandingRp || 0)),
            ],
          ]}
        />
      </Panel>
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
  canEdit,
  busy,
  run,
}: {
  rows: Row[];
  products: Row[];
  customers: Row[];
  canWrite: boolean;
  canEdit: boolean;
  busy: boolean;
  run: any;
}) {
  /* RKN_PLASTIC_OUTBOUND_EDIT_VOID_UI_V2O */
  const emptyLine = () => ({
    variantId: "",
    qty: "1",
    unit: "",
    unitPriceRp: "",
  });

  const [dateKey, setDateKey] = useState(today());
  const [customerName, setCustomerName] = useState("");
  const [discountRp, setDiscountRp] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [editInvoiceId, setEditInvoiceId] = useState("");
  const [editInvoiceNo, setEditInvoiceNo] = useState("");
  const [editReason, setEditReason] = useState("");

  const invoices = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of rows) {
      const id = String(row.invoiceId || "");
      if (!id) continue;
      const current = map.get(id);
      if (!current) {
        map.set(id, {
          ...row,
          grossProfitRp:
            Number(row.grandTotalRp || 0) - Number(row.cogsRp || 0),
        });
      }
    }
    return Array.from(map.values());
  }, [rows]);

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

  const subtotal = useMemo(
    () =>
      lines.reduce((total, line) => {
        const product = products.find(
          (item) => item.variantId === line.variantId
        );
        const price =
          Number(line.unitPriceRp || 0) ||
          defaultPrice(product, line.unit);
        if (!line.variantId) return total;
        return total + Number(line.qty || 0) * price;
      }, 0),
    [lines, products]
  );

  const grand = Math.max(0, subtotal - Number(discountRp || 0));

  const saleReady =
    lines.length > 0 &&
    lines.every(
      (line) =>
        Boolean(line.variantId) &&
        Number(line.qty || 0) > 0 &&
        Boolean(line.unit) &&
        Number(line.unitPriceRp || 0) >= 0
    );

  const resetForm = () => {
    setDateKey(today());
    setCustomerName("");
    setDiscountRp("0");
    setPaymentStatus("PAID");
    setPaymentMethod("TRANSFER");
    setNote("");
    setLines([emptyLine()]);
    setEditInvoiceId("");
    setEditInvoiceNo("");
    setEditReason("");
  };

  const startEdit = (row: Row) => {
    const invoiceId = String(row.invoiceId || "");
    const group = rows.filter(
      (item) => String(item.invoiceId || "") === invoiceId
    );
    if (!group.length) return;

    const head = group[0];
    setEditInvoiceId(invoiceId);
    setEditInvoiceNo(String(head.invoiceNo || ""));
    setDateKey(String(head.dateKey || today()));
    setCustomerName(String(head.customerName || ""));
    setDiscountRp(String(head.discountRp || 0));
    setNote(String(head.note || ""));
    setPaymentStatus(
      Number(head.outstandingRp || 0) > 0 ? "NOT_PAID" : "PAID"
    );
    setLines(
      group.map((item) => ({
        variantId: String(item.variantId || ""),
        qty: String(item.qtyInput || 1),
        unit: String(item.inputUnit || "").toUpperCase(),
        unitPriceRp: String(item.unitPriceRp || 0),
      }))
    );
    setEditReason("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const voidSale = async (row: Row) => {
    if (!canEdit || typeof window === "undefined") return;
    const reason = window.prompt(
      `Alasan hapus / void ${row.invoiceNo || "transaksi"}?`
    );
    if (!reason?.trim()) return;
    if (!window.confirm("Void transaksi ini? Stok akan dikembalikan.")) {
      return;
    }
    await run(
      "VOID_SALE",
      { invoiceId: row.invoiceId, reason: reason.trim() },
      "OUTBOUND"
    );
    resetForm();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const payload = {
      dateKey,
      customerId: exactCustomer?.customerId || "",
      customerName: customerName.trim(),
      discountRp: Number(discountRp || 0),
      note,
      lines: lines.map((line) => ({
        ...line,
        qty: Number(line.qty),
        unitPriceRp: Number(line.unitPriceRp || 0),
      })),
    };

    if (editInvoiceId) {
      if (!editReason.trim()) {
        window.alert("Alasan edit wajib diisi.");
        return;
      }
      await run(
        "UPDATE_SALE",
        {
          ...payload,
          invoiceId: editInvoiceId,
          reason: editReason.trim(),
        },
        "OUTBOUND"
      );
      resetForm();
      return;
    }

    await run(
      "CREATE_SALE",
      {
        ...payload,
        paymentStatus,
        paymentMethod:
          paymentStatus === "PAID" ? paymentMethod : "",
      },
      "OUTBOUND"
    );
    resetForm();
  };

  return (
    <>
      {canWrite ? (
        <Panel
          title={editInvoiceId ? `Edit ${editInvoiceNo}` : "Barang Keluar"}
          subtitle={
            editInvoiceId
              ? "Edit aman; stok dan audit ikut disesuaikan."
              : "Lunas atau piutang."
          }
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

              <Field label="Customer">
                <input
                  required
                  list="plastic-customer-options-v2o"
                  placeholder="Nama customer"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
                />
                <datalist id="plastic-customer-options-v2o">
                  {customers.map((customer) => (
                    <option
                      key={customer.customerId}
                      value={customer.customerName}
                    />
                  ))}
                </datalist>
              </Field>

              {!editInvoiceId ? (
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
              ) : (
                <div className={styles.simpleInfoCard}>
                  <span>STATUS</span>
                  <strong>
                    {paymentStatus === "PAID"
                      ? "LUNAS"
                      : "BELUM LUNAS"}
                  </strong>
                </div>
              )}

              {!editInvoiceId && paymentStatus === "PAID" ? (
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
              ) : null}

              <Field label="Catatan">
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>

              {editInvoiceId ? (
                <Field label="Alasan Edit">
                  <input
                    required
                    value={editReason}
                    onChange={(event) =>
                      setEditReason(event.target.value)
                    }
                  />
                </Field>
              ) : null}
            </div>

            <div className={styles.lineSection}>
              <div className={styles.lineSectionHead}>
                <strong>Item</strong>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setLines([...lines, emptyLine()])}
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
                        disabled={!selected}
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
                        <option value="">Pilih UOM</option>
                        {units.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Harga">
                      <input
                        required
                        disabled={!selected}
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
                <strong>{money.format(subtotal)}</strong>
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
                <strong>{money.format(grand)}</strong>
              </div>
            </div>

            <div className={styles.actions}>
              {editInvoiceId ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={resetForm}
                >
                  Batal
                </button>
              ) : null}
              <button
                className={styles.primaryButton}
                disabled={busy || !saleReady}
              >
                {editInvoiceId ? "Simpan Edit" : "Simpan"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Riwayat Keluar">
        <DataTable
          rows={invoices}
          columns={[
            ["dateKey", "Tanggal"],
            ["invoiceNo", "Invoice"],
            ["customerName", "Customer"],
            [
              "grandTotalRp",
              "Sales",
              (row) => money.format(Number(row.grandTotalRp || 0)),
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
              "payment",
              "Status",
              (row) =>
                Number(row.outstandingRp || 0) > 0
                  ? "BELUM LUNAS"
                  : "LUNAS",
            ],
            [
              "actions",
              "Aksi",
              (row) =>
                canEdit ? (
                  <div className={styles.tableActions}>
                    <button
                      type="button"
                      className={styles.inlineEditButton}
                      onClick={() => startEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.inlineDangerButton}
                      onClick={() => voidSale(row)}
                    >
                      Hapus
                    </button>
                  </div>
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
  data,
  canWrite,
  canManage,
  busy,
  run,
}: {
  data: Row;
  canWrite: boolean;
  canManage: boolean;
  busy: boolean;
  run: any;
}) {
  /* RKN_PLASTIC_RECEIVABLE_LEDGER_UI_V2O */
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const customers = Array.isArray(data.customers)
    ? data.customers
    : [];
  const payments = Array.isArray(data.payments)
    ? data.payments
    : [];
  const ledger = Array.isArray(data.ledger) ? data.ledger : [];

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("TRANSFER");
  const [customerId, setCustomerId] = useState("");

  const total = rows.reduce(
    (sum: number, row: Row) =>
      sum + Number(row.outstandingRp || 0),
    0
  );

  const customerLedger = useMemo(() => {
    if (!customerId) return [];
    let balance = 0;
    return ledger
      .filter(
        (row: Row) => String(row.customerId || "") === customerId
      )
      .slice()
      .sort((a: Row, b: Row) =>
        String(a.createdAt || "").localeCompare(
          String(b.createdAt || "")
        )
      )
      .map((row: Row) => {
        const signed =
          Number(row.amountRp || 0) * Number(row.direction || 0);
        balance += signed;
        return {
          ...row,
          debitRp: signed > 0 ? signed : 0,
          creditRp: signed < 0 ? Math.abs(signed) : 0,
          balanceRp: balance,
        };
      })
      .reverse();
  }, [customerId, ledger]);

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

  const reversePayment = async (row: Row) => {
    if (!canManage || row.status !== "POSTED") return;
    const reason = window.prompt(
      `Alasan batalkan pembayaran ${row.invoiceNo || ""}?`
    );
    if (!reason?.trim()) return;
    await run(
      "REVERSE_PAYMENT",
      {
        paymentId: row.paymentId,
        reason: reason.trim(),
      },
      "RECEIVABLES"
    );
  };

  return (
    <>
      <div className={styles.receivableSummary}>
        <span>TOTAL PIUTANG</span>
        <strong>{money.format(total)}</strong>
      </div>

      <Panel title="Piutang Customer">
        <DataTable
          rows={customers}
          columns={[
            ["customerName", "Customer"],
            [
              "salesRp",
              "Transaksi",
              (row) => money.format(Number(row.salesRp || 0)),
            ],
            [
              "paidRp",
              "Dibayar",
              (row) => money.format(Number(row.paidRp || 0)),
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

      {canWrite && rows.length ? (
        <Panel title="Pembayaran">
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.formGrid3}>
              <Field label="Transaksi">
                <select
                  required
                  value={invoiceId}
                  onChange={(event) =>
                    setInvoiceId(event.target.value)
                  }
                >
                  <option value="">Pilih transaksi</option>
                  {rows.map((row: Row) => (
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
              (row) => money.format(Number(row.paidRp || 0)),
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

      <Panel title="Ledger Customer">
        <div className={styles.ledgerFilter}>
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Pilih customer</option>
            {customers.map((row: Row) => (
              <option key={row.customerId} value={row.customerId}>
                {row.customerName}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          rows={customerLedger}
          columns={[
            ["dateKey", "Tanggal"],
            [
              "eventType",
              "Jenis",
              (row) =>
                row.eventType === "SALE"
                  ? "BARANG KELUAR"
                  : row.eventType === "PAYMENT"
                    ? "PEMBAYARAN"
                    : "BATAL BAYAR",
            ],
            ["referenceNo", "Ref"],
            [
              "debitRp",
              "Tambah",
              (row) =>
                row.debitRp
                  ? money.format(Number(row.debitRp))
                  : "-",
            ],
            [
              "creditRp",
              "Bayar",
              (row) =>
                row.creditRp
                  ? money.format(Number(row.creditRp))
                  : "-",
            ],
            [
              "balanceRp",
              "Saldo",
              (row) =>
                money.format(Number(row.balanceRp || 0)),
            ],
          ]}
        />
      </Panel>

      <Panel title="Riwayat Pembayaran">
        <DataTable
          rows={payments}
          columns={[
            ["dateKey", "Tanggal"],
            ["invoiceNo", "Invoice"],
            ["customerName", "Customer"],
            [
              "amountRp",
              "Nominal",
              (row) => money.format(Number(row.amountRp || 0)),
            ],
            ["paymentMethod", "Metode"],
            ["status", "Status"],
            [
              "paymentAction",
              "Aksi",
              (row) =>
                canManage && row.status === "POSTED" ? (
                  <button
                    type="button"
                    className={styles.inlineDangerButton}
                    onClick={() => reversePayment(row)}
                  >
                    Batalkan
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
  /* RKN_PLASTIC_REPORTS_GRID_PDF_V2O */
  const stockRows = Array.isArray(data.stock) ? data.stock : [];
  const opnameRows = Array.isArray(data.opname) ? data.opname : [];
  const receivables = Array.isArray(data.receivables)
    ? data.receivables
    : [];
  const metrics = data.metrics || {};

  const polymailer = stockRows.filter(
    (row: Row) => String(row.category || "").toUpperCase() !== "THERMAL"
  );
  const thermal = stockRows.filter(
    (row: Row) => String(row.category || "").toUpperCase() === "THERMAL"
  );

  const n = (value: unknown) =>
    qtyFmt.format(Number(value || 0));

  const varianceStatus = (value: unknown) => {
    const v = Number(value || 0);
    if (Math.abs(v) < 0.000001) return "BALANCE";
    return v > 0 ? "LEBIH" : "KURANG";
  };

  const ascii = (value: unknown) =>
    String(value ?? "")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const downloadPdf = () => {
    type PdfTable = {
      title: string;
      headers: string[];
      widths: number[];
      rows: Array<Array<string | number>>;
    };

    const tables: PdfTable[] = [
      {
        title: "STOCK POLYMAILER",
        headers: [
          "Warna",
          "Ukuran",
          "Ball",
          "Isi/Ball",
          "Total Roll",
          "Harga/Ball",
          "Stock Value",
        ],
        widths: [105, 75, 60, 70, 78, 105, 115],
        rows: polymailer.map((row: Row) => {
          const per = Math.max(1, Number(row.unitsPerPack || 1));
          const qty = Number(row.qtyBase || 0);
          return [
            row.color || "-",
            row.size || "-",
            n(qty / per),
            n(per),
            n(qty),
            money.format(Number(row.defaultSellPricePackRp || 0)),
            money.format(Number(row.stockValueRp || 0)),
          ];
        }),
      },
      {
        title: "STOCK THERMAL",
        headers: [
          "Produk",
          "Dus",
          "Stack",
          "Lembar",
          "Harga/Dus",
          "Stock Value",
        ],
        widths: [185, 60, 65, 75, 110, 120],
        rows: thermal.map((row: Row) => {
          const pack = Math.max(1, Number(row.unitsPerPack || 1));
          const mid = Math.max(1, Number(row.unitsPerMid || 1));
          const qty = Number(row.qtyBase || 0);
          return [
            row.productName || "-",
            n(qty / pack),
            n(qty / mid),
            n(qty),
            money.format(Number(row.defaultSellPricePackRp || 0)),
            money.format(Number(row.stockValueRp || 0)),
          ];
        }),
      },
      {
        title: "STOCK OPNAME - BALANCE / SELISIH",
        headers: [
          "Tanggal",
          "No. SO",
          "Produk",
          "Warna",
          "Ukuran",
          "System",
          "Fisik",
          "Selisih",
          "Status",
        ],
        widths: [62, 100, 145, 70, 65, 68, 68, 68, 65],
        rows: opnameRows.map((row: Row) => [
          row.dateKey || "-",
          row.opnameNo || "-",
          row.productName || "-",
          row.color || "-",
          row.size || "-",
          `${n(row.systemQtyBase)} ${row.baseUnit || ""}`,
          `${n(row.physicalQtyBase)} ${row.baseUnit || ""}`,
          `${n(row.varianceQtyBase)} ${row.baseUnit || ""}`,
          varianceStatus(row.varianceQtyBase),
        ]),
      },
      {
        title: "PIUTANG AKTIF",
        headers: [
          "Tanggal",
          "Invoice",
          "Customer",
          "Total",
          "Dibayar",
          "Sisa",
        ],
        widths: [72, 120, 190, 115, 115, 115],
        rows: receivables.map((row: Row) => [
          row.dateKey || "-",
          row.invoiceNo || "-",
          row.customerName || "-",
          money.format(Number(row.grandTotalRp || 0)),
          money.format(Number(row.paidRp || 0)),
          money.format(Number(row.outstandingRp || 0)),
        ]),
      },
    ];

    const PAGE_W = 842;
    const PAGE_H = 595;
    const M = 28;
    const BOTTOM = 28;
    const pages: string[][] = [];
    let commands: string[] = [];
    let y = 0;
    let pageNo = 0;

    const esc = (value: unknown) =>
      ascii(value)
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

    const text = (
      x: number,
      yy: number,
      value: unknown,
      size = 8,
      bold = false
    ) => {
      commands.push(
        `BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(
          1
        )} ${yy.toFixed(1)} Td (${esc(value)}) Tj ET`
      );
    };

    const rect = (
      x: number,
      yy: number,
      w: number,
      h: number,
      fill = ""
    ) => {
      if (fill) commands.push(`${fill} rg`);
      commands.push(
        `${x.toFixed(1)} ${yy.toFixed(1)} ${w.toFixed(
          1
        )} ${h.toFixed(1)} re ${fill ? "B" : "S"}`
      );
      if (fill) commands.push("0 0 0 rg");
    };

    const startPage = () => {
      if (commands.length) pages.push(commands);
      commands = [];
      pageNo += 1;

      commands.push("0.06 0.12 0.20 rg");
      commands.push(`0 ${PAGE_H - 58} ${PAGE_W} 58 re f`);
      commands.push("1 1 1 rg");
      text(M, PAGE_H - 25, "RKN ERP", 15, true);
      text(M, PAGE_H - 41, "PLASTIC TRADING", 8, true);
      commands.push("0 0 0 rg");

      text(
        PAGE_W - 220,
        PAGE_H - 25,
        `PERIODE ${period}`,
        9,
        true
      );
      text(
        PAGE_W - 220,
        PAGE_H - 41,
        `HALAMAN ${pageNo}`,
        7,
        false
      );

      y = PAGE_H - 82;
    };

    const ensure = (height: number) => {
      if (y - height < BOTTOM) startPage();
    };

    const summary = () => {
      const items = [
        ["STOCK VALUE", money.format(Number(metrics.stockValueRp || 0))],
        ["PIUTANG", money.format(Number(metrics.receivableRp || 0))],
        ["SALES", money.format(Number(metrics.salesRp || 0))],
        ["GROSS PROFIT", money.format(Number(metrics.grossProfitRp || 0))],
      ];

      ensure(58);
      const gap = 8;
      const w = (PAGE_W - M * 2 - gap * 3) / 4;

      items.forEach(([label, value], index) => {
        const x = M + index * (w + gap);
        rect(x, y - 44, w, 44, "0.96 0.97 0.99");
        text(x + 8, y - 16, label, 6.5, true);
        text(x + 8, y - 33, value, 9, true);
      });

      y -= 58;
    };

    const table = (spec: PdfTable) => {
      if (!spec.rows.length) return;

      const widths = [...spec.widths];
      const total = widths.reduce((a, b) => a + b, 0);
      const available = PAGE_W - M * 2;
      const scale = total > available ? available / total : 1;
      for (let i = 0; i < widths.length; i += 1) {
        widths[i] *= scale;
      }

      const headerH = 20;
      const rowH = 18;

      const drawHeader = () => {
        let x = M;
        spec.headers.forEach((header, index) => {
          const w = widths[index];
          rect(x, y - headerH, w, headerH, "0.88 0.92 0.96");
          text(x + 4, y - 13, header, 6.4, true);
          x += w;
        });
        y -= headerH;
      };

      ensure(50);
      text(M, y, spec.title, 10, true);
      y -= 15;
      drawHeader();

      for (const row of spec.rows) {
        if (y - rowH < BOTTOM) {
          startPage();
          text(M, y, spec.title, 9, true);
          y -= 14;
          drawHeader();
        }

        let x = M;
        row.forEach((cell, index) => {
          const w = widths[index] || 60;
          rect(x, y - rowH, w, rowH);
          const limit = Math.max(4, Math.floor(w / 4.4));
          const raw = ascii(cell);
          const clipped =
            raw.length > limit
              ? raw.slice(0, Math.max(1, limit - 3)) + "..."
              : raw;
          text(x + 4, y - 12, clipped, 6.2, false);
          x += w;
        });
        y -= rowH;
      }

      y -= 16;
    };

    startPage();
    summary();
    tables.forEach(table);

    if (commands.length) pages.push(commands);

    const objects: string[] = [];
    const pageRefs: string[] = [];
    const fontNormal = 3;
    const fontBold = 4;
    let nextObject = 5;

    pages.forEach((page) => {
      const pageObject = nextObject++;
      const contentObject = nextObject++;
      pageRefs.push(`${pageObject} 0 R`);

      const stream = page.join("\n");

      objects[pageObject] =
        `${pageObject} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 ${fontNormal} 0 R /F2 ${fontBold} 0 R >> >> ` +
        `/Contents ${contentObject} 0 R >>\nendobj\n`;

      objects[contentObject] =
        `${contentObject} 0 obj\n` +
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
    });

    objects[1] =
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    objects[2] =
      `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pageRefs.join(
        " "
      )}] >>\nendobj\n`;
    objects[fontNormal] =
      `${fontNormal} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
    objects[fontBold] =
      `${fontBold} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

    const maxObject = objects.length - 1;
    let pdf = "%PDF-1.4\n";
    const offsets = new Array(maxObject + 1).fill(0);

    for (let objectNo = 1; objectNo <= maxObject; objectNo += 1) {
      if (!objects[objectNo]) continue;
      offsets[objectNo] = pdf.length;
      pdf += objects[objectNo];
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${maxObject + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let objectNo = 1; objectNo <= maxObject; objectNo += 1) {
      pdf +=
        String(offsets[objectNo] || 0).padStart(10, "0") +
        " 00000 n \n";
    }

    pdf +=
      `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RKN_PLASTIC_REPORT_${period}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  return (
    <>
      <div className={styles.reportToolbar}>
        <div>
          <strong>Laporan</strong>
          <span>Stok, opname, piutang.</span>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={downloadPdf}
        >
          Download PDF
        </button>
      </div>

      <Panel title="Stock Polymailer">
        <DataTable
          rows={polymailer}
          columns={[
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "ball",
              "Ball",
              (row) =>
                n(
                  Number(row.qtyBase || 0) /
                    Math.max(1, Number(row.unitsPerPack || 1))
                ),
            ],
            ["unitsPerPack", "Isi/Ball", (row) => n(row.unitsPerPack)],
            ["qtyBase", "Total Roll", (row) => n(row.qtyBase)],
            [
              "defaultSellPricePackRp",
              "Harga/Ball",
              (row) =>
                money.format(Number(row.defaultSellPricePackRp || 0)),
            ],
            [
              "stockValueRp",
              "Stock Value",
              (row) => money.format(Number(row.stockValueRp || 0)),
            ],
          ]}
        />
      </Panel>

      <Panel title="Stock Thermal">
        <DataTable
          rows={thermal}
          columns={[
            ["productName", "Produk"],
            [
              "dus",
              "Dus",
              (row) =>
                n(
                  Number(row.qtyBase || 0) /
                    Math.max(1, Number(row.unitsPerPack || 1))
                ),
            ],
            [
              "stack",
              "Stack",
              (row) =>
                n(
                  Number(row.qtyBase || 0) /
                    Math.max(1, Number(row.unitsPerMid || 1))
                ),
            ],
            ["qtyBase", "Lembar", (row) => n(row.qtyBase)],
            [
              "stockValueRp",
              "Stock Value",
              (row) => money.format(Number(row.stockValueRp || 0)),
            ],
          ]}
        />
      </Panel>

      <Panel title="Stock Opname">
        <DataTable
          rows={opnameRows}
          columns={[
            ["dateKey", "Tanggal"],
            ["opnameNo", "No. SO"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "systemQtyBase",
              "System",
              (row) =>
                `${n(row.systemQtyBase)} ${row.baseUnit || ""}`,
            ],
            [
              "physicalQtyBase",
              "Fisik",
              (row) =>
                `${n(row.physicalQtyBase)} ${row.baseUnit || ""}`,
            ],
            [
              "varianceQtyBase",
              "Selisih",
              (row) =>
                `${n(row.varianceQtyBase)} ${row.baseUnit || ""}`,
            ],
            [
              "varianceStatus",
              "Status",
              (row) => varianceStatus(row.varianceQtyBase),
            ],
          ]}
        />
      </Panel>

      <Panel title="Piutang">
        <DataTable
          rows={receivables}
          columns={[
            ["dateKey", "Tanggal"],
            ["invoiceNo", "Invoice"],
            ["customerName", "Customer"],
            [
              "grandTotalRp",
              "Total",
              (row) => money.format(Number(row.grandTotalRp || 0)),
            ],
            [
              "paidRp",
              "Dibayar",
              (row) => money.format(Number(row.paidRp || 0)),
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
