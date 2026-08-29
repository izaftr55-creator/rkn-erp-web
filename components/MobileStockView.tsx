"use client";

import {
  useMemo,
  useState,
} from "react";

import styles from "./MobileStockView.module.css";

export type MobileStockSummary = {
  ready: number;
  pending: number;
  waiting: number;
  random: number;
  review: number;
};

export type MobileStockRow = {
  key: string;
  platform: string;
  storeName: string;
  productId: string;
  productName: string;
  variationName: string;
  family: string;
  canonicalSku: string;
  inventoryStatus: string;
  detectedColors: string;
  bundleQty: number;
  fulfillmentAction: string;
  componentDetail: string;
};

type Props = {
  summary?: MobileStockSummary;
  rows?: MobileStockRow[];
};

type Filter =
  | "ALL"
  | "READY"
  | "PENDING";

function statusLabel(
  status: string
) {
  switch (status) {
    case "READY":
      return "Ready";

    case "WAITING_ALLOCATION":
      return "Butuh Alokasi";

    case "RANDOM_SUGGESTION":
      return "Saran SKU";

    case "REVIEW":
      return "Review";

    case "BLOCKED":
      return "Blocked";

    case "ARCHIVED":
      return "Archived";

    default:
      return status || "Belum Diputuskan";
  }
}

function isPending(
  status: string
) {
  return [
    "WAITING_ALLOCATION",
    "RANDOM_SUGGESTION",
    "REVIEW",
    "BLOCKED",
  ].includes(status);
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4 8 8-4 8 4-8 4-8-4Z" />
      <path d="m4 8v8l8 4 8-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

export default function MobileStockView({
  summary,
  rows,
}: Props) {
  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedKey, setSelectedKey] =
    useState("");

  const data =
    rows ?? [];

  const totals =
    summary ?? {
      ready: 0,
      pending: 0,
      waiting: 0,
      random: 0,
      review: 0,
    };

  const filtered =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase();

      return data.filter(
        (row) => {
          if (
            filter === "READY" &&
            row.inventoryStatus !==
              "READY"
          ) {
            return false;
          }

          if (
            filter === "PENDING" &&
            !isPending(
              row.inventoryStatus
            )
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          return [
            row.productName,
            row.variationName,
            row.family,
            row.canonicalSku,
            row.productId,
            row.storeName,
            row.platform,
            row.detectedColors,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q);
        }
      );
    }, [
      data,
      filter,
      query,
    ]);

  const selected =
    data.find(
      (row) =>
        row.key === selectedKey
    ) ?? null;

  return (
    <>
      <section
        className={styles.page}
      >
        <header
          className={styles.intro}
        >
          <span
            className={styles.eyebrow}
          >
            INVENTORY CONTROL
          </span>

          <h1>Persediaan</h1>

          <p>
            Kesiapan inventory untuk
            allocation, picking dan
            pemotongan stok.
          </p>

          <div
            className={styles.sourceNote}
          >
            <span>
              <i />
              Kesiapan stok
            </span>

            <small>
              INTERNAL ERP
            </small>
          </div>
        </header>

        <div
          className={styles.metrics}
        >
          <article>
            <span>
              Inventory Ready
            </span>

            <strong>
              {totals.ready.toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              siap auto-deduct
            </small>
          </article>

          <article>
            <span>
              Pending
            </span>

            <strong>
              {totals.pending.toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              perlu tindakan
            </small>
          </article>

          <article>
            <span>
              Butuh Alokasi
            </span>

            <strong>
              {totals.waiting.toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              warna / SKU fisik
            </small>
          </article>

          <article>
            <span>
              Review
            </span>

            <strong>
              {totals.review.toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              belum pasti
            </small>
          </article>
        </div>

        <div
          className={styles.tools}
        >
          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Cari produk, SKU, warna atau akun..."
            aria-label="Cari inventory"
          />

          <div
            className={styles.filters}
          >
            {(
              [
                ["ALL", "Semua"],
                ["READY", "Ready"],
                ["PENDING", "Pending"],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? styles.filterActive
                      : undefined
                  }
                  onClick={() =>
                    setFilter(value)
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        <div
          className={styles.sectionHead}
        >
          <strong>
            Inventory
          </strong>

          <span>
            {filtered.length.toLocaleString(
              "id-ID"
            )}{" "}
            ditampilkan
          </span>
        </div>

        {filtered.length === 0 ? (
          <div
            className={styles.empty}
          >
            <span
              className={styles.emptyIcon}
            >
              <BoxIcon />
            </span>

            <strong>
              Belum ada data inventory
            </strong>

            <p>
              Data kesiapan persediaan
              akan muncul setelah produk
              dan transaksi tersedia di
              ledger RKN ERP.
            </p>
          </div>
        ) : (
          <div
            className={styles.list}
          >
            {filtered.map(
              (row) => (
                <button
                  key={row.key}
                  type="button"
                  className={styles.card}
                  onClick={() =>
                    setSelectedKey(
                      row.key
                    )
                  }
                >
                  <div
                    className={styles.cardTop}
                  >
                    <span>
                      {row.platform ||
                        "MARKETPLACE"}
                    </span>

                    <small>
                      {row.storeName ||
                        "Akun marketplace"}
                    </small>
                  </div>

                  <div
                    className={styles.cardMain}
                  >
                    <span
                      className={styles.cardIcon}
                    >
                      <BoxIcon />
                    </span>

                    <span
                      className={styles.cardCopy}
                    >
                      <strong>
                        {row.productName ||
                          row.family ||
                          "Produk"}
                      </strong>

                      <small>
                        {row.variationName ||
                          row.detectedColors ||
                          "Varian belum tersedia"}
                      </small>

                      <em>
                        {row.canonicalSku ||
                          row.family ||
                          "-"}
                      </em>
                    </span>

                    <span
                      className={styles.arrow}
                    >
                      <ArrowIcon />
                    </span>
                  </div>

                  <div
                    className={styles.cardFoot}
                  >
                    <span>
                      Bundle{" "}
                      {row.bundleQty.toLocaleString(
                        "id-ID"
                      )}
                    </span>

                    <strong
                      className={
                        row.inventoryStatus ===
                        "READY"
                          ? styles.ready
                          : row.inventoryStatus ===
                              "REVIEW" ||
                            row.inventoryStatus ===
                              "BLOCKED"
                            ? styles.review
                            : styles.pending
                      }
                    >
                      {statusLabel(
                        row.inventoryStatus
                      )}
                    </strong>
                  </div>
                </button>
              )
            )}
          </div>
        )}

        <div
          className={styles.physicalNote}
        >
          <span>
            <i />
            STOK FISIK
          </span>

          <p>
            Jumlah stok fisik tidak
            ditampilkan sampai ledger
            persediaan menjadi sumber data
            resmi RKN ERP.
          </p>
        </div>
      </section>

      {selected && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Tutup detail inventory"
            onClick={() =>
              setSelectedKey("")
            }
          />

          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Detail inventory"
          >
            <div
              className={styles.handle}
            />

            <div
              className={styles.sheetHeader}
            >
              <div>
                <span
                  className={styles.eyebrow}
                >
                  DETAIL INVENTORY
                </span>

                <h2>
                  {selected.family ||
                    "Persediaan"}
                </h2>

                <p>
                  {selected.platform}
                  {selected.storeName
                    ? ` · ${selected.storeName}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={() =>
                  setSelectedKey("")
                }
                aria-label="Tutup"
              >
                <CloseIcon />
              </button>
            </div>

            <div
              className={styles.detailStatus}
            >
              <span>
                STATUS INVENTORY
              </span>

              <strong>
                {statusLabel(
                  selected.inventoryStatus
                )}
              </strong>
            </div>

            <div
              className={styles.detailGrid}
            >
              <div>
                <small>
                  SKU Master
                </small>

                <strong>
                  {selected.canonicalSku ||
                    "-"}
                </strong>
              </div>

              <div>
                <small>
                  Bundle Qty
                </small>

                <strong>
                  {selected.bundleQty.toLocaleString(
                    "id-ID"
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Warna
                </small>

                <strong>
                  {selected.detectedColors ||
                    selected.variationName ||
                    "-"}
                </strong>
              </div>

              <div>
                <small>
                  Product ID
                </small>

                <strong>
                  {selected.productId ||
                    "-"}
                </strong>
              </div>
            </div>

            <div
              className={styles.productPanel}
            >
              <small>
                PRODUK
              </small>

              <strong>
                {selected.productName ||
                  "-"}
              </strong>

              {selected.variationName && (
                <span>
                  {selected.variationName}
                </span>
              )}
            </div>

            {selected.componentDetail && (
              <div
                className={styles.productPanel}
              >
                <small>
                  KOMPONEN
                </small>

                <p>
                  {selected.componentDetail}
                </p>
              </div>
            )}

            {selected.fulfillmentAction && (
              <div
                className={styles.actionPanel}
              >
                <span>
                  TINDAKAN STOK
                </span>

                <p>
                  {selected.fulfillmentAction}
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
