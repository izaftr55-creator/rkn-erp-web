import Link from "next/link";

import styles from "@/app/login/login.module.css";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams:
    Promise<{
      status?: string | string[];
    }>;
};

function messageFor(
  status: string
) {
  if (status === "pending") {
    return (
      "Pendaftaran berhasil. " +
      "Akun sedang menunggu persetujuan administrator RKN."
    );
  }

  if (status === "exists") {
    return (
      "Email atau username tersebut sudah digunakan."
    );
  }

  if (status === "invalid") {
    return (
      "Periksa kembali data pendaftaran. " +
      "Password minimal 10 karakter."
    );
  }

  if (status === "error") {
    return (
      "Pendaftaran belum dapat diproses. Silakan coba lagi."
    );
  }

  return "";
}

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const params =
    await searchParams;

  const rawStatus =
    params?.status;

  const status =
    Array.isArray(rawStatus)
      ? String(rawStatus[0] ?? "")
      : String(rawStatus ?? "");

  const message =
    messageFor(status);

  return (
    <main className={styles.page}>
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />
      <div className={styles.ambientThree} />

      <section className={styles.panel}>
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
            Daftarkan data diri.
            Akses ERP aktif setelah disetujui
            administrator RKN.
          </p>
        </header>

        <form
          className={styles.form}
          action="/api/rkn/signup"
          method="post"
        >
          <label className={styles.field}>
            <span>NAMA LENGKAP</span>

            <div className={`${styles.inputShell} ${styles.signupInputShell}`}>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                placeholder="Nama lengkap"
                required
                minLength={3}
                maxLength={120}
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>USERNAME</span>

            <div className={`${styles.inputShell} ${styles.signupInputShell}`}>
              <input
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Contoh: fatur.rkn"
                required
                minLength={3}
                maxLength={30}
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>EMAIL AKTIF</span>

            <div className={`${styles.inputShell} ${styles.signupInputShell}`}>
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

            <div className={`${styles.inputShell} ${styles.signupInputShell}`}>
              <input
                type="tel"
                name="whatsapp"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>AKSES YANG DIAJUKAN</span>

            <div className={`${styles.inputShell} ${styles.signupInputShell}`}>
              <select
                name="requestedRole"
                required
                defaultValue=""
                style={{
                  width: "100%",
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "inherit",
                  padding: "14px 16px",
                  font: "inherit",
                }}
              >
                <option value="" disabled>
                  Pilih akses
                </option>

                <option value="OWNER">
                  Owner
                </option>

                <option value="ADMIN">
                  Admin
                </option>

                <option value="STAFF">
                  Staff / User Internal
                </option>
              </select>
            </div>
          </label>

          <label className={styles.field}>
            <span>PASSWORD</span>

            <div className={`${styles.inputShell} ${styles.signupInputShell}`}>
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

            <div className={`${styles.inputShell} ${styles.signupInputShell}`}>
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

          {message ? (
            <div className={styles.message}>
              <span>
                {status === "pending"
                  ? "✓"
                  : "!"}
              </span>

              <p>{message}</p>
            </div>
          ) : null}

          <button
            className={styles.submit}
            type="submit"
          >
            <span>BUAT AKUN</span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 13,
          }}
        >
          Sudah punya akun?{" "}

          <Link
            href="/"
            style={{
              fontWeight: 700,
              textDecoration: "none",
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
            Pendaftaran tidak otomatis memberikan
            akses Owner atau Admin.
          </span>
        </footer>
      </section>
    </main>
  );
}