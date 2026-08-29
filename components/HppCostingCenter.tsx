"use client";

// RKN_HPP_ZERO_INPUT_FIX_V1103B

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "./HppCostingCenter.module.css";

export type HppProductOption = {
  productId: string;
  sku: string;
  productName: string;
  category: string;
};

type Props = {
  products?: HppProductOption[];
};

type CostComponent = {
  name: string;
  amount: number;
};

type HppRow = {
  cost_key: string;
  product_id: string;
  sku: string;
  product_name: string;
  method:
    | "MANUAL"
    | "AUTO";
  manual_hpp: number;
  calculated_hpp: number;
  effective_hpp: number;
  components_json: string;
  effective_from: string;
  source_note: string;
  updated_by: string;
  updated_at: string;
};

type HistoryRow = {
  id: number;
  effective_hpp: number;
  method: string;
  effective_from: string;
  source_note: string;
  changed_by: string;
  changed_at: string;
};

const defaultComponents:
  CostComponent[] = [
  {
    name: "Bahan Utama",
    amount: 0,
  },
  {
    name: "Jahit / Produksi",
    amount: 0,
  },
  {
    name: "Label / Aksesoris",
    amount: 0,
  },
  {
    name: "Kemasan Produksi",
    amount: 0,
  },
  {
    name: "Overhead Produksi",
    amount: 0,
  },
];

function rupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value) || 0
  );
}

function today() {
  const date =
    new Date();

  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() -
      offset * 60_000
  )
    .toISOString()
    .slice(0, 10);
}

function productKey(
  product:
    HppProductOption
) {
  return [
    product.productId,
    product.sku,
  ].join("::");
}

function parseComponents(
  value: string
) {
  try {
    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return defaultComponents;
    }

    const current =
      parsed.map(
        (
          item: Record<
            string,
            unknown
          >
        ) => ({
          name:
            String(
              item.name || ""
            ),
          amount:
            Number(
              item.amount
            ) || 0,
        })
      );

    return current.length
      ? current
      : defaultComponents;
  }
  catch {
    return defaultComponents;
  }
}

export default function HppCostingCenter({
  products,
}: Props) {
  const productRows =
    products ?? [];

  const [rows, setRows] =
    useState<HppRow[]>([]);

  const [history, setHistory] =
    useState<
      HistoryRow[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [editorOpen, setEditorOpen] =
    useState(false);

  const [
    selectedProductKey,
    setSelectedProductKey,
  ] = useState("");

  const [method, setMethod] =
    useState<
      "MANUAL" | "AUTO"
    >("MANUAL");

  const [
    manualHpp,
    setManualHpp,
  ] = useState(0);

  const [
    components,
    setComponents,
  ] = useState<
    CostComponent[]
  >(
    defaultComponents.map(
      (item) => ({...item})
    )
  );

  const [
    effectiveFrom,
    setEffectiveFrom,
  ] = useState(today());

  const [
    sourceNote,
    setSourceNote,
  ] = useState("");

  async function loadRows() {
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/rkn/hpp",
          {
            cache:
              "no-store",
          }
        );

      const json =
        (await response.json()) as {
          ok?: boolean;
          rows?: unknown;
        };

      if (
        !response.ok ||
        !json.ok
      ) {
        throw new Error(
          "HPP_API_ERROR"
        );
      }

      setRows(
        Array.isArray(
          json.rows
        )
          ? json.rows
          : []
      );
    }
    catch {
      setNotice(
        "Data HPP belum dapat dibaca."
      );
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  const selectedProduct =
    productRows.find(
      (product) =>
        productKey(product) ===
        selectedProductKey
    ) ?? null;

  const calculatedHpp =
    useMemo(
      () =>
        components.reduce(
          (sum, item) =>
            sum +
            (
              Number(
                item.amount
              ) || 0
            ),
          0
        ),
      [components]
    );

  const effectiveHpp =
    method === "MANUAL"
      ? manualHpp
      : calculatedHpp;

  const savedMap =
    useMemo(
      () =>
        new Map(
          rows.map(
            (row) => [
              row.cost_key,
              row,
            ]
          )
        ),
      [rows]
    );

  const merged =
    useMemo(() => {
      const result =
        productRows.map(
          (product) => {
            const key =
              product.sku
                ? `SKU:${product.sku}`
                : `PRODUCT:${product.productId}`;

            return {
              product,
              saved:
                savedMap.get(
                  key
                ) ?? null,
            };
          }
        );

      const masterKeys =
        new Set(
          result.map(
            (item) =>
              item.saved
                ?.cost_key ||
              (
                item.product.sku
                  ? `SKU:${item.product.sku}`
                  : `PRODUCT:${item.product.productId}`
              )
          )
        );

      for (const saved of rows) {
        if (
          masterKeys.has(
            saved.cost_key
          )
        ) {
          continue;
        }

        result.push({
          product: {
            productId:
              saved.product_id,
            sku:
              saved.sku,
            productName:
              saved.product_name,
            category: "",
          },
          saved,
        });
      }

      const q =
        query
          .trim()
          .toLowerCase();

      return result.filter(
        (item) => {
          if (!q) {
            return true;
          }

          return [
            item.product.productId,
            item.product.sku,
            item.product.productName,
            item.product.category,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q);
        }
      );
    }, [
      productRows,
      rows,
      savedMap,
      query,
    ]);

  const manualCount =
    rows.filter(
      (row) =>
        row.method ===
        "MANUAL"
    ).length;

  const autoCount =
    rows.filter(
      (row) =>
        row.method ===
        "AUTO"
    ).length;

  async function loadHistory(
    costKey: string
  ) {
    if (!costKey) {
      setHistory([]);
      return;
    }

    try {
      const response =
        await fetch(
          `/api/rkn/hpp?costKey=${encodeURIComponent(
            costKey
          )}`,
          {
            cache:
              "no-store",
          }
        );

      const json =
        (await response.json()) as {
          history?: unknown;
        };

      setHistory(
        Array.isArray(
          json.history
        )
          ? json.history
          : []
      );
    }
    catch {
      setHistory([]);
    }
  }

  function resetEditor() {
    const first =
      productRows[0];

    setSelectedProductKey(
      first
        ? productKey(first)
        : ""
    );

    setMethod("MANUAL");
    setManualHpp(0);

    setComponents(
      defaultComponents.map(
        (item) => ({
          ...item,
        })
      )
    );

    setEffectiveFrom(
      today()
    );

    setSourceNote("");
    setHistory([]);
  }

  function openNew() {
    resetEditor();
    setEditorOpen(true);
  }

  function openSaved(
    saved: HppRow,
    product:
      HppProductOption
  ) {
    setSelectedProductKey(
      productKey(product)
    );

    setMethod(
      saved.method
    );

    setManualHpp(
      Number(
        saved.manual_hpp
      ) || 0
    );

    setComponents(
      parseComponents(
        saved.components_json
      )
    );

    setEffectiveFrom(
      saved.effective_from ||
      today()
    );

    setSourceNote(
      saved.source_note || ""
    );

    setEditorOpen(true);

    void loadHistory(
      saved.cost_key
    );
  }

  function changeProduct(
    key: string
  ) {
    setSelectedProductKey(
      key
    );

    const product =
      productRows.find(
        (item) =>
          productKey(
            item
          ) === key
      );

    if (!product) {
      return;
    }

    const costKey =
      product.sku
        ? `SKU:${product.sku}`
        : `PRODUCT:${product.productId}`;

    const saved =
      savedMap.get(
        costKey
      );

    if (!saved) {
      setMethod("MANUAL");
      setManualHpp(0);

      setComponents(
        defaultComponents.map(
          (item) => ({
            ...item,
          })
        )
      );

      setEffectiveFrom(
        today()
      );

      setSourceNote("");
      setHistory([]);
      return;
    }

    setMethod(
      saved.method
    );

    setManualHpp(
      Number(
        saved.manual_hpp
      ) || 0
    );

    setComponents(
      parseComponents(
        saved.components_json
      )
    );

    setEffectiveFrom(
      saved.effective_from ||
      today()
    );

    setSourceNote(
      saved.source_note ||
      ""
    );

    void loadHistory(
      saved.cost_key
    );
  }

  function setComponentAmount(
    index: number,
    amount: number
  ) {
    setComponents(
      (current) =>
        current.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  amount:
                    Math.max(
                      0,
                      amount || 0
                    ),
                }
              : item
        )
    );
  }

  async function saveHpp() {
    if (!selectedProduct) {
      setNotice(
        "Pilih produk terlebih dahulu."
      );
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const response =
        await fetch(
          "/api/rkn/hpp",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                productId:
                  selectedProduct.productId,
                sku:
                  selectedProduct.sku,
                productName:
                  selectedProduct.productName,
                method,
                manualHpp,
                components,
                effectiveFrom,
                sourceNote,
              }),
          }
        );

      const json =
        (await response.json()) as {
          ok?: boolean;
          error?: string;
          effectiveHpp: number;
        };

      if (
        !response.ok ||
        !json.ok
      ) {
        throw new Error(
          json.error ||
          "SAVE_FAILED"
        );
      }

      setNotice(
        `HPP ${selectedProduct.productName} tersimpan · ${rupiah(
          json.effectiveHpp
        )}`
      );

      setEditorOpen(false);

      await loadRows();
    }
    catch (
      error
    ) {
      setNotice(
        error instanceof Error
          ? `Gagal menyimpan HPP · ${error.message}`
          : "Gagal menyimpan HPP."
      );
    }
    finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={styles.page}
    >
      <div
        className={styles.heading}
      >
        <div>
          <span
            className={styles.eyebrow}
          >
            FINANCE · COST CONTROL
          </span>

          <h1>
            HPP & Costing
          </h1>

          <p>
            Kelola HPP manual atau
            kalkulasi biaya produksi
            otomatis.
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={openNew}
        >
          + Atur HPP
        </button>
      </div>

      {notice && (
        <div
          className={styles.notice}
          role="status"
        >
          {notice}
        </div>
      )}

      <div
        className={styles.metrics}
      >
        <article>
          <span>
            Master Produk
          </span>

          <strong>
            {productRows.length.toLocaleString(
              "id-ID"
            )}
          </strong>

          <small>
            produk master
          </small>
        </article>

        <article>
          <span>
            HPP Tersimpan
          </span>

          <strong>
            {rows.length.toLocaleString(
              "id-ID"
            )}
          </strong>

          <small>
            costing aktif
          </small>
        </article>

        <article>
          <span>
            Manual
          </span>

          <strong>
            {manualCount.toLocaleString(
              "id-ID"
            )}
          </strong>

          <small>
            keputusan final
          </small>
        </article>

        <article>
          <span>
            Otomatis
          </span>

          <strong>
            {autoCount.toLocaleString(
              "id-ID"
            )}
          </strong>

          <small>
            hasil komponen
          </small>
        </article>
      </div>

      <div
        className={styles.toolbar}
      >
        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          placeholder="Cari produk, SKU atau kategori..."
        />

        <span>
          {merged.length.toLocaleString(
            "id-ID"
          )}{" "}
          produk
        </span>
      </div>

      {loading ? (
        <div
          className={styles.empty}
        >
          Memuat data HPP...
        </div>
      ) : merged.length === 0 ? (
        <div
          className={styles.empty}
        >
          Master produk belum tersedia.
        </div>
      ) : (
        
<>
  {/* RKN_HPP_NATIVE_MOBILE_V142 */}
  <div className={styles.mobileListV142}>
    {merged.map(({ product, saved }) => (
      <article
        key={"hpp-mobile-v142-" + productKey(product)}
        className={styles.mobileCardV142}
      >
        <div className={styles.mobileHeadV142}>
          <div className={styles.mobileTitleV142}>
            <strong>
              {product.productName || "-"}
            </strong>
            <small>
              {product.category ||
                product.productId ||
                "Produk master"}
            </small>
          </div>
          <span
            className={
              saved
                ? styles.mobileStatusReadyV142
                : styles.mobileStatusEmptyV142
            }
          >
            {saved ? "TERISI" : "BELUM ADA"}
          </span>
        </div>
        <div className={styles.mobileRowsV142}>
          <div>
            <span>SKU</span>
            <strong>
              {product.sku || "-"}
            </strong>
          </div>
          <div>
            <span>HPP</span>
            <strong>
              {saved
                ? rupiah(saved.effective_hpp)
                : "-"}
            </strong>
          </div>
          <div>
            <span>Metode</span>
            <strong>
              {saved
                ? saved.method === "MANUAL"
                  ? "Manual"
                  : "Otomatis"
                : "-"}
            </strong>
          </div>
          <div className={styles.mobileDateV142}>
            <span>Efektif Mulai</span>
            <strong>
              {saved?.effective_from || "-"}
            </strong>
          </div>
        </div>
        <button
          type="button"
          className={styles.mobileActionV142}
          onClick={() => {
            if (saved) {
              openSaved(saved, product);
              return;
            }
            setSelectedProductKey(
              productKey(product)
            );
            setMethod("MANUAL");
            setManualHpp(0);
            setComponents(
              defaultComponents.map(
                (item) => ({
                  ...item,
                })
              )
            );
            setEffectiveFrom(today());
            setSourceNote("");
            setHistory([]);
            setEditorOpen(true);
          }}
        >
          {saved ? "Ubah HPP" : "Isi HPP"}
        </button>
      </article>
    ))}
  </div>
<div
          className={`${styles.tableWrap} ${styles.desktopTableV142}`}
        >
          <table
            className={styles.table}
          >
            <thead>
              <tr>
                <th>Produk</th>
                <th>SKU</th>
                <th>HPP</th>
                <th>Metode</th>
                <th>Efektif</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {merged.map(
                ({
                  product,
                  saved,
                }) => (
                  <tr
                    key={
                      productKey(
                        product
                      )
                    }
                  >
                    <td
                      data-label="Produk"
                    >
                      <strong>
                        {product.productName ||
                          "-"}
                      </strong>

                      <small>
                        {product.category ||
                          product.productId ||
                          ""}
                      </small>
                    </td>

                    <td
                      data-label="SKU"
                    >
                      {product.sku ||
                        "-"}
                    </td>

                    <td
                      data-label="HPP"
                    >
                      <strong>
                        {saved
                          ? rupiah(
                              saved.effective_hpp
                            )
                          : "-"}
                      </strong>
                    </td>

                    <td
                      data-label="Metode"
                    >
                      {saved
                        ? saved.method ===
                          "MANUAL"
                          ? "Manual"
                          : "Otomatis"
                        : "-"}
                    </td>

                    <td
                      data-label="Efektif"
                    >
                      {saved
                        ?.effective_from ||
                        "-"}
                    </td>

                    <td
                      data-label="Status"
                    >
                      <span
                        className={
                          saved
                            ? styles.statusReady
                            : styles.statusEmpty
                        }
                      >
                        {saved
                          ? "TERISI"
                          : "BELUM ADA"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => {
                          if (saved) {
                            openSaved(
                              saved,
                              product
                            );
                            return;
                          }

                          setSelectedProductKey(
                            productKey(
                              product
                            )
                          );

                          setMethod(
                            "MANUAL"
                          );

                          setManualHpp(0);

                          setComponents(
                            defaultComponents.map(
                              (item) => ({
                                ...item,
                              })
                            )
                          );

                          setEffectiveFrom(
                            today()
                          );

                          setSourceNote(
                            ""
                          );

                          setHistory([]);

                          setEditorOpen(
                            true
                          );
                        }}
                      >
                        {saved
                          ? "Ubah"
                          : "Isi HPP"}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
</>
      )}

      {editorOpen && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Tutup editor HPP"
            onClick={() =>
              setEditorOpen(
                false
              )
            }
          />

          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Editor HPP"
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
                  HPP EDITOR
                </span>

                <h2>
                  Atur HPP
                </h2>

                <p>
                  Manual atau kalkulasi
                  otomatis.
                </p>
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
                aria-label="Tutup editor HPP"
              >
                {/* RKN_HPP_CLOSE_ICON_V1104 */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12" />
                  <path d="m18 6-12 12" />
                </svg>
              </button>
            </div>

            <label
              className={styles.field}
            >
              <span>Produk</span>

              <select
                value={
                  selectedProductKey
                }
                onChange={(event) =>
                  changeProduct(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Pilih produk
                </option>

                {productRows.map(
                  (product) => (
                    <option
                      key={
                        productKey(
                          product
                        )
                      }
                      value={
                        productKey(
                          product
                        )
                      }
                    >
                      {product.productName}
                      {product.sku
                        ? ` · ${product.sku}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </label>

            <div
              className={styles.methodSwitch}
            >
              <button
                type="button"
                className={
                  method ===
                  "MANUAL"
                    ? styles.methodActive
                    : undefined
                }
                onClick={() =>
                  setMethod(
                    "MANUAL"
                  )
                }
              >
                HPP Manual
              </button>

              <button
                type="button"
                className={
                  method ===
                  "AUTO"
                    ? styles.methodActive
                    : undefined
                }
                onClick={() =>
                  setMethod(
                    "AUTO"
                  )
                }
              >
                Hitung Otomatis
              </button>
            </div>

            {method ===
            "MANUAL" ? (
              <label
                className={styles.field}
              >
                <span>
                  HPP Final
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                  manualHpp === 0
                    ? ""
                    : manualHpp
                }
                  onChange={(event) =>
                    setManualHpp(
                      Math.max(
                        0,
                        Number(
                          event.target
                            .value
                        ) || 0
                      )
                    )
                  }
                />

                <small>
                  Digunakan jika owner
                  sudah menentukan HPP
                  final.
                </small>
              </label>
            ) : (
              <div
                className={styles.components}
              >
                <div
                  className={styles.componentTitle}
                >
                  Komponen HPP
                </div>

                {components.map(
                  (
                    component,
                    index
                  ) => (
                    <label
                      key={
                        component.name
                      }
                      className={styles.componentRow}
                    >
                      <span>
                        {component.name}
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          component.amount
                        }
                        onChange={(event) =>
                          setComponentAmount(
                            index,
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                      />
                    </label>
                  )
                )}

                <div
                  className={styles.calculated}
                >
                  <span>
                    HPP Terhitung
                  </span>

                  <strong>
                    {rupiah(
                      calculatedHpp
                    )}
                  </strong>
                </div>
              </div>
            )}

            <div
              className={styles.resultCard}
            >
              <span>
                HPP DIGUNAKAN
              </span>

              <strong>
                {rupiah(
                  effectiveHpp
                )}
              </strong>

              <small>
                {method ===
                "MANUAL"
                  ? "Sumber: Input Manual"
                  : "Sumber: Kalkulasi Komponen"}
              </small>
            </div>

            <label
              className={styles.field}
            >
              <span>
                Efektif Mulai
              </span>

              {/* RKN_HPP_DATE_OVERLAY_V143 */}
              <div
                className={
                  styles.dateShellV143
                }
              >
                <span
                  className={
                    styles.dateTextV143
                  }
                  aria-hidden="true"
                >
                  {effectiveFrom
                    ? new Intl.DateTimeFormat(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                        .format(
                          new Date(
                            effectiveFrom +
                              "T00:00:00"
                          )
                        )
                        .toUpperCase()
                    : "PILIH TANGGAL"}
                </span>
                <span
                  className={
                    styles.dateIconV143
                  }
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                    />
                    <path d="M16 3v4" />
                    <path d="M8 3v4" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
                <input
                  className={styles.dateNativeV143}
                type="date"
                value={
                  effectiveFrom
                }
                onChange={(event) =>
                  setEffectiveFrom(
                    event.target.value
                  )
                }
              />
              </div>
            </label>

            <label
              className={styles.field}
            >
              <span>
                Catatan / Sumber
              </span>

              <textarea
                rows={3}
                value={
                  sourceNote
                }
                onChange={(event) =>
                  setSourceNote(
                    event.target.value
                  )
                }
                placeholder="Contoh: Sesuai keputusan owner"
              />
            </label>

            {history.length > 0 && (
              <div
                className={styles.history}
              >
                <div
                  className={styles.componentTitle}
                >
                  Riwayat HPP
                </div>

                {history
                  .slice(0, 8)
                  .map(
                    (item) => (
                      <div
                        key={
                          item.id
                        }
                      >
                        <span>
                          {item.effective_from}
                        </span>

                        <strong>
                          {rupiah(
                            item.effective_hpp
                          )}
                        </strong>

                        <small>
                          {item.method ===
                          "AUTO"
                            ? "Otomatis"
                            : "Manual"}
                        </small>
                      </div>
                    )
                  )}
              </div>
            )}

            <button
              type="button"
              className={styles.saveButton}
              disabled={
                saving ||
                !selectedProduct
              }
              onClick={() =>
                void saveHpp()
              }
            >
              {saving
                ? "Menyimpan..."
                : "Simpan HPP"}
            </button>
          </section>
        </>
      )}
    </section>
  );
}
