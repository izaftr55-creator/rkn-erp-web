"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import styles from "@/app/login/login.module.css";

export default function RknLoginScreen() {
  /*
   * RKN_LOGIN_INPUT_PERFORMANCE_V2
   *
   * Credential fields intentionally use refs instead of
   * React state. Typing therefore does not rerender the
   * complete futuristic login screen on every keystroke.
   */
  const usernameRef =
    useRef<HTMLInputElement>(null);

  const passwordRef =
    useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [logoFailed, setLogoFailed] =
    useState(false);

  /*
   * RKN_LOGIN_ERROR_FEEDBACK_V1
   *
   * Native login redirects back with:
   * /?auth=<reason>
   *
   * Read it after mount so the native
   * top-level login flow remains untouched.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );
    const reason =
      params.get("auth");
    if (!reason) {
      return;
    }
    if (reason === "invalid") {
      setMessage(
        "Username atau kata sandi tidak valid."
      );
    }
    else if (reason === "required") {
      setMessage(
        "Username dan kata sandi wajib diisi."
      );
    }
    else if (reason === "cookie") {
      setMessage(
        "Sesi login tidak dapat dibuat. Silakan coba lagi."
      );
    }    else if (reason === "workspace") {
      setMessage(
        "Akun ini tidak memiliki akses ke workspace atau role yang dipilih."
      );
    }
    else {
      setMessage(
        "Login tidak dapat diproses. Silakan coba lagi."
      );
    }
    /*
     * Remove error query from address bar
     * after the message has been captured.
     */
    window.history.replaceState(
      {},
      "",
      "/"
    );
  }, []);
  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    /*
     * RKN_NATIVE_LOGIN_V2
     *
     * Do not prevent native submission.
     * Browser performs a top-level POST.
     */
    void event;
    setMessage("");
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />
      <div className={styles.ambientThree} />

      <section className={styles.panel}>
        <div className={styles.panelGlow} />

        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            {!logoFailed ? (
              <img
                className={styles.logoImage}
                src="/rkn-logo.png"
                alt="RKN"
                onError={() =>
                  setLogoFailed(true)
                }
              />
            ) : (
              <div
                className={
                  styles.logoFallback
                }
              >
                RKN
              </div>
            )}
          </div>

          <div className={styles.brandLine}>
            <span />
            <strong>RKN ERP</strong>
            <span />
          </div>
        </div>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>
            SECURE ORGANIZATION ACCESS
          </p>

          <h1>Welcome Back</h1>

          <p className={styles.subtitle}>
            Masuk untuk melanjutkan ke
            workspace RKN.
          </p>
        </header>

        <form
          className={styles.form}
          onSubmit={handleSubmit}

        action="/api/rkn/native-login"
        method="post">
          {/* RKN_LOGIN_ROLE_FINAL_UI_V2R1 */}
          <label className={styles.field}>
            <span>USERNAME</span>

            <div
              className={
                styles.inputShell
              }
            >
              <div
                className={
                  styles.inputIcon
                }
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M4 6.75h16v10.5H4z"
                  />
                  <path
                    d="m5 8 7 5 7-5"
                  />
                </svg>
              </div>

              <input
                type="text"
                name="username"
                ref={usernameRef}
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={busy}
                placeholder="Masukkan Username"
                autoFocus
              />
            </div>
          </label>

          <label className={styles.field}>
            <span>PASSWORD</span>

            <div
              className={
                styles.inputShell
              }
            >
              <div
                className={
                  styles.inputIcon
                }
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                  />
                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                  />
                </svg>
              </div>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                ref={passwordRef}
                autoComplete={
                  "current-password"
                }
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  textTransform: "none",
                  fontVariantCaps: "normal",
                }}
                data-rkn-password-case-safe="true"
                /* RKN_PASSWORD_CASE_SAFE_V3 */
                disabled={busy}
                placeholder="Masukkan Password"
              />

              <button
                type="button"
                className={styles.eyeButton}
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
                tabIndex={-1}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="2.7"
                  />
                </svg>
              </button>
            </div>
          </label>

          {/* RKN_LOGIN_AS_WORKSPACE_V2H */}
          <label className={styles.field}>
            <span>LOGIN AS</span>

            <div className={styles.inputShell}>
              <div
                className={styles.inputIcon}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="4"
                    y="5"
                    width="16"
                    height="14"
                    rx="2"
                  />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              </div>

              <select
                className={styles.loginAsSelect}
                name="login_as"
                defaultValue=""
                required
                disabled={busy}
              >
                <option value="" disabled>
                  Pilih workspace
                </option>

                <option value="MARKETPLACE_ADMIN">
                  System Admin - Marketplace ERP
                </option>

                <option value="PLASTIC_SYSTEM_ADMIN">
                  System Admin - Plastic Trading
                </option>

                <option value="PLASTIC_OWNER">
                  Plastic Trading - Owner
                </option>


<option value="PLASTIC_SUPERVISOR">
                  Plastic Trading - Supervisory Board
                </option>
              </select>

              <div
                className={styles.selectChevron}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="m7 9 5 5 5-5" />
                </svg>
              </div>
            </div>

            <small className={styles.loginAsHint}>
              Workspace dipilih di sini. Hak akses tetap
              diverifikasi dari role dan business scope akun.
            </small>
          </label>

          <div className={styles.formMeta}>
            <span>
              RKN INTERNAL SYSTEM
            </span>

            <span>
              AUTHORIZED ACCESS
            </span>
          </div>

          {message ? (
            <div className={styles.message}>
              <span>!</span>

              <p>{message}</p>
            </div>
          ) : null}

          <button
            className={styles.submit}
            type="submit"
            disabled={busy}
          >
            <span>
              {busy
                ? "MEMVERIFIKASI..."
                : "MASUK KE ERP"}
            </span>

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
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>
            Belum punya akun?
          </span>

          <Link
            href="/signup"
            style={{
              fontWeight: 700,
              color: "#38bdf8",
              textDecoration: "none",
              letterSpacing: "0.04em",
              borderBottom: "1px solid rgba(56, 189, 248, 0.4)",
              paddingBottom: 1,
            }}
          >
            BUAT AKUN
          </Link>
        </div>

        <div className={styles.divider}>
          <span />
          <i />
          <span />
        </div>

        <footer className={styles.footer}>
          <div className={styles.shield}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 3 5 6v5c0 4.8 2.9 8.2 7 10 4.1-1.8 7-5.2 7-10V6l-7-3Z"
              />
              <path
                d="m9.5 12 1.7 1.7 3.6-3.8"
              />
            </svg>
          </div>

          <span>
            Akses ERP dikelola oleh
            administrator RKN.
          </span>
        </footer>
      </section>
    </main>
  );
}
