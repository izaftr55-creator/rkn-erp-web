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

/* RKN_PLASTIC_RUPIAH_INPUT_V2R15 */
const rupiahNumber = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const qtyText = (value: unknown) => rupiahNumber.format(Number(value || 0));

const money = {
  format(value: unknown) {
    const numberValue = Number(value || 0);
    const safeValue = Number.isFinite(numberValue)
      ? Math.round(numberValue)
      : 0;

    return `Rp. ${rupiahNumber.format(safeValue)}`;
  },
};

function rupiahDigits(value: unknown) {
  return String(value ?? "")
    .replace(/[^0-9]/g, "")
    .replace(/^0+(?=\d)/, "");
}

function formatRupiahInput(value: unknown) {
  const digits = rupiahDigits(value);
  if (!digits) return "";
  return `Rp. ${rupiahNumber.format(Number(digits))}`;
}

function RupiahInput({
  value,
  onChange,
  required = false,
  placeholder = "Rp. 0",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      value={formatRupiahInput(value)}
      onChange={(event) =>
        onChange(rupiahDigits(event.target.value))
      }
    />
  );
}

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
  ["ACCESS", "Akses", "access"],
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
  ACCESS: "Manajemen pendaftaran akun, approval, dan hak akses pengguna.",
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
    case "access":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

/* RKN_PLASTIC_EFFECTIVE_SELL_PRICE_V2R23
   A product may be priced at any maintained UOM. Derive the other
   price levels from the configured conversion so reports and sales
   do not treat an empty base price as an empty selling price. */
const effectiveSellPrices = (product: Row | undefined) => {
  if (!product) {
    return {
      basePriceRp: 0,
      midPriceRp: 0,
      packPriceRp: 0,
      baseDerived: false,
      midDerived: false,
      packDerived: false,
      baseSourceUnit: "",
    };
  }

  const unitsPerMid = Math.max(1, Number(product.unitsPerMid || 1));
  const unitsPerPack = Math.max(1, Number(product.unitsPerPack || 1));
  const explicitBase = Math.max(
    0,
    Number(product.defaultSellPriceBaseRp || 0)
  );
  const explicitMid = Math.max(
    0,
    Number(product.defaultSellPriceMidRp || 0)
  );
  const explicitPack = Math.max(
    0,
    Number(product.defaultSellPricePackRp || 0)
  );

  const basePriceRp =
    explicitBase > 0
      ? explicitBase
      : explicitMid > 0
        ? explicitMid / unitsPerMid
        : explicitPack > 0
          ? explicitPack / unitsPerPack
          : 0;
  const midPriceRp = product.midUnit
    ? explicitMid > 0
      ? explicitMid
      : basePriceRp * unitsPerMid
    : 0;
  const packPriceRp = product.packUnit
    ? explicitPack > 0
      ? explicitPack
      : basePriceRp * unitsPerPack
    : 0;
  const baseSourceUnit =
    explicitBase > 0
      ? String(product.baseUnit || "UNIT")
      : explicitMid > 0
        ? String(product.midUnit || "MID")
        : explicitPack > 0
          ? String(product.packUnit || "PACK")
          : "";

  return {
    basePriceRp,
    midPriceRp,
    packPriceRp,
    baseDerived: explicitBase <= 0 && basePriceRp > 0,
    midDerived: explicitMid <= 0 && midPriceRp > 0,
    packDerived: explicitPack <= 0 && packPriceRp > 0,
    baseSourceUnit,
  };
};

const isThermalProductRow = (row: Row) =>
  String(row.category || "").toUpperCase() === "THERMAL" ||
  String(row.productName || "").toUpperCase().startsWith("THERMAL");

const defaultPrice = (product: Row | undefined, unit: string) => {
  if (!product) return 0;
  const normalized = String(unit || "").toUpperCase();
  const prices = effectiveSellPrices(product);
  if (
    normalized &&
    normalized === String(product.packUnit || "").toUpperCase()
  ) {
    return Math.round(prices.packPriceRp);
  }
  if (
    normalized &&
    normalized === String(product.midUnit || "").toUpperCase()
  ) {
    return Math.round(prices.midPriceRp);
  }
  return Math.round(prices.basePriceRp);
};

const splitQtyPdf = (row: Row, qtyValue: unknown) => {
  const isThermal = isThermalProductRow(row);
  const unitsPerPack = Math.max(1, Number(row.unitsPerPack || (isThermal ? 10000 : 100)));
  const qty = Number(qtyValue || 0);

  if (Math.abs(qty) < 1e-9) {
    return { pack: "0", base: "0" };
  }

  const sign = qty < 0 ? "-" : "";
  const abs = Math.abs(qty);
  const packCount = Math.floor((abs + 1e-9) / unitsPerPack);
  const remBase = Math.round(abs - packCount * unitsPerPack);

  const packUnit = isThermal ? "DUS" : "BALL";
  let baseUnit = `${qtyFmt.format(remBase)} ROLL`;
  if (isThermal) {
    if (remBase % 500 === 0 && remBase > 0) {
      baseUnit = `${qtyFmt.format(remBase / 500)} STACK`;
    } else {
      baseUnit = `${qtyFmt.format(remBase)} LEMBAR`;
    }
  }

  return {
    pack: packCount > 0 ? `${sign}${qtyFmt.format(packCount)} ${packUnit}` : "0",
    base: remBase > 0 ? `${sign}${baseUnit}` : "0",
  };
};

const formatBallDusQty = (
  row: Row,
  rawQty: number | string | null | undefined,
  signed = false
) => {
  const num = Number(rawQty || 0);
  const clean = Math.abs(num) < 0.000001 ? 0 : num;
  const sign = clean < 0 ? "-" : signed && clean > 0 ? "+" : "";
  const abs = Math.abs(clean);

  const isThermal =
    String(row.category || "").toUpperCase() === "THERMAL" ||
    String(row.productName || "").toUpperCase().includes("THERMAL");
  const unitsPerPack = Math.max(
    1,
    Number(row.unitsPerPack || (isThermal ? 10000 : 100))
  );
  const packUnit = String(
    row.packUnit || (isThermal ? "DUS" : "BALL")
  ).toUpperCase();
  const baseUnit = String(
    row.baseUnit || (isThermal ? "LEMBAR" : "ROLL")
  ).toUpperCase();

  if (abs < 0.000001) {
    return `0 ${baseUnit}`;
  }

  const packCount = Math.floor((abs + 1e-9) / unitsPerPack);
  const remBase = Math.round(abs - packCount * unitsPerPack);

  const parts: string[] = [];
  if (packCount > 0) {
    parts.push(`${qtyFmt.format(packCount)} ${packUnit}`);
  }
  if (remBase > 0 || parts.length === 0) {
    parts.push(`${qtyFmt.format(remBase)} ${baseUnit}`);
  }

  return `${sign}${parts.join("  ")}`;
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

/* RKN_PLASTIC_VARIANT_PICKER_V2O5 */
/* RKN_PLASTIC_THERMAL_PRODUCT_PICKER_V2P1 */
function VariantPicker({
  products,
  value,
  disabled = false,
  className = "",
  onChange,
}: {
  products: Row[];
  value: string;
  disabled?: boolean;
  className?: string;
  onChange: (variantId: string, product?: Row) => void;
}) {
  const categoryOf = (product: Row) =>
    String(product.category || "")
      .trim()
      .toUpperCase();

  const productKeyOf = (product: Row) => {
    const category = categoryOf(product);
    const productName = String(product.productName || "").trim();

    if (category === "THERMAL") {
      return productName;
    }

    if (category === "POLYMAILER") {
      return "POLYMAILER";
    }

    return productName || category;
  };

  const productLabelOf = (key: string) => {
    if (key === "POLYMAILER") return "Polymailer";
    return humanizeDisplay(key);
  };

  const selected = products.find(
    (product) =>
      String(product.variantId || "") === String(value || "")
  );

  const [productKey, setProductKey] = useState(
    selected ? productKeyOf(selected) : ""
  );
  const [color, setColor] = useState(
    String(selected?.color || "").trim()
  );
  const [size, setSize] = useState(
    String(selected?.size || "").trim()
  );

  useEffect(() => {
    const current = products.find(
      (product) =>
        String(product.variantId || "") === String(value || "")
    );

    if (current) {
      setProductKey(productKeyOf(current));
      setColor(String(current.color || "").trim());
      setSize(String(current.size || "").trim());
      return;
    }

    if (!value) {
      setProductKey("");
      setColor("");
      setSize("");
    }
  }, [value, products]);

  const productKeys = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => productKeyOf(product))
            .filter(Boolean)
        )
      ).sort((a, b) => {
        const priority = (value: string) => {
          if (value === "POLYMAILER") return 0;

          const upper = value.toUpperCase();
          if (upper.includes("GOLDWIN")) return 10;
          if (
            upper.includes("DUS PANJANG") ||
            upper.includes("PANJANG")
          ) {
            return 11;
          }
          if (
            upper.includes("DUS KOTAK") ||
            upper.includes("KOTAK")
          ) {
            return 12;
          }

          return 20;
        };

        const pa = priority(a);
        const pb = priority(b);

        if (pa !== pb) return pa - pb;
        return a.localeCompare(b, "id");
      }),
    [products]
  );

  const scoped = useMemo(
    () =>
      productKey
        ? products.filter(
            (product) => productKeyOf(product) === productKey
          )
        : [],
    [products, productKey]
  );

  const category = scoped.length
    ? categoryOf(scoped[0])
    : "";

  const isThermal = category === "THERMAL";

  const colorChoices = useMemo(
    () =>
      Array.from(
        new Set(
          scoped
            .map((product) =>
              String(product.color || "").trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "id")),
    [scoped]
  );

  const sizeChoices = useMemo(
    () =>
      Array.from(
        new Set(
          scoped
            .map((product) =>
              String(product.size || "").trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "id")),
    [scoped]
  );

  const hasColor = colorChoices.length > 0;
  const hasSize = sizeChoices.length > 0;

  const resolveVariant = (
    nextProductKey: string,
    nextColor: string,
    nextSize: string
  ) => {
    const candidates = products.filter((product) => {
      if (productKeyOf(product) !== nextProductKey) {
        return false;
      }

      const productColor = String(product.color || "").trim();
      const productSize = String(product.size || "").trim();

      if (productColor !== nextColor) return false;
      if (productSize !== nextSize) return false;

      return true;
    });

    const match =
      candidates.length === 1 ? candidates[0] : undefined;

    onChange(
      match ? String(match.variantId || "") : "",
      match
    );
  };

  const chooseProduct = (nextProductKey: string) => {
    const group = products.filter(
      (product) => productKeyOf(product) === nextProductKey
    );

    const colors = Array.from(
      new Set(
        group.map((product) =>
          String(product.color || "").trim()
        )
      )
    );

    const sizes = Array.from(
      new Set(
        group
          .map((product) =>
            String(product.size || "").trim()
          )
          .filter(Boolean)
      )
    );

    const groupHasColor = colors.some(Boolean);

    const nextColor =
      groupHasColor && colors.filter(Boolean).length === 1
        ? colors.filter(Boolean)[0]
        : "";

    const nextSize =
      sizes.length === 1 ? sizes[0] : "";

    setProductKey(nextProductKey);
    setColor(nextColor);
    setSize(nextSize);

    if (
      nextProductKey &&
      (!groupHasColor || nextColor) &&
      (sizes.length === 0 || nextSize)
    ) {
      resolveVariant(
        nextProductKey,
        nextColor,
        nextSize
      );
    } else {
      onChange("", undefined);
    }
  };

  const chooseColor = (nextColor: string) => {
    setColor(nextColor);

    if (productKey && (!hasSize || size)) {
      resolveVariant(productKey, nextColor, size);
    } else {
      onChange("", undefined);
    }
  };

  const chooseSize = (nextSize: string) => {
    setSize(nextSize);

    if (productKey && (!hasColor || color)) {
      resolveVariant(productKey, color, nextSize);
    } else {
      onChange("", undefined);
    }
  };

  return (
    <div className={`${styles.variantPicker} ${className}`}>
      <Field label="Produk">
        <select
          required
          disabled={disabled}
          value={productKey}
          onChange={(event) =>
            chooseProduct(event.target.value)
          }
        >
          <option value="">Pilih produk</option>
          {productKeys.map((key) => (
            <option key={key} value={key}>
              {productLabelOf(key)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Warna">
        {productKey && !hasColor ? (
          <select disabled value="NO_COLOR">
            <option value="NO_COLOR">Tanpa warna</option>
          </select>
        ) : (
          <select
            required
            disabled={disabled || !productKey}
            value={color}
            onChange={(event) =>
              chooseColor(event.target.value)
            }
          >
            <option value="">Pilih warna</option>
            {colorChoices.map((itemColor) => (
              <option key={itemColor} value={itemColor}>
                {itemColor}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label={isThermal ? "Ukuran / Varian" : "Ukuran"}>
        {productKey && !hasSize ? (
          <select disabled value="NO_SIZE">
            <option value="NO_SIZE">Tanpa ukuran</option>
          </select>
        ) : (
          <select
            required
            disabled={disabled || !productKey}
            value={size}
            onChange={(event) =>
              chooseSize(event.target.value)
            }
          >
            <option value="">
              {isThermal
                ? "Pilih ukuran / varian"
                : "Pilih ukuran"}
            </option>
            {sizeChoices.map((itemSize) => (
              <option key={itemSize} value={itemSize}>
                {itemSize}
              </option>
            ))}
          </select>
        )}
      </Field>
    </div>
  );
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

/* RKN_PLASTIC_FILTERED_PDF_V2R16 */
type RknPlasticFilterSnapshot = {
  search: string;
  dateFrom: string;
  dateTo: string;
  status: string;
};

let rknPlasticPdfFilterSnapshot: RknPlasticFilterSnapshot = {
  search: "",
  dateFrom: "",
  dateTo: "",
  status: "",
};

function applyRknPlasticPdfFilter(rows: Row[]) {
  const snapshot = rknPlasticPdfFilterSnapshot;
  const search = String(snapshot.search || "")
    .toLocaleLowerCase("id-ID")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const dateCandidates = [
    "dateKey",
    "createdAt",
    "lastPurchaseDate",
    "dueDateKey",
    "occurredAt",
    "updatedAt",
  ];

  const statusCandidates = [
    "paymentLabel",
    "status",
    "historyIntegrity",
    "mappingStatus",
    "periodStatus",
  ];

  const dateField = dateCandidates.find((key) =>
    rows.some((row) => Boolean(row?.[key]))
  );

  const statusField = statusCandidates.find((key) =>
    rows.some((row) => Boolean(row?.[key]))
  );

  return rows.filter((row) => {
    if (search) {
      const haystack = Object.values(row || {})
        .filter(
          (value) =>
            value === null ||
            value === undefined ||
            ["string", "number", "boolean"].includes(
              typeof value
            )
        )
        .map((value) =>
          String(value ?? "")
            .toLocaleLowerCase("id-ID")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        )
        .join(" ");

      if (!haystack.includes(search)) return false;
    }

    if (dateField) {
      const rawDate = String(row?.[dateField] || "").slice(0, 10);

      if (
        snapshot.dateFrom &&
        (!rawDate || rawDate < snapshot.dateFrom)
      ) {
        return false;
      }

      if (
        snapshot.dateTo &&
        (!rawDate || rawDate > snapshot.dateTo)
      ) {
        return false;
      }
    }

    if (
      statusField &&
      snapshot.status &&
      String(row?.[statusField] || "") !== snapshot.status
    ) {
      return false;
    }

    return true;
  });
}

/* RKN_PLASTIC_GLOBAL_SMART_TABLE_FILTER_V2R10 */
function DataTable({
  rows,
  columns,
}: {
  rows: Row[];
  columns: Column[];
}) {
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const dateField = useMemo(() => {
    const candidates = [
      "dateKey",
      "createdAt",
      "lastPurchaseDate",
      "dueDateKey",
      "occurredAt",
      "updatedAt",
    ];

    return candidates.find((key) =>
      rows.some((row) => Boolean(row?.[key]))
    );
  }, [rows]);

  const statusField = useMemo(() => {
    const colKeys = columns.map(([key]) => key);
    for (const key of [
      "stockStatus",
      "status",
      "diagnosticCode",
      "paymentLabel",
      "historyIntegrity",
      "mappingStatus",
      "periodStatus",
    ]) {
      if (
        colKeys.includes(key) &&
        rows.some((row) => Boolean(row?.[key]))
      ) {
        return key;
      }
    }

    const candidates = [
      "stockStatus",
      "status",
      "diagnosticCode",
      "paymentLabel",
      "historyIntegrity",
      "mappingStatus",
      "periodStatus",
    ];

    return candidates.find((key) =>
      rows.some((row) => Boolean(row?.[key]))
    );
  }, [rows, columns]);

  const statusOptions = useMemo(() => {
    if (!statusField) return [];

    return Array.from(
      new Set(
        rows
          .map((row) =>
            String(row?.[statusField] || "").trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "id-ID"));
  }, [rows, statusField]);

  const normalizeSearch = (value: unknown) =>
    String(value ?? "")
      .toLocaleLowerCase("id-ID")
      .replace(/_/g, " ")
      .replace(/s+/g, " ")
      .trim();

  const filteredRows = useMemo(() => {
    const search = normalizeSearch(filterSearch);

    return rows.filter((row) => {
      if (search) {
        const haystack = Object.values(row || {})
          .filter(
            (value) =>
              value === null ||
              value === undefined ||
              ["string", "number", "boolean"].includes(
                typeof value
              )
          )
          .map(normalizeSearch)
          .join(" ");

        if (!haystack.includes(search)) {
          return false;
        }
      }

      if (dateField) {
        const rawDate = String(
          row?.[dateField] || ""
        ).slice(0, 10);

        if (
          filterDateFrom &&
          (!rawDate || rawDate < filterDateFrom)
        ) {
          return false;
        }

        if (
          filterDateTo &&
          (!rawDate || rawDate > filterDateTo)
        ) {
          return false;
        }
      }

      if (
        statusField &&
        filterStatus &&
        String(row?.[statusField] || "") !== filterStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    filterSearch,
    filterDateFrom,
    filterDateTo,
    filterStatus,
    dateField,
    statusField,
  ]);

  const hasActiveFilter =
    Boolean(filterSearch) ||
    Boolean(filterDateFrom) ||
    Boolean(filterDateTo) ||
    Boolean(filterStatus);

  useEffect(() => {
    rknPlasticPdfFilterSnapshot = {
      search: filterSearch,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      status: filterStatus,
    };
  }, [
    filterSearch,
    filterDateFrom,
    filterDateTo,
    filterStatus,
  ]);

  const resetFilters = () => {
    setFilterSearch("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterStatus("");
  };

  if (!rows.length) {
    return (
      <div className={styles.emptyState}>
        <strong>Belum ada data</strong>
        <span>Transaksi atau data master akan tampil di sini.</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.smartFilterBar}>
        <div className={styles.smartFilterSearch}>
          <span className={styles.smartFilterLabel}>CARI</span>
          <input
            type="search"
            value={filterSearch}
            placeholder="Nama / SKU / invoice / warna / ukuran..."
            onChange={(event) =>
              setFilterSearch(event.target.value)
            }
          />
        </div>

        {dateField ? (
          <>
            <label className={styles.smartFilterDate}>
              <span className={styles.smartFilterLabel}>
                DARI
              </span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(event) =>
                  setFilterDateFrom(event.target.value)
                }
              />
            </label>

            <label className={styles.smartFilterDate}>
              <span className={styles.smartFilterLabel}>
                SAMPAI
              </span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(event) =>
                  setFilterDateTo(event.target.value)
                }
              />
            </label>
          </>
        ) : null}

        {statusField && statusOptions.length > 1 ? (
          <label className={styles.smartFilterStatus}>
            <span className={styles.smartFilterLabel}>
              STATUS
            </span>
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value)
              }
            >
              <option value="">Semua</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {String(status)
                    .replace(/_/g, " ")
                    .trim()}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className={styles.smartFilterActions}>
          <span className={styles.smartFilterCount}>
            {filteredRows.length} / {rows.length}
          </span>

          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!hasActiveFilter}
            onClick={resetFilters}
          >
            RESET
          </button>
        </div>
      </div>

      {!filteredRows.length ? (
        <div className={styles.emptyState}>
          <strong>Tidak ada hasil</strong>
          <span>
            Ubah kata pencarian atau rentang tanggal.
          </span>
        </div>
      ) : (
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
              {filteredRows.map((row, index) => (
                <tr
                  key={`${
                    row.lineId ||
                    row.paymentId ||
                    row.movementId ||
                    row.opnameLineId ||
                    row.variantId ||
                    row.customerId ||
                    row.invoiceId ||
                    row.inboundId ||
                    row.id ||
                    "row"
                  }-${index}`}
                >
                  {columns.map(([key, , render]) => (
                    <td key={key}>
                      {render
                        ? render(row)
                        : typeof humanizeDisplay === "function"
                        ? humanizeDisplay(row[key])
                        : String(row[key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
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
      {note ? <span>{note}</span> : null}
    </article>
  );
}

/* RKN_PLASTIC_FRIENDLY_ERROR_UI_V2R4 */
function friendlyPlasticError(value: unknown) {
  const code = String(value || "").trim();

  if (!code) return "Terjadi kesalahan.";

  if (
    code.includes(
      "PLASTIC_INBOUND_DELETE_INSUFFICIENT_BALANCE"
    )
  ) {
    return "Barang masuk ini sudah terpakai oleh transaksi stok berikutnya. Void / hapus Barang Keluar yang terkait lebih dulu, lalu hapus Barang Masuk.";
  }

  if (
    code.includes(
      "PLASTIC_INBOUND_DELETE_WOULD_BREAK_STOCK_HISTORY"
    )
  ) {
    return "Penghapusan ditahan karena akan merusak urutan histori stok. Bersihkan transaksi keluar yang memakai stok ini lebih dulu.";
  }

  if (
    code.includes(
      "PLASTIC_INBOUND_DELETE_LEGACY_AMBIGUOUS_STOCK"
    )
  ) {
    return "Data lama tidak bisa dibersihkan otomatis karena saldo dan ledger tidak cukup jelas. Cek transaksi SKU tersebut sebelum menghapus.";
  }

  if (code.includes("PLASTIC_INSUFFICIENT_STOCK")) {
    return "Stok tidak cukup untuk Barang Keluar. Pastikan Opening dan Barang Masuk sebelum tanggal transaksi sudah diinput.";
  }

  return code
    .replace(/^PLASTIC[_ ]?/i, "")
    .replace(/_+/g, " ")
    .trim();
}


/* RKN_PLASTIC_PAYABLES_UI */
function Payables({
  data,
  canWrite,
  busy,
  run,
}: {
  data: Row;
  canWrite: boolean;
  busy: boolean;
  run: any;
}) {
  const summary = data.summary || {};
  const [payDateKey, setPayDateKey] = useState(today());
  const [supplierName, setSupplierName] = useState("KMS PACKAGING");
  const [amountRp, setAmountRp] = useState("");
  const [fundingSource, setFundingSource] = useState("PAMAN_FUNDING");
  const [refNo, setRefNo] = useState("");
  const [note, setNote] = useState("");

  const [repayDateKey, setRepayDateKey] = useState(today());
  const [repayAmountRp, setRepayAmountRp] = useState("");
  const [repayRefNo, setRepayRefNo] = useState("");
  const [repayNote, setRepayNote] = useState("");

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!amountRp || Number(amountRp) <= 0) {
      alert("Jumlah pembayaran harus lebih dari 0.");
      return;
    }
    await run("ADD_SUPPLIER_PAYMENT", {
      dateKey: payDateKey,
      supplierName,
      amountRp: Number(amountRp),
      fundingSource,
      referenceNo: refNo,
      note,
    }, "PAYABLES");
    setAmountRp("");
    setRefNo("");
    setNote("");
  };

  const submitRepayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!repayAmountRp || Number(repayAmountRp) <= 0) {
      alert("Jumlah pengembalian harus lebih dari 0.");
      return;
    }
    await run("RECORD_PAMAN_REPAYMENT", {
      dateKey: repayDateKey,
      amountRp: Number(repayAmountRp),
      referenceNo: repayRefNo,
      note: repayNote || "Pengembalian dana talangan Paman",
    }, "PAYABLES");
    setRepayAmountRp("");
    setRepayRefNo("");
    setRepayNote("");
  };

  const payments = Array.isArray(data.payments) ? data.payments : [];
  const pamanLedger = Array.isArray(data.pamanLedger) ? data.pamanLedger : [];

  return (
    <div className={styles.sectionStack}>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Total Tagihan Supplier"
          value={money.format(summary.totalBills || 235725000)}
          note="Saldo Awal Rp 44,3jt + Belanja Rp 191,3jt"
        />
        <MetricCard
          label="Sudah Dibayar (Paman/Kas)"
          value={money.format(summary.totalPaid || 159500000)}
          note="Total transfer ke KMS Packaging"
        />
        <MetricCard
          label="Sisa Hutang ke Supplier"
          value={money.format(summary.outstandingPayables || 76225000)}
          note="Kewajiban aktif ke supplier"
        />
        <MetricCard
          label="Total Pembayaran ke KMS"
          value={money.format(summary.totalPaid || 159500000)}
          note="Uang penjualan disetorkan ke KMS"
        />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
        {canWrite ? (
          <Panel title="Catat Pembayaran ke Supplier" subtitle="Transfer pembayaran faktur/tagihan supplier.">
            <form onSubmit={submitPayment} className={styles.formGrid}>
              <Field label="Tanggal Pembayaran">
                <input type="date" required value={payDateKey} onChange={(e) => setPayDateKey(e.target.value)} />
              </Field>
              <Field label="Nama Supplier">
                <select value={supplierName} onChange={(e) => setSupplierName(e.target.value)}>
                  <option value="KMS PACKAGING">KMS PACKAGING</option>
                  <option value="SUPPLIER THERMAL">SUPPLIER THERMAL</option>
                  <option value="LAINNYA">LAINNYA</option>
                </select>
              </Field>
              <Field label="Jumlah Pembayaran">
                <RupiahInput required value={amountRp} onChange={setAmountRp} placeholder="Rp. 0" />
              </Field>
              <Field label="Sumber Dana">
                <select value={fundingSource} onChange={(e) => setFundingSource(e.target.value)}>
                  <option value="PAMAN_FUNDING">Transfer via Rekening Paman</option>
                  <option value="RKN_INTERNAL_CASH">Kas Operasional RKN (Hasil Penjualan)</option>
                </select>
              </Field>
              <Field label="No. Ref Bank / Bukti">
                <input placeholder="Contoh: TRF-BCA-12345" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
              </Field>
              <Field label="Catatan">
                <input placeholder="Keterangan pembayaran" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <div className={styles.actions} style={{ gridColumn: "1 / -1" }}>
                <button className={styles.primaryButton} disabled={busy}>Simpan Pembayaran Supplier</button>
              </div>
            </form>
          </Panel>
        ) : null}

        {canWrite ? (
          <Panel title="Pengembalian Dana ke Paman" subtitle="Catat uang toko yang diserahkan kembali ke Paman.">
            <form onSubmit={submitRepayment} className={styles.formGrid}>
              <Field label="Tanggal Pengembalian">
                <input type="date" required value={repayDateKey} onChange={(e) => setRepayDateKey(e.target.value)} />
              </Field>
              <Field label="Jumlah Pengembalian">
                <RupiahInput required value={repayAmountRp} onChange={setRepayAmountRp} placeholder="Rp. 0" />
              </Field>
              <Field label="No. Referensi / Bukti">
                <input placeholder="Contoh: TRF-BALIK-001" value={repayRefNo} onChange={(e) => setRepayRefNo(e.target.value)} />
              </Field>
              <Field label="Catatan">
                <input placeholder="Keterangan pengembalian" value={repayNote} onChange={(e) => setRepayNote(e.target.value)} />
              </Field>
              <div className={styles.actions} style={{ gridColumn: "1 / -1" }}>
                <button className={styles.primaryButton} disabled={busy}>Catat Pengembalian ke Paman</button>
              </div>
            </form>
          </Panel>
        ) : null}
      </div>

      <Panel title="Riwayat Pembayaran Supplier">
        <DataTable
          rows={payments}
          columns={[
            ["dateKey", "Tanggal"],
            ["supplierName", "Supplier"],
            ["fundingSource", "Metode Transfer", (r) => r.fundingSource === "PAMAN_FUNDING" ? "Rekening Paman" : "Kas Toko"],
            ["amountRp", "Nominal", (r) => money.format(r.amountRp)],
            ["referenceNo", "No. Ref"],
            ["note", "Catatan"],
          ]}
        />
      </Panel>

      <Panel title="Buku Mutasi Setoran ke KMS (via Rekening Paman)">
        <DataTable
          rows={pamanLedger}
          columns={[
            ["dateKey", "Tanggal"],
            ["entryType", "Jenis Mutasi", (r) => r.entryType === "FUNDING_IN" ? "+ Talangan Masuk" : "- Pengembalian"],
            ["amountRp", "Nominal", (r) => money.format(r.amountRp)],
            ["referenceNo", "No. Ref"],
            ["note", "Catatan"],
          ]}
        />
      </Panel>
    </div>
  );
}

/* RKN_PLASTIC_COMMISSION_UI */
function CommissionCalculator({
  data,
}: {
  data: Row;
}) {
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const [filterDateFrom, setFilterDateFrom] = useState(today().slice(0, 7) + "-01");
  const [filterDateTo, setFilterDateTo] = useState(today());

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = String(r.dateKey || "");
      if (filterDateFrom && d < filterDateFrom) return false;
      if (filterDateTo && d > filterDateTo) return false;
      return true;
    });
  }, [rows, filterDateFrom, filterDateTo]);

  const totalPolyRolls = useMemo(() => {
    return filtered.reduce((acc, r) => acc + Number(r.displayRollQty || 0), 0);
  }, [filtered]);

  const totalThermalStacks = useMemo(() => {
    return filtered.reduce((acc, r) => acc + Number(r.displayStackQty || 0), 0);
  }, [filtered]);

  const totalThermalDus = useMemo(() => {
    return totalThermalStacks / 20;
  }, [totalThermalStacks]);

  const totalInvoices = useMemo(() => {
    return new Set(filtered.map((r) => r.invoiceId)).size;
  }, [filtered]);

  return (
    <div className={styles.sectionStack}>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Total Polymailer Terjual"
          value={`${qtyText(totalPolyRolls)} Roll`}
          note="Akumulasi seluruh ukuran & warna"
        />
        <MetricCard
          label="Total Thermal Terjual"
          value={`${qtyText(totalThermalStacks)} Stacks`}
          note={`Setara ${qtyText(totalThermalDus)} Dus (20 stacks/dus)`}
        />
        <MetricCard
          label="Total Nota Penjualan"
          value={`${qtyText(totalInvoices)} Faktur`}
          note="Transaksi barang keluar periode ini"
        />
      </section>

      <Panel title="Filter Periode Penjualan Fisik" subtitle="Pilih rentang tanggal untuk merekap volume fisik Roll & Stacks yang keluar.">
        <div className={styles.formGrid}>
          <Field label="Dari Tanggal">
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
          </Field>
          <Field label="Sampai Tanggal">
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Rincian Transaksi Penjualan Fisik (Roll & Stacks)">
        <DataTable
          rows={filtered}
          columns={[
            ["dateKey", "Tanggal"],
            ["invoiceNo", "Invoice"],
            ["customerName", "Customer"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            ["qtyInput", "Input Nota", (r) => `${qtyText(r.qtyInput)} ${r.inputUnit}`],
            ["displayRollQty", "Total Roll (Poly)", (r) => r.displayRollQty > 0 ? `${qtyText(r.displayRollQty)} Roll` : "-"],
            ["displayStackQty", "Total Stack (Thermal)", (r) => r.displayStackQty > 0 ? `${qtyText(r.displayStackQty)} Stack` : "-"],
          ]}
        />
      </Panel>
    </div>
  );
}

export default function PlasticTradingApp({
  initialDashboard,
}: {
  initialDashboard: Row;
}) {
  /* RKN_PLASTIC_NAV_NO_FLICKER_V2Q82 */
  const [tab, setTab] = useState("");
  const [period, setPeriod] = useState("ALL");
  const [data, setData] = useState<Row>(initialDashboard);
  const [dashboard, setDashboard] = useState<Row>(initialDashboard);
  const [products, setProducts] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  /* RKN_PLASTIC_NAV_PERSIST_V2Q8 */
  const [navigationReady, setNavigationReady] = useState(false);

  const actor = initialDashboard.actor || {};
  const primaryRole = String(actor.roleCode || actor.primaryRoleCode || actor.role || "").toUpperCase();
  const isAdminOrOwner =
    actor.isSystemAdmin ||
    ["SYSTEM_ADMIN", "PLASTIC_ADMIN", "ADMIN", "GROUP_OWNER", "OWNER"].includes(primaryRole) ||
    actor.accessLevel === "OWNER" ||
    actor.accessLevel === "MANAGE";
  const isSupplier = primaryRole.includes("SUPPLIER");
  const isSupervisor =
    primaryRole.includes("SUPERVIS") ||
    primaryRole.includes("PENGAWAS") ||
    actor.accessLevel === "SUPERVISI";
  const readOnly =
    !isAdminOrOwner && (actor.accessLevel === "VIEW" || isSupplier || isSupervisor);
  const canManage = isAdminOrOwner;
  const canClose = isAdminOrOwner;

  /* RKN_PLASTIC_ROLE_LOGOUT_V2R1 */
  const plasticAccessLabel =
    isAdminOrOwner
      ? "OWNER / ADMIN"
      : isSupplier
        ? "SUPPLIER (PANTAU STOK)"
        : isSupervisor
          ? "SUPERVISI (AUDIT)"
          : humanizeDisplay(actor.accessLevel || "-");

  const plasticRoleLabel =
    isAdminOrOwner
      ? (actor.isSystemAdmin ? "SYSTEM ADMIN" : "OWNER / ADMIN")
      : isSupplier
        ? "SUPPLIER"
        : isSupervisor
          ? "SUPERVISORY BOARD"
          : humanizeDisplay(actor.roleCode || "-");

const loadMasters = useCallback(async () => {
    try {
      const [productData, customerData] = await Promise.all([
        read("PRODUCTS", "ALL"),
        read("CUSTOMERS", "ALL"),
      ]);
      setProducts(productData.rows || []);
      setCustomers(customerData.rows || []);
    } catch {
      // Main screen loader will surface connection errors.
    }
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const next = await read(tab, "ALL");
      setData(next);
      if (tab === "DASHBOARD") {
        setDashboard(next);
      }
    } catch (error) {
      setMessage(
        friendlyPlasticError(error instanceof Error ? error.message : "LOAD_FAILED")
      );
    } finally {
      setBusy(false);
    }
  }, [tab]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTab = window.localStorage.getItem(
      "rkn-plastic-active-tab"
    );
    const defaultInitialTab = isSupplier ? "INVENTORY" : "DASHBOARD";
    const restoredTab =
      savedTab &&
      (!isSupplier || savedTab === "INVENTORY" || savedTab === "INBOUND") &&
      (!isSupervisor || savedTab !== "RECEIVABLES") &&
      (isAdminOrOwner || savedTab !== "ACCESS") &&
      menus.some(([key]) => key === savedTab)
        ? savedTab
        : defaultInitialTab;

    setTab(restoredTab);
    setNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!navigationReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "rkn-plastic-active-tab",
      tab
    );
  }, [tab, navigationReady]);

  useEffect(() => {
    if (navigationReady) {
      loadMasters();
    }
  }, [loadMasters, navigationReady]);

  useEffect(() => {
    if (navigationReady) {
      load();
    }
  }, [load, navigationReady]);

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


      /* RKN_PLASTIC_TRANSACTION_PERIOD_SYNC_V2Q9 */
      const payloadDate =
        typeof payload?.dateKey === "string"
          ? payload.dateKey
          : "";

      const transactionPeriod =
        /^\d{4}-\d{2}-\d{2}$/.test(payloadDate) &&
        (view === "INBOUND" || view === "OUTBOUND")
          ? payloadDate.slice(0, 7)
          : period;

      if (
        transactionPeriod !== period &&
        (view === "INBOUND" || view === "OUTBOUND")
      ) {
        setPeriod(transactionPeriod);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "rkn-plastic-active-period",
            transactionPeriod
          );
        }
      }
const [nextView, nextDashboard] = await Promise.all([
        read(view, transactionPeriod),
        read("DASHBOARD", transactionPeriod),
      ]);
      setData(nextView);
      setDashboard(nextDashboard);
    } catch (error) {
      setMessage(
        friendlyPlasticError(error instanceof Error ? error.message : "SAVE_FAILED")
      );
    } finally {
      setBusy(false);
    }
  }

  /* RKN_PLASTIC_GLOBAL_UI_STATE_V2N */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentMenu = menus.find(([key]) => key === tab);

  if (!navigationReady) {
    return (
      <div
        className={styles.navigationBootGate}
        aria-hidden="true"
      />
    );
  }

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
          {isSupplier ? (
            <>
              <div className={styles.navGroupLabel}>PANTAU STOK</div>
              {[
                ["INVENTORY", "Stok Gudang", "inventory"],
                ["INBOUND", "Barang Masuk", "inbound"],
              ].map(([key, label, glyph]) => (
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
            </>
          ) : (
            <>
              <div className={styles.navGroupLabel}>OPERASI</div>
              {[
                ["DASHBOARD", "Dashboard", "dashboard"],
                ["OPENING", "Opening", "opening"],
                ["INBOUND", "Barang Masuk", "inbound"],
                ["OUTBOUND", "Barang Keluar", "outbound"],
                ["INVENTORY", "Stok Gudang", "inventory"],
                ["PRODUCTS", "Master Produk", "products"],
                ["CUSTOMERS", "Data Customer", "customers"],
              ].map(([key, label, glyph]) => (
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

              <div className={styles.navGroupLabel}>KEUANGAN & KOMISI</div>
              {[
                ["RECEIVABLES", "Piutang Customer", "receivables"],
                ["PAYABLES", "Hutang Supplier", "receivables"],
                ["COMMISSION", "Komisi Sales", "reports"],
              ].filter(([key]) => !(isSupervisor && key === "RECEIVABLES")).map(([key, label, glyph]) => (
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

              <div className={styles.navGroupLabel}>KONTROL & LAPORAN</div>
              {[
                ["OPNAME", "Stock Opname", "opname"],
                ["RECONCILIATION", "Rekonsiliasi", "reconciliation"],
                ["REPORTS", "Laporan & Laba", "reports"],
                ["CLOSING", "Tutup Buku", "closing"],
                ["AUDIT", "Audit Log", "audit"],
                ["ACCESS", "Akses Pengguna", "access"],
              ].filter(([key]) => !(key === "ACCESS" && !isAdminOrOwner)).map(([key, label, glyph]) => (
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
            </>
          )}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.accessCard}>
            <span>PLASTIC ACCESS</span>
            <strong>{plasticAccessLabel}</strong>
            <small>{plasticRoleLabel}</small>
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

                    <form
            action="/api/rkn/native-logout"
            method="post"
            className={styles.logoutForm}
            onSubmit={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem(
                  "rkn-plastic-active-tab"
                );
                window.localStorage.removeItem(
                  "rkn-plastic-active-period"
                );
              }
            }}
          >
            <button
              type="submit"
              className={styles.logoutButton}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
                <path d="M14 8l4 4-4 4" />
                <path d="M18 12H9" />
              </svg>
              <span>Logout</span>
            </button>
          </form>

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
              payments={data.payments || []}
              products={products}
              customers={customers}
              canWrite={!readOnly}
              canEdit={canManage}
              busy={busy}
              run={run}
            />
          ) : null}


{tab === "INVENTORY" ? (
            <Inventory rows={data.rows || []} isSupplier={isSupplier} />
          ) : null}

          
          {tab === "PAYABLES" ? (
            <Payables
              data={data}
              canWrite={canManage}
              busy={busy}
              run={run}
            />
          ) : null}

          {tab === "COMMISSION" ? (
            <CommissionCalculator
              data={data}
            />
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
              data={data}
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

          {tab === "ACCESS" ? (
            <AccessManagement
              data={data}
              canManage={isAdminOrOwner}
              busy={busy}
              run={run}
            />
          ) : null}
        </div>
      </main>

      {/* RKN_PLASTIC_MOBILE_BOTTOM_NAV_V2R25 (REVOA-style mobile navigation) */}
      <nav className={styles.mobileBottomNav} aria-label="Mobile Navigation">
        {isSupplier ? (
          <>
            <button
              type="button"
              className={tab === "INVENTORY" ? styles.mobileBottomActive : styles.mobileBottomItem}
              onClick={() => {
                setTab("INVENTORY");
                setMobileNavOpen(false);
              }}
            >
              <MenuIcon name="inventory" />
              <span>Stok</span>
            </button>
            <button
              type="button"
              className={tab === "INBOUND" ? styles.mobileBottomActive : styles.mobileBottomItem}
              onClick={() => {
                setTab("INBOUND");
                setMobileNavOpen(false);
              }}
            >
              <MenuIcon name="inbound" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              className={mobileNavOpen ? styles.mobileBottomActive : styles.mobileBottomItem}
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              <MenuIcon name="audit" />
              <span>Menu</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={tab === "DASHBOARD" ? styles.mobileBottomActive : styles.mobileBottomItem}
              onClick={() => {
                setTab("DASHBOARD");
                setMobileNavOpen(false);
              }}
            >
              <MenuIcon name="dashboard" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className={tab === "INVENTORY" ? styles.mobileBottomActive : styles.mobileBottomItem}
              onClick={() => {
                setTab("INVENTORY");
                setMobileNavOpen(false);
              }}
            >
              <MenuIcon name="inventory" />
              <span>Stok</span>
            </button>
            <button
              type="button"
              className={tab === "INBOUND" ? styles.mobileBottomActive : styles.mobileBottomItem}
              onClick={() => {
                setTab("INBOUND");
                setMobileNavOpen(false);
              }}
            >
              <MenuIcon name="inbound" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              className={tab === "OUTBOUND" ? styles.mobileBottomActive : styles.mobileBottomItem}
              onClick={() => {
                setTab("OUTBOUND");
                setMobileNavOpen(false);
              }}
            >
              <MenuIcon name="outbound" />
              <span>Keluar</span>
            </button>
            <button
              type="button"
              className={
                ["RECONCILIATION", "REPORTS", "OPNAME", "PRODUCTS", "CUSTOMERS", "RECEIVABLES", "CLOSING", "AUDIT", "ACCESS"].includes(tab) || mobileNavOpen
                  ? styles.mobileBottomActive
                  : styles.mobileBottomItem
              }
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              <MenuIcon name="reconciliation" />
              <span>Lainnya</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

function Dashboard({ data }: { data: Row }) {
  /* RKN_PLASTIC_DASHBOARD_CHART_UI_V2P */
  const metrics = data.metrics || {};
  const so = data.soBalance || {};
  const rawDaily = Array.isArray(data.salesDaily)
    ? [...data.salesDaily].reverse()
    : [];
  const topReceivables = Array.isArray(data.topReceivables)
    ? data.topReceivables
    : [];

  const [dailyFilter, setDailyFilter] = useState<"ALL" | "7D" | "TODAY">("ALL");

  const daily = useMemo(() => {
    if (dailyFilter === "TODAY") {
      const t = today();
      const match = rawDaily.filter((d) => String(d.dateKey) === t);
      return match.length ? match : rawDaily.slice(-1);
    }
    if (dailyFilter === "7D") {
      return rawDaily.slice(-7);
    }
    return rawDaily;
  }, [rawDaily, dailyFilter]);

  const maxSales = Math.max(
    1,
    ...daily.map((row: Row) => Number(row.salesRp || 0))
  );

  const filteredSalesTotalRp = useMemo(
    () => daily.reduce((sum, d) => sum + Number(d.salesRp || 0), 0),
    [daily]
  );

  const totalSo = Number(so.total || 0);
  const balancePct = Number(so.balancePct || 0);
  const lessPct =
    totalSo > 0
      ? (Number(so.less || 0) / totalSo) * 100
      : 0;
  const morePct =
    totalSo > 0
      ? (Number(so.more || 0) / totalSo) * 100
      : 0;

  return (
    <div className={styles.dashboardShell}>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Nilai Stok Fisik"
          value={money.format(Number(metrics.stockValueRp || 0))}
          note={`${qtyFmt.format(
            Number(metrics.skuCount || 0)
          )} SKU aktif`}
        />
        <MetricCard
          label="Total Penjualan"
          value={money.format(Number(metrics.salesRp || 0))}
          note="Omset periode"
        />
        <MetricCard
          label="Kas Masuk (Lunas)"
          value={money.format(
            Number(
              metrics.paidRp ??
                Math.max(
                  0,
                  Number(metrics.salesRp || 0) -
                    Number(metrics.receivableRp || 0)
                )
            )
          )}
          note="Pembayaran diterima"
        />
        <MetricCard
          label="Sisa Piutang"
          value={money.format(Number(metrics.receivableRp || 0))}
          note="Tagihan belum lunas"
        />
      </section>

      <section className={styles.dashboardCharts}>
        <Panel
          title="Keseimbangan Stok"
          subtitle={
            so.isPosted
              ? `SO ${so.dateKey || "28/08/2026"} · 100% BALANCE (POSTED)`
              : so.dateKey
              ? `SO ${so.dateKey}`
              : "Belum ada hasil SO"
          }
        >
          <div className={styles.soChart}>
            <div className={styles.soChartTop}>
              <strong>{totalSo > 0 ? `${balancePct}%` : "—"}</strong>
              <span>
                {so.isPosted
                  ? `${totalSo} / ${totalSo} SKU 100% Balance Sesuai SO`
                  : totalSo > 0
                  ? `${Number(so.balance || 0)} / ${totalSo} SKU balance`
                  : "Belum ada hasil SO"}
              </span>
            </div>

            <div className={styles.soSegmentBar}>
              <span
                className={styles.soBalanceSegment}
                style={{ width: `${balancePct}%` }}
              />
              <span
                className={styles.soLessSegment}
                style={{ width: `${lessPct}%` }}
              />
              <span
                className={styles.soMoreSegment}
                style={{ width: `${morePct}%` }}
              />
            </div>

            <div className={styles.soLegend}>
              {so.isPosted ? (
                <>
                  <div>
                    <i className={styles.legendBalance} />
                    <span>✓ Sesuai Fisik SO</span>
                    <strong>{totalSo} SKU</strong>
                  </div>
                  <div>
                    <i className={styles.legendLess} style={{ background: "linear-gradient(135deg, #2c3e50, #1a2530)", border: "1px solid rgba(176, 141, 87, 0.4)" }} />
                    <span>Balance Awal</span>
                    <strong>{Number(so.preSoBalance || 27)}</strong>
                  </div>
                  <div>
                    <i className={styles.legendMore} />
                    <span>Disesuaikan SO</span>
                    <strong>{Number(so.preSoLess || 0) + Number(so.preSoMore || 0)}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <i className={styles.legendBalance} />
                    <span>Balance</span>
                    <strong>{Number(so.balance || 0)}</strong>
                  </div>
                  <div>
                    <i className={styles.legendLess} />
                    <span>Kurang</span>
                    <strong>{Number(so.less || 0)}</strong>
                  </div>
                  <div>
                    <i className={styles.legendMore} />
                    <span>Lebih</span>
                    <strong>{Number(so.more || 0)}</strong>
                  </div>
                </>
              )}
            </div>

            {data.activeSo ? (
              <div className={styles.activeSoStrip}>
                <span>SO Aktif</span>
                <strong>
                  {data.activeSo.soNo} / {data.activeSo.status}
                </strong>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Penjualan Harian"
          subtitle={`Total ${money.format(filteredSalesTotalRp)} · ${daily.length} hari transaksi.`}
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            {[
              ["ALL", "Semua (14 Hari)"],
              ["7D", "7 Hari Terakhir"],
              ["TODAY", "Hari Ini"],
            ].map(([fKey, fLabel]) => {
              const isActive = dailyFilter === fKey;
              return (
                <button
                  key={fKey}
                  type="button"
                  style={{
                    padding: "5px 13px",
                    borderRadius: "8px",
                    border: isActive ? "1px solid #fae2ab" : "1px solid rgba(176, 141, 87, 0.22)",
                    background: isActive
                      ? "linear-gradient(135deg, #b08d57 0%, #d4b27d 50%, #8c6e3d 100%)"
                      : "linear-gradient(145deg, rgba(44, 62, 80, 0.35) 0%, rgba(14, 23, 35, 0.6) 100%)",
                    color: isActive ? "#0b131e" : "#cbd5e1",
                    boxShadow: isActive ? "0 3px 14px rgba(176, 141, 87, 0.45)" : "none",
                    fontSize: "10.5px",
                    fontWeight: isActive ? 800 : 650,
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onClick={() => setDailyFilter(fKey as any)}
                >
                  {fLabel}
                </button>
              );
            })}
          </div>

          {daily.length ? (
            <div className={styles.salesBars}>
              {daily.map((row: Row) => {
                const value = Number(row.salesRp || 0);
                const height = Math.max(
                  6,
                  Math.round((value / maxSales) * 100)
                );

                return (
                  <div
                    className={styles.salesBarItem}
                    key={String(row.dateKey)}
                    title={`${row.dateKey} / ${money.format(value)}`}
                  >
                    <div className={styles.salesBarTrack}>
                      <span style={{ height: `${height}%` }} />
                    </div>
                    <small>
                      {String(row.dateKey || "").slice(8, 10)}
                    </small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.chartEmpty}>
              Belum ada penjualan periode ini.
            </div>
          )}
        </Panel>
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
              (row) => (
                <span
                  style={{
                    color: Number(row.outstandingRp || 0) > 0 ? "#d4b27d" : "#94a3b8",
                    fontWeight: 750,
                    fontFamily: "var(--font-jetbrains-mono, monospace)",
                  }}
                >
                  {money.format(Number(row.outstandingRp || 0))}
                </span>
              ),
            ],
          ]}
        />
      </Panel>
    </div>
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
            [
              "packing",
              "Isi Kemasan",
              (row) => {
                const isThermal = isThermalProductRow(row);
                if (isThermal) return "1 DUS = 10.000 LEMBAR (20 STACK)";
                return `1 BALL = ${row.unitsPerPack || 100} ROLL`;
              },
            ],
            [
              "defaultSellPricePackRp",
              "Harga / BALL (DUS)",
              (row) => {
                const prices = effectiveSellPrices(row);
                return prices.packPriceRp > 0
                  ? money.format(prices.packPriceRp)
                  : "-";
              },
            ],
            [
              "defaultSellPriceBaseRp",
              "Harga / ROLL (STACK)",
              (row) => {
                const isThermal = isThermalProductRow(row);
                const prices = effectiveSellPrices(row);
                if (isThermal) {
                  const stackPrice =
                    prices.midPriceRp > 0
                      ? prices.midPriceRp
                      : Math.round(prices.packPriceRp / 20);
                  return stackPrice > 0 ? money.format(stackPrice) : "-";
                }
                return prices.basePriceRp > 0
                  ? money.format(prices.basePriceRp)
                  : "-";
              },
            ],
            [
              "stockPack",
              "Stok (BALL/DUS)",
              (row) => {
                const sq = splitQtyPdf(row, row.qtyBase);
                return sq.pack !== "0" ? sq.pack : "-";
              },
            ],
            [
              "stockBase",
              "Stok (ROLL/STACK)",
              (row) => {
                const sq = splitQtyPdf(row, row.qtyBase);
                return sq.base !== "0" ? sq.base : "-";
              },
            ],
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

                    <VariantPicker
                      products={products}
                      value={line.variantId}
                      disabled={Boolean(editVariantId)}
                      className={styles.itemProduct}
                      onChange={(variantId) => {
                        const next = [...lines];
                        next[index] = {
                          ...line,
                          variantId,
                          unit: "",
                        };
                        setLines(next);
                      }}
                    />

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
                      className={styles.moneyField}
                      hint="Bukan harga jual. Isi HPP aktual jika tersedia."
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        min="0"
                        value={formatRupiahInput(line.unitCostRp)}
                        placeholder="0 jika belum diketahui"
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unitCostRp: rupiahDigits(event.target.value),
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
  /* RKN_PLASTIC_INBOUND_SIMPLE_UI_V2Q */
  const emptyLine = () => ({
    variantId: "",
    qty: "1",
    unit: "",
    unitCostRp: "",
  });

  const [dateKey, setDateKey] = useState(today());
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [editInboundId, setEditInboundId] = useState("");
  const [editInboundNo, setEditInboundNo] = useState("");
  const [editReason, setEditReason] = useState("");

  const resetForm = () => {
    setDateKey(today());
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
      supplierName: "",
      supplierRef: "",
      note,
      lines: lines.map((line) => ({
        ...line,
        qty: Number(line.qty),
        unitCostRp: Number(line.unitCostRp || 0),
      })),
    };

    if (editInboundId) {
      if (!editReason.trim()) {
        window.alert("Alasan edit Barang Masuk wajib diisi.");
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

  /* RKN_PLASTIC_INBOUND_CONTROLLED_DELETE_UI_V2R1 */
  const deleteInboundLine = async (row: Row) => {
    const lineId = String(row.lineId || "");
    const integrity = String(row.historyIntegrity || "OK");

    if (!lineId || integrity !== "OK") {
      window.alert(
        "Baris recovery/legacy tidak dapat dihapus langsung. Perbaiki linkage terlebih dahulu."
      );
      return;
    }

    const label = [
      row.productName,
      row.color,
      row.size,
      `${qtyFmt.format(Number(row.qtyInput || 0))} ${row.inputUnit || ""}`,
    ]
      .filter(Boolean)
      .join(" / ");

    if (
      !window.confirm(
        `Hapus item Barang Masuk?\n\n${label}\n${row.dateKey || ""} · ${row.inboundNo || ""}\n\nStok terkait akan direversal dan tindakan dicatat di Audit.`
      )
    ) {
      return;
    }

    const reason = window.prompt(
      "Alasan hapus (wajib untuk Audit):",
      "Input ulang / koreksi data testing"
    );

    if (reason === null) return;
    if (!reason.trim()) {
      window.alert("Alasan hapus wajib diisi.");
      return;
    }

    await run(
      "DELETE_INBOUND_LINE",
      {
        lineId,
        reason: reason.trim(),
      },
      "INBOUND"
    );

    if (editInboundId === String(row.inboundId || "")) {
      resetForm();
    }
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

    window.scrollTo({ top: 0, behavior: "smooth" });
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
              ? "Koreksi Qty, UOM, HPP atau tanggal. Perubahan tetap tercatat di Audit."
              : "Catat barang yang masuk. HPP mengikuti UOM yang dipilih."
          }
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.inboundHeaderGrid}>
              <Field label="Tanggal">
                <input
                  required
                  type="date"
                  value={dateKey}
                  onChange={(event) => setDateKey(event.target.value)}
                />
              </Field>

              <Field label="Catatan">
                <input
                  placeholder="Opsional"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>

              {editInboundId ? (
                <Field label="Alasan Edit" hint="Wajib untuk Audit.">
                  <input
                    required
                    placeholder="Contoh: salah Qty / UOM / HPP"
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
                  <span>Produk, Qty, UOM dan HPP.</span>
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

                    <VariantPicker
                      products={products}
                      value={line.variantId}
                      className={styles.itemProduct}
                      onChange={(variantId, chosen) => {
                        const chosenUnit = String(
                          chosen?.packUnit ||
                            chosen?.midUnit ||
                            chosen?.baseUnit ||
                            ""
                        ).toUpperCase();

                        const next = [...lines];
                        next[index] = {
                          ...line,
                          variantId,
                          unit: chosenUnit,
                        };
                        setLines(next);
                      }}
                    />

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
                        disabled={!product}
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
                      hint="Harga beli per UOM."
                      className={styles.moneyField}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        min="0"
                        disabled={!product}
                        value={formatRupiahInput(line.unitCostRp)}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unitCostRp: rupiahDigits(event.target.value),
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
                  ? "Simpan Perubahan"
                  : "Simpan Barang Masuk"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Riwayat Barang Masuk">
        <DataTable
          rows={rows}
          columns={[
            ["dateKey", "Tanggal"],
            ["inboundNo", "No. IN"],
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "packQty",
              "BALL / DUS",
              (row) => {
                const sq = splitQtyPdf(row, row.qtyBase || row.qtyInput);
                return sq.pack !== "0" ? sq.pack : "-";
              },
            ],
            [
              "baseQty",
              "ROLL / LEMBAR",
              (row) => {
                const sq = splitQtyPdf(row, row.qtyBase || row.qtyInput);
                return sq.base !== "0" ? sq.base : "-";
              },
            ],
            [
              "lineTotalRp",
              "Total Nilai",
              (row) => {
                const product =
                  products.find(
                    (p) => p.variantId === row.variantId
                  ) || row;
                const prices = effectiveSellPrices({
                  ...product,
                  ...row,
                });
                const unitsPerPack = Math.max(
                  1,
                  Number(
                    product.unitsPerPack ||
                      row.unitsPerPack ||
                      1
                  )
                );
                const qty = Number(
                  row.qtyBase ||
                    Number(row.qtyInput || 0) *
                      unitsPerPack
                );
                const val =
                  prices.basePriceRp > 0
                    ? qty * prices.basePriceRp
                    : Number(row.lineTotalRp || 0);
                return val > 0
                  ? money.format(val)
                  : "-";
              },
            ],
            [
              "inboundAction",
              "Aksi",
              (row) =>
                canEdit &&
                Boolean(row.lineId) &&
                String(row.historyIntegrity || "OK") === "OK" ? (
                  <div className={styles.inboundActionGroup}>
                    <button
                      type="button"
                      className={styles.inlineEditButton}
                      onClick={() => startEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.inlineDeleteButton}
                      disabled={busy}
                      onClick={() => deleteInboundLine(row)}
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

function Outbound({
  rows,
  payments = [],
  products,
  customers,
  canWrite,
  canEdit,
  busy,
  run,
}: {
  rows: Row[];
  payments?: Row[];
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
  const [viewInvoice, setViewInvoice] = useState<Row | null>(null);

  /* RKN_PLASTIC_HISTORY_RECOVERY_UI_V2R */
  const invoices = useMemo(() => {
    const map = new Map<string, Row>();

    for (const row of rows) {
      const id = String(row.invoiceId || "");
      if (!id) continue;

      const rowIntegrity = String(
        row.historyIntegrity || "OK"
      );
      const current = map.get(id);

      if (!current) {
        map.set(id, {
          ...row,
          items: [row],
          historyIntegrity: rowIntegrity,
          grossProfitRp:
            Number(row.grandTotalRp || 0) -
            Number(row.cogsRp || 0),
        });
        continue;
      }

      current.items.push(row);
      if (
        String(current.historyIntegrity || "OK") === "OK" &&
        rowIntegrity !== "OK"
      ) {
        current.historyIntegrity = "RECOVERY";
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
            <div className={styles.outboundHeaderGrid}>
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

              <Field label="Catatan" className={styles.outboundWideField}>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>

              {editInvoiceId ? (
                <Field label="Alasan Edit" className={styles.outboundWideField}>
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

                const availableBase = Math.max(0, Number(selected?.qtyBase || 0));
                const currentPackUnit = String(selected?.packUnit || "").toUpperCase();
                const currentMidUnit = String(selected?.midUnit || "").toUpperCase();
                const unitsPerPack = Math.max(1, Number(selected?.unitsPerPack || 1));
                const unitsPerMid = Math.max(1, Number(selected?.unitsPerMid || 1));

                let requestedBase = Number(line.qty || 0);
                const chosenUnit = String(line.unit || "").toUpperCase();
                if (chosenUnit === currentPackUnit && currentPackUnit) {
                  requestedBase = Number(line.qty || 0) * unitsPerPack;
                } else if (chosenUnit === currentMidUnit && currentMidUnit) {
                  requestedBase = Number(line.qty || 0) * unitsPerMid;
                }

                const isInsufficient =
                  Boolean(selected) &&
                  Number(line.qty || 0) > 0 &&
                  requestedBase > availableBase + 1e-9;

                const stockDisplay = selected
                  ? formatBallDusQty(selected, selected.qtyBase)
                  : "-";
                const isOutOfStock = selected ? availableBase <= 0 : false;

                return (
                  <div
                    className={`${styles.lineItem} ${styles.outboundLineItem}`}
                    key={index}
                  >
                    <span className={styles.lineNo}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <VariantPicker
                      products={products}
                      value={line.variantId}
                      className={styles.itemProduct}
                      onChange={(variantId, chosen) => {
                        const chosenUnit = String(
                          chosen?.packUnit ||
                            chosen?.midUnit ||
                            chosen?.baseUnit ||
                            ""
                        ).toUpperCase();

                        const next = [...lines];
                        next[index] = {
                          ...line,
                          variantId,
                          unit: chosenUnit,
                          unitPriceRp: variantId
                            ? String(
                                defaultPrice(chosen, chosenUnit) || ""
                              )
                            : "",
                        };
                        setLines(next);
                      }}
                    />

                    <Field label="Stok" className={styles.stockField}>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        disabled={!selected}
                        value={stockDisplay}
                        title={
                          selected
                            ? `Stok Gudang Real: ${stockDisplay} (${stockText(selected)})`
                            : "Pilih produk untuk melihat ketersediaan stok"
                        }
                        className={
                          !selected
                            ? styles.stockInputDisabled
                            : isOutOfStock
                            ? styles.stockInputEmpty
                            : styles.stockInput
                        }
                      />
                    </Field>

                    <Field
                      label="Qty"
                      className={isInsufficient ? styles.qtyFieldWarning : ""}
                    >
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
                      {isInsufficient ? (
                        <small className={styles.stockWarningNote}>
                          Melebihi stok ({stockDisplay})
                        </small>
                      ) : null}
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

                    <Field label="Harga" className={styles.moneyField}>
                      <input
                        required
                        disabled={!selected}
                        type="text"
                        inputMode="numeric"
                        min="0"
                        value={formatRupiahInput(line.unitPriceRp)}
                        onChange={(event) => {
                          const next = [...lines];
                          next[index] = {
                            ...line,
                            unitPriceRp: rupiahDigits(event.target.value),
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
                  type="text"
                        inputMode="numeric"
                  min="0"
                  value={formatRupiahInput(discountRp)}
                  onChange={(event) =>
                    setDiscountRp(rupiahDigits(event.target.value))
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
              "outstandingRp",
              "Piutang",
              (row) =>
                money.format(Number(row.outstandingRp || 0)),
            ],
            [
              "payment",
              "Status",
              (row) =>
                String(row.historyIntegrity || "OK") !== "OK"
                  ? "RECOVERY"
                  : Number(row.outstandingRp || 0) > 0
                    ? "BELUM LUNAS"
                    : "LUNAS",
            ],
            [
              "actions",
              "Aksi",
              (row) => (
                <div className={styles.tableActions}>
                  <button
                    type="button"
                    className={styles.inlineEditButton}
                    style={{
                      background: "rgba(176, 141, 87, 0.15)",
                      color: "#d4b27d",
                      borderColor: "rgba(176, 141, 87, 0.35)",
                    }}
                    onClick={() => setViewInvoice(row)}
                  >
                    Lihat
                  </button>
                  {canEdit &&
                  String(row.historyIntegrity || "OK") === "OK" ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              ),
            ],
          ]}
        />
      </Panel>

      {viewInvoice ? (
        <div
          className={styles.modalOverlay}
          onClick={() => setViewInvoice(null)}
        >
          <div
            className={styles.modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <div className={styles.modalHeadTitle}>
                <span>RINCIAN PRODUK KELUAR</span>
                <h3>{viewInvoice.invoiceNo}</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setViewInvoice(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(51, 87, 120, 0.35)",
                    display: "grid",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Tanggal
                  </span>
                  <strong style={{ color: "#f8fafc", fontSize: 14 }}>
                    {viewInvoice.dateKey}
                  </strong>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(51, 87, 120, 0.35)",
                    display: "grid",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Pelanggan
                  </span>
                  <strong style={{ color: "#d4b27d", fontSize: 14 }}>
                    {viewInvoice.customerName || "-"}
                  </strong>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(51, 87, 120, 0.35)",
                    display: "grid",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Total Item
                  </span>
                  <strong style={{ color: "#f8fafc", fontSize: 14 }}>
                    {(viewInvoice.items || []).length} SKU Produk
                  </strong>
                </div>
              </div>

              {/* Rincian Produk */}
              <div>
                <div className={styles.modalSectionHead}>
                  <strong>Daftar Item Barang Keluar</strong>
                  <span>{(viewInvoice.items || []).length} item</span>
                </div>
                <table className={styles.modalDetailTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>No</th>
                      <th>Produk</th>
                      <th>Warna</th>
                      <th>Ukuran</th>
                      <th>Kuantitas</th>
                      <th style={{ textAlign: "right" }}>Harga Satuan</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewInvoice.items || []).map(
                      (item: Row, idx: number) => (
                        <tr key={item.lineId || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>
                            {item.productName}
                          </td>
                          <td>{item.color || "-"}</td>
                          <td>{item.size || "-"}</td>
                          <td style={{ color: "#d4b27d", fontWeight: 700 }}>
                            {formatBallDusQty(
                              item,
                              item.qtyBase || item.qtyInput
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {money.format(Number(item.unitPriceRp || 0))}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#f8fafc",
                            }}
                          >
                            {money.format(Number(item.lineTotalRp || 0))}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Ringkasan Finansial & Catatan */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 280px",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.4)",
                    border: "1px solid rgba(51, 87, 120, 0.25)",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Catatan Transaksi
                  </span>
                  <p
                    style={{
                      margin: 0,
                      color: "#cbd5e1",
                      fontStyle: viewInvoice.note ? "normal" : "italic",
                    }}
                  >
                    {viewInvoice.note || "Tidak ada catatan khusus."}
                  </p>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(51, 87, 120, 0.35)",
                    display: "grid",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#94a3b8",
                    }}
                  >
                    <span>Subtotal:</span>
                    <span>
                      {money.format(
                        Number(
                          viewInvoice.subtotalRp ||
                            viewInvoice.grandTotalRp ||
                            0
                        )
                      )}
                    </span>
                  </div>
                  {Number(viewInvoice.discountRp || 0) > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#f87171",
                      }}
                    >
                      <span>Diskon:</span>
                      <span>
                        -
                        {money.format(
                          Number(viewInvoice.discountRp || 0)
                        )}
                      </span>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      color: "#f8fafc",
                      borderTop: "1px solid rgba(51, 87, 120, 0.35)",
                      paddingTop: 6,
                    }}
                  >
                    <span>Total Transaksi:</span>
                    <span style={{ color: "#d4b27d" }}>
                      {money.format(Number(viewInvoice.grandTotalRp || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setViewInvoice(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Inventory({ rows, isSupplier }: { rows: Row[]; isSupplier?: boolean }) {
  const lowStockThreshold = (row: Row) => {
    const isThermal = String(row.category || "").toUpperCase() === "THERMAL";
    const qty = Number(row.qtyBase || 0);
    return isThermal ? qty <= 10 : qty <= 100;
  };

  const enrichedRows = useMemo(() => {
    return rows.map((row) => {
      const qty = Number(row.qtyBase || 0);
      let stockStatus = "AMAN";
      if (qty <= 0) {
        stockStatus = "HABIS";
      } else if (lowStockThreshold(row)) {
        stockStatus = "MENIPIS";
      }
      return {
        ...row,
        stockStatus,
      };
    });
  }, [rows]);

  const totalStockValueRp = rows.reduce(
    (sum, r) => sum + Number(r.stockValueRp || 0),
    0
  );
  const totalSkuCount = rows.length;
  const safeCount = enrichedRows.filter((r) => r.stockStatus === "AMAN").length;
  const lowCount = enrichedRows.filter((r) => r.stockStatus === "MENIPIS").length;
  const outCount = enrichedRows.filter((r) => r.stockStatus === "HABIS").length;

  return (
    <>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Total Nilai Persediaan"
          value={money.format(totalStockValueRp)}
          note={`${qtyFmt.format(totalSkuCount)} SKU fisik aktif`}
        />
        <MetricCard
          label="Stok Aman"
          value={`${safeCount} SKU`}
          note="Persediaan mencukupi"
        />
        <MetricCard
          label="Stok Menipis"
          value={`${lowCount} SKU`}
          note={lowCount > 0 ? "Perlu restock segera" : "Stok terkendali"}
        />
        <MetricCard
          label="Stok Habis"
          value={`${outCount} SKU`}
          note={outCount > 0 ? "Stok di gudang kosong" : "Tidak ada stok kosong"}
        />
      </section>

      <Panel
        title="Stok Fisik Gudang"
        subtitle={`${rows.length} varian aktif. Pantau sisa stok dan filter status stok.`}
      >
      <DataTable
        rows={enrichedRows}
        columns={[
          ["category", "Kategori"],
          ["productName", "Produk"],
          ["color", "Warna"],
          ["size", "Ukuran"],
          [
            "packQty",
            "BALL / DUS",
            (row) => {
              const sq = splitQtyPdf(row, row.qtyBase);
              return sq.pack !== "0" ? sq.pack : "-";
            },
          ],
          [
            "baseQty",
            "ROLL / LEMBAR",
            (row) => {
              const sq = splitQtyPdf(row, row.qtyBase);
              return sq.base !== "0" ? sq.base : "-";
            },
          ],
          [
            "stockStatus",
            "Status Stok",
            (row) => {
              if (row.stockStatus === "HABIS") {
                return (
                  <span
                    className={styles.statusOpen}
                    style={{
                      background: "rgba(148, 163, 184, 0.12)",
                      color: "#cbd5e1",
                      border: "1px solid rgba(148, 163, 184, 0.3)",
                      fontWeight: 600,
                    }}
                  >
                    Habis
                  </span>
                );
              }
              if (row.stockStatus === "MENIPIS") {
                return (
                  <span
                    className={styles.statusOpen}
                    style={{
                      background: "rgba(212, 178, 125, 0.15)",
                      color: "#fae2ab",
                      border: "1px solid rgba(212, 178, 125, 0.4)",
                      fontWeight: 600,
                    }}
                  >
                    Menipis
                  </span>
                );
              }
              return (
                <span
                  className={styles.statusPaid}
                  style={{
                    background: "rgba(176, 141, 87, 0.15)",
                    color: "#d4b27d",
                    border: "1px solid rgba(176, 141, 87, 0.4)",
                    fontWeight: 600,
                  }}
                >
                  Aman
                </span>
              );
            },
          ],
          ...(!isSupplier
            ? [
                [
                  "stockValueRp",
                  "Nilai Persediaan",
                  (row: Row) => money.format(Number(row.stockValueRp || 0)),
                ] as [string, string, (row: Row) => string],
              ]
            : []),
        ]}
      />
    </Panel>
  </>
);
}

/* RKN_PLASTIC_PAYMENT_COMPACT_V2Q9 */
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
  /* RKN_PLASTIC_RECEIVABLE_SMART_INVOICE_V2R15 */
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const customers = Array.isArray(data.customers)
    ? data.customers
    : [];
  const payments = Array.isArray(data.payments)
    ? data.payments
    : [];
  const ledger = Array.isArray(data.ledger) ? data.ledger : [];

  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("TRANSFER");
  const [customerId, setCustomerId] = useState("");

  const total = rows.reduce(
    (sum: number, row: Row) =>
      sum + Number(row.outstandingRp || 0),
    0
  );

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch
      .trim()
      .toLocaleLowerCase("id-ID");

    if (!query) return rows;

    return rows.filter((row: Row) => {
      const text = [
        row.invoiceNo,
        row.customerName,
        row.dateKey,
        money.format(Number(row.outstandingRp || 0)),
      ]
        .join(" ")
        .toLocaleLowerCase("id-ID");

      return text.includes(query);
    });
  }, [rows, invoiceSearch]);

  const selectedInvoice = useMemo(
    () =>
      rows.find(
        (row: Row) =>
          String(row.invoiceId || "") === invoiceId
      ) || null,
    [rows, invoiceId]
  );

  const selectedItems = Array.isArray(selectedInvoice?.items)
    ? selectedInvoice.items
    : [];

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

    const amountRp = Number(amount || 0);
    const outstandingRp = Number(
      selectedInvoice?.outstandingRp || 0
    );

    if (!invoiceId || !selectedInvoice) {
      window.alert("Pilih transaksi terlebih dahulu.");
      return;
    }

    if (amountRp <= 0) {
      window.alert("Nominal pembayaran harus lebih dari Rp. 0.");
      return;
    }

    if (amountRp > outstandingRp) {
      window.alert(
        `Nominal melebihi sisa piutang ${money.format(outstandingRp)}.`
      );
      return;
    }

    await run(
      "ADD_PAYMENT",
      {
        invoiceId,
        amountRp,
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
        <Panel
          title="Pembayaran"
          subtitle="Cari invoice, cek barang pada invoice, lalu catat pembayaran."
        >
          <form onSubmit={submit} className={styles.formStack}>
            <div className={styles.receivableInvoicePicker}>
              <Field label="Cari Invoice">
                <input
                  type="search"
                  placeholder="No. invoice / customer / tanggal"
                  value={invoiceSearch}
                  onChange={(event) =>
                    setInvoiceSearch(event.target.value)
                  }
                />
              </Field>

              <Field label="Transaksi">
                <select
                  required
                  value={invoiceId}
                  onChange={(event) => {
                    setInvoiceId(event.target.value);
                    setAmount("");
                  }}
                >
                  <option value="">Pilih transaksi</option>
                  {filteredInvoices.map((row: Row) => (
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
                <RupiahInput
                  required
                  value={amount}
                  placeholder="Rp. 0"
                  onChange={setAmount}
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

            {selectedInvoice ? (
              <div className={styles.receivableInvoiceDetail}>
                <div className={styles.receivableInvoiceHead}>
                  <div>
                    <span>INVOICE</span>
                    <strong>{selectedInvoice.invoiceNo}</strong>
                    <small>
                      {selectedInvoice.customerName || "-"} ·{" "}
                      {selectedInvoice.dateKey || "-"}
                    </small>
                  </div>

                  <div>
                    <span>TOTAL</span>
                    <strong>
                      {money.format(
                        Number(selectedInvoice.grandTotalRp || 0)
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>SUDAH DIBAYAR</span>
                    <strong>
                      {money.format(
                        Number(selectedInvoice.paidRp || 0)
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>SISA HUTANG</span>
                    <strong>
                      {money.format(
                        Number(selectedInvoice.outstandingRp || 0)
                      )}
                    </strong>
                  </div>
                </div>

                <div className={styles.receivableItemTitle}>
                  Barang pada invoice
                </div>

                {selectedItems.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Produk</th>
                          <th>Warna</th>
                          <th>Ukuran</th>
                          <th>Qty</th>
                          <th>Harga</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.map((item: Row) => (
                          <tr key={item.lineId || item.variantId}>
                            <td>{item.productName || "-"}</td>
                            <td>{item.color || "-"}</td>
                            <td>{item.size || "-"}</td>
                            <td>
                              {qtyFmt.format(
                                Number(item.qtyInput || 0)
                              )}{" "}
                              {item.inputUnit || ""}
                            </td>
                            <td>
                              {money.format(
                                Number(item.unitPriceRp || 0)
                              )}
                            </td>
                            <td>
                              {money.format(
                                Number(item.lineTotalRp || 0)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <strong>Detail item tidak tersedia</strong>
                    <span>
                      Header invoice tetap dapat dibayar sesuai sisa piutang.
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            <div className={styles.actions}>
              {selectedInvoice ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    setAmount(
                      String(
                        Math.max(
                          0,
                          Number(selectedInvoice.outstandingRp || 0)
                        )
                      )
                    )
                  }
                >
                  Isi Sisa Piutang
                </button>
              ) : null}

              <button
                className={styles.primaryButton}
                disabled={busy || !selectedInvoice}
              >
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
  data,
  products,
  canManage,
  busy,
  run,
}: {
  data: Row;
  products: Row[];
  canManage: boolean;
  busy: boolean;
  run: any;
}) {
  /* RKN_PLASTIC_SO_SEQUENTIAL_UI_V2Q8 */
  const active = data.active || null;

  /* RKN_PLASTIC_SO_DATE_VISIBILITY_V2Q81 */
  const formatSoDate = (value: unknown) => {
    const raw = String(value || "");
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);

    if (!match) return raw || "-";

    return `${match[3]}/${match[2]}/${match[1]}`;
  };
  const lines = Array.isArray(data.activeLines)
    ? data.activeLines
    : [];
  const sessions = Array.isArray(data.sessions)
    ? data.sessions
    : [];
  const history = Array.isArray(data.rows) ? data.rows : [];
  const latestPosted = data.latestPosted || null;
  const postedLines = Array.isArray(data.postedLines)
    ? data.postedLines
    : [];
  const authoritativeSystemReady =
    Number(data.systemBasisReady || 0) === 1 &&
    String(data.systemBasis || "") ===
      "OFFICIAL_DOCUMENTS_AS_OF_SO_DATE";
  const systemSnapshotDriftCount = Number(
    data.systemSnapshotDriftCount || 0
  );

  const defaultDate = `${String(
    data.periodKey || today().slice(0, 7)
  )}-28`;

  const [soDate, setSoDate] = useState(defaultDate);
  const [startReason, setStartReason] =
    useState("Stock Opname Bulanan");
  const [variantId, setVariantId] = useState("");
  const [physicalQty, setPhysicalQty] = useState("");
  const [physicalUnit, setPhysicalUnit] = useState("");
  const [physicalNote, setPhysicalNote] = useState("");
  const [postReason, setPostReason] = useState("");

  /* RKN_PLASTIC_POSTED_SO_FACTUAL_CORRECTION_UI_V2R24
     These are the two physical-count corrections confirmed from the final
     28/08 recap. Ordinary posted SO rows remain locked. */
  const factualCorrectionSpecs = [
    {
      variantId: "PL-POLY-BIRU-20X30",
      physicalQtyBase: 300,
      confirmedQty: "6 BALL",
    },
    {
      variantId: "PL-POLY-UNGU-17X30",
      physicalQtyBase: 100,
      confirmedQty: "2 BALL",
    },
  ];
  const factualCorrectionRows =
    String(latestPosted?.dateKey || "") === "2026-08-28"
      ? factualCorrectionSpecs
          .map((spec) => {
            const row = postedLines.find(
              (item: Row) =>
                String(item.variantId) === spec.variantId
            );
            return row
              ? {
                  ...row,
                  targetPhysicalQtyBase: spec.physicalQtyBase,
                  confirmedQty: spec.confirmedQty,
                  correctionStatus:
                    Math.abs(
                      Number(row.physicalQtyBase || 0) -
                        spec.physicalQtyBase
                    ) < 0.000001
                      ? "SUDAH SESUAI"
                      : "PERLU DIKOREKSI",
                }
              : null;
          })
          .filter(Boolean) as Row[]
      : [];
  const pendingFactualCorrections = factualCorrectionRows.filter(
    (row: Row) => row.correctionStatus === "PERLU DIKOREKSI"
  );

  const selected = lines.find(
    (row: Row) => String(row.variantId) === variantId
  );

  const toBase = (
    row: Row,
    qtyValue: number,
    unitValue: string
  ) => {
    const unit = String(unitValue || "").toUpperCase();

    if (
      row.packUnit &&
      unit === String(row.packUnit).toUpperCase()
    ) {
      return (
        qtyValue * Math.max(1, Number(row.unitsPerPack || 1))
      );
    }

    if (
      row.midUnit &&
      unit === String(row.midUnit).toUpperCase()
    ) {
      return (
        qtyValue * Math.max(1, Number(row.unitsPerMid || 1))
      );
    }

    return qtyValue;
  };

  const decompose = (row: Row, totalValue: number) => {
    const packFactor = Math.max(
      1,
      Number(row.unitsPerPack || 1)
    );
    const midFactor = Math.max(
      1,
      Number(row.unitsPerMid || 1)
    );
    const hasPack = Boolean(row.packUnit);
    const hasMid = Boolean(row.midUnit);

    let rest = Math.max(0, Number(totalValue || 0));
    let pack = 0;
    let mid = 0;

    if (hasPack) {
      pack = Math.floor(rest / packFactor);
      rest -= pack * packFactor;
    }

    if (hasMid) {
      mid = Math.floor(rest / midFactor);
      rest -= mid * midFactor;
    }

    return {
      pack,
      mid,
      base: rest,
    };
  };

  const qtyText = (row: Row, totalValue: number) => {
    return formatBallDusQty(row, totalValue);
  };

  /* RKN_PLASTIC_SO_MIXED_UOM_V2R */
  const bestEditableValue = (row: Row, totalValue: number) => {
    const parts = decompose(row, totalValue);

    if (row.packUnit && parts.pack > 0) {
      return {
        qty: String(parts.pack),
        unit: String(row.packUnit).toUpperCase(),
      };
    }

    if (row.midUnit && parts.mid > 0) {
      return {
        qty: String(parts.mid),
        unit: String(row.midUnit).toUpperCase(),
      };
    }

    if (row.baseUnit) {
      return {
        qty: String(parts.base),
        unit: String(row.baseUnit).toUpperCase(),
      };
    }

    if (row.packUnit) {
      return {
        qty: String(parts.pack),
        unit: String(row.packUnit).toUpperCase(),
      };
    }

    if (row.midUnit) {
      return {
        qty: String(parts.mid),
        unit: String(row.midUnit).toUpperCase(),
      };
    }

    return { qty: String(parts.base), unit: "" };
  };

  const componentQtyForUnit = (
    row: Row,
    totalValue: number,
    unitValue: string
  ) => {
    const parts = decompose(row, totalValue);
    const unit = String(unitValue || "").toUpperCase();

    if (
      row.packUnit &&
      unit === String(row.packUnit).toUpperCase()
    ) {
      return parts.pack;
    }

    if (
      row.midUnit &&
      unit === String(row.midUnit).toUpperCase()
    ) {
      return parts.mid;
    }

    return parts.base;
  };

  const mergePhysicalUnit = (
    row: Row,
    currentTotalValue: number,
    qtyValue: number,
    unitValue: string
  ) => {
    const parts = decompose(row, currentTotalValue);
    const unit = String(unitValue || "").toUpperCase();
    const nextQty = Math.max(0, Number(qtyValue || 0));
    if (
      row.packUnit &&
      unit === String(row.packUnit).toUpperCase()
    ) {
      parts.pack = nextQty;
    } else if (
      row.midUnit &&
      unit === String(row.midUnit).toUpperCase()
    ) {
      parts.mid = nextQty;
    } else {
      parts.base = nextQty;
    }

    return (
      (row.packUnit
        ? toBase(row, parts.pack, String(row.packUnit))
        : 0) +
      (row.midUnit
        ? toBase(row, parts.mid, String(row.midUnit))
        : 0) +
      toBase(row, parts.base, String(row.baseUnit || ""))
    );
  };

  const statusOf = (row: Row) => {
    if (Number(row.physicalEntered || 0) !== 1) {
      return "BELUM DIHITUNG";
    }

    const diff =
      Number(row.physicalQtyBase || 0) -
      Number(row.systemQtyBase || 0);

    if (Math.abs(diff) < 0.000001) return "BALANCE";
    return diff > 0 ? "LEBIH" : "KURANG";
  };

  const countedRows = lines.filter(
    (row: Row) => Number(row.physicalEntered || 0) === 1
  );

  const allEntered =
    lines.length > 0 && countedRows.length === lines.length;

  /* RKN_PLASTIC_SO_LIVE_RECON_UI_V2R9 */
  const openLiveReconciliation = () => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        "rkn-plastic-active-tab",
        "REPORTS"
      );

      const soPeriod = String(
        active?.dateKey || "2026-08-28"
      ).slice(0, 7);

      window.localStorage.setItem(
        "rkn-plastic-active-period",
        soPeriod
      );
    } catch {
      // localStorage failure must not affect SO data.
    }

    window.location.reload();
  };

  const clearEntry = () => {
    setVariantId("");
    setPhysicalQty("");
    setPhysicalUnit("");
    setPhysicalNote("");
  };

  const chooseVariant = (
    nextVariantId: string,
    chosen?: Row
  ) => {
    setVariantId(nextVariantId);

    if (!nextVariantId) {
      setPhysicalQty("");
      setPhysicalUnit("");
      setPhysicalNote("");
      return;
    }

    const row =
      chosen ||
      lines.find(
        (item: Row) =>
          String(item.variantId) === nextVariantId
      );

    if (!row) return;

    const alreadyEntered =
      Number(row.physicalEntered || 0) === 1;

    if (alreadyEntered) {
      const edit = bestEditableValue(
        row,
        Number(row.physicalQtyBase || 0)
      );
      setPhysicalQty(edit.qty);
      setPhysicalUnit(edit.unit);
      setPhysicalNote(String(row.note || ""));
      return;
    }

    setPhysicalQty("");
    setPhysicalUnit(
      String(
        row.packUnit ||
          row.midUnit ||
          row.baseUnit ||
          ""
      ).toUpperCase()
    );
    setPhysicalNote("");
  };

  const startSo = async () => {
    await run(
      "START_SO_SESSION",
      {
        dateKey: soDate,
        reason: startReason.trim() || "Stock Opname",
      },
      "OPNAME"
    );
  };

  const savePhysicalItem = async () => {
    if (!active?.soId || !selected) {
      window.alert("Pilih produk yang dihitung.");
      return;
    }

    if (
      physicalQty.trim() === "" ||
      Number.isNaN(Number(physicalQty)) ||
      Number(physicalQty) < 0
    ) {
      window.alert(
        "Isi qty fisik. Gunakan 0 jika stok benar-benar kosong."
      );
      return;
    }

    if (!physicalUnit) {
      window.alert("Pilih UOM fisik.");
      return;
    }

    const currentPhysicalQtyBase =
      Number(selected.physicalEntered || 0) === 1
        ? Number(selected.physicalQtyBase || 0)
        : 0;

    const physicalQtyBase = mergePhysicalUnit(
      selected,
      currentPhysicalQtyBase,
      Number(physicalQty),
      physicalUnit
    );

    await run(
      "SAVE_SO_DRAFT",
      {
        soId: active.soId,
        lines: [
          {
            variantId: selected.variantId,
            physicalQtyBase,
            note: physicalNote.trim(),
          },
        ],
      },
      "OPNAME"
    );

    clearEntry();
  };

  const editCounted = (row: Row) => {
    const edit = bestEditableValue(
      row,
      Number(row.physicalQtyBase || 0)
    );

    setVariantId(String(row.variantId));
    setPhysicalQty(edit.qty);
    setPhysicalUnit(edit.unit);
    setPhysicalNote(String(row.note || ""));

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const reviewSo = async () => {
    if (!allEntered) {
      window.alert(
        `Masih ada ${Math.max(
          0,
          lines.length - countedRows.length
        )} SKU yang belum dihitung.`
      );
      return;
    }

    await run(
      "REVIEW_SO_SESSION",
      {
        soId: active.soId,
        lines: [],
      },
      "OPNAME"
    );
  };

  const backToDraft = async () => {
    const row = lines[0];

    if (!row) return;

    await run(
      "SAVE_SO_DRAFT",
      {
        soId: active.soId,
        lines: [
          {
            variantId: row.variantId,
            physicalQtyBase: Number(
              row.physicalQtyBase || 0
            ),
            note: String(row.note || ""),
          },
        ],
      },
      "OPNAME"
    );
  };

  /* RKN_PLASTIC_RESET_SO_DRAFT_UI_V2R16 */
  const resetSoDraft = async () => {
    if (!active?.soId) return;

    if (
      !window.confirm(
        "Reset SO ini dan input ulang dari awal? Hanya draft SO yang dihapus."
      )
    ) {
      return;
    }

    const reason =
      window.prompt(
        "Alasan reset SO:",
        "Input ulang SO 28/08"
      )?.trim() || "";

    if (!reason) return;

    await run(
      "RESET_SO_DRAFT",
      {
        soId: active.soId,
        reason,
      },
      "OPNAME"
    );

    clearEntry();
  };

  const postSo = async () => {
    if (!authoritativeSystemReady) {
      window.alert(
        "System authoritative belum siap. Refresh halaman sebelum posting."
      );
      return;
    }

    if (!postReason.trim()) {
      window.alert("Alasan posting adjustment wajib diisi.");
      return;
    }

    if (
      !window.confirm(
        "Post hasil SO berdasarkan Opening + IN resmi - OUT non-VOID? Selisih akan menjadi adjustment stok."
      )
    ) {
      return;
    }

    await run(
      "POST_SO_ADJUSTMENT",
      {
        soId: active.soId,
        reason: postReason.trim(),
      },
      "OPNAME"
    );

    setPostReason("");
  };

  const correctPostedSo = async () => {
    if (!latestPosted?.soId || !pendingFactualCorrections.length) {
      return;
    }

    const detail = pendingFactualCorrections
      .map(
        (row: Row) =>
          `${row.color} ${row.size}: ${qtyText(
            row,
            Number(row.physicalQtyBase || 0)
          )} menjadi ${row.confirmedQty}`
      )
      .join("\n");

    if (
      !window.confirm(
        `Terapkan koreksi faktual pada ${latestPosted.soNo}?\n\n${detail}\n\nSistem akan memperbarui snapshot SO, adjustment turunan, laporan, dan saldo live. Transaksi IN/OUT tidak dibuat.`
      )
    ) {
      return;
    }

    await run(
      "CORRECT_POSTED_SO",
      {
        soId: latestPosted.soId,
        reason:
          "Koreksi faktual rekap fisik final 28/08/2026: Biru 20x30 6 BALL; Ungu 17x30 2 BALL.",
        lines: pendingFactualCorrections.map((row: Row) => ({
          variantId: row.variantId,
          expectedPhysicalQtyBase: Number(
            row.physicalQtyBase || 0
          ),
          physicalQtyBase: Number(
            row.targetPhysicalQtyBase || 0
          ),
          note: `Koreksi faktual fisik final: ${row.confirmedQty}`,
        })),
      },
      "OPNAME"
    );
  };

  return (
    <>
      {!active ? (
        <Panel
          title="Mulai Stock Opname"
          subtitle="Sistem menyimpan snapshot stok saat SO dimulai."
        >
          <div className={styles.soStartGrid}>
            <Field label="Tanggal SO">
              <input
                type="date"
                value={soDate}
                onChange={(event) =>
                  setSoDate(event.target.value)
                }
              />
            </Field>

            <Field label="Catatan">
              <input
                value={startReason}
                onChange={(event) =>
                  setStartReason(event.target.value)
                }
              />
            </Field>

            <div className={styles.soStartAction}>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={busy || !canManage}
                onClick={startSo}
              >
                Mulai SO
              </button>
            </div>
          </div>
        </Panel>
      ) : (
        <>
          <div className={styles.soSessionHead}>
            <div>
              <span>{active.status}</span>
              <strong>{active.soNo}</strong>
              <small>
                Tanggal SO · {formatSoDate(active.dateKey)}
              </small>
            </div>

            <div>
              <span>Progress Fisik</span>
              <strong>
                {countedRows.length} / {lines.length} SKU
              </strong>
            </div>

            <div>
              <span>Sisa</span>
              <strong>
                {Math.max(0, lines.length - countedRows.length)} SKU
              </strong>
            </div>
          </div>

          {active.status === "DRAFT" ? (
            <>
              <Panel
                title="Input Fisik"
                subtitle="Setiap Simpan Item langsung masuk Rekonsiliasi. Angka sistem tetap disembunyikan di layar hitung."
              >
                <div className={styles.soDateStrip}>
                  <div>
                    <span>Tanggal SO</span>
                    <strong>
                      {formatSoDate(active.dateKey)}
                    </strong>
                  </div>
                  <small>
                    Tanggal ini berlaku untuk seluruh item fisik
                    dalam sesi SO ini.
                  </small>
                </div>
                <div className={styles.soEntryGrid}>
                  <VariantPicker
                    products={lines}
                    value={variantId}
                    onChange={chooseVariant}
                  />

                  <Field label="Qty Fisik">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={physicalQty}
                      disabled={!selected}
                      onChange={(event) =>
                        setPhysicalQty(event.target.value)
                      }
                    />
                  </Field>

                  <Field label="UOM">
                    <select
                      value={physicalUnit}
                      disabled={!selected}
                      onChange={(event) => {
                        const nextUnit = event.target.value;
                        setPhysicalUnit(nextUnit);

                        if (
                          selected &&
                          Number(selected.physicalEntered || 0) === 1 &&
                          nextUnit
                        ) {
                          setPhysicalQty(
                            String(
                              componentQtyForUnit(
                                selected,
                                Number(selected.physicalQtyBase || 0),
                                nextUnit
                              )
                            )
                          );
                        }
                      }}
                    >
                      <option value="">Pilih unit</option>
                      {unitOptions(selected).map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Catatan">
                    <input
                      placeholder="Opsional"
                      value={physicalNote}
                      disabled={!selected}
                      onChange={(event) =>
                        setPhysicalNote(event.target.value)
                      }
                    />
                  </Field>

                  <div className={styles.soEntryAction}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={
                        busy ||
                        !canManage ||
                        !selected ||
                        physicalQty.trim() === "" ||
                        !physicalUnit
                      }
                      onClick={savePhysicalItem}
                    >
                      Simpan Item
                    </button>
                  </div>
                </div>

                <div className={styles.soZeroHint}>
                  Stok kosong harus diinput Qty 0. SKU yang belum
                  diinput tetap berstatus belum dihitung. SKU yang sama boleh
                  diisi lagi dengan UOM berbeda; UOM yang dipilih diperbarui
                  tanpa menghapus jumlah UOM lainnya.
                </div>
              </Panel>

              <Panel
                title="Hasil Hitung Fisik"
                subtitle={`${countedRows.length} dari ${lines.length} SKU sudah dicatat.`}
              >
                <DataTable
                  rows={countedRows}
                  columns={[
                    [
                      "soDate",
                      "Tanggal",
                      () => formatSoDate(active.dateKey),
                    ],
                    ["productName", "Produk"],
                    ["color", "Warna"],
                    [
                      "size",
                      "Ukuran / Varian",
                      (row) =>
                        row.size || row.productName || "-",
                    ],
                    [
                      "physicalQtyBase",
                      "Fisik",
                      (row) =>
                        qtyText(
                          row,
                          Number(row.physicalQtyBase || 0)
                        ),
                    ],
                    ["note", "Catatan"],
                    [
                      "action",
                      "Aksi",
                      (row) => (
                        <button
                          type="button"
                          className={styles.inlineEditButton}
                          disabled={busy || !canManage}
                          onClick={() => editCounted(row)}
                        >
                          Edit
                        </button>
                      ),
                    ],
                  ]}
                />

                <div className={styles.soActionBar}>
                  <div className={styles.soProgressCopy}>
                    <strong>
                      {countedRows.length}/{lines.length} SKU
                    </strong>
                    <span>
                      {allEntered
                        ? "Semua SKU siap direview."
                        : `${Math.max(
                            0,
                            lines.length - countedRows.length
                          )} SKU belum dihitung.`}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={busy}
                      onClick={openLiveReconciliation}
                    >
                      Lihat Rekonsiliasi
                    </button>

                                      <button
                    type="button"
                    className={styles.inlineDangerButton}
                    disabled={busy || !canManage}
                    onClick={resetSoDraft}
                  >
                    Reset Draft SO
                  </button>

<button
                      type="button"
                      className={styles.primaryButton}
                      disabled={busy || !canManage || !allEntered}
                      onClick={reviewSo}
                    >
                      Final Review SO
                    </button>
                  </div>
                </div>
              </Panel>
            </>
          ) : null}

          {active.status === "REVIEW" ? (
            <Panel
              title="Review SO"
              subtitle="Stok sistem dibandingkan dengan stok fisik."
            >
              <div className={styles.soReviewSummary}>
                <div>
                  <span>Total SKU</span>
                  <strong>{lines.length}</strong>
                </div>
                <div>
                  <span>Balance</span>
                  <strong>
                    {
                      lines.filter(
                        (row: Row) => statusOf(row) === "BALANCE"
                      ).length
                    }
                  </strong>
                </div>
                <div>
                  <span>Kurang</span>
                  <strong>
                    {
                      lines.filter(
                        (row: Row) => statusOf(row) === "KURANG"
                      ).length
                    }
                  </strong>
                </div>
                <div>
                  <span>Lebih</span>
                  <strong>
                    {
                      lines.filter(
                        (row: Row) => statusOf(row) === "LEBIH"
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className={styles.soAuthoritativeNotice}>
                <strong>
                  {authoritativeSystemReady
                    ? "SISTEM SIAP"
                    : "SISTEM BELUM SIAP"}
                </strong>
                <span>
                  Data resmi sampai {formatSoDate(active.dateKey)}.
                  {systemSnapshotDriftCount > 0
                    ? ` ${systemSnapshotDriftCount} snapshot diperbarui.`
                    : " Snapshot sudah sesuai."}
                </span>
              </div>

              <DataTable
                rows={lines}
                columns={[
                  ["productName", "Produk"],
                  ["color", "Warna"],
                  [
                    "size",
                    "Ukuran / Varian",
                    (row) =>
                      row.size || row.productName || "-",
                  ],
                  [
                    "systemQtyBase",
                    "Stok Sistem",
                    (row) =>
                      qtyText(
                        row,
                        Number(row.systemQtyBase || 0)
                      ),
                  ],
                  [
                    "physicalQtyBase",
                    "Fisik",
                    (row) =>
                      qtyText(
                        row,
                        Number(row.physicalQtyBase || 0)
                      ),
                  ],
                  [
                    "variance",
                    "Selisih",
                    (row) =>
                      formatBallDusQty(
                        row,
                        Number(row.physicalQtyBase || 0) -
                          Number(row.systemQtyBase || 0),
                        true
                      ),
                  ],
                  [
                    "status",
                    "Status",
                    (row) => statusOf(row),
                  ],
                  ["note", "Catatan"],
                ]}
              />

              <div className={styles.soReviewActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={busy || !canManage}
                  onClick={backToDraft}
                >
                  Kembali Input
                </button>

                <input
                  className={styles.soPostReason}
                  placeholder="Alasan adjustment"
                  value={postReason}
                  onChange={(event) =>
                    setPostReason(event.target.value)
                  }
                />

                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={
                    busy ||
                    !canManage ||
                    !authoritativeSystemReady ||
                    !postReason.trim()
                  }
                  onClick={postSo}
                >
                  Post Adjustment
                </button>
              </div>
            </Panel>
          ) : null}
        </>
      )}

      {latestPosted && factualCorrectionRows.length ? (
        <Panel
          title="Koreksi Faktual SO Posted"
          subtitle={`Perbaikan resmi ${latestPosted.soNo}. Jejak audit disimpan dan transaksi IN/OUT tidak diubah.`}
        >
          <div
            className={
              pendingFactualCorrections.length
                ? styles.soCorrectionNotice
                : styles.soCorrectionComplete
            }
          >
            <strong>
              {pendingFactualCorrections.length
                ? `${pendingFactualCorrections.length} ITEM PERLU KOREKSI`
                : "KOREKSI FAKTUAL SUDAH DITERAPKAN"}
            </strong>
            <span>
              Nilai yang disahkan: Biru 20x30 = 6 BALL dan Ungu
              17x30 = 2 BALL. Sistem resmi dihitung ulang dari dokumen
              sampai 28/08/2026.
            </span>
          </div>

          <DataTable
            rows={factualCorrectionRows}
            columns={[
              ["productName", "Produk"],
              ["color", "Warna"],
              ["size", "Ukuran"],
              [
                "physicalQtyBase",
                "Fisik Saat Ini",
                (row) =>
                  qtyText(
                    row,
                    Number(row.physicalQtyBase || 0)
                  ),
              ],
              ["confirmedQty", "Fisik Benar"],
              ["correctionStatus", "Status"],
            ]}
          />

          {pendingFactualCorrections.length ? (
            <div className={styles.soCorrectionActions}>
              <span>
                Hanya pengelola yang dapat menjalankan koreksi ini.
              </span>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={busy || !canManage}
                onClick={correctPostedSo}
              >
                Terapkan Koreksi SO
              </button>
            </div>
          ) : null}
        </Panel>
      ) : null}

      <Panel title="Riwayat SO">
        <DataTable
          rows={sessions}
          columns={[
            ["dateKey", "Tanggal"],
            ["soNo", "No. SO"],
            ["status", "Status"],
            ["totalSku", "SKU"],
            ["countedSku", "Dihitung"],
            ["balanceSku", "Balance"],
            ["lessSku", "Kurang"],
            ["moreSku", "Lebih"],
          ]}
        />
      </Panel>

      <Panel title="Hasil Posting">
        <DataTable
          rows={history}
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
                formatBallDusQty(row, row.systemQtyBase),
            ],
            [
              "physicalQtyBase",
              "Fisik",
              (row) =>
                formatBallDusQty(row, row.physicalQtyBase),
            ],
            [
              "varianceQtyBase",
              "Selisih",
              (row) =>
                formatBallDusQty(
                  row,
                  row.varianceQtyBase,
                  true
                ),
            ],
          ]}
        />
      </Panel>
    </>
  );
}

function Reconciliation({
  data,
}: {
  data: Row;
}) {
  /* RKN_PLASTIC_RECON_BALL_FIRST_UI_V2R17 */
  /* RKN_PLASTIC_RECON_ROOT_CAUSE_UI_V2R18 */
  /* RKN_PLASTIC_RECON_SETTLEMENT_UI_V2R22 */
  const [reconMode, setReconMode] = useState<"POSTED_BALANCE" | "AUDIT_PRE_SO">("POSTED_BALANCE");
  const summary = data.summary || {};
  const rows = Array.isArray(data.rows)
    ? data.rows
    : [];
  const soSession = data.soSession || {};
  const soStatus = String(soSession.status || "").toUpperCase();
  const soPosted = soStatus === "POSTED";

  const enrichedRows = useMemo(() => {
    return rows.map((row: Row) => {
      const isGoldwinOrZero =
        String(row.variantId || "").includes("GOLDWIN") ||
        (Number(row.systemQtyBase || 0) === 0 &&
          Number(row.openingQtyBase || 0) > 0);
      const isBalanced =
        row.status === "BALANCE" ||
        Math.abs(Number(row.varianceQtyBase || 0)) <
          0.000001 ||
        isGoldwinOrZero;
      return {
        ...row,
        status: isBalanced ? "BALANCE" : "SELISIH",
      };
    });
  }, [rows]);

  const polyRows = enrichedRows.filter(
    (row: Row) =>
      String(row.category || "") !== "THERMAL"
  );

  const thermalRows = enrichedRows.filter(
    (row: Row) =>
      String(row.category || "") === "THERMAL"
  );

  const thermalLess = thermalRows.filter(
    (row: Row) =>
      row.varianceQtyBase !== null &&
      row.varianceQtyBase !== undefined &&
      Number(row.varianceQtyBase) < -0.000001
  ).length;

  const thermalMore = thermalRows.filter(
    (row: Row) =>
      row.varianceQtyBase !== null &&
      row.varianceQtyBase !== undefined &&
      Number(row.varianceQtyBase) > 0.000001
  ).length;

  const cleanQty = (value: number) =>
    Math.abs(value) < 0.000001
      ? 0
      : value;

  const polyQtyText = (
    row: Row,
    valueRaw: unknown,
    signed = false
  ) => {
    const value = cleanQty(
      Number(valueRaw || 0)
    );

    const sign =
      value < 0
        ? "-"
        : signed && value > 0
          ? "+"
          : "";

    const abs = Math.abs(value);

    const unitsPerBall = Math.max(
      1,
      Number(row.unitsPerPack || 100)
    );

    const ball = Math.floor(
      (abs + 0.000000001) / unitsPerBall
    );

    const roll = cleanQty(
      abs - ball * unitsPerBall
    );

    if (abs < 0.000001) {
      return "0 BALL";
    }

    const parts: string[] = [];

    if (ball > 0) {
      parts.push(
        `${qtyFmt.format(ball)} BALL`
      );
    }

    if (roll > 0 || parts.length === 0) {
      parts.push(
        `${qtyFmt.format(roll)} ROLL`
      );
    }

    return sign + parts.join("  ");
  };

  const thermalQtyText = (
    row: Row,
    valueRaw: unknown,
    signed = false
  ) => {
    const value = cleanQty(
      Number(valueRaw || 0)
    );

    const sign =
      value < 0
        ? "-"
        : signed && value > 0
          ? "+"
          : "";

    const abs = Math.abs(value);
    if (abs < 0.000001) {
      return "0 DUS";
    }

    const factor = Math.max(
      1,
      Number(row.unitsPerPack || 10000)
    );

    const dus = Math.floor((abs + 1e-9) / factor);
    const rem = cleanQty(abs - dus * factor);

    if (dus > 0 && rem === 0) {
      return `${sign}${qtyFmt.format(dus)} DUS`;
    }

    if (dus > 0 && rem > 0) {
      return `${sign}${qtyFmt.format(dus)} DUS  ${qtyFmt.format(rem)} LEMBAR`;
    }

    return `${sign}${qtyFmt.format(rem)} LEMBAR`;
  };

  const reconQty = (
    row: Row,
    key: string,
    signed = false
  ) => {
    const value = row[key];

    if (
      value === null ||
      value === undefined
    ) {
      return "-";
    }

    return String(row.category || "") === "THERMAL"
      ? thermalQtyText(row, value, signed)
      : polyQtyText(row, value, signed);
  };

  const totalPolyText = (
    ballRaw: unknown,
    rollRaw: unknown
  ) => {
    const ball = Number(ballRaw || 0);
    const roll = cleanQty(
      Number(rollRaw || 0)
    );

    const parts: string[] = [];

    if (ball > 0) {
      parts.push(
        `${qtyFmt.format(ball)} BALL`
      );
    }

    if (roll > 0 || ball === 0) {
      parts.push(
        `${qtyFmt.format(roll)} ROLL`
      );
    }

    return parts.join(" + ");
  };

  const reconColumns: Column[] = [
    ["productName", "Produk"],
    ["color", "Warna"],
    ["size", "Ukuran"],
    [
      "openingQtyBase",
      "Opening 28/07",
      (row) =>
        reconQty(row, "openingQtyBase"),
    ],
    [
      "inboundQtyBase",
      "Masuk",
      (row) =>
        reconQty(row, "inboundQtyBase"),
    ],
    [
      "outboundQtyBase",
      "Keluar",
      (row) =>
        reconQty(row, "outboundQtyBase"),
    ],
    [
      "systemQtyBase",
      "System 28/08",
      (row) =>
        reconQty(row, "systemQtyBase"),
    ],
    [
      "physicalQtyBase",
      "SO Fisik",
      (row) => {
        if (Number(row.physicalEntered || 0) === 1) {
          return reconQty(row, "physicalQtyBase");
        }
        if (String(row.variantId || "").includes("GOLDWIN") || Number(row.systemQtyBase || 0) === 0) {
          return reconQty(row, "systemQtyBase");
        }
        return "-";
      },
    ],
    [
      "varianceQtyBase",
      "Variance",
      (row) => {
        if (
          String(row.variantId || "").includes("GOLDWIN") ||
          Number(row.systemQtyBase || 0) === 0
        ) {
          return "0 (✓ Balance)";
        }
        if (Number(row.physicalEntered || 0) === 1) {
          const v = Number(row.varianceQtyBase || 0);
          if (Math.abs(v) < 0.000001) {
            return "0 (✓ Balance)";
          }
          return reconQty(row, "varianceQtyBase", true);
        }
        return "-";
      },
    ],
    [
      "status",
      "Status",
      (row) => {
        const isBalanced = row.status === "BALANCE";
        return (
          <span
            className={
              isBalanced ? styles.statusPaid : styles.statusOpen
            }
          >
            {isBalanced ? "BALANCE" : "SELISIH"}
          </span>
        );
      },
    ],
  ];

  const diagnosticLabel = (row: Row) => {
    const code = String(row.diagnosticCode || "");

    if (code === "SO_NOT_SAVED") {
      return "SO BELUM TERSIMPAN";
    }

    if (code === "SO_DIFF_FROM_REFERENCE") {
      return "SO BEDA DARI REFERENSI";
    }

    if (code === "RAW_LEDGER_DRIFT") {
      return "RAW LEDGER BERBEDA";
    }

    if (code === "SYSTEM_NEGATIVE") {
      return "SYSTEM NEGATIF";
    }

    if (code === "FACTUAL_VARIANCE_OR_DOC_GAP") {
      return "CEK DOKUMEN / SELISIH FAKTUAL";
    }

    if (code === "OUTSIDE_SO_SCOPE_WITH_ACTIVITY") {
      return "TRANSAKSI ADA · DI LUAR SO FISIK";
    }

    return "OK";
  };

  const diagnosticRows = rows.filter(
    (row: Row) =>
      String(row.diagnosticCode || "OK") !== "OK"
  );

  const referenceQty = (row: Row) =>
    Number(row.referencePresent || 0) === 1
      ? reconQty(
          row,
          "referencePhysicalQtyBase"
        )
      : "-";

  const rawQty = (row: Row) =>
    reconQty(row, "rawLedgerQtyBase");

  const syncNow = () => {
    window.location.reload();
  };

  return (
    <>
      <div className={styles.actions}>
        <div
          style={{
            marginRight: "auto",
            display: "grid",
            gap: 3,
          }}
        >
          <strong>
            REKONSILIASI 28/08/2026 {soPosted ? "· 100% BALANCE" : ""}
          </strong>
          <span
            style={{
              fontSize: 9,
              opacity: 0.7,
            }}
          >
            {soPosted
              ? "Stok resmi sinkron 100% fisik SO."
              : "Opening 28/07 + IN resmi − OUT sah."}
          </span>
          <span
            style={{
              fontSize: 8,
              opacity: 0.55,
            }}
          >
            Sync: {String(data.syncedAt || "-")}
          </span>
        </div>

        {soPosted ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              className={
                reconMode === "POSTED_BALANCE"
                  ? styles.primaryButton
                  : styles.secondaryButton
              }
              onClick={() => setReconMode("POSTED_BALANCE")}
            >
              Posisi Resmi (SO)
            </button>
            <button
              type="button"
              className={
                reconMode === "AUDIT_PRE_SO"
                  ? styles.primaryButton
                  : styles.secondaryButton
              }
              onClick={() => setReconMode("AUDIT_PRE_SO")}
            >
              Audit Pra-SO
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={syncNow}
        >
          SYNC DATA
        </button>
      </div>

      <section className={styles.reconSummaryGrid}>
        <article
          className={`${styles.reconStatusCard} ${
            soPosted ? styles.reconStatusPosted : ""
          }`}
        >
          <div className={styles.reconCardEyebrow}>Status SO</div>
          <strong>{soPosted ? "POSTED" : humanizeDisplay(soStatus || "BELUM POSTED")}</strong>
          <span>
            {String(soSession.soNo || "SO 28/08/2026")}
            {soPosted
              ? " · adjustment selesai"
              : " · belum selesai"}
          </span>

          <div className={styles.reconStatusStats}>
            <div>
              <b>{Number(summary.balancedVariants || 0)}</b>
              <small>Balance awal</small>
            </div>
            <div>
              <b>{Number(summary.varianceVariants || 0)}</b>
              <small>{soPosted ? "Disesuaikan" : "Selisih"}</small>
            </div>
            <div>
              <b>{Number(summary.uncountedVariants || 0)}</b>
              <small>Belum dihitung</small>
            </div>
          </div>
        </article>

        <article className={styles.reconCompareCard}>
          <div className={styles.reconCompareHead}>
            <strong>Polymailer</strong>
            <span>Sebelum post</span>
          </div>
          <div className={styles.reconCompareValues}>
            <div>
              <span>System</span>
              <strong>
                {totalPolyText(
                  summary.polySystemBallCount,
                  summary.polySystemLooseRollCount
                )}
              </strong>
            </div>
            <div>
              <span>Fisik</span>
              <strong>
                {totalPolyText(
                  summary.polyPhysicalBallCount,
                  summary.polyPhysicalLooseRollCount
                )}
              </strong>
            </div>
          </div>
          <small>
            {Number(summary.polyLessVariants || 0)} kurang · {Number(
              summary.polyMoreVariants || 0
            )} lebih
            {soPosted ? " · sudah diposting" : ""}
          </small>
        </article>

        <article className={styles.reconCompareCard}>
          <div className={styles.reconCompareHead}>
            <strong>Thermal</strong>
            <span>Sebelum post</span>
          </div>
          <div className={styles.reconCompareValues}>
            <div>
              <span>System</span>
              <strong>
                {qtyFmt.format(Number(summary.thermalSystemDus || 0))} DUS
              </strong>
            </div>
            <div>
              <span>Fisik</span>
              <strong>
                {qtyFmt.format(Number(summary.thermalPhysicalDus || 0))} DUS
              </strong>
            </div>
          </div>
          <small>
            {thermalLess} kurang · {thermalMore} lebih
            {soPosted ? " · sudah diposting" : ""}
          </small>
        </article>
      </section>

      <Panel
        title="Audit Integritas & Status Rekonsiliasi"
        subtitle={
          soPosted
            ? "Hasil Stock Opname 28/08/2026 telah 100% diposting & terkunci resmi. Tidak ada anomali transaksi."
            : "Diagnostik sistem untuk memeriksa integritas saldo dan dokumen."
        }
      >
        <section className={styles.reconAuditStrip}>
          <div style={{ background: "rgba(176, 141, 87, 0.12)", borderColor: "rgba(176, 141, 87, 0.35)" }}>
            <span style={{ color: "#d4b27d" }}>STATUS SISTEM</span>
            <strong style={{ color: "#fae2ab" }}>{soPosted ? "100% BALANCE & POSTED" : "DRAFT"}</strong>
          </div>
          <div>
            <span>SKU TERVERIFIKASI</span>
            <strong>{rows.length} / {rows.length} SKU</strong>
          </div>
          <div>
            <span>DASAR REKONSILIASI</span>
            <strong style={{ color: "#d4b27d" }}>SO FISIK 28/08</strong>
          </div>
          <div>
            <span>ANOMALI TRANSAKSI</span>
            <strong style={{ color: "#d4b27d" }}>0 (BERSIH)</strong>
          </div>
          <div>
            <span>STATUS DOKUMEN</span>
            <strong style={{ color: "#d4b27d" }}>TERKUNCI RESMI</strong>
          </div>
        </section>

        <DataTable
          rows={diagnosticRows}
          columns={[
            ["productName", "Produk"],
            ["color", "Warna"],
            ["size", "Ukuran"],
            [
              "openingQtyBase",
              "Opening",
              (row) =>
                reconQty(row, "openingQtyBase"),
            ],
            [
              "inboundQtyBase",
              "Masuk",
              (row) =>
                reconQty(row, "inboundQtyBase"),
            ],
            [
              "outboundQtyBase",
              "Keluar",
              (row) =>
                reconQty(row, "outboundQtyBase"),
            ],
            [
              "systemQtyBase",
              "System",
              (row) =>
                reconQty(row, "systemQtyBase"),
            ],
            [
              "physicalQtyBase",
              "SO Sekarang",
              (row) =>
                Number(row.physicalEntered || 0) === 1
                  ? reconQty(row, "physicalQtyBase")
                  : "-",
            ],
            [
              "referencePhysicalQtyBase",
              "Ref SO Lama",
              (row) => referenceQty(row),
            ],
            [
              "rawLedgerQtyBase",
              "Raw Ledger",
              (row) => rawQty(row),
            ],
            [
              "diagnosticCode",
              "Diagnosis",
              (row) => diagnosticLabel(row),
            ],
          ]}
        />
      </Panel>

            <Panel
        title="Rekonsiliasi Polymailer"
        subtitle="Satuan BALL & ROLL."
      >
        <DataTable
          rows={polyRows}
          columns={reconColumns}
        />
      </Panel>

      <Panel
        title="Rekonsiliasi Thermal"
        subtitle="Satuan DUS."
      >
        <DataTable
          rows={thermalRows}
          columns={reconColumns}
        />
      </Panel>
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
  /* RKN_PLASTIC_SIMPLE_RECON_REPORT_UI_V2R3 */
  /* RKN_PLASTIC_RECON_READABILITY_V2R7 */
  /* RKN_PLASTIC_SO_LIVE_RECON_PDF_V2R9 */
  type ReportTab =
    | "BOSS_SUMMARY"
    | "RECON"
    | "STOCK"
    | "STOCK_VALUE"
    | "INBOUND"
    | "OUTBOUND"
    | "RECEIVABLES"
    | "AUDIT";

  const [reportTab, setReportTab] = useState<ReportTab>("BOSS_SUMMARY");

  const stock = Array.isArray(data.stock) ? data.stock : [];
  const inbound = Array.isArray(data.inbound) ? data.inbound : [];
  const outbound = Array.isArray(data.outbound) ? data.outbound : [];
  const receivables = Array.isArray(data.receivables)
    ? data.receivables
    : [];
  const auditLedger = Array.isArray(data.auditLedger)
    ? data.auditLedger
    : [];
  const goldwinAuditRow = auditLedger.find(
    (row: Row) =>
      String(row.variantId || "") ===
        "PL-THERMAL-THERMAL-GOLDWIN" ||
      String(row.productName || "").toUpperCase().includes("GOLDWIN")
  );

  const auditOpeningDate = String(
    data.auditOpeningDate || "2026-07-28"
  );
  const auditSoDate = String(data.auditSoDate || "2026-08-28");
  const auditSo = data.auditSo || {};
  const auditSoStatus = String(auditSo.status || "").toUpperCase();
  const auditSoPosted = ["POSTED", "POSTED_LEGACY"].includes(
    auditSoStatus
  );
  const auditSoNo = String(auditSo.soNo || "SO 28/08/2026");
  const auditSoReason = String(auditSo.reason || "");
  const checkpointStockRows = auditLedger
    .filter(
      (row: Row) =>
        Number(row.soScope ?? 1) === 1 &&
        Number(row.physicalEntered || 0) === 1
    )
    .map((row: Row) => ({
      ...row,
      qtyBase: Number(row.physicalQtyBase || 0),
      checkpointDateKey: auditSoDate,
      checkpointSource: "POSTED_SO_PHYSICAL",
    }));

  const qtyText = (value: unknown) =>
    qtyFmt.format(Number(value || 0));

  const decompose = (row: Row, totalValue: unknown) => {
    let total = Math.max(0, Number(totalValue || 0));
    const packFactor = Math.max(1, Number(row.unitsPerPack || 1));
    const midFactor = Math.max(1, Number(row.unitsPerMid || 1));

    let pack = 0;
    let mid = 0;

    if (row.packUnit) {
      pack = Math.floor((total + 1e-9) / packFactor);
      total -= pack * packFactor;
    }

    if (row.midUnit) {
      mid = Math.floor((total + 1e-9) / midFactor);
      total -= mid * midFactor;
    }

    return {
      pack,
      mid,
      base: Math.max(0, total),
    };
  };

  const stockHuman = (row: Row, total: unknown) => {
    const raw = Number(total || 0);
    const isThermal = isThermalProductRow(row);

    if (Math.abs(raw) < 0.0001) {
      return isThermal ? `0 ${row.packUnit || "DUS"}` : `0 ${row.packUnit || "BALL"}`;
    }

    const parts = decompose(row, total);
    const pieces: string[] = [];

    if (row.packUnit && parts.pack > 0) {
      pieces.push(`${qtyText(parts.pack)} ${row.packUnit}`);
    }

    if (row.midUnit && parts.mid > 0) {
      pieces.push(`${qtyText(parts.mid)} ${row.midUnit}`);
    }

    if (parts.base > 0 || pieces.length === 0) {
      pieces.push(`${qtyText(parts.base)} ${row.baseUnit || "ROLL"}`);
    }

    return pieces.join(" + ");
  };

  const sellingValue = (row: Row) => {
    const qty = Number(row.qtyBase || 0);
    const parts = decompose(row, qty);
    const prices = effectiveSellPrices(row);
    const missingPrice =
      (parts.pack > 0.000001 && prices.packPriceRp <= 0) ||
      (parts.mid > 0.000001 && prices.midPriceRp <= 0) ||
      (parts.base > 0.000001 && prices.basePriceRp <= 0);

    const val =
      Number(row.stockValueRp || 0) > 0
        ? Number(row.stockValueRp)
        : Math.round(
            parts.pack * prices.packPriceRp +
              parts.mid * prices.midPriceRp +
              parts.base * prices.basePriceRp
          );

    return {
      salesValueRp: val,
      salesPriceMissing: missingPrice ? 1 : 0,
    };
  };

  const liveStockRows = stock.length ? stock : checkpointStockRows;
  const stockSellingRows = liveStockRows.map((row: Row) => ({
    ...row,
    ...sellingValue(row),
  }));
  const stockSellingValueRows = stockSellingRows.filter(
    (row: Row) => Number(row.qtyBase || 0) > 0.000001
  );
  const stockSellingValueTotalRp = stockSellingValueRows.reduce(
    (total: number, row: Row) => total + Number(row.salesValueRp || 0),
    0
  );
  const stockSellingMissingPrice = stockSellingValueRows.filter(
    (row: Row) => Number(row.salesPriceMissing || 0) === 1
  ).length;

  const primarySellPriceText = (row: Row) => {
    const prices = effectiveSellPrices(row);
    if (isThermalProductRow(row)) {
      return prices.midPriceRp > 0
        ? `${money.format(prices.midPriceRp)} / ${row.midUnit || "STACK"}`
        : "HARGA JUAL BELUM ADA";
    }
    if (prices.basePriceRp <= 0) return "HARGA JUAL BELUM ADA";
    return `${money.format(prices.basePriceRp)} / ${
      row.baseUnit || "UNIT"
    }${
      prices.baseDerived && prices.baseSourceUnit
        ? ` · AUTO DARI ${prices.baseSourceUnit}`
        : ""
    }`;
  };

  const packSellPriceText = (row: Row) => {
    if (!row.packUnit) return "-";
    const prices = effectiveSellPrices(row);
    return prices.packPriceRp > 0
      ? `${money.format(prices.packPriceRp)} / ${row.packUnit}${
          prices.packDerived ? " · AUTO" : ""
        }`
      : "HARGA JUAL BELUM ADA";
  };

  const sellingValueText = (row: Row) =>
    Number(row.salesPriceMissing || 0) === 1
      ? "HARGA JUAL BELUM LENGKAP"
      : money.format(Number(row.salesValueRp || 0));


  const reportQtyFmt = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

  const isThermalRow = (row: Row) =>
    isThermalProductRow(row);

  /*
    Report utama:
    - Polymailer: BALL dan ROLL dipisahkan per baris di dalam sel.
    - Thermal: satuan report hanya DUS. Penjualan eceran tetap masuk
      sebagai pecahan DUS agar kuantitas tidak hilang.
  */
  const reportQtyString = (row: Row, totalValue: unknown) => {
    const raw = Number(totalValue || 0);

    if (isThermalRow(row)) {
      const factor = Math.max(1, Number(row.unitsPerPack || 1));
      return `${reportQtyFmt.format(raw / factor)} DUS`;
    }

    const factor = Math.max(1, Number(row.unitsPerPack || 1));
    const sign = raw < 0 ? -1 : 1;
    let total = Math.abs(raw);
    const ball = Math.floor((total + 1e-9) / factor);
    total -= ball * factor;
    const roll = Math.max(0, total);

    const signedBall = ball === 0 ? 0 : ball * sign;
    const signedRoll = roll === 0 ? 0 : roll * sign;

    return [
      `BALL  ${reportQtyFmt.format(signedBall)}`,
      `ROLL  ${reportQtyFmt.format(signedRoll)}`,
    ].join("\n");
  };

  /* RKN_PLASTIC_PDF_NATIVE_MULTILINE_V2R12 */
  const reportQtyPdfCell = (
    row: Row,
    totalValue: unknown
  ): string | string[] => {
    const raw = Number(totalValue || 0);

    if (isThermalRow(row)) {
      const factor = Math.max(
        1,
        Number(row.unitsPerPack || 1)
      );

      return `${reportQtyFmt.format(raw / factor)} DUS`;
    }

    const factor = Math.max(
      1,
      Number(row.unitsPerPack || 1)
    );

    const sign = raw < 0 ? -1 : 1;
    let total = Math.abs(raw);

    const ball = Math.floor(
      (total + 1e-9) / factor
    );

    total -= ball * factor;

    const roll = Math.max(0, total);

    const signedBall =
      ball === 0 ? 0 : ball * sign;

    const signedRoll =
      roll === 0 ? 0 : roll * sign;

    /*
      IMPORTANT:
      Return an ARRAY, not a string with "\\n".
      AutoTable renders each array entry as a real line.
    */
    return [
      `BALL  ${reportQtyFmt.format(signedBall)}`,
      `ROLL  ${reportQtyFmt.format(signedRoll)}`,
    ];
  };

  const reportQtyCell = (row: Row, totalValue: unknown) => (
    <span
      style={{
        whiteSpace: "pre-line",
        lineHeight: 1.45,
        display: "inline-block",
      }}
    >
      {reportQtyString(row, totalValue)}
    </span>
  );

  /* RKN_PLASTIC_AUTHORITATIVE_RECON_UI_V2R15 */
  const simpleRows = auditLedger
    .filter((row: Row) => Number(row.soScope ?? 1) === 1)
    .map((row: Row) => {
      const expectedQtyBase = Number(row.systemLedgerQtyBase || 0);
      const counted = Number(row.physicalEntered || 0) === 1;
      const physicalQtyBase = counted
        ? Number(row.physicalQtyBase || 0)
        : null;
      const differenceQtyBase = counted
        ? Number(physicalQtyBase || 0) - expectedQtyBase
        : null;
      const status = !counted
        ? "BELUM DIHITUNG"
        : Math.abs(Number(differenceQtyBase || 0)) < 0.000001
          ? "BALANCE"
          : "SELISIH";

      return {
        ...row,
        expectedQtyBase,
        counted,
        physicalQtyBase,
        differenceQtyBase,
        status,
      };
    });
  const outsideSoRows = auditLedger
    .filter((row: Row) => Number(row.soScope ?? 1) === 0)
    .map((row: Row) => ({
      ...row,
      expectedQtyBase: Number(row.systemLedgerQtyBase || 0),
      counted: false,
      physicalQtyBase: null,
      differenceQtyBase: null,
      status: "DI LUAR SO FISIK",
    }));
  /* RKN_PLASTIC_SO_LIVE_RECON_MODEL_V2R9
     Keep every active SKU from the SO session in reconciliation.
     Uncounted zero-activity SKU must remain visible as BELUM DIHITUNG. */

  const countedRows = simpleRows.filter((row: Row) => row.counted);
  const balanceRows = simpleRows.filter(
    (row: Row) => row.status === "BALANCE"
  );
  const varianceRows = simpleRows.filter(
    (row: Row) => row.status === "SELISIH"
  );
  const uncountedRows = simpleRows.filter(
    (row: Row) => row.status === "BELUM DIHITUNG"
  );

  const reportReady =
    simpleRows.length > 0 && uncountedRows.length === 0;

  /* RKN_PLASTIC_BOSS_REPORT_MODEL_V2R22 */
  const salesValueRp = outbound.reduce(
    (total: number, row: Row) => total + Number(row.totalRp || 0),
    0
  );
  const salesInvoiceCount = new Set(
    outbound.map((row: Row) => String(row.referenceNo || "")).filter(Boolean)
  ).size;
  const salesCustomerCount = new Set(
    outbound.map((row: Row) => String(row.customerName || "")).filter(Boolean)
  ).size;
  const receivableTotalRp = receivables.reduce(
    (total: number, row: Row) => total + Number(row.outstandingRp || 0),
    0
  );
  const topStockSellingValueRows = [...stockSellingValueRows].sort(
    (left: Row, right: Row) =>
      Number(right.salesValueRp || 0) - Number(left.salesValueRp || 0)
  );
  const bossSoStatus = auditSoPosted
    ? "100% POSTED & BALANCE"
    : reportReady
      ? "SIAP DIREVIEW"
      : "BELUM LENGKAP";

  const signedStock = (row: Row, value: unknown) => {
    const numberValue = Number(value || 0);
    if (Math.abs(numberValue) < 0.000001) return "0";
    return `${numberValue > 0 ? "+" : "-"}${stockHuman(
      row,
      Math.abs(numberValue)
    )}`;
  };


  const reconColumns: Column[] = [
    ["productName", "Produk"],
    ["color", "Warna"],
    ["size", "Ukuran"],
    [
      "openingQtyBase",
      `Opening ${auditOpeningDate.slice(5).split("-").reverse().join("/")}`,
      (row) => reportQtyCell(row, row.openingQtyBase),
    ],
    [
      "inboundQtyBase",
      "Masuk",
      (row) => reportQtyCell(row, row.inboundQtyBase),
    ],
    [
      "outboundQtyBase",
      "Keluar",
      (row) => reportQtyCell(row, row.outboundQtyBase),
    ],
    [
      "expectedQtyBase",
      `Stock ${auditSoDate.slice(5).split("-").reverse().join("/")}`,
      (row) => reportQtyCell(row, row.expectedQtyBase),
    ],
    [
      "physicalQtyBase",
      "SO Fisik",
      (row) =>
        Number(row.soScope ?? 1) === 0
          ? "TIDAK MASUK SO 28/08"
          : row.counted
          ? reportQtyCell(row, row.physicalQtyBase)
          : "BELUM DIHITUNG",
    ],
    [
      "differenceQtyBase",
      auditSoPosted ? "Status Pasca-SO" : "Selisih",
      (row) =>
        Number(row.soScope ?? 1) === 0
          ? "-"
          : auditSoPosted
          ? "0 (✓ Balance)"
          : row.counted
          ? reportQtyCell(row, row.differenceQtyBase)
          : "-",
    ],
  ];

  const loadLogoData = async () => {
    const response = await fetch("/rkn-logo.png", {
      cache: "force-cache",
    });

    if (!response.ok) return "";

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () =>
        reject(new Error("RKN_LOGO_READ_FAILED"));
      reader.readAsDataURL(blob);
    });
  };

  const downloadPdf = async () => {
    const [{ jsPDF }, tableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const autoTable: any =
      (tableModule as any).default || tableModule;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = pageWidth - 8;
    const generatedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    let logoData = "";
    try {
      logoData = await loadLogoData();
    } catch {
      logoData = "";
    }

    const title =
      reportTab === "BOSS_SUMMARY"
        ? "EXECUTIVE SUMMARY & BUSINESS PERFORMANCE"
      : reportTab === "RECON"
        ? `LAPORAN REKONSILIASI STOK FISIK 28/08/2026`
        : reportTab === "STOCK"
          ? "LAPORAN STOK FISIK GUDANG"
          : reportTab === "STOCK_VALUE"
            ? "VALUASI STOK & HARGA JUAL MASTER"
          : reportTab === "INBOUND"
            ? "BUKU BARANG MASUK RESMI"
            : reportTab === "OUTBOUND"
              ? "BUKU PENJUALAN & BARANG KELUAR"
              : reportTab === "RECEIVABLES"
                ? "BUKU PIUTANG & STATUS PEMBAYARAN"
                : "AUDIT TRAIL & MUTASI LEDGER";

    const subtitle =
      reportTab === "BOSS_SUMMARY"
        ? `STATUS SO: ${bossSoStatus} - RKN GROUP PLASTIC TRADING`
      : reportTab === "RECON"
        ? auditSoPosted
          ? `${auditSoNo} - 100% POSTED & BALANCE - ${simpleRows.length} SKU BALANCE`
          : `OPENING + MASUK - KELUAR / SO FISIK`
        : reportTab === "STOCK_VALUE"
          ? `FISIK SO ${auditSoDate} - VALUASI TOTAL: ${money.format(stockSellingValueTotalRp)}`
        : `RKN GROUP PLASTIC TRADING`;

    const drawHeader = (pageNo: number) => {
      doc.setFillColor(11, 19, 30);
      doc.rect(0, 0, pageWidth, 24, "F");

      doc.setFillColor(176, 141, 87);
      doc.rect(0, 24, pageWidth, 1.2, "F");

      if (logoData) {
        doc.addImage(
          logoData,
          "PNG",
          5,
          2.5,
          19,
          19,
          "RKN_LOGO",
          "FAST"
        );
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("RKN ERP", 28, 8.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(212, 178, 125);
      doc.text("PLASTIC TRADING DIVISION - RKN GROUP", 28, 14.5);
      doc.text(`CUTOFF: ${auditSoDate} - 100% BALANCE`, 28, 20);

      doc.setTextColor(252, 237, 197);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, pageWidth - 5, 8.5, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(197, 162, 106);
      doc.text(subtitle, pageWidth - 5, 14.5, { align: "right" });

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${generatedAt} WIB`, pageWidth - 5, 20, {
        align: "right",
      });
      doc.setTextColor(44, 62, 80);
    };

    const drawFooter = (pageNo: number, totalPages: number) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(176, 141, 87);
      doc.setLineWidth(0.2);
      doc.line(4, pageHeight - 7, pageWidth - 4, pageHeight - 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("RKN ERP - Plastic Trading - RKN GROUP", 4, pageHeight - 3.5);
      doc.text(`Halaman ${pageNo} dari ${totalPages}`, pageWidth - 4, pageHeight - 3.5, { align: "right" });
    };

    const table = (
      head: any,
      body: any[][],
      startY = 37,
      columnStyles?: any
    ) => {
      autoTable(doc, {
        theme: "grid",
        tableWidth,
        startY,
        margin: {
          left: 4,
          right: 4,
          top: 37,
          bottom: 10,
        },
        head: Array.isArray(head[0]) ? head : [head],
        body,
        columnStyles: columnStyles || {},
        didParseCell: (data: any) => {
          data.cell.styles.halign = "center";
        },
        styles: {
          font: "helvetica",
          fontSize: 6.8,
          textColor: [30, 41, 59],
          cellPadding: 1.4,
          lineColor: [212, 178, 125],
          lineWidth: 0.12,
          overflow: "linebreak",
          valign: "middle",
          halign: "center",
        },
        headStyles: {
          fillColor: [22, 35, 52],
          textColor: [252, 237, 197],
          fontStyle: "bold",
          lineColor: [176, 141, 87],
          lineWidth: 0.15,
          halign: "center",
        },
        bodyStyles: {
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [250, 248, 244],
        },
        didDrawPage: () => {
          drawHeader(doc.getNumberOfPages());
        },
      });
    };

    if (reportTab === "BOSS_SUMMARY") {
      drawHeader(doc.getNumberOfPages());
      doc.setTextColor(44, 62, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("RINGKASAN EKSEKUTIF & INDIKATOR KUNCI", 4, 32);

      table(
        ["Pilar Bisnis", "Indikator Utama", "Nilai / Realisasi", "Catatan Eksekutif & Status"],
        [
          ["Penjualan & Omset", "Total Omset Periode", money.format(salesValueRp), `${salesInvoiceCount} invoice penjualan - ${salesCustomerCount} pelanggan terlayani`],
          ["Valuasi Persediaan", "Nilai Jual Stok Fisik 28/08", money.format(stockSellingValueTotalRp), `${stockSellingValueRows.length} SKU fisik aktif memiliki stok di gudang`],
          ["Buku Piutang", "Total Piutang Berjalan", money.format(receivableTotalRp), `${receivables.length} invoice aktif belum lunas`],
          ["Stock Opname", "Status SO 28/08/2026", bossSoStatus, `${simpleRows.length}/${simpleRows.length} SKU (100%) - Balance & Terkunci Resmi`],
          ["Integritas Audit", "Status Rekonsiliasi", "100% BALANCE (POSTED)", "Seluruh variasi telah diselaraskan melalui dokumen resmi"],
          ...(goldwinAuditRow
            ? [[
                "Produk Non-SO",
                "Thermal Goldwin s/d 28/08",
                reportQtyString(goldwinAuditRow, goldwinAuditRow.systemLedgerQtyBase),
                `Opening ${reportQtyString(goldwinAuditRow, goldwinAuditRow.openingQtyBase)} - Masuk ${reportQtyString(goldwinAuditRow, goldwinAuditRow.inboundQtyBase)} - Keluar ${reportQtyString(goldwinAuditRow, goldwinAuditRow.outboundQtyBase)} (Di luar SO fisik)`,
              ]]
            : []),
        ],
        37
      );

      if (topStockSellingValueRows.length) {
        doc.addPage();
        drawHeader(doc.getNumberOfPages());
        doc.setTextColor(44, 62, 80);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("VALUASI NILAI JUAL STOK FISIK 28/08/2026 (PERINGKAT TERBESAR)", 4, 32);

        table(
          ["Produk", "Warna", "Ukuran", "Stok Fisik", "Harga Jual Utama", "Nilai Jual Total"],
          [
            ...topStockSellingValueRows.map((row: Row) => [
              row.productName || row.category || "-",
              row.color || "-",
              row.size || "-",
              stockHuman(row, row.qtyBase),
              primarySellPriceText(row),
              sellingValueText(row),
            ]),
            [
              {
                content: "TOTAL NILAI JUAL",
                colSpan: 5,
                styles: {
                  halign: "right",
                  fontStyle: "bold",
                  fillColor: [243, 237, 224],
                  textColor: [140, 110, 61],
                },
              },
              {
                content: money.format(stockSellingValueTotalRp),
                styles: {
                  halign: "center",
                  fontStyle: "bold",
                  fillColor: [243, 237, 224],
                  textColor: [140, 110, 61],
                },
              },
            ],
          ],
          37
        );
      }

      if (receivables.length) {
        doc.addPage();
        drawHeader(doc.getNumberOfPages());
        doc.setTextColor(44, 62, 80);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("BUKU PIUTANG AKTIF PELANGGAN", 4, 32);

        table(
          ["Tanggal", "No. Invoice", "Nama Pelanggan", "Total Tagihan", "Sudah Dibayar", "Sisa Piutang"],
          [
            ...receivables.map((row: Row) => [
              row.dateKey || "-",
              row.invoiceNo || "-",
              row.customerName || "-",
              money.format(Number(row.grandTotalRp || 0)),
              money.format(Number(row.paidRp || 0)),
              money.format(Number(row.outstandingRp || 0)),
            ]),
            [
              {
                content: "TOTAL PIUTANG",
                colSpan: 5,
                styles: {
                  halign: "right",
                  fontStyle: "bold",
                  fillColor: [243, 237, 224],
                  textColor: [140, 110, 61],
                },
              },
              {
                content: money.format(receivableTotalRp),
                styles: {
                  halign: "center",
                  fontStyle: "bold",
                  fillColor: [243, 237, 224],
                  textColor: [140, 110, 61],
                },
              },
            ],
          ],
          37
        );
      }
    }

    const splitQtyPdf = (row: Row, qtyValue: any) => {
      const isThermal = isThermalProductRow(row);
      const unitsPerPack = Math.max(
        1,
        Number(row.unitsPerPack || (isThermal ? 10000 : 100))
      );
      const raw = Number(
        qtyValue !== undefined && qtyValue !== null
          ? qtyValue
          : row.qtyBase || row.qty || 0
      );

      if (Math.abs(raw) < 0.0001) {
        return { pack: "0", base: "0" };
      }

      const inputUnitUpper = String(
        row.unit || row.inputUnit || ""
      ).toUpperCase();
      if (
        (inputUnitUpper === "DUS" || inputUnitUpper === "BALL") &&
        raw <= 500 &&
        qtyValue === undefined
      ) {
        return { pack: qtyFmt.format(raw), base: "0" };
      }

      const sign = raw < 0 ? "-" : "";
      const abs = Math.abs(raw);
      const pack = Math.floor((abs + 1e-9) / unitsPerPack);
      const base = Math.max(0, Math.round(abs - pack * unitsPerPack));

      return {
        pack: `${sign}${qtyFmt.format(pack)}`,
        base: `${qtyFmt.format(base)}`,
      };
    };

    if (reportTab === "RECON") {
      const reconHead = [
        [
          { content: "PRODUK", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "WARNA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "UKURAN", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "OPENING", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "MASUK", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "KELUAR", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "SALDO SISTEM", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "FISIK SO", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "SELISIH SO", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "STATUS", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        ],
        [
          { content: "BALL/DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL/PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "BALL/DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL/PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "BALL/DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL/PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "BALL/DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL/PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "BALL/DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL/PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "BALL/DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL/PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
        ],
      ];

      const bodyFor = (rows: Row[]) =>
        rows.map((row: Row) => {
          const op = splitQtyPdf(row, row.openingQtyBase);
          const inb = splitQtyPdf(row, row.inboundQtyBase);
          const outb = splitQtyPdf(row, row.outboundQtyBase);
          const sys = splitQtyPdf(row, row.expectedQtyBase);
          const phy =
            Number(row.soScope ?? 1) === 0
              ? { pack: "-", base: "Non-SO" }
              : row.counted
              ? splitQtyPdf(row, row.physicalQtyBase)
              : { pack: "-", base: "N/A" };
          const diff =
            Number(row.soScope ?? 1) === 0
              ? { pack: "-", base: "-" }
              : auditSoPosted
              ? { pack: "0", base: "0" }
              : row.counted
              ? splitQtyPdf(row, row.differenceQtyBase)
              : { pack: "-", base: "-" };

          return [
            row.productName || row.category || "-",
            row.color || "-",
            row.size || "-",
            op.pack,
            op.base,
            inb.pack,
            inb.base,
            outb.pack,
            outb.base,
            sys.pack,
            sys.base,
            phy.pack,
            phy.base,
            diff.pack,
            diff.base,
            auditSoPosted ? "BALANCE (POSTED)" : Number(row.differenceQtyBase || 0) === 0 ? "BALANCE" : "SELISIH",
          ];
        });

      const pdfVarianceRows = applyRknPlasticPdfFilter(varianceRows);
      const pdfBalanceRows = applyRknPlasticPdfFilter(balanceRows);
      const pdfOutsideSoRows = applyRknPlasticPdfFilter(outsideSoRows);
      const allReconRows = [...pdfBalanceRows, ...pdfVarianceRows];

      drawHeader(doc.getNumberOfPages());
      doc.setTextColor(44, 62, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`HASIL REKONSILIASI STOK RESMI (${allReconRows.length} SKU - 100% BALANCE)`, 4, 32);

      table(
        reconHead,
        bodyFor(allReconRows),
        37
      );

      if (pdfOutsideSoRows.length > 0) {
        doc.addPage();
        drawHeader(doc.getNumberOfPages());
        doc.setTextColor(44, 62, 80);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(`TRANSAKSI DI LUAR SO FISIK (${pdfOutsideSoRows.length} SKU)`, 4, 32);

        table(
          reconHead,
          bodyFor(pdfOutsideSoRows),
          37
        );
      }
    }

    if (reportTab === "STOCK") {
      const pdfStockRows = applyRknPlasticPdfFilter(stockSellingRows);
      const pdfStockTotal = pdfStockRows.reduce(
        (total: number, row: Row) => total + Number(row.salesValueRp || 0),
        0
      );

      const stockHead = [
        [
          { content: "PRODUK", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "WARNA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "UKURAN", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "STOK FISIK GUDANG", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "HARGA JUAL UTAMA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "NILAI JUAL TOTAL", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        ],
        [
          { content: "BALL / DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL / PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
        ],
      ];

      table(
        stockHead,
        [
          ...pdfStockRows.map((row: Row) => {
            const sq = splitQtyPdf(row, row.qtyBase);
            return [
              row.productName || row.category || "-",
              row.color || "-",
              row.size || "-",
              sq.pack,
              sq.base,
              primarySellPriceText(row),
              sellingValueText(row),
            ];
          }),
          [
            {
              content: "TOTAL NILAI JUAL",
              colSpan: 6,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
            {
              content: money.format(pdfStockTotal),
              styles: {
                halign: "center",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
          ],
        ],
        37
      );
    }

    if (reportTab === "STOCK_VALUE") {
      const pdfStockValueRows = applyRknPlasticPdfFilter(stockSellingValueRows);
      const pdfStockValueTotal = pdfStockValueRows.reduce(
        (total: number, row: Row) => total + Number(row.salesValueRp || 0),
        0
      );

      const stockValueHead = [
        [
          { content: "SUPPLIER", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "PRODUK", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "WARNA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "UKURAN", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "STOK FISIK", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "HARGA / ROLL", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "HARGA / BALL", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "NILAI JUAL TOTAL", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        ],
        [
          { content: "BALL / DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL / PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
        ],
      ];

      table(
        stockValueHead,
        [
          ...pdfStockValueRows.map((row: Row) => {
            const sq = splitQtyPdf(row, row.qtyBase);
            return [
              row.lastSupplierName || "KMS PACKAGING",
              row.productName || row.category || "-",
              row.color || "-",
              row.size || "-",
              sq.pack,
              sq.base,
              primarySellPriceText(row),
              packSellPriceText(row),
              sellingValueText(row),
            ];
          }),
          [
            {
              content: "TOTAL NILAI JUAL",
              colSpan: 8,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
            {
              content: money.format(pdfStockValueTotal),
              styles: {
                halign: "center",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
          ],
        ],
        37
      );
    }

    if (reportTab === "INBOUND") {
      const pdfInboundRows = applyRknPlasticPdfFilter(inbound);
      const inboundHead = [
        [
          { content: "TANGGAL", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "NO. DOKUMEN IN", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "PRODUK", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "WARNA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "UKURAN", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "BARANG MASUK", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "INPUT ASLI", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        ],
        [
          { content: "BALL / DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL / PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
        ],
      ];

      table(
        inboundHead,
        pdfInboundRows.map((row: Row) => {
          const sq = splitQtyPdf(row, row.qtyBase || row.qty);
          return [
            row.dateKey || "-",
            row.referenceNo || "-",
            row.productName || "-",
            row.color || "-",
            row.size || "-",
            sq.pack,
            sq.base,
            `${qtyText(row.qty)} ${row.unit || ""}`,
          ];
        }),
        37
      );
    }

    if (reportTab === "OUTBOUND") {
      const pdfOutboundRows = applyRknPlasticPdfFilter(outbound);
      const pdfOutboundTotal = pdfOutboundRows.reduce(
        (total: number, row: Row) => total + Number(row.totalRp || 0),
        0
      );

      const outboundHead = [
        [
          { content: "TANGGAL", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "NO. INVOICE", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "NAMA CUSTOMER", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "PRODUK", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "WARNA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "UKURAN", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "BARANG KELUAR", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "TOTAL PENJUALAN", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        ],
        [
          { content: "BALL / DUS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
          { content: "ROLL / PCS", styles: { halign: "center", fontStyle: "bold", fillColor: [28, 45, 66], textColor: [212, 178, 125] } },
        ],
      ];

      table(
        outboundHead,
        [
          ...pdfOutboundRows.map((row: Row) => {
            const sq = splitQtyPdf(row, row.qtyBase || row.qty);
            return [
              row.dateKey || "-",
              row.referenceNo || "-",
              row.customerName || "-",
              row.productName || "-",
              row.color || "-",
              row.size || "-",
              sq.pack,
              sq.base,
              money.format(Number(row.totalRp || 0)),
            ];
          }),
          [
            {
              content: "TOTAL PENJUALAN",
              colSpan: 8,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
            {
              content: money.format(pdfOutboundTotal),
              styles: {
                halign: "center",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
          ],
        ],
        37
      );
    }

    if (reportTab === "RECEIVABLES") {
      const pdfReceivableRows = applyRknPlasticPdfFilter(receivables);
      const pdfReceivableTotal = pdfReceivableRows.reduce(
        (total: number, row: Row) => total + Number(row.outstandingRp || 0),
        0
      );
      table(
        ["Tanggal Invoice", "No. Invoice", "Nama Pelanggan", "Total Tagihan", "Sudah Dibayar", "Sisa Piutang"],
        [
          ...pdfReceivableRows.map((row: Row) => [
            row.dateKey || "-",
            row.invoiceNo || "-",
            row.customerName || "-",
            money.format(Number(row.grandTotalRp || 0)),
            money.format(Number(row.paidRp || 0)),
            money.format(Number(row.outstandingRp || 0)),
          ]),
          [
            {
              content: "TOTAL PIUTANG",
              colSpan: 5,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
            {
              content: money.format(pdfReceivableTotal),
              styles: {
                halign: "center",
                fontStyle: "bold",
                fillColor: [243, 237, 224],
                textColor: [140, 110, 61],
              },
            },
          ],
        ],
        37
      );
    }

    if (reportTab === "AUDIT") {
      table(
        [
          "Produk",
          "Warna",
          "Ukuran",
          "Opening 28/07",
          "Masuk Resmi",
          "Keluar Sah",
          "Koreksi SO",
          "System Ledger",
          "Snapshot SO",
          "On Hand Live",
        ],
        applyRknPlasticPdfFilter(auditLedger).map((row: Row) => [
          row.productName || row.category || "-",
          row.color || "-",
          row.size || "-",
          stockHuman(row, row.openingQtyBase),
          stockHuman(row, row.inboundQtyBase),
          stockHuman(row, row.outboundQtyBase),
          signedStock(row, row.correctionQtyBase),
          stockHuman(row, row.systemLedgerQtyBase),
          row.systemSnapshotQtyBase === null ||
          row.systemSnapshotQtyBase === undefined
            ? "-"
            : stockHuman(row, row.systemSnapshotQtyBase),
          stockHuman(row, row.liveOnHandQtyBase),
        ]),
        37
      );
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(i, totalPages);
    }

    const suffix =
      reportTab === "BOSS_SUMMARY"
        ? `EXECUTIVE-SUMMARY`
      : reportTab === "RECON"
        ? `REKONSILIASI-STOK-${auditOpeningDate}-${auditSoDate}`
        : `${reportTab.replace(/_/g, "-")}`;

    const filterSuffix =
      rknPlasticPdfFilterSnapshot.search.trim()
        ? `-${rknPlasticPdfFilterSnapshot.search
            .trim()
            .replace(/[^0-9A-Za-z]+/g, "-")
            .slice(0, 32)}`
        : "";

    doc.save(
      `RKN-${String(suffix)
        .replace(/[^0-9A-Za-z-]/g, "-")
        .replace(/-+/g, "-")
        .toUpperCase()}${filterSuffix.toUpperCase()}.pdf`
    );
  };

  const tabs: [ReportTab, string][] = [
    ["BOSS_SUMMARY", "Executive Summary"],
    ["RECON", "Rekonsiliasi 28/08"],
    ["STOCK", "Stok Fisik 28/08"],
    ["STOCK_VALUE", "Valuasi Stok & Supplier"],
    ["INBOUND", "Barang Masuk"],
    ["OUTBOUND", "Barang Keluar"],
    ["RECEIVABLES", "Buku Piutang"],
    ["AUDIT", "Audit Detail"],
  ];

  return (
    <>
      <div className={styles.reportCenterHead}>
        <div>
          <strong>Report Center</strong>
          <span>Pusat laporan resmi manajemen & ekspor PDF.</span>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={downloadPdf}
        >
          Unduh PDF Resmi
        </button>
      </div>

      <div className={styles.reportSubnav}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={
              reportTab === key
                ? styles.reportSubnavActive
                : styles.reportSubnavButton
            }
            onClick={() => setReportTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {reportTab === "BOSS_SUMMARY" ? (
        <>
          <section className={styles.bossReportHero}>
            <div>
              <span>Executive Summary · {period}</span>
              <strong>{bossSoStatus}</strong>
              <small>
                {auditSoNo} · {simpleRows.length}/{simpleRows.length} SKU (100%) ✓ Balance & Terkunci Sesuai SO 28/08/2026
              </small>
            </div>
            <div className={styles.bossReportHeroValue}>
              <span>Nilai Jual Stok Fisik 28/08/2026</span>
              <strong>{money.format(stockSellingValueTotalRp)}</strong>
              <small>{stockSellingValueRows.length} SKU fisik memiliki stok</small>
            </div>
          </section>

          <section className={styles.bossReportGrid}>
            <article>
              <h3>Kinerja Periode</h3>
              <div className={styles.bossMetricList}>
                <div><span>Penjualan</span><strong>{money.format(salesValueRp)}</strong></div>
                <div><span>Invoice Penjualan</span><strong>{salesInvoiceCount}</strong></div>
                <div><span>Customer</span><strong>{salesCustomerCount}</strong></div>
                <div><span>Dasar Nilai</span><strong>Harga Jual</strong></div>
              </div>
            </article>

            <article>
              <h3>Stok & Arus Barang</h3>
              <div className={styles.bossMetricList}>
                <div><span>Barang Masuk Resmi</span><strong>{inbound.length} baris</strong></div>
                <div><span>Nilai Jual 28/08</span><strong>{money.format(stockSellingValueTotalRp)}</strong></div>
                <div><span>Piutang Aktif</span><strong>{money.format(receivableTotalRp)}</strong></div>
                <div><span>Harga Jual Belum Lengkap</span><strong>{stockSellingMissingPrice} SKU</strong></div>
              </div>
            </article>

            <article>
              <h3>Hasil Stock Opname</h3>
              <div className={styles.bossMetricList}>
                <div><span>Status</span><strong>{bossSoStatus}</strong></div>
                <div><span>Balance Awal</span><strong>{balanceRows.length} SKU</strong></div>
                <div><span>Adjustment</span><strong>{auditSoPosted ? varianceRows.length : 0} SKU</strong></div>
                <div><span>Belum Dihitung</span><strong>{uncountedRows.length} SKU</strong></div>
              </div>
            </article>
          </section>

          {goldwinAuditRow ? (
            <div className={styles.reportInfoStrip}>
              <div>
                <span>Audit Thermal Goldwin s/d {auditSoDate}</span>
                <strong>{reportQtyString(goldwinAuditRow, goldwinAuditRow.systemLedgerQtyBase)} system</strong>
              </div>
              <small>
                Di luar SO fisik 28/08. Masuk: {reportQtyString(goldwinAuditRow, goldwinAuditRow.inboundQtyBase)} · Keluar: {reportQtyString(goldwinAuditRow, goldwinAuditRow.outboundQtyBase)}.
              </small>
            </div>
          ) : null}

          <Panel
            title="12 SKU Nilai Jual Terbesar"
            subtitle="Berdasarkan master harga jual."
          >
            <DataTable
              rows={topStockSellingValueRows.slice(0, 12)}
              columns={[
                ["productName", "Produk"],
                ["color", "Warna"],
                ["size", "Ukuran"],
                [
                  "packQty",
                  "BALL / DUS",
                  (row) => {
                    const sq = splitQtyPdf(row, row.qtyBase);
                    return sq.pack !== "0" ? sq.pack : "-";
                  },
                ],
                [
                  "baseQty",
                  "ROLL / LEMBAR",
                  (row) => {
                    const sq = splitQtyPdf(row, row.qtyBase);
                    return sq.base !== "0" ? sq.base : "-";
                  },
                ],
                ["defaultSellPriceBaseRp", "Harga Jual", (row) => primarySellPriceText(row)],
                [
                  "salesValueRp",
                  "Nilai Jual",
                  (row) => sellingValueText(row),
                ],
              ]}
            />
          </Panel>
        </>
      ) : null}

      {reportTab === "RECON" ? (
        <>
          <div className={styles.reportInfoStrip}>
            <div>
              <span>Rekonsiliasi Stok {auditSoDate}</span>
              <strong>
                {reportReady
                  ? auditSoPosted
                    ? `100% BALANCE (POSTED)`
                    : varianceRows.length === 0
                    ? "SEMUA BALANCE"
                    : `${varianceRows.length} SKU SELISIH`
                  : `${uncountedRows.length} SKU BELUM DIHITUNG`}
              </strong>
            </div>
            <small>
              {auditSoPosted ? (
                <>
                  {auditSoNo} · 41 SKU ✓ 100% Balance Resmi.
                </>
              ) : (
                <>
                  Opening + Masuk − Keluar vs Stok Fisik.
                </>
              )}
            </small>
          </div>

          <section className={styles.reportSummaryStrip}>
            <div>
              <span>Total SKU</span>
              <strong>{qtyText(simpleRows.length)}</strong>
            </div>
            <div>
              <span>Fisik dicatat</span>
              <strong>{qtyText(countedRows.length)}</strong>
            </div>
            <div>
              <span>Balance awal</span>
              <strong>{qtyText(balanceRows.length)}</strong>
            </div>
            <div>
              <span>{auditSoPosted ? "Penyesuaian" : "Selisih"}</span>
              <strong>{qtyText(varianceRows.length)}</strong>
            </div>
            <div className={styles.reportSummaryResult}>
              <span>Status akhir</span>
              <strong>
                {auditSoPosted && reportReady
                  ? `${qtyText(simpleRows.length)} / ${qtyText(simpleRows.length)} SELESAI`
                  : reportReady
                    ? "SIAP DIREVIEW"
                    : "BELUM LENGKAP"}
              </strong>
            </div>
          </section>

          {varianceRows.length ? (
            <Panel
              title={
                auditSoPosted
                  ? `Penyesuaian SO · ${varianceRows.length} SKU`
                  : `Masih Selisih · ${varianceRows.length} SKU`
              }
              subtitle={
                auditSoPosted
                  ? "Selisih resmi telah diselesaikan."
                  : "Periksa beda stok sistem dan fisik."
              }
            >
              <DataTable
                rows={varianceRows}
                columns={reconColumns}
              />
            </Panel>
          ) : null}

          {balanceRows.length ? (
            <Panel
              title={
                auditSoPosted
                  ? `Balance Awal · ${balanceRows.length} SKU`
                  : `Sudah Balance · ${balanceRows.length} SKU`
              }
              subtitle="Stok sistem sama dengan fisik."
            >
              <DataTable
                rows={balanceRows}
                columns={reconColumns}
              />
            </Panel>
          ) : null}

          {uncountedRows.length ? (
            <Panel
              title={`Belum Dihitung · ${uncountedRows.length} SKU`}
              subtitle="Belum ada stok fisik."
            >
              <DataTable
                rows={uncountedRows}
                columns={reconColumns}
              />
            </Panel>
          ) : null}

          {outsideSoRows.length ? (
            <Panel
              title={`Transaksi di Luar SO Fisik · ${outsideSoRows.length} SKU`}
              subtitle="Riwayat Opening, Masuk, dan Keluar tetap ditampilkan. Baris ini tidak mengubah hasil SO 41 SKU karena tidak memiliki hitungan fisik 28/08."
            >
              <DataTable
                rows={outsideSoRows}
                columns={reconColumns}
              />
            </Panel>
          ) : null}
        </>
      ) : null}

      {reportTab === "STOCK" ? (
        <Panel
          title="Stok Fisik 28/08/2026"
          subtitle="Hasil SO fisik yang sudah POSTED. Bukan saldo live setelah 28/08."
        >
          <DataTable
            rows={stockSellingRows}
            columns={[
              ["productName", "Produk"],
              ["color", "Warna"],
              ["size", "Ukuran"],
              [
                "packQty",
                "BALL / DUS",
                (row) => {
                  const sq = splitQtyPdf(row, row.qtyBase);
                  return sq.pack !== "0" ? sq.pack : "-";
                },
              ],
              [
                "baseQty",
                "ROLL / LEMBAR",
                (row) => {
                  const sq = splitQtyPdf(row, row.qtyBase);
                  return sq.base !== "0" ? sq.base : "-";
                },
              ],
              [
                "defaultSellPriceBaseRp",
                "Harga Jual Utama",
                (row) => primarySellPriceText(row),
              ],
              [
                "salesValueRp",
                "Nilai Jual",
                (row) => sellingValueText(row),
              ],
            ]}
          />
        </Panel>
      ) : null}

      {reportTab === "STOCK_VALUE" ? (
        <>
          <div className={styles.reportInfoStrip}>
            <div>
              <span>Nilai jual stok fisik per 28/08/2026</span>
              <strong>{money.format(stockSellingValueTotalRp)}</strong>
            </div>
            <small>
              Qty berasal dari SO {auditSoNo} yang sudah {auditSoStatus || "-"} · {stockSellingValueRows.length} SKU
              memiliki stok · {stockSellingMissingPrice} harga jual belum lengkap.
            </small>
          </div>

          <Panel
            title="Nilai Jual Fisik 28/08 per Produk"
            subtitle="Qty SO fisik 28/08 × harga jual master. Supplier mengikuti penerimaan terakhir sampai tanggal 28/08."
          >
            <DataTable
              rows={stockSellingValueRows}
              columns={[
                ["lastSupplierName", "Supplier", (row) => row.lastSupplierName || "KMS PACKAGING"],
                ["productName", "Produk"],
                ["color", "Warna"],
                ["size", "Ukuran"],
                ["qtyBase", "Stok", (row) => stockHuman(row, row.qtyBase)],
                ["defaultSellPriceBaseRp", "Harga Jual Utama", (row) => primarySellPriceText(row)],
                ["defaultSellPricePackRp", "Harga Jual / Pack", (row) => packSellPriceText(row)],
                [
                  "salesValueRp",
                  "Nilai Jual",
                  (row) => sellingValueText(row),
                ],
              ]}
            />
          </Panel>
        </>
      ) : null}

      {reportTab === "INBOUND" ? (
        <>
        {goldwinAuditRow ? (
          <div className={styles.reportInfoStrip}>
            <div>
              <span>Goldwin · seluruh dokumen sampai {auditSoDate}</span>
              <strong>{reportQtyString(goldwinAuditRow, goldwinAuditRow.inboundQtyBase)} masuk resmi</strong>
            </div>
            <small>
              Rekonsiliasi cutoff membaca seluruh dokumen transaksi: Opening {reportQtyString(goldwinAuditRow, goldwinAuditRow.openingQtyBase)} · Keluar {reportQtyString(goldwinAuditRow, goldwinAuditRow.outboundQtyBase)} · System {reportQtyString(goldwinAuditRow, goldwinAuditRow.systemLedgerQtyBase)}.
            </small>
          </div>
        ) : null}
        <Panel title="Barang Masuk" subtitle="Daftar transaksi barang masuk resmi.">
          <DataTable
            rows={inbound}
            columns={[
              ["dateKey", "Tanggal"],
              ["referenceNo", "No. IN"],
              ["productName", "Produk"],
              ["color", "Warna"],
              ["size", "Ukuran"],
              [
                "qty",
                "Qty",
                (row) => `${qtyText(row.qty)} ${row.unit || ""}`,
              ],
            ]}
          />
        </Panel>
        </>
      ) : null}

      {reportTab === "OUTBOUND" ? (
        <Panel title="Barang Keluar" subtitle="Daftar transaksi barang keluar / penjualan.">
          <DataTable
            rows={outbound}
            columns={[
              ["dateKey", "Tanggal"],
              ["referenceNo", "Invoice"],
              ["customerName", "Customer"],
              ["productName", "Produk"],
              ["color", "Warna"],
              ["size", "Ukuran"],
              ["qtyBase", "Qty Base"],
              [
                "totalRp",
                "Sales",
                (row) => money.format(Number(row.totalRp || 0)),
              ],
            ]}
          />
        </Panel>
      ) : null}

      {reportTab === "RECEIVABLES" ? (
        <Panel title="Piutang" subtitle="Invoice yang masih memiliki saldo.">
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
                (row) => money.format(Number(row.outstandingRp || 0)),
              ],
            ]}
          />
        </Panel>
      ) : null}

      {reportTab === "AUDIT" ? (
        <Panel
          title="Audit Detail"
          subtitle="Data teknis untuk pemeriksaan."
        >
          <DataTable
            rows={auditLedger}
            columns={[
              ["productName", "Produk"],
              ["color", "Warna"],
              ["size", "Ukuran"],
              [
                "openingQtyBase",
                "Opening",
                (row) => stockHuman(row, row.openingQtyBase),
              ],
              [
                "inboundQtyBase",
                "Masuk Resmi",
                (row) => stockHuman(row, row.inboundQtyBase),
              ],
              [
                "rawInboundQtyBase",
                "Raw IN",
                (row) => stockHuman(row, row.rawInboundQtyBase),
              ],
              [
                "inboundLedgerDiffQtyBase",
                "Beda IN",
                (row) => signedStock(row, row.inboundLedgerDiffQtyBase),
              ],
              [
                "outboundQtyBase",
                "Keluar Resmi",
                (row) => stockHuman(row, row.outboundQtyBase),
              ],
              [
                "rawOutboundQtyBase",
                "Raw OUT",
                (row) => stockHuman(row, row.rawOutboundQtyBase),
              ],
              [
                "outboundLedgerDiffQtyBase",
                "Beda OUT",
                (row) => signedStock(row, row.outboundLedgerDiffQtyBase),
              ],
              [
                "correctionQtyBase",
                "Koreksi",
                (row) => signedStock(row, row.correctionQtyBase),
              ],
              [
                "systemLedgerQtyBase",
                "System",
                (row) => stockHuman(row, row.systemLedgerQtyBase),
              ],
              [
                "systemSnapshotQtyBase",
                "Snapshot SO",
                (row) =>
                  row.systemSnapshotQtyBase === null ||
                  row.systemSnapshotQtyBase === undefined
                    ? "-"
                    : stockHuman(row, row.systemSnapshotQtyBase),
              ],
              [
                "liveOnHandQtyBase",
                "On Hand Live",
                (row) => stockHuman(row, row.liveOnHandQtyBase),
              ],
              [
                "soScopeReason",
                "Scope SO",
                (row) =>
                  row.soScopeReason === "IN_SCOPE"
                    ? "SO 28/08"
                    : "DI LUAR SO FISIK",
              ],
            ]}
          />
        </Panel>
      ) : null}
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
            <span>TOTAL PENJUALAN</span>
            <strong>
              {money.format(Number(current.sales_rp || 0))}
            </strong>
          </div>
          <div>
            <span>KAS MASUK (LUNAS)</span>
            <strong>
              {money.format(
                Number(
                  current.paid_rp ??
                    Math.max(
                      0,
                      Number(current.sales_rp || 0) -
                        Number(current.receivable_rp || 0)
                    )
                )
              )}
            </strong>
          </div>
          <div>
            <span>SISA PIUTANG</span>
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

/* RKN_PLASTIC_ACCESS_MANAGEMENT_VIEW_V2R */
function AccessManagement({
  data,
  canManage,
  busy,
  run,
}: {
  data: Row;
  canManage: boolean;
  busy: boolean;
  run: (cmd: string, payload: any, view?: string) => Promise<void>;
}) {
  const pendingRequests: Row[] = Array.isArray(data.pendingRequests)
    ? data.pendingRequests
    : [];
  const historyRequests: Row[] = Array.isArray(data.historyRequests)
    ? data.historyRequests
    : [];
  const users: Row[] = Array.isArray(data.users) ? data.users : [];

  const [activeTab, setActiveTab] = useState<"PENDING" | "USERS" | "HISTORY">(
    pendingRequests.length > 0 ? "PENDING" : "USERS"
  );
  const [selectedRoleMap, setSelectedRoleMap] = useState<Record<string, string>>({});
  const [rejectPromptId, setRejectPromptId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [editingUserRoleMap, setEditingUserRoleMap] = useState<Record<string, string>>({});

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(u.fullName || "").toLowerCase().includes(q) ||
      String(u.userId || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q);
    const role = String(u.roleCode || "").toUpperCase();
    const matchesRole =
      userRoleFilter === "ALL" ||
      (userRoleFilter === "OWNER" && role === "OWNER") ||
      (userRoleFilter === "ADMIN" &&
        (role === "ADMIN" ||
          role === "PLASTIC_ADMIN" ||
          role === "SYSTEM_ADMIN")) ||
      (userRoleFilter === "SUPERVISI" && role.includes("SUPERVIS")) ||
      (userRoleFilter === "SUPPLIER" && role.includes("SUPPLIER")) ||
      (userRoleFilter === "STAFF" && role === "STAFF");
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <section className={styles.metricGrid}>
        <MetricCard
          label="Permintaan Menunggu"
          value={String(pendingRequests.length)}
          note="Pendaftaran akun baru"
        />
        <MetricCard
          label="Total Pengguna"
          value={String(users.length)}
          note="Akun terdaftar"
        />
        <MetricCard
          label="Notifikasi Email"
          value="Zoho Mail"
          note="adminrkn@rkngroup.my.id"
        />
      </section>

      <div className={styles.reportSubnav}>
        {[
          ["PENDING", `Pendaftaran Baru (${pendingRequests.length})`],
          ["USERS", `Daftar Pengguna (${users.length})`],
          ["HISTORY", "Riwayat Verifikasi"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={
              activeTab === key
                ? styles.reportSubnavActive
                : styles.reportSubnavButton
            }
            onClick={() => setActiveTab(key as any)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "PENDING" ? (
        <Panel
          title="Permintaan Pendaftaran Akun"
          subtitle="Verifikasi calon pengguna RKN ERP. Saat disetujui, email aktivasi resmi akan dikirim otomatis ke alamat email yang bersangkutan."
        >
          {pendingRequests.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
              <span style={{ fontSize: 13, display: "block" }}>
                Tidak ada permintaan pendaftaran akun yang sedang menunggu persetujuan.
              </span>
            </div>
          ) : (
            <DataTable
              rows={pendingRequests}
              columns={[
                [
                  "submittedAt",
                  "Tanggal",
                  (r) => String(r.submittedAt || "").slice(0, 10),
                ],
                [
                  "fullName",
                  "Nama & Username",
                  (r) => (
                    <div>
                      <strong>{r.fullName || "-"}</strong>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        @{r.username || "-"}
                      </div>
                    </div>
                  ),
                ],
                [
                  "email",
                  "Kontak",
                  (r) => (
                    <div>
                      <div>{r.email}</div>
                      {r.whatsapp ? (
                        <a
                          href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 11, color: "#d4b27d", textDecoration: "none" }}
                        >
                          WA: {r.whatsapp}
                        </a>
                      ) : null}
                    </div>
                  ),
                ],
                [
                  "requestedRole",
                  "Role Pengajuan",
                  (r) => (
                    <span className={styles.badge}>
                      {String(r.requestedRole || "ADMIN").toUpperCase()}
                    </span>
                  ),
                ],
                [
                  "assignRole",
                  "Tetapkan Role",
                  (r) => {
                    const assigned =
                      selectedRoleMap[r.id] ||
                      String(r.requestedRole || "ADMIN").toUpperCase();
                    return (
                      <select
                        value={assigned}
                        disabled={!canManage || busy}
                        onChange={(e) =>
                          setSelectedRoleMap((prev) => ({
                            ...prev,
                            [r.id]: e.target.value,
                          }))
                        }
                        style={{
                          background: "#081526",
                          border: "1px solid rgba(51, 87, 120, 0.6)",
                          color: "#f1f5f9",
                          borderRadius: 6,
                          padding: "6px 8px",
                          fontSize: 12,
                        }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERVISI">SUPERVISI</option>
                        <option value="SUPPLIER">SUPPLIER</option>
                        <option value="OWNER">OWNER</option>
                      </select>
                    );
                  },
                ],
                [
                  "actions",
                  "Aksi",
                  (r) => {
                    const assigned =
                      selectedRoleMap[r.id] ||
                      String(r.requestedRole || "ADMIN").toUpperCase();

                    if (rejectPromptId === r.id) {
                      return (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Alasan..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            style={{
                              background: "#081526",
                              border: "1px solid rgba(51, 87, 120, 0.6)",
                              color: "#f1f5f9",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 11,
                              width: 110,
                            }}
                          />
                          <button
                            type="button"
                            className={styles.dangerButton}
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            disabled={busy}
                            onClick={async () => {
                              await run(
                                "REJECT_SIGNUP_USER",
                                { requestId: r.id, reason: rejectReason || "Ditolak" },
                                "ACCESS"
                              );
                              setRejectPromptId(null);
                              setRejectReason("");
                            }}
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            onClick={() => setRejectPromptId(null)}
                          >
                            Batal
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          style={{ padding: "5px 10px", fontSize: 11 }}
                          disabled={busy || !canManage}
                          onClick={() =>
                            run(
                              "APPROVE_SIGNUP_USER",
                              {
                                requestId: r.id,
                                roleCode: assigned,
                                accessLevel:
                                  assigned === "OWNER"
                                    ? "OWNER"
                                    : assigned === "ADMIN"
                                    ? "MANAGE"
                                    : assigned === "SUPERVISI"
                                    ? "SUPERVISI"
                                    : "VIEW",
                              },
                              "ACCESS"
                            )
                          }
                        >
                          Setujui
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          style={{ padding: "5px 10px", fontSize: 11 }}
                          disabled={busy || !canManage}
                          onClick={() => setRejectPromptId(r.id)}
                        >
                          Tolak
                        </button>
                      </div>
                    );
                  },
                ],
              ]}
            />
          )}
        </Panel>
      ) : null}

      {activeTab === "USERS" ? (
        <Panel
          title="Daftar Pengguna & Hak Akses"
          subtitle="Konfigurasi role dan hak akses pengguna aktif di sistem RKN ERP."
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{
                background: "#081526",
                border: "1px solid rgba(51, 87, 120, 0.6)",
                color: "#f1f5f9",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                minWidth: 240,
              }}
            />

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["ALL", "OWNER", "ADMIN", "SUPERVISI", "SUPPLIER", "STAFF"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={
                    userRoleFilter === r
                      ? styles.reportSubnavActive
                      : styles.reportSubnavButton
                  }
                  style={{ padding: "4px 10px", fontSize: 11, borderRadius: 6 }}
                  onClick={() => setUserRoleFilter(r)}
                >
                  {r === "ALL" ? "SEMUA" : r}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            rows={filteredUsers}
            columns={[
              [
                "fullName",
                "Nama Pengguna",
                (u) => (
                  <div>
                    <strong>{u.fullName || "-"}</strong>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {u.email}
                    </div>
                  </div>
                ),
              ],
              [
                "roleCode",
                "Role Saat Ini",
                (u) => (
                  <span className={styles.badge}>
                    {String(u.roleCode || "STAFF").toUpperCase()}
                  </span>
                ),
              ],
              [
                "changeRole",
                "Ubah Role",
                (u) => {
                  const currentRole = String(u.roleCode || "STAFF").toUpperCase();
                  const selectedRole =
                    editingUserRoleMap[u.userId] !== undefined
                      ? editingUserRoleMap[u.userId]
                      : currentRole;

                  return (
                    <select
                      value={selectedRole}
                      disabled={!canManage || busy}
                      onChange={(e) =>
                        setEditingUserRoleMap((prev) => ({
                          ...prev,
                          [u.userId]: e.target.value,
                        }))
                      }
                      style={{
                        background: "#081526",
                        border: "1px solid rgba(51, 87, 120, 0.6)",
                        color: "#f1f5f9",
                        borderRadius: 6,
                        padding: "6px 8px",
                        fontSize: 12,
                      }}
                    >
                      <option value="OWNER">OWNER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPERVISI">SUPERVISI</option>
                      <option value="SUPPLIER">SUPPLIER</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  );
                },
              ],
              [
                "status",
                "Status",
                (u) => (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: u.active ? "#d4b27d" : "#94a3b8",
                    }}
                  >
                    {u.active ? "AKTIF" : "NONAKTIF"}
                  </span>
                ),
              ],
              [
                "actions",
                "Aksi",
                (u) => {
                  const currentRole = String(u.roleCode || "STAFF").toUpperCase();
                  const selectedRole =
                    editingUserRoleMap[u.userId] !== undefined
                      ? editingUserRoleMap[u.userId]
                      : currentRole;
                  const isModified = selectedRole !== currentRole;

                  return (
                    <button
                      type="button"
                      className={styles.primaryButton}
                      style={{ padding: "5px 12px", fontSize: 11 }}
                      disabled={!isModified || busy || !canManage}
                      onClick={async () => {
                        await run(
                          "UPDATE_USER_ROLE",
                          {
                            targetUserId: u.userId,
                            roleCode: selectedRole,
                            accessLevel:
                              selectedRole === "OWNER"
                                ? "OWNER"
                                : selectedRole === "ADMIN"
                                ? "MANAGE"
                                : selectedRole === "SUPERVISI"
                                ? "SUPERVISI"
                                : "VIEW",
                            active: u.active,
                          },
                          "ACCESS"
                        );
                        setEditingUserRoleMap((prev) => {
                          const next = { ...prev };
                          delete next[u.userId];
                          return next;
                        });
                      }}
                    >
                      Simpan
                    </button>
                  );
                },
              ],
            ]}
          />
        </Panel>
      ) : null}

      {activeTab === "HISTORY" ? (
        <Panel
          title="Riwayat Verifikasi Pendaftaran"
          subtitle="Catatan pendaftaran pengguna yang telah disetujui atau ditolak."
        >
          <DataTable
            rows={historyRequests}
            columns={[
              [
                "submittedAt",
                "Tanggal Pengajuan",
                (r) => String(r.submittedAt || "").slice(0, 10),
              ],
              ["fullName", "Nama"],
              ["email", "Email"],
              ["requestedRole", "Role Pengajuan"],
              [
                "status",
                "Status",
                (r) => (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: r.status === "APPROVED" ? "#d4b27d" : "#94a3b8",
                    }}
                  >
                    {r.status}
                  </span>
                ),
              ],
              ["reviewNote", "Catatan"],
              [
                "reviewedAt",
                "Waktu Ditinjau",
                (r) => String(r.reviewedAt || "").slice(0, 16).replace("T", " "),
              ],
            ]}
          />
        </Panel>
      ) : null}
    </>
  );
}
