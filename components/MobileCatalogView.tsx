"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "./MobileCatalogView.module.css";

export type MobileProductRow = {
  productId: string;
  sku: string;
  productName: string;
  category: string;
  variant: string;
  unit: string;
  hpp: string;
  status: string;
};

export type MobileSkuRow = {
  productName: string;
  family: string;
  parentSku: string;
  variantSku: string;
  color: string;
  size: string;
  validationStatus: string;
  syncEligible: string;
  sourceSheet: string;
  notes: string;
};

export type MobileCatalogStore = {
  storeId: string;
  ownerId: string;
  platform: string;
  storeName: string;
  storeCode: string;
  status: string;
  apiStatus: string;
};

type Mode =
  | "products"
  | "skuColors"
  | "stores";

type Filter =
  | "ALL"
  | "GOOD"
  | "REVIEW";

type Detail = {
  label: string;
  value: string;
};

type CatalogItem = {
  key: string;
  title: string;
  subtitle: string;
  code: string;
  status: string;
  tone:
    | "good"
    | "warn"
    | "neutral";
  searchable: string;
  details: Detail[];
};

type Props = {
  mode: Mode;
  products?: MobileProductRow[];
  skuRows?: MobileSkuRow[];
  stores?: MobileCatalogStore[];
  onSelect: (tab: string) => void;
};

function normalized(
  value: string
) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function truthy(
  value: string
) {
  return [
    "TRUE",
    "YES",
    "Y",
    "1",
    "READY",
    "ELIGIBLE",
  ].includes(
    normalized(value)
  );
}

function activeStatus(
  value: string
) {
  return [
    "ACTIVE",
    "AKTIF",
    "READY",
    "ENABLED",
  ].includes(
    normalized(value)
  );
}

function money(
  value: string
) {
  const number =
    Number(
      String(value || "")
        .replace(/[^\d.-]/g, "")
    );

  if (
    !Number.isFinite(number) ||
    !String(value || "").trim()
  ) {
    return value || "-";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(number);
}

function niceStatus(
  value: string
) {
  const status =
    normalized(value);

  if (!status) {
    return "Belum Ditentukan";
  }

  if (
    status === "TRUE" ||
    status === "READY" ||
    status === "ELIGIBLE"
  ) {
    return "Siap";
  }

  if (status === "ACTIVE") {
    return "Aktif";
  }

  if (status === "INACTIVE") {
    return "Nonaktif";
  }

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

function Icon({
  name,
}: {
  name:
    | "box"
    | "sku"
    | "store"
    | "search"
    | "back"
    | "arrow"
    | "close";
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "sku") {
    return (
      <svg {...common}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }

  if (name === "store") {
    return (
      <svg {...common}>
        <path d="M4 9h16" />
        <path d="m5 9 1-5h12l1 5" />
        <path d="M6 9v11h12V9" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (name === "back") {
    return (
      <svg {...common}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

export default function MobileCatalogView({
  mode,
  products,
  skuRows,
  stores,
  onSelect,
}: Props) {
  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedKey, setSelectedKey] =
    useState("");

  useEffect(() => {
    setQuery("");
    setFilter("ALL");
    setSelectedKey("");
  }, [mode]);

  const config =
    mode === "products"
      ? {
          eyebrow:
            "MASTER PRODUK",
          title: "Produk",
          description:
            "Master produk RKN ERP.",
          icon:
            "box" as const,
          goodLabel: "Aktif",
          reviewLabel: "Nonaktif",
        }
      : mode === "skuColors"
        ? {
            eyebrow:
              "SKU & COLOR MASTER",
            title:
              "SKU & Warna",
            description:
              "SKU master, varian, dan warna.",
            icon:
              "sku" as const,
            goodLabel:
              "Siap",
            reviewLabel:
              "Review",
          }
        : {
            eyebrow:
              "MARKETPLACE STORE MASTER",
            title:
              "Toko",
            description:
              "Master akun dan kanal marketplace.",
            icon:
              "store" as const,
            goodLabel:
              "Aktif",
            reviewLabel:
              "Nonaktif",
          };

  const items =
    useMemo<CatalogItem[]>(() => {
      if (mode === "products") {
        return (
          products ?? []
        ).map(
          (row, index) => {
            const good =
              activeStatus(
                row.status
              );

            return {
              key:
                [
                  row.productId,
                  row.sku,
                  index,
                ].join("::"),

              title:
                row.productName ||
                row.sku ||
                "Produk",

              subtitle:
                [
                  row.category,
                  row.variant,
                ]
                  .filter(Boolean)
                  .join(" · ") ||
                "Produk master",

              code:
                row.sku ||
                row.productId ||
                "-",

              status:
                niceStatus(
                  row.status
                ),

              tone:
                good
                  ? "good"
                  : "warn",

              searchable:
                [
                  row.productId,
                  row.sku,
                  row.productName,
                  row.category,
                  row.variant,
                  row.unit,
                  row.status,
                ].join(" "),

              details: [
                {
                  label:
                    "Product ID",
                  value:
                    row.productId ||
                    "-",
                },
                {
                  label:
                    "SKU",
                  value:
                    row.sku ||
                    "-",
                },
                {
                  label:
                    "Kategori",
                  value:
                    row.category ||
                    "-",
                },
                {
                  label:
                    "Varian",
                  value:
                    row.variant ||
                    "-",
                },
                {
                  label:
                    "Satuan",
                  value:
                    row.unit ||
                    "-",
                },
                {
                  label:
                    "HPP Default",
                  value:
                    money(row.hpp),
                },
                {
                  label:
                    "Status",
                  value:
                    niceStatus(
                      row.status
                    ),
                },
              ],
            };
          }
        );
      }

      if (
        mode === "skuColors"
      ) {
        return (
          skuRows ?? []
        ).map(
          (row, index) => {
            const ready =
              truthy(
                row.syncEligible
              );

            return {
              key:
                [
                  row.variantSku,
                  row.family,
                  index,
                ].join("::"),

              title:
                row.productName ||
                row.family ||
                "SKU Varian",

              subtitle:
                [
                  row.color,
                  row.size,
                ]
                  .filter(Boolean)
                  .join(" · ") ||
                row.family ||
                "Varian master",

              code:
                row.variantSku ||
                row.parentSku ||
                "-",

              status:
                ready
                  ? "Siap Sync"
                  : (
                      niceStatus(
                        row.validationStatus
                      ) ||
                      "Review"
                    ),

              tone:
                ready
                  ? "good"
                  : "warn",

              searchable:
                [
                  row.productName,
                  row.family,
                  row.parentSku,
                  row.variantSku,
                  row.color,
                  row.size,
                  row.validationStatus,
                  row.notes,
                ].join(" "),

              details: [
                {
                  label:
                    "Keluarga Produk",
                  value:
                    row.family ||
                    "-",
                },
                {
                  label:
                    "SKU Induk",
                  value:
                    row.parentSku ||
                    "-",
                },
                {
                  label:
                    "SKU Varian",
                  value:
                    row.variantSku ||
                    "-",
                },
                {
                  label:
                    "Warna",
                  value:
                    row.color ||
                    "-",
                },
                {
                  label:
                    "Ukuran",
                  value:
                    row.size ||
                    "-",
                },
                {
                  label:
                    "Validasi",
                  value:
                    niceStatus(
                      row.validationStatus
                    ),
                },
                {
                  label:
                    "Sync Eligible",
                  value:
                    ready
                      ? "Ya"
                      : "Tidak",
                },
                {
                  label:
                    "Sumber",
                  value:
                    row.sourceSheet ||
                    "-",
                },
                {
                  label:
                    "Catatan",
                  value:
                    row.notes ||
                    "-",
                },
              ],
            };
          }
        );
      }

      return (
        stores ?? []
      ).map(
        (row, index) => {
          const good =
            activeStatus(
              row.status
            );

          return {
            key:
              [
                row.storeId,
                row.platform,
                index,
              ].join("::"),

            title:
              row.storeName ||
              row.storeId ||
              "Toko",

            subtitle:
              row.platform ||
              "Marketplace",

            code:
              row.storeId ||
              row.storeCode ||
              "-",

            status:
              niceStatus(
                row.status
              ),

            tone:
              good
                ? "good"
                : "warn",

            searchable:
              [
                row.storeId,
                row.ownerId,
                row.platform,
                row.storeName,
                row.storeCode,
                row.status,
                row.apiStatus,
              ].join(" "),

            details: [
              {
                label:
                  "Store ID",
                value:
                  row.storeId ||
                  "-",
              },
              {
                label:
                  "Nama Toko",
                value:
                  row.storeName ||
                  "-",
              },
              {
                label:
                  "Marketplace",
                value:
                  row.platform ||
                  "-",
              },
              {
                label:
                  "Owner ID",
                value:
                  row.ownerId ||
                  "-",
              },
              {
                label:
                  "Store Code",
                value:
                  row.storeCode ||
                  "-",
              },
              {
                label:
                  "Status",
                value:
                  niceStatus(
                    row.status
                  ),
              },
              {
                label:
                  "API Status",
                value:
                  row.apiStatus ||
                  "Belum tersedia",
              },
            ],
          };
        }
      );
    }, [
      mode,
      products,
      skuRows,
      stores,
    ]);

  const filtered =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase();

      return items.filter(
        (item) => {
          if (
            filter === "GOOD" &&
            item.tone !== "good"
          ) {
            return false;
          }

          if (
            filter === "REVIEW" &&
            item.tone === "good"
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          return (
            item.searchable +
            " " +
            item.title +
            " " +
            item.code
          )
            .toLowerCase()
            .includes(q);
        }
      );
    }, [
      items,
      filter,
      query,
    ]);

  const selected =
    items.find(
      (item) =>
        item.key ===
        selectedKey
    ) ?? null;

  const metrics =
    useMemo(() => {
      if (mode === "products") {
        const rows =
          products ?? [];

        return [
          {
            label:
              "Total Produk",
            value:
              rows.length,
            note:
              "canonical",
          },
          {
            label:
              "Aktif",
            value:
              rows.filter(
                (row) =>
                  activeStatus(
                    row.status
                  )
              ).length,
            note:
              "produk",
          },
          {
            label:
              "Kategori",
            value:
              new Set(
                rows
                  .map(
                    (row) =>
                      row.category
                        .trim()
                  )
                  .filter(Boolean)
              ).size,
            note:
              "kategori",
          },
          {
            label:
              "HPP Terisi",
            value:
              rows.filter(
                (row) =>
                  String(
                    row.hpp || ""
                  ).trim()
              ).length,
            note:
              "produk",
          },
        ];
      }

      if (
        mode === "skuColors"
      ) {
        const rows =
          skuRows ?? [];

        const ready =
          rows.filter(
            (row) =>
              truthy(
                row.syncEligible
              )
          ).length;

        return [
          {
            label:
              "Total Varian",
            value:
              rows.length,
            note:
              "SKU warna",
          },
          {
            label:
              "Siap Sync",
            value:
              ready,
            note:
              "eligible",
          },
          {
            label:
              "Family",
            value:
              new Set(
                rows
                  .map(
                    (row) =>
                      row.family
                        .trim()
                  )
                  .filter(Boolean)
              ).size,
            note:
              "produk",
          },
          {
            label:
              "Review",
            value:
              Math.max(
                0,
                rows.length -
                  ready
              ),
            note:
              "perlu cek",
          },
        ];
      }

      const rows =
        stores ?? [];

      const active =
        rows.filter(
          (row) =>
            activeStatus(
              row.status
            )
        ).length;

      return [
        {
          label:
            "Total Toko",
          value:
            rows.length,
          note:
            "akun",
        },
        {
          label:
            "Aktif",
          value:
            active,
          note:
            "toko",
        },
        {
          label:
            "Platform",
          value:
            new Set(
              rows
                .map(
                  (row) =>
                    row.platform
                      .trim()
                      .toUpperCase()
                )
                .filter(Boolean)
            ).size,
          note:
            "kanal",
        },
        {
          label:
            "Nonaktif",
          value:
            Math.max(
              0,
              rows.length -
                active
            ),
          note:
            "toko",
        },
      ];
    }, [
      mode,
      products,
      skuRows,
      stores,
    ]);

  useEffect(() => {
    document.body.style.overflow =
      selected
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [selected]);

  return (
    <>
      <section
        className={styles.page}
      >
        <button
          type="button"
          className={styles.breadcrumb}
          onClick={() =>
            onSelect(
              "marketplaceHub"
            )
          }
        >
          <Icon name="back" />

          <span>
            Marketplace
          </span>
        </button>

        <header
          className={styles.intro}
        >
          <span
            className={styles.eyebrow}
          >
            {config.eyebrow}
          </span>

          <h1>
            {config.title}
          </h1>

          <p>
            {config.description}
          </p>
        </header>

        <div
          className={styles.metrics}
        >
          {metrics.map(
            (metric) => (
              <article
                key={metric.label}
              >
                <span>
                  {metric.label}
                </span>

                <strong>
                  {metric.value.toLocaleString(
                    "id-ID"
                  )}
                </strong>

                <small>
                  {metric.note}
                </small>
              </article>
            )
          )}
        </div>

        <div
          className={styles.tools}
        >
          <div
            className={styles.search}
          >
            <Icon name="search" />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder={
                mode ===
                "products"
                  ? "Cari produk atau SKU..."
                  : mode ===
                      "skuColors"
                    ? "Cari SKU, warna atau family..."
                    : "Cari toko atau marketplace..."
              }
              aria-label={
                "Cari " +
                config.title
              }
            />
          </div>

          <div
            className={styles.filters}
          >
            <button
              type="button"
              className={
                filter === "ALL"
                  ? styles.filterActive
                  : undefined
              }
              onClick={() =>
                setFilter("ALL")
              }
            >
              Semua
            </button>

            <button
              type="button"
              className={
                filter === "GOOD"
                  ? styles.filterActive
                  : undefined
              }
              onClick={() =>
                setFilter("GOOD")
              }
            >
              {config.goodLabel}
            </button>

            <button
              type="button"
              className={
                filter === "REVIEW"
                  ? styles.filterActive
                  : undefined
              }
              onClick={() =>
                setFilter(
                  "REVIEW"
                )
              }
            >
              {config.reviewLabel}
            </button>
          </div>
        </div>

        <div
          className={styles.sectionHead}
        >
          <strong>
            {config.title}
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
            <span>
              <Icon
                name={config.icon}
              />
            </span>

            <strong>
              Data tidak ditemukan
            </strong>

            <p>
              Tidak ada data yang
              sesuai dengan pencarian
              atau filter saat ini.
            </p>
          </div>
        ) : (
          <div
            className={styles.list}
          >
            {filtered.map(
              (item) => (
                <button
                  key={item.key}
                  type="button"
                  className={styles.card}
                  onClick={() =>
                    setSelectedKey(
                      item.key
                    )
                  }
                >
                  <div
                    className={styles.cardMain}
                  >
                    <span
                      className={styles.iconBox}
                    >
                      <Icon
                        name={config.icon}
                      />
                    </span>

                    <span
                      className={styles.cardCopy}
                    >
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.subtitle}
                      </small>

                      <em>
                        {item.code}
                      </em>
                    </span>

                    <span
                      className={styles.arrow}
                    >
                      <Icon name="arrow" />
                    </span>
                  </div>

                  <div
                    className={styles.cardFoot}
                  >
                    <span>
                      Detail
                    </span>

                    <strong
                      className={
                        item.tone ===
                        "good"
                          ? styles.good
                          : item.tone ===
                              "warn"
                            ? styles.warn
                            : styles.neutral
                      }
                    >
                      {item.status}
                    </strong>
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </section>

      {selected && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Tutup detail"
            onClick={() =>
              setSelectedKey("")
            }
          />

          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={
              "Detail " +
              selected.title
            }
          >
            <div
              className={styles.handle}
            />

            <div
              className={styles.sheetHead}
            >
              <div>
                <span
                  className={styles.eyebrow}
                >
                  DETAIL{" "}
                  {config.title.toUpperCase()}
                </span>

                <h2>
                  {selected.title}
                </h2>

                <p>
                  {selected.code}
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
                <Icon name="close" />
              </button>
            </div>

            <div
              className={styles.statusPanel}
            >
              <span>
                STATUS
              </span>

              <strong
                className={
                  selected.tone ===
                  "good"
                    ? styles.goodText
                    : styles.warnText
                }
              >
                {selected.status}
              </strong>
            </div>

            <div
              className={styles.detailList}
            >
              {selected.details.map(
                (detail) => (
                  <div
                    key={
                      detail.label
                    }
                  >
                    <small>
                      {detail.label}
                    </small>

                    <strong>
                      {detail.value}
                    </strong>
                  </div>
                )
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
