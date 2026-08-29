"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "./MobileMarketplaceView.module.css";

export type MobileMarketplaceStore = {
  storeId: string;
  storeName: string;
  platform: string;
  status: string;
};

type Props = {
  stores?: MobileMarketplaceStore[];
  onSelect: (tab: string) => void;
  onPlanned: (label: string) => void;
};

function nicePlatform(
  value: string
) {
  const text =
    value
      .trim()
      .toUpperCase();

  if (text === "SHOPEE") {
    return "Shopee";
  }

  if (text === "TIKTOK") {
    return "TikTok";
  }

  if (text === "TOKOPEDIA") {
    return "Tokopedia";
  }

  if (text === "LAZADA") {
    return "Lazada";
  }

  return (
    value.trim() ||
    "Marketplace"
  );
}

function Icon({
  name,
}: {
  name:
    | "store"
    | "order"
    | "product"
    | "sku"
    | "money"
    | "api"
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

  if (name === "order") {
    return (
      <svg {...common}>
        <path d="M7 4h10" />
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </svg>
    );
  }

  if (name === "product") {
    return (
      <svg {...common}>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>
    );
  }

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

  if (name === "money") {
    return (
      <svg {...common}>
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
        />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (name === "api") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
        <path d="m4.9 4.9 2.1 2.1" />
        <path d="m17 17 2.1 2.1" />
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
      <path d="M4 9h16" />
      <path d="m5 9 1-5h12l1 5" />
      <path d="M6 9v11h12V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export default function MobileMarketplaceView({
  stores,
  onSelect,
  onPlanned,
}: Props) {
  const [selected, setSelected] =
    useState("");

  const data =
    stores ?? [];

  const groups =
    useMemo(() => {
      const map =
        new Map<
          string,
          MobileMarketplaceStore[]
        >();

      for (const store of data) {
        const platform =
          String(
            store.platform ||
            "UNKNOWN"
          )
            .trim()
            .toUpperCase();

        const rows =
          map.get(platform) ?? [];

        rows.push(store);

        map.set(
          platform,
          rows
        );
      }

      return Array.from(
        map.entries()
      ).map(
        ([
          platform,
          platformStores,
        ]) => ({
          platform,
          stores:
            platformStores,
          active:
            platformStores.filter(
              (store) =>
                store.status
                  .toUpperCase() ===
                "ACTIVE"
            ).length,
        })
      );
    }, [data]);

  const selectedGroup =
    groups.find(
      (group) =>
        group.platform ===
        selected
    ) ?? null;

  const active =
    data.filter(
      (store) =>
        store.status
          .toUpperCase() ===
        "ACTIVE"
    ).length;

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
        <header
          className={styles.intro}
        >
          <span
            className={styles.eyebrow}
          >
            RINGKASAN MARKETPLACE
          </span>

          <h1>
            Marketplace
          </h1>

          <p>
            Kendali toko, operasional dan
            kesiapan integrasi marketplace
            RKN ERP.
          </p>

          <div
            className={styles.banner}
          >
            <span>
              <i />
              API-first architecture
            </span>

            <small>
              RINGKASAN
            </small>
          </div>
        </header>

        <div
          className={styles.metrics}
        >
          <article>
            <span>Total Toko</span>

            <strong>
              {data.length.toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              akun terdaftar
            </small>
          </article>

          <article>
            <span>Toko Aktif</span>

            <strong>
              {active.toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              status active
            </small>
          </article>

          <article>
            <span>Platform</span>

            <strong>
              {groups.length.toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              kanal marketplace
            </small>
          </article>

          <article>
            <span>Nonaktif</span>

            <strong>
              {Math.max(
                0,
                data.length -
                  active
              ).toLocaleString(
                "id-ID"
              )}
            </strong>

            <small>
              toko tidak aktif
            </small>
          </article>
        </div>

        <div
          className={styles.sectionHead}
        >
          <div>
            <strong>
              Status Integrasi
            </strong>

            <span>
              Per marketplace
            </span>
          </div>

          <small>API</small>
        </div>

        <div
          className={styles.platformList}
        >
          {groups.length === 0 ? (
            <div
              className={styles.empty}
            >
              <span>
                <Icon name="store" />
              </span>

              <strong>
                Belum ada toko
              </strong>

              <p>
                Master toko marketplace
                belum tersedia.
              </p>
            </div>
          ) : (
            groups.map(
              (group) => (
                <button
                  key={group.platform}
                  type="button"
                  className={styles.platformCard}
                  onClick={() =>
                    setSelected(
                      group.platform
                    )
                  }
                >
                  <span
                    className={styles.iconBox}
                  >
                    <Icon name="store" />
                  </span>

                  <span
                    className={styles.platformCopy}
                  >
                    <strong>
                      {nicePlatform(
                        group.platform
                      )}
                    </strong>

                    <small>
                      {group.stores.length.toLocaleString(
                        "id-ID"
                      )}{" "}
                      toko ·{" "}
                      {group.active.toLocaleString(
                        "id-ID"
                      )}{" "}
                      aktif
                    </small>

                    <em>
                      Menunggu integrasi API
                    </em>
                  </span>

                  <span
                    className={styles.end}
                  >
                    <i />
                    <Icon name="arrow" />
                  </span>
                </button>
              )
            )
          )}
        </div>

        <div
          className={styles.sectionHead}
        >
          <div>
            <strong>
              Operasional
            </strong>

            <span>
              Akses cepat
            </span>
          </div>
        </div>

        <div
          className={styles.operations}
        >
          <button
            type="button"
            onClick={() =>
              onSelect("orders")
            }
          >
            <span>
              <Icon name="order" />
            </span>

            <strong>Pesanan</strong>
            <small>Packing</small>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect("products")
            }
          >
            <span>
              <Icon name="product" />
            </span>

            <strong>Produk</strong>
            <small>Katalog</small>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect("skuColors")
            }
          >
            <span>
              <Icon name="sku" />
            </span>

            <strong>
              SKU & Warna
            </strong>

            <small>SKU Master</small>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect("stores")
            }
          >
            <span>
              <Icon name="store" />
            </span>

            <strong>Toko</strong>
            <small>Master Akun</small>
          </button>

          <button
            type="button"
            onClick={() =>
              onPlanned(
                "Marketplace Settlement"
              )
            }
          >
            <span>
              <Icon name="money" />
            </span>

            <strong>
              Settlement
            </strong>

            <small>Keuangan MP</small>
          </button>

          <button
            type="button"
            onClick={() =>
              onPlanned(
                "Pusat Integrasi API"
              )
            }
          >
            <span>
              <Icon name="api" />
            </span>

            <strong>
              Integrasi API
            </strong>

            <small>Connector</small>
          </button>
        </div>

        <div
          className={styles.future}
        >
          <strong>
            DATA MARKETPLACE
          </strong>

          <p>
            Setelah konektor aktif, data
            transaksi dan finansial akan
            masuk otomatis ke Control
            Center.
          </p>

          <div>
            <span>Pesanan</span>
            <span>Penjualan</span>
            <span>Admin Fee</span>
            <span>Iklan</span>
            <span>Pajak</span>
            <span>Settlement</span>
            <span>Refund</span>
            <span>Return</span>
          </div>
        </div>
      </section>

      {selectedGroup && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Tutup detail marketplace"
            onClick={() =>
              setSelected("")
            }
          />

          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
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
                  MARKETPLACE
                </span>

                <h2>
                  {nicePlatform(
                    selectedGroup.platform
                  )}
                </h2>

                <p>
                  {selectedGroup.stores.length.toLocaleString(
                    "id-ID"
                  )}{" "}
                  toko terdaftar
                </p>
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={() =>
                  setSelected("")
                }
                aria-label="Tutup"
              >
                <Icon name="close" />
              </button>
            </div>

            <div
              className={styles.connector}
            >
              <span>
                <i />
                STATUS CONNECTOR
              </span>

              <strong>
                Menunggu Integrasi API
              </strong>

              <p>
                Belum ada koneksi API
                marketplace yang aktif.
              </p>
            </div>

            <div
              className={styles.sheetMetrics}
            >
              <div>
                <small>
                  Total Toko
                </small>

                <strong>
                  {selectedGroup.stores.length.toLocaleString(
                    "id-ID"
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Aktif
                </small>

                <strong>
                  {selectedGroup.active.toLocaleString(
                    "id-ID"
                  )}
                </strong>
              </div>
            </div>

            <h3
              className={styles.storeTitle}
            >
              Daftar Toko
            </h3>

            <div
              className={styles.storeList}
            >
              {selectedGroup.stores.map(
                (store) => {
                  const storeActive =
                    store.status
                      .toUpperCase() ===
                    "ACTIVE";

                  return (
                    <div
                      key={store.storeId}
                      className={styles.storeCard}
                    >
                      <span
                        className={styles.storeIcon}
                      >
                        <Icon name="store" />
                      </span>

                      <span
                        className={styles.storeCopy}
                      >
                        <strong>
                          {store.storeName ||
                            store.storeId}
                        </strong>

                        <small>
                          {store.storeId}
                        </small>
                      </span>

                      <em
                        className={
                          storeActive
                            ? styles.active
                            : styles.inactive
                        }
                      >
                        {storeActive
                          ? "AKTIF"
                          : "NONAKTIF"}
                      </em>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
