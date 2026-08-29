"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./SablonWorkerInviteManager.module.css";

type Invite = {
  id: string;
  active: number;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  notes: string | null;
  createdAt: string;
  revokedAt: string | null;
};

type InviteListResponse = {
  ok: boolean;
  invites?: Invite[];
  error?: string;
};

type InviteCreateResponse = {
  ok: boolean;
  invite?: {
    id: string;
    token: string;
    path: string;
    maxUses: number | null;
    expiresAt: string | null;
    notes: string | null;
  };
  error?: string;
};

function inviteStatus(invite: Invite) {
  if (invite.active !== 1) {
    return "NONAKTIF";
  }

  if (
    invite.expiresAt &&
    new Date(invite.expiresAt).getTime() <= Date.now()
  ) {
    return "KEDALUWARSA";
  }

  if (
    invite.maxUses !== null &&
    invite.useCount >= invite.maxUses
  ) {
    return "KUOTA HABIS";
  }

  return "AKTIF";
}

export default function SablonWorkerInviteManager() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState("");
  const [latestLink, setLatestLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const loadInvites = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/rkn/worker-registration/invites",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json() as InviteListResponse;

      if (!response.ok || !result.ok) {
        setError(result.error ?? "GAGAL MEMUAT LINK PENDAFTARAN");
        return;
      }

      setInvites(
        Array.isArray(result.invites)
          ? result.invites
          : []
      );
    }
    catch {
      setError("GAGAL TERHUBUNG KE SERVER");
    }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  async function createInvite(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreating(true);
    setError("");
    setLatestLink("");
    setCopied(false);

    const parsedMaxUses =
      maxUses.trim()
        ? Number(maxUses)
        : null;

    const parsedExpiresAt =
      expiresAt
        ? new Date(expiresAt).toISOString()
        : null;

    try {
      const response = await fetch(
        "/api/rkn/worker-registration/invites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes,
            maxUses: parsedMaxUses,
            expiresAt: parsedExpiresAt,
          }),
        }
      );

      const result =
        await response.json() as InviteCreateResponse;

      if (
        !response.ok ||
        !result.ok ||
        !result.invite
      ) {
        setError(result.error ?? "GAGAL MEMBUAT LINK");
        return;
      }

      const fullLink =
        window.location.origin +
        result.invite.path;

      setLatestLink(fullLink);
      setNotes("");
      setMaxUses("");
      setExpiresAt("");

      await loadInvites();
    }
    catch {
      setError("GAGAL TERHUBUNG KE SERVER");
    }
    finally {
      setCreating(false);
    }
  }

  async function copyLatestLink() {
    if (!latestLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestLink);
      setCopied(true);
    }
    catch {
      setError("LINK GAGAL DISALIN. SALIN MANUAL DARI KOLOM LINK.");
    }
  }

  async function revokeInvite(inviteId: string) {
    setRevokingId(inviteId);
    setError("");

    try {
      const response = await fetch(
        `/api/rkn/worker-registration/invites/${encodeURIComponent(inviteId)}`,
        {
          method: "PATCH",
        }
      );

      const result = await response.json() as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "GAGAL MENONAKTIFKAN LINK");
        return;
      }

      await loadInvites();
    }
    catch {
      setError("GAGAL TERHUBUNG KE SERVER");
    }
    finally {
      setRevokingId("");
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <div>
          <span>SELF REGISTRATION</span>
          <h3>LINK PENDAFTARAN PEKERJA</h3>
        </div>
        <small>BU-SABLON</small>
      </div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : null}

      <form
        className={styles.createForm}
        onSubmit={createInvite}
      >
        <label>
          <span>CATATAN LINK</span>
          <input
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="CONTOH: PENDAFTARAN PEKERJA AGUSTUS"
          />
        </label>

        <div className={styles.twoCol}>
          <label>
            <span>MAKSIMAL PEMAKAIAN</span>
            <input
              type="number"
              min="1"
              max="1000"
              value={maxUses}
              onChange={(event) =>
                setMaxUses(event.target.value)
              }
              placeholder="KOSONG = TANPA BATAS"
            />
          </label>

          <label>
            <span>KEDALUWARSA</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) =>
                setExpiresAt(event.target.value)
              }
            />
          </label>
        </div>

        <button
          type="submit"
          className={styles.createButton}
          disabled={creating}
        >
          {creating
            ? "MEMBUAT LINK..."
            : "BUAT LINK PENDAFTARAN"}
        </button>
      </form>

      {latestLink ? (
        <div className={styles.latest}>
          <div className={styles.latestLabel}>
            LINK BARU — TAMPIL SEKALI
          </div>

          <div className={styles.linkRow}>
            <input
              readOnly
              value={latestLink}
            />

            <button
              type="button"
              onClick={() => void copyLatestLink()}
            >
              {copied ? "TERSALIN" : "COPY"}
            </button>
          </div>

          <p>
            SIMPAN ATAU BAGIKAN LINK INI SEKARANG.
            TOKEN ASLI TIDAK DISIMPAN DI DATABASE.
          </p>
        </div>
      ) : null}

      <div className={styles.listHead}>
        <strong>RIWAYAT LINK</strong>
        <span>
          {loading ? "..." : `${invites.length} LINK`}
        </span>
      </div>

      {loading ? (
        <div className={styles.empty}>MEMUAT LINK...</div>
      ) : invites.length === 0 ? (
        <div className={styles.empty}>
          BELUM ADA LINK PENDAFTARAN.
        </div>
      ) : (
        <div className={styles.list}>
          {invites.map((invite) => {
            const status = inviteStatus(invite);
            const canRevoke = status === "AKTIF";

            return (
              <article
                key={invite.id}
                className={styles.row}
              >
                <div className={styles.info}>
                  <strong>
                    {invite.notes || "LINK PENDAFTARAN SABLON"}
                  </strong>
                  <span>
                    DIPAKAI {invite.useCount}
                    {invite.maxUses !== null
                      ? ` / ${invite.maxUses}`
                      : " / TANPA BATAS"}
                  </span>
                  <span>
                    {invite.expiresAt
                      ? `EXPIRED ${new Date(invite.expiresAt).toLocaleString("id-ID")}`
                      : "TANPA TANGGAL KEDALUWARSA"}
                  </span>
                </div>

                <div className={styles.actions}>
                  <span className={styles.status}>
                    {status}
                  </span>

                  {canRevoke ? (
                    <button
                      type="button"
                      disabled={revokingId === invite.id}
                      onClick={() =>
                        void revokeInvite(invite.id)
                      }
                    >
                      {revokingId === invite.id
                        ? "MEMPROSES..."
                        : "NONAKTIFKAN"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}