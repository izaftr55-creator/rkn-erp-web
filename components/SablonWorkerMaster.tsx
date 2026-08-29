"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import SablonWorkerInviteManager from "./SablonWorkerInviteManager";
import SablonWorkerRegistrationInbox from "./SablonWorkerRegistrationInbox";
import styles from "./SablonWorkerMaster.module.css";

type Worker = {
  id: string;
  workerCode: string;
  businessUnitId: string;
  fullName: string;
  nickname: string | null;
  workerType: string;
  whatsapp: string | null;
  paymentMethod: string;
  startDate: string | null;
  endDate: string | null;
  active: number;
  notes: string | null;
};

type WorkerListResponse = {
  ok: boolean;
  businessUnitId?: string;
  accessMode?: string;
  workers?: Worker[];
  error?: string;
};

type WorkerCreateResponse = {
  ok: boolean;
  worker?: Worker;
  error?: string;
};

const initialForm = {
  fullName: "",
  nickname: "",
  whatsapp: "",
  workerType: "BORONGAN",
  paymentMethod: "CASH",
  startDate: "",
  notes: "",
};

export default function SablonWorkerMaster() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initialForm);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rkn/workers", {
        method: "GET",
        cache: "no-store",
      });

      const result =
        await response.json() as WorkerListResponse;

      if (!response.ok || !result.ok) {
        setError(result.error ?? "GAGAL MEMUAT PEKERJA");
        return;
      }

      setWorkers(
        Array.isArray(result.workers)
          ? result.workers
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
    void loadWorkers();
  }, [loadWorkers]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/rkn/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName,
          nickname: form.nickname,
          whatsapp: form.whatsapp,
          workerType: form.workerType,
          paymentMethod: form.paymentMethod,
          startDate: form.startDate,
          notes: form.notes,
        }),
      });

      const result =
        await response.json() as WorkerCreateResponse;

      if (!response.ok || !result.ok) {
        setError(result.error ?? "GAGAL MENAMBAH PEKERJA");
        return;
      }

      setSuccess(
        result.worker
          ? `PEKERJA ${result.worker.workerCode} BERHASIL DITAMBAHKAN`
          : "PEKERJA BERHASIL DITAMBAHKAN"
      );

      setForm(initialForm);
      await loadWorkers();
    }
    catch {
      setError("GAGAL TERHUBUNG KE SERVER");
    }
    finally {
      setSaving(false);
    }
  }

  const activeCount = workers.filter(
    (worker) => worker.active === 1
  ).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <div>
          <div className={styles.eyebrow}>MASTER PEKERJA</div>
          <h2>PEKERJA SABLON</h2>
          <p>
            DATA PEKERJA UNTUK OPERASIONAL DAN PAYROLL SABLON.
          </p>
        </div>

        <div className={styles.summary}>
          <div>
            <span>TOTAL</span>
            <strong>{loading ? "..." : workers.length}</strong>
          </div>
          <div>
            <span>AKTIF</span>
            <strong>{loading ? "..." : activeCount}</strong>
          </div>
        </div>
      </div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : null}

      {success ? (
        <div className={styles.success}>{success}</div>
      ) : null}

      <SablonWorkerInviteManager />

      <SablonWorkerRegistrationInbox />

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>DAFTAR</span>
              <h3>PEKERJA TERDAFTAR</h3>
            </div>
          </div>

          {loading ? (
            <div className={styles.empty}>MEMUAT DATA...</div>
          ) : workers.length === 0 ? (
            <div className={styles.empty}>
              BELUM ADA PEKERJA SABLON TERDAFTAR.
            </div>
          ) : (
            <div className={styles.workerList}>
              {workers.map((worker) => (
                <article
                  key={worker.id}
                  className={styles.workerRow}
                >
                  <div>
                    <strong>{worker.fullName}</strong>
                    <span>
                      {worker.nickname
                        ? worker.nickname
                        : "TANPA NAMA PANGGILAN"}
                    </span>
                  </div>

                  <div className={styles.workerMeta}>
                    <strong>{worker.workerCode}</strong>
                    <span>
                      {worker.active === 1
                        ? "AKTIF"
                        : "NONAKTIF"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>INPUT</span>
              <h3>TAMBAH PEKERJA</h3>
            </div>
            <small>KODE OTOMATIS</small>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <label>
              <span>NAMA LENGKAP *</span>
              <input
                required
                maxLength={120}
                value={form.fullName}
                onChange={(event) =>
                  setForm({
                    ...form,
                    fullName: event.target.value,
                  })
                }
                placeholder="NAMA PEKERJA"
              />
            </label>

            <label>
              <span>NAMA PANGGILAN</span>
              <input
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
              <span>WHATSAPP</span>
              <input
                value={form.whatsapp}
                onChange={(event) =>
                  setForm({
                    ...form,
                    whatsapp: event.target.value,
                  })
                }
                placeholder="08..."
              />
            </label>

            <div className={styles.twoCol}>
              <label>
                <span>TIPE PEKERJA</span>
                <select
                  value={form.workerType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      workerType: event.target.value,
                    })
                  }
                >
                  <option value="BORONGAN">BORONGAN</option>
                  <option value="HARIAN">HARIAN</option>
                  <option value="BULANAN">BULANAN</option>
                  <option value="OTHER">LAINNYA</option>
                </select>
              </label>

              <label>
                <span>METODE BAYAR</span>
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      paymentMethod: event.target.value,
                    })
                  }
                >
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="EWALLET">E-WALLET</option>
                  <option value="OTHER">LAINNYA</option>
                </select>
              </label>
            </div>

            <label>
              <span>TANGGAL MULAI</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({
                    ...form,
                    startDate: event.target.value,
                  })
                }
              />
            </label>

            <label>
              <span>CATATAN</span>
              <textarea
                rows={3}
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

            <button
              type="submit"
              disabled={saving}
              className={styles.submit}
            >
              {saving
                ? "MENYIMPAN..."
                : "TAMBAH PEKERJA"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}