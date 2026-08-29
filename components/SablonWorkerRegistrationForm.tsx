"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import styles from "./SablonWorkerRegistrationForm.module.css";

type Props = {
  token: string;
};

type InviteState =
  | "CHECKING"
  | "VALID"
  | "INVALID";

type FormState = {
  fullName: string;
  nickname: string;
  whatsapp: string;
  address: string;
  notes: string;
};

const initialForm: FormState = {
  fullName: "",
  nickname: "",
  whatsapp: "",
  address: "",
  notes: "",
};

function errorMessage(
  error: string
) {
  switch (error) {
    case "FULL_NAME_REQUIRED":
      return "NAMA LENGKAP WAJIB DIISI.";
    case "FULL_NAME_TOO_LONG":
      return "NAMA LENGKAP TERLALU PANJANG.";
    case "INVALID_WHATSAPP":
      return "NOMOR WHATSAPP TIDAK VALID.";
    case "REGISTRATION_ALREADY_EXISTS":
      return "NOMOR WHATSAPP INI SUDAH PERNAH MENDAFTAR DAN MASIH MENUNGGU VERIFIKASI.";
    case "INVALID_OR_EXPIRED_INVITE":
      return "LINK PENDAFTARAN SUDAH TIDAK BERLAKU.";
    default:
      return "PENDAFTARAN GAGAL. SILAKAN COBA LAGI.";
  }
}

export default function SablonWorkerRegistrationForm({
  token,
}: Props) {
  const [inviteState, setInviteState] =
    useState<InviteState>("CHECKING");

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [saving, setSaving] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function validateInvite() {
      try {
        const response = await fetch(
          `/api/public/worker-registration/${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!mounted) {
          return;
        }

        setInviteState(
          response.ok
            ? "VALID"
            : "INVALID"
        );
      }
      catch {
        if (mounted) {
          setInviteState("INVALID");
        }
      }
    }

    void validateInvite();

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/public/worker-registration/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json() as {
        ok?: boolean;
        error?: string;
        status?: string;
      };

      if (!response.ok || !result.ok) {
        setError(
          errorMessage(
            result.error ?? "UNKNOWN"
          )
        );
        return;
      }

      setSubmitted(true);
      setForm(initialForm);
    }
    catch {
      setError(
        "GAGAL TERHUBUNG KE SERVER. SILAKAN COBA LAGI."
      );
    }
    finally {
      setSaving(false);
    }
  }

  if (inviteState === "CHECKING") {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.brand}>RKN ERP</div>
          <div className={styles.state}>
            MEMERIKSA LINK PENDAFTARAN...
          </div>
        </section>
      </main>
    );
  }

  if (inviteState === "INVALID") {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.brand}>RKN ERP</div>
          <div className={styles.badge}>SABLON PLASTIK</div>
          <h1>LINK TIDAK TERSEDIA</h1>
          <p className={styles.description}>
            LINK PENDAFTARAN INI TIDAK VALID, SUDAH KEDALUWARSA,
            ATAU SUDAH DINONAKTIFKAN.
          </p>
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.brand}>RKN ERP</div>
          <div className={styles.badge}>SABLON PLASTIK</div>
          <div className={styles.successIcon}>✓</div>
          <h1>PENDAFTARAN TERKIRIM</h1>
          <p className={styles.description}>
            DATA KAMU SUDAH DITERIMA DAN SEKARANG MENUNGGU
            VERIFIKASI ADMIN SABLON.
          </p>
          <div className={styles.notice}>
            KODE PEKERJA AKAN DIBUAT OTOMATIS SETELAH
            PENDAFTARAN DISETUJUI.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>RKN ERP</div>
          <div className={styles.badge}>SABLON PLASTIK</div>
          <h1>PENDAFTARAN PEKERJA</h1>
          <p className={styles.description}>
            ISI DATA DI BAWAH INI DENGAN DATA YANG BENAR.
            PENDAFTARAN AKAN DIVERIFIKASI TERLEBIH DAHULU.
          </p>
        </header>

        {error ? (
          <div className={styles.error}>
            {error}
          </div>
        ) : null}

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <label>
            <span>NAMA LENGKAP *</span>
            <input
              required
              maxLength={120}
              autoComplete="name"
              value={form.fullName}
              onChange={(event) =>
                setForm({
                  ...form,
                  fullName: event.target.value,
                })
              }
              placeholder="CONTOH: DESTY ..."
            />
          </label>

          <label>
            <span>NAMA PANGGILAN</span>
            <input
              maxLength={80}
              value={form.nickname}
              onChange={(event) =>
                setForm({
                  ...form,
                  nickname: event.target.value,
                })
              }
              placeholder="OPSIONAL"
            />
          </label>

          <label>
            <span>NOMOR WHATSAPP *</span>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.whatsapp}
              onChange={(event) =>
                setForm({
                  ...form,
                  whatsapp: event.target.value,
                })
              }
              placeholder="08XXXXXXXXXX"
            />
          </label>

          <label>
            <span>ALAMAT / DOMISILI</span>
            <textarea
              rows={3}
              maxLength={500}
              autoComplete="street-address"
              value={form.address}
              onChange={(event) =>
                setForm({
                  ...form,
                  address: event.target.value,
                })
              }
              placeholder="OPSIONAL"
            />
          </label>

          <label>
            <span>CATATAN</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
              placeholder="OPSIONAL"
            />
          </label>

          <div className={styles.notice}>
            KAMU TIDAK PERLU MEMBUAT KODE PEKERJA.
            KODE AKAN DIBUAT OTOMATIS SETELAH DATA DISETUJUI.
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={saving}
          >
            {saving
              ? "MENGIRIM..."
              : "KIRIM PENDAFTARAN"}
          </button>
        </form>
      </section>
    </main>
  );
}