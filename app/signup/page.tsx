import Link from "next/link";
import styles from "@/app/login/login.module.css";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

function messageFor(status: string) {
  if (status === "pending") {
    return "Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan administrator RKN.";
  }
  if (status === "exists") {
    return "Email atau username tersebut sudah terdaftar. Silakan gunakan akun lain.";
  }
  if (status === "invalid") {
    return "Periksa kembali data pendaftaran. Pastikan password minimal 10 karakter.";
  }
  if (status === "error") {
    return "Pendaftaran belum dapat diproses. Silakan coba beberapa saat lagi.";
  }
  return "";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const rawStatus = params?.status;
  const status = Array.isArray(rawStatus) ? String(rawStatus[0] ?? "") : String(rawStatus ?? "");
  const message = messageFor(status);

  return (
    <main className={styles.page}>
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />
      <div className={styles.ambientThree} />

      <section className={`${styles.panel} ${styles.signupPanel}`}>
        <div className={styles.panelGlow} />

        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <img
              className={styles.logoImage}
              src="/rkn-logo.png"
              alt="RKN"
            />
          </div>

          <div className={styles.brandLine}>
            <span />
            <strong>RKN ERP</strong>
            <span />
          </div>
        </div>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>
            INTERNAL ACCOUNT REGISTRATION
          </p>

          <h1>Buat Akun</h1>

          <p className={styles.subtitle}>
            Daftarkan akun untuk mengakses sistem manajemen RKN ERP.
          </p>
        </header>

        <form
          className={styles.form}
          action="/api/rkn/signup"
          method="post"
        >
          <div className={styles.signupGrid}>
            <label className={styles.field}>
              <span>NAMA LENGKAP</span>
              <div className={styles.inputShell}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Nama Lengkap Anda"
                  required
                  minLength={3}
                  maxLength={120}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>USERNAME</span>
              <div className={styles.inputShell}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Username"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>EMAIL AKTIF</span>
              <div className={styles.inputShell}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 6.75h16v10.5H4z" />
                    <path d="m5 8 7 5 7-5" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>WHATSAPP</span>
              <div className={styles.inputShell}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  name="whatsapp"
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
            </label>

            <label className={`${styles.field} ${styles.fullSpan}`}>
              <span>AKSES YANG DIAJUKAN</span>
              <div className={styles.inputShell}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <select
                  name="requestedRole"
                  required
                  defaultValue=""
                  className={styles.roleSelect}
                >
                  <option value="" disabled>
                    Pilih Peran / Scope Akses
                  </option>
                  <option value="ADMIN">Admin (Operasional, Transaksi & Stok)</option>
                  <option value="SUPPLIER">Supplier (Pemantau Stok Menipis)</option>
                  <option value="SUPERVISI">Supervisi (Audit Trail & Pengawasan)</option>
                  <option value="OWNER">Owner (Pemilik Bisnis)</option>
                </select>
              </div>
            </label>

            <label className={styles.field}>
              <span>PASSWORD</span>
              <div className={styles.inputShell}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Minimal 10 karakter"
                  required
                  minLength={10}
                  maxLength={128}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>KONFIRMASI PASSWORD</span>
              <div className={styles.inputShell}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  required
                  minLength={10}
                  maxLength={128}
                />
              </div>
            </label>
          </div>

          {message ? (
            <div className={styles.message}>
              <span>{status === "pending" ? "✓" : "!"}</span>
              <p>{message}</p>
            </div>
          ) : null}

          <button className={styles.submit} type="submit">
            <span>DAFTARKAN AKUN</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </form>

        <div
          style={{
            marginTop: 22,
            textAlign: "center",
            fontSize: 13,
            color: "#8393b8",
          }}
        >
          Sudah punya akun?{" "}
          <Link
            href="/"
            style={{
              fontWeight: 800,
              color: "#5b8cff",
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            MASUK KE ERP
          </Link>
        </div>

        <div className={styles.divider}>
          <span />
          <i />
          <span />
        </div>

        <footer className={styles.footer}>
          <span>
            Pendaftaran akan ditinjau oleh Administrator RKN sebelum akses diaktifkan.
          </span>
        </footer>
      </section>
    </main>
  );
}