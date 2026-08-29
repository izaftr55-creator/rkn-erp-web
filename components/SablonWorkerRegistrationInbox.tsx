"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import styles from "./SablonWorkerRegistrationInbox.module.css";

type Registration = {
  id: string;
  inviteId: string;
  fullName: string;
  nickname: string | null;
  whatsapp: string;
  address: string | null;
  notes: string | null;
  status: string;
  submittedAt: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  workerId: string | null;
};

type InboxResponse = {
  ok?: boolean;
  accessMode?: string;
  counts?: {
    pending: number;
    approved: number;
    rejected: number;
  };
  registrations?: Registration[];
  error?: string;
};

type ReviewResponse = {
  ok?: boolean;
  action?: "APPROVE" | "REJECT";
  worker?: {
    workerCode?: string;
  };
  error?: string;
};

function formatDate(value: string) {
  const raw = value.trim();

  /*
    SQLite CURRENT_TIMESTAMP disimpan sebagai UTC:
    YYYY-MM-DD HH:MM:SS

    Tambahkan penanda UTC hanya jika timestamp
    belum membawa timezone sendiri.
  */
  const hasTimezone =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);

  let normalized = raw;

  if (!hasTimezone) {
    normalized =
      raw.includes("T")
        ? `${raw}Z`
        : `${raw.replace(" ", "T")}Z`;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatted =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    ).format(date);

  return `${formatted} WIB`;
}

function errorMessage(error: string) {
  switch (error) {
    case "INVALID_WORKER_TYPE":
      return "TIPE PEKERJA BELUM VALID.";
    case "INVALID_PAYMENT_METHOD":
      return "METODE BAYAR BELUM VALID.";
    case "REJECTION_REASON_REQUIRED":
      return "ALASAN PENOLAKAN WAJIB DIISI.";
    case "REGISTRATION_ALREADY_REVIEWED":
      return "PENDAFTARAN INI SUDAH PERNAH DIREVIEW.";
    case "REGISTRATION_NOT_FOUND":
      return "PENDAFTARAN TIDAK DITEMUKAN.";
    case "SCOPE_DENIED":
      return "AKUN INI TIDAK MEMILIKI HAK UNTUK REVIEW.";
    default:
      return "PROSES REVIEW GAGAL.";
  }
}

// CUSTOM REVIEW SELECT V11 START

type ReviewOption = {
  value: string;
  label: string;
};

type CustomReviewSelectProps = {
  label: string;
  value: string;
  placeholder: string;
  options: ReviewOption[];
  tone: "APPROVE" | "REJECT";
  disabled?: boolean;
  onChange: (value: string) => void;
};

function CustomReviewSelect({
  label,
  value,
  placeholder,
  options,
  tone,
  disabled = false,
  onChange,
}: CustomReviewSelectProps) {
  const [open, setOpen] = useState(false);

  const selected =
    options.find((option) => option.value === value);

  return (
    <div className={styles.customField}>
      <span className={styles.customFieldLabel}>
        {label}
      </span>

      <div className={styles.customDropdown}>
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={`${styles.customDropdownTrigger} ${
            tone === "APPROVE"
              ? styles.customApproveTrigger
              : styles.customRejectTrigger
          } ${open ? styles.customTriggerOpen : ""}`}
          onClick={() =>
            setOpen((current) => !current)
          }
        >
          <span
            className={
              selected
                ? styles.customSelectedText
                : styles.customPlaceholder
            }
          >
            {selected?.label ?? placeholder}
          </span>

          <span
            className={`${styles.customChevron} ${
              open
                ? styles.customChevronOpen
                : ""
            }`}
          >
            ↓
          </span>
        </button>

        {open ? (
          <div
            className={`${styles.customDropdownMenu} ${
              tone === "APPROVE"
                ? styles.customApproveMenu
                : styles.customRejectMenu
            }`}
            role="listbox"
          >
            {options.map((option) => {
              const active =
                option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${styles.customOption} ${
                    active
                      ? styles.customOptionSelected
                      : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>

                  {active ? (
                    <span className={styles.customCheck}>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const workerTypeOptions: ReviewOption[] = [
  {
    value: "BORONGAN",
    label: "BORONGAN",
  },
  {
    value: "HARIAN",
    label: "HARIAN",
  },
  {
    value: "BULANAN",
    label: "BULANAN",
  },
  {
    value: "OTHER",
    label: "OTHER",
  },
];

const paymentMethodOptions: ReviewOption[] = [
  {
    value: "CASH",
    label: "CASH",
  },
  {
    value: "BANK_TRANSFER",
    label: "BANK TRANSFER",
  },
  {
    value: "EWALLET",
    label: "E-WALLET",
  },
  {
    value: "OTHER",
    label: "OTHER",
  },
];

const rejectReasonOptions: ReviewOption[] = [
  {
    value: "DATA TIDAK LENGKAP",
    label: "DATA TIDAK LENGKAP",
  },
  {
    value: "NOMOR WHATSAPP TIDAK VALID",
    label: "NOMOR WHATSAPP TIDAK VALID",
  },
  {
    value: "DUPLIKAT PENDAFTARAN",
    label: "DUPLIKAT PENDAFTARAN",
  },
  {
    value: "BUKAN PEKERJA SABLON",
    label: "BUKAN PEKERJA SABLON",
  },
  {
    value: "DATA TEST SISTEM",
    label: "DATA TEST SISTEM",
  },
  {
    value: "LAINNYA",
    label: "LAINNYA",
  },
];

// CUSTOM REVIEW SELECT V11 END
export default function SablonWorkerRegistrationInbox() {
  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [counts, setCounts] =
    useState({
      pending: 0,
      approved: 0,
      rejected: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [workerTypes, setWorkerTypes] =
    useState<Record<string, string>>({});

  const [paymentMethods, setPaymentMethods] =
    useState<Record<string, string>>({});

  const [rejectReasons, setRejectReasons] =
    useState<Record<string, string>>({});

  const [rejectPresets, setRejectPresets] =
    useState<Record<string, string>>({});

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/rkn/worker-registration/registrations?status=PENDING",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json() as InboxResponse;

      if (!response.ok || !result.ok) {
        setError(
          result.error ??
            "GAGAL MEMUAT PENDAFTARAN"
        );
        return;
      }

      setRegistrations(
        Array.isArray(result.registrations)
          ? result.registrations
          : []
      );

      setCounts(
        result.counts ?? {
          pending: 0,
          approved: 0,
          rejected: 0,
        }
      );
    }
    catch {
      setError("GAGAL TERHUBUNG KE SERVER.");
    }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  async function reviewRegistration(
    registration: Registration,
    action: "APPROVE" | "REJECT"
  ) {
    const workerType =
      workerTypes[registration.id] ?? "";

    const paymentMethod =
      paymentMethods[registration.id] ?? "";

    const reason =
      rejectReasons[registration.id]?.trim() ?? "";

    if (
      action === "APPROVE" &&
      (!workerType || !paymentMethod)
    ) {
      setError(
        "PILIH TIPE PEKERJA DAN METODE BAYAR TERLEBIH DAHULU."
      );
      return;
    }

    if (
      action === "REJECT" &&
      reason.length < 3
    ) {
      setError(
        "ALASAN PENOLAKAN MINIMAL 3 KARAKTER."
      );
      return;
    }

    setProcessingId(registration.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/rkn/worker-registration/registrations/${encodeURIComponent(registration.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            action === "APPROVE"
              ? {
                  action,
                  workerType,
                  paymentMethod,
                }
              : {
                  action,
                  reason,
                }
          ),
        }
      );

      const result =
        await response.json() as ReviewResponse;

      if (!response.ok || !result.ok) {
        setError(
          errorMessage(
            result.error ?? "UNKNOWN"
          )
        );
        return;
      }

      if (action === "APPROVE") {
        setSuccess(
          result.worker?.workerCode
            ? `${registration.fullName} DISETUJUI SEBAGAI ${result.worker.workerCode}.`
            : `${registration.fullName} BERHASIL DISETUJUI.`
        );
      }
      else {
        setSuccess(
          `${registration.fullName} BERHASIL DITOLAK.`
        );
      }

      setWorkerTypes((current) => {
        const next = { ...current };
        delete next[registration.id];
        return next;
      });

      setPaymentMethods((current) => {
        const next = { ...current };
        delete next[registration.id];
        return next;
      });

      setRejectReasons((current) => {
        const next = { ...current };
        delete next[registration.id];
        return next;
      });

      setRejectPresets((current) => {
        const next = { ...current };
        delete next[registration.id];
        return next;
      });

      await loadInbox();
    }
    catch {
      setError("GAGAL TERHUBUNG KE SERVER.");
    }
    finally {
      setProcessingId("");
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span>PENDAFTARAN MASUK</span>
          <h3>VERIFIKASI PEKERJA BARU</h3>
        </div>

        <div className={styles.counter}>
          {counts.pending} PENDING
        </div>
      </div>

      <div className={styles.summary}>
        <div>
          <span>PENDING</span>
          <strong>{counts.pending}</strong>
        </div>

        <div>
          <span>APPROVED</span>
          <strong>{counts.approved}</strong>
        </div>

        <div>
          <span>REJECTED</span>
          <strong>{counts.rejected}</strong>
        </div>
      </div>

      {error ? (
        <div className={styles.error}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div className={styles.success}>
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className={styles.empty}>
          MEMUAT PENDAFTARAN...
        </div>
      ) : registrations.length === 0 ? (
        <div className={styles.empty}>
          BELUM ADA PENDAFTARAN YANG MENUNGGU VERIFIKASI.
        </div>
      ) : (
        <div className={styles.list}>
          {registrations.map((registration) => {
            const busy =
              processingId === registration.id;

            const canApprove =
              Boolean(
                workerTypes[registration.id]
              ) &&
              Boolean(
                paymentMethods[registration.id]
              ) &&
              !busy;

            const canReject =
              (
                rejectReasons[registration.id]
                  ?.trim().length ?? 0
              ) >= 3 &&
              !busy;

            return (
              <article
                key={registration.id}
                className={styles.card}
              >
                <div className={styles.identity}>
                  <div>
                    <span>NAMA LENGKAP</span>
                    <strong>
                      {registration.fullName}
                    </strong>
                  </div>

                  <div>
                    <span>NAMA PANGGILAN</span>
                    <strong>
                      {registration.nickname || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>WHATSAPP</span>
                    <strong>
                      {registration.whatsapp}
                    </strong>
                  </div>

                  <div>
                    <span>DIKIRIM</span>
                    <strong>
                      {formatDate(
                        registration.submittedAt
                      )}
                    </strong>
                  </div>
                </div>

                <div className={styles.detail}>
                  <div>
                    <span>ALAMAT / DOMISILI</span>
                    <p>
                      {registration.address || "-"}
                    </p>
                  </div>

                  <div>
                    <span>CATATAN</span>
                    <p>
                      {registration.notes || "-"}
                    </p>
                  </div>
                </div>

                <div className={styles.review}>
                  <div className={styles.approveBox}>
                    <div className={styles.boxTitle}>
                      SETUJUI PENDAFTARAN
                    </div>

                    <div className={styles.twoCol}>
                      <CustomReviewSelect
                        label="TIPE PEKERJA"
                        value={
                          workerTypes[registration.id] ?? ""
                        }
                        placeholder="PILIH TIPE PEKERJA"
                        options={workerTypeOptions}
                        tone="APPROVE"
                        disabled={busy}
                        onChange={(value) =>
                          setWorkerTypes({
                            ...workerTypes,
                            [registration.id]: value,
                          })
                        }
                      />

                      <CustomReviewSelect
                        label="METODE BAYAR"
                        value={
                          paymentMethods[registration.id] ?? ""
                        }
                        placeholder="PILIH METODE BAYAR"
                        options={paymentMethodOptions}
                        tone="APPROVE"
                        disabled={busy}
                        onChange={(value) =>
                          setPaymentMethods({
                            ...paymentMethods,
                            [registration.id]: value,
                          })
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.approveButton}
                      disabled={!canApprove}
                      onClick={() =>
                        void reviewRegistration(
                          registration,
                          "APPROVE"
                        )
                      }
                    >
                      {busy
                        ? "MEMPROSES..."
                        : "SETUJUI"}
                    </button>
                  </div>

                  <div className={styles.rejectBox}>
                    <div className={styles.boxTitle}>
                      TOLAK PENDAFTARAN
                    </div>

                    <div className={styles.rejectFields}>
                      <CustomReviewSelect
                        label="ALASAN CEPAT"
                        value={
                          rejectPresets[registration.id] ?? ""
                        }
                        placeholder="PILIH ALASAN"
                        options={rejectReasonOptions}
                        tone="REJECT"
                        disabled={busy}
                        onChange={(preset) => {
                          setRejectPresets({
                            ...rejectPresets,
                            [registration.id]: preset,
                          });

                          setRejectReasons({
                            ...rejectReasons,
                            [registration.id]:
                              !preset ||
                              preset === "LAINNYA"
                                ? ""
                                : preset,
                          });
                        }}
                      />

                      <div className={styles.customField}>
                        <span className={styles.customFieldLabel}>
                          ALASAN PENOLAKAN
                        </span>

                        <textarea
                          rows={2}
                          maxLength={500}
                          disabled={busy}
                          value={
                            rejectReasons[registration.id] ?? ""
                          }
                          onChange={(event) =>
                            setRejectReasons({
                              ...rejectReasons,
                              [registration.id]:
                                event.target.value,
                            })
                          }
                          placeholder="BISA DIEDIT / DIISI MANUAL"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.rejectButton}
                      disabled={!canReject}
                      onClick={() =>
                        void reviewRegistration(
                          registration,
                          "REJECT"
                        )
                      }
                    >
                      {busy
                        ? "MEMPROSES..."
                        : "TOLAK"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}