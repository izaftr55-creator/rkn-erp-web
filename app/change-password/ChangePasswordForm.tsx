"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import styles from "./change-password.module.css";

type Props = {
  name: string;
};

export default function ChangePasswordForm({
  name,
}: Props) {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setMessage(
        "Semua kolom password wajib diisi."
      );
      return;
    }

    if (newPassword.length < 10) {
      setMessage(
        "Password baru minimal 10 karakter."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(
        "Konfirmasi password baru tidak sama."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setMessage(
        "Password baru harus berbeda dari password sementara."
      );
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        "/api/rkn/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          error?: string;
        };

      if (!response.ok || !result.ok) {
        if (
          result.error ===
          "PASSWORD_CHANGE_FAILED"
        ) {
          setMessage(
            "Password sementara tidak valid."
          );
        }
        else {
          setMessage(
            result.error ||
            "Gagal mengubah password."
          );
        }

        return;
      }

      router.replace("/");
      router.refresh();
    }
    catch {
      setMessage(
        "Tidak dapat terhubung ke server."
      );
    }
    finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.badge}>
          SECURITY SETUP
        </div>

        <h1>
          Buat Password Baru
        </h1>

        <p className={styles.welcome}>
          Selamat datang,
          <strong>{name}</strong>
        </p>

        <p className={styles.description}>
          Akun ini masih menggunakan
          password sementara. Buat password
          pribadi sebelum masuk ke RKN ERP.
        </p>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <label className={styles.field}>
            <span>
              PASSWORD SEMENTARA
            </span>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              disabled={busy}
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span>
              PASSWORD BARU
            </span>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              disabled={busy}
            />
          </label>

          <label className={styles.field}>
            <span>
              KONFIRMASI PASSWORD BARU
            </span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              disabled={busy}
            />
          </label>

          {message ? (
            <div className={styles.message}>
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            className={styles.submit}
            disabled={busy}
          >
            {busy
              ? "MENYIMPAN..."
              : "SIMPAN PASSWORD BARU"}
          </button>
        </form>

        <p className={styles.footer}>
          RKN ERP · SECURE ACCESS
        </p>
      </section>
    </main>
  );
}