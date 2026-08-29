import SablonWorkerRegistrationForm from "@/components/SablonWorkerRegistrationForm";

import styles from "./page.module.css";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function Page({
  params,
}: Props) {
  const { token } = await params;

  return (
    <div className={styles.page}>
      <div
        className={styles.grid}
        aria-hidden="true"
      />

      <div
        className={styles.glowOne}
        aria-hidden="true"
      />

      <div
        className={styles.glowTwo}
        aria-hidden="true"
      />

      <main className={styles.shell}>
        <header className={styles.brand}>
          <div className={styles.brandLeft}>
            <div className={styles.logoBox}>
              <img
                src="/rkn-logo.png"
                alt="RKN"
                className={styles.logo}
              />
            </div>

            <div className={styles.brandCopy}>
              <strong>RKN ERP</strong>
              <span>
                WORKER REGISTRATION
              </span>
            </div>
          </div>

          <div className={styles.secure}>
            <span
              className={styles.secureDot}
              aria-hidden="true"
            />
            SECURE FORM
          </div>
        </header>

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>
              RKN GROUP · SABLON PLASTIK
            </span>

            <h1>
              Pendaftaran Pekerja
            </h1>

            <p>
              Lengkapi data diri dengan benar.
              Pendaftaran akan diverifikasi oleh
              admin RKN sebelum pekerja
              diaktifkan di dalam sistem.
            </p>
          </div>

          <div className={styles.status}>
            <span>STATUS</span>
            <strong>
              REGISTRATION OPEN
            </strong>
          </div>
        </section>

        <section className={styles.info}>
          <div className={styles.infoIcon}>
            i
          </div>

          <p>
            Pastikan nomor WhatsApp yang
            digunakan aktif dan data yang
            dimasukkan sudah sesuai.
          </p>
        </section>

        <section className={styles.formCard}>
          <SablonWorkerRegistrationForm
            token={token}
          />
        </section>

        <footer className={styles.footer}>
          <div>
            <span
              className={styles.footerDot}
              aria-hidden="true"
            />

            RKN SECURE REGISTRATION
          </div>

          <span>
            RKN ERP · INTERNAL WORKFORCE SYSTEM
          </span>
        </footer>
      </main>
    </div>
  );
}