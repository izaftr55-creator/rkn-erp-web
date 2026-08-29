"use client";

import styles from "./MobileMenuView.module.css";

type Props = {
  onSelect: (tab: string) => void;
  onPlanned: (label: string) => void;
};

type IconName =
  | "finance"
  | "people"
  | "report"
  | "system"
  | "marketplace"
  | "orders"
  | "stock"
  | "products"
  | "logout"
  | "arrow";

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
    case "finance":
      return (
        <svg {...common}>
          <path d="M3 9h18" />
          <path d="M5 9v9" />
          <path d="M9 9v9" />
          <path d="M15 9v9" />
          <path d="M19 9v9" />
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
          <path d="M2 12h3" />
          <path d="M19 12h3" />
          <path d="m4.9 4.9 2.1 2.1" />
          <path d="m17 17 2.1 2.1" />
          <path d="m19.1 4.9-2.1 2.1" />
          <path d="m7 17-2.1 2.1" />
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

    case "products":
      return (
        <svg {...common}>
          <path d="m4 7 8-4 8 4-8 4-8-4Z" />
          <path d="M4 7v10l8 4 8-4V7" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 5H5v14h5" />
          <path d="M14 8l4 4-4 4" />
          <path d="M18 12H9" />
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

const domains: Array<{
  title: string;
  description: string;
  icon: IconName;
}> = [
  {
    title: "Keuangan & Operasional",
    description:
      "Kas, bank, settlement, vendor, hutang, piutang dan operasional.",
    icon: "finance",
  },
  {
    title: "SDM & Akses",
    description:
      "Pengguna ERP, pekerja, payroll, izin dan ruang lingkup akses.",
    icon: "people",
  },
  {
    title: "Laporan & Analitik",
    description:
      "Laporan sales, inventory, keuangan, payroll dan pusat ekspor.",
    icon: "report",
  },
  {
    title: "Kendali Sistem",
    description:
      "Approval, alert, audit log, integrasi dan pengaturan sistem.",
    icon: "system",
  },
];

export default function MobileMenuView({
  onSelect,
  onPlanned,
}: Props) {
  return (
    <section className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>
          RKN ERP
        </span>

        <h1>Menu</h1>

        <p>
          Pusat administrasi, domain ERP,
          akun dan akses sistem.
        </p>
      </header>

      <div className={styles.accountCard}>
        <span className={styles.avatar}>
          LF
        </span>

        <span className={styles.accountCopy}>
          <strong>
            Administrator Sistem
          </strong>

          <small>
            RKN ERP  /  Akses Administratif
          </small>
        </span>

        <span className={styles.accountStatus}>
          AKTIF
        </span>
      </div>

      <div className={styles.sectionHead}>
        <div>
          <strong>Domain ERP</strong>
          <span>
            Administrasi perusahaan
          </span>
        </div>
      </div>

      <div className={styles.domainList}>
        {/* RKN_HPP_MOBILE_MENU_V11 */}
        <button
          type="button"
          className={styles.domainCard}
          onClick={() =>
            onSelect("hppCosting")
          }
        >
          <span
            className={styles.domainIcon}
          >
            <Icon name="finance" />
          </span>

          <span
            className={styles.domainCopy}
          >
            <strong>
              HPP & Costing
            </strong>

            <small>
              Input HPP manual, kalkulasi otomatis dan riwayat costing.
            </small>
          </span>

          <span
            className={styles.domainEnd}
          >
            <em>AKTIF</em>
            <Icon name="arrow" />
          </span>
        </button>

        {domains.map((domain) => (
          <button
            key={domain.title}
            type="button"
            className={styles.domainCard}
            onClick={() =>
              onPlanned(domain.title)
            }
          >
            <span className={styles.domainIcon}>
              <Icon name={domain.icon} />
            </span>

            <span className={styles.domainCopy}>
              <strong>
                {domain.title}
              </strong>

              <small>
                {domain.description}
              </small>
            </span>

            <span className={styles.domainEnd}>
              <em>SEGERA</em>
              <Icon name="arrow" />
            </span>
          </button>
        ))}
      </div>

      <div className={styles.sectionHead}>
        <div>
          <strong>Akses Cepat</strong>
          <span>
            Operasional utama
          </span>
        </div>
      </div>

      <div className={styles.quickGrid}>
        <button
          type="button"
          onClick={() =>
            onSelect("marketplaceHub")
          }
        >
          <span>
            <Icon name="marketplace" />
          </span>

          <strong>
            Marketplace
          </strong>

          <small>
            Ringkasan
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelect("orders")
          }
        >
          <span>
            <Icon name="orders" />
          </span>

          <strong>
            Pesanan
          </strong>

          <small>
            Packing
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelect("stock")
          }
        >
          <span>
            <Icon name="stock" />
          </span>

          <strong>
            Stok
          </strong>

          <small>
            Persediaan
          </small>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelect("products")
          }
        >
          <span>
            <Icon name="products" />
          </span>

          <strong>
            Produk
          </strong>

          <small>
            Master Produk
          </small>
        </button>
      </div>

      <div className={styles.sectionHead}>
        <div>
          <strong>Akun & Sesi</strong>
          <span>
            Keamanan perangkat
          </span>
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
          <span className={styles.logoutIcon}>
            <Icon name="logout" />
          </span>

          <span className={styles.logoutCopy}>
            <strong>
              Keluar dari RKN ERP
            </strong>

            <small>
              Akhiri sesi pada perangkat ini
            </small>
          </span>

          <span className={styles.logoutArrow}>
            <Icon name="arrow" />
          </span>
        </button>
      </form>

      <div className={styles.securityNote}>
        <span>
          <i />
          SESI AMAN
        </span>

        <p>
          Logout akan mengakhiri sesi ERP
          pada perangkat ini dan kembali ke
          halaman login.
        </p>
      </div>
    </section>
  );
}
