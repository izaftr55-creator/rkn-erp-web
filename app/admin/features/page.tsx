/* RKN_HUMAN_COPY_V1 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

import styles from "./features.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    embed?: string | string[];
    feature?: string | string[];
    title?: string | string[];
    businessUnit?: string | string[];
  }>;
};

function first(
  value: string | string[] | undefined
) {
  return Array.isArray(value)
    ? String(value[0] ?? "")
    : String(value ?? "");
}

function safeTitle(
  title: string,
  feature: string
) {
  const clean =
    title
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 80);

  if (clean) {
    return clean;
  }

  return feature
    .replace(/-/g, " ")
    .replace(/\b\w/g, (value) =>
      value.toUpperCase()
    )
    .slice(0, 80);
}

function formatMetric(
  value: unknown
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return new Intl.NumberFormat(
      "id-ID",
      {
        maximumFractionDigits: 2,
      }
    ).format(value);
  }

  return String(value ?? "-");
}

export default async function AdminFeaturePage({
  searchParams,
}: PageProps) {
  const session =
    await getAuth().api.getSession({
      headers: await headers(),
    });

  if (!session) {
    redirect("/");
  }

  const params =
    await searchParams;
  // RKN_SINGLE_SHELL_EMBED_V1
  const rawEmbed =
    params?.embed;

  const embedded =
    Array.isArray(rawEmbed)
      ? String(rawEmbed[0] ?? "") === "1"
      : String(rawEmbed ?? "") === "1";

  const feature =
    first(params.feature)
      .replace(/[^a-z0-9-]/gi, "")
      .slice(0, 100) ||
    "admin-feature";

  const title =
    safeTitle(
      first(params.title),
      feature
    );

  const businessUnit =
    first(
      params.businessUnit
    )
      .replace(
        /[^a-zA-Z0-9._:-]/g,
        ""
      )
      .slice(0, 180);

  let report: any;

  try {
    report =
      await getErpCoreRpcStub()
        .getAdminModuleReport(
          session.user.id,
          feature,
          businessUnit
        );
  }
  catch {
    redirect("/");
  }

  const metrics =
    Array.isArray(report?.metrics)
      ? report.metrics
      : [];

  const rows =
    Array.isArray(report?.rows)
      ? report.rows
      : [];

  const limitations =
    Array.isArray(
      report?.limitations
    )
      ? report.limitations
      : [];

  const businessUnits =
    Array.isArray(
      report?.businessUnits
    )
      ? report.businessUnits
      : [];

  const columns =
    rows.length > 0 &&
    rows[0] &&
    typeof rows[0] === "object"
      ? Object.keys(rows[0])
      : [];

  return (
    <main className={embedded ? `${styles.page} ${styles.embed}` : styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            RKN ERP / SYSTEM ADMIN
          </p>

          <h1>{title}</h1>

          <p className={styles.subtitle}>
            Canonical module read model.
            Data ditampilkan dari ERP Core
            sesuai kemampuan schema yang
            benar-benar tersedia.
          </p>
        </div>

        <a
          href="/"
          className={styles.back}
        >
          KEMBALI KE ERP
        </a>
      </header>

      <section className={styles.controlBar}>
        <div className={styles.engineInfo}>
          <span
            className={
              report?.engineState === "LIVE"
                ? styles.live
                : report?.engineState ===
                    "SCHEMA_REQUIRED"
                  ? styles.schema
                  : styles.partial
            }
          >
            {String(
              report?.engineState ??
                "UNKNOWN"
            )}
          </span>

          <strong>
            {String(
              report?.domain ??
                "GENERAL"
            )}
          </strong>
        </div>

        <form
          method="get"
          className={styles.scopeForm}
        >
          {embedded ? (
            <input
              type="hidden"
              name="embed"
              value="1"
            />
          ) : null}
          <input
            type="hidden"
            name="feature"
            value={feature}
          />

          <input
            type="hidden"
            name="title"
            value={title}
          />

          <label>
            <span>BUSINESS UNIT</span>

            <select
              name="businessUnit"
              defaultValue={
                String(
                  report?.businessUnitId ??
                    ""
                )
              }
            >
              <option value="">
                GLOBAL / SEMUA UNIT
              </option>

              {businessUnits.map(
                (unit: any) => (
                  <option
                    key={String(unit.id)}
                    value={String(unit.id)}
                  >
                    {String(unit.name)}
                    {" / "}
                    {String(unit.code)}
                  </option>
                )
              )}
            </select>
          </label>

          <button type="submit">
            TERAPKAN
          </button>
        </form>
      </section>

      <section className={styles.metrics}>
        {metrics.length === 0 ? (
          <article>
            <span>STATUS</span>
            <strong>
              {String(
                report?.engineState ??
                  "-"
              )}
            </strong>
          </article>
        ) : (
          metrics.map(
            (metric: any) => (
              <article
                key={String(metric.key)}
              >
                <span>
                  {String(metric.label)}
                </span>

                <strong>
                  {formatMetric(
                    metric.value
                  )}
                </strong>

                {metric.note ? (
                  <small>
                    {String(metric.note)}
                  </small>
                ) : null}
              </article>
            )
          )
        )}
      </section>

      {limitations.length > 0 ? (
        <section className={styles.limitations}>
          <div>
            <p>ENGINE COVERAGE</p>
            <h2>Catatan Canonical</h2>
          </div>

          <ul>
            {limitations.map(
              (
                item: unknown,
                index: number
              ) => (
                <li key={index}>
                  {String(item)}
                </li>
              )
            )}
          </ul>
        </section>
      ) : null}

      <section className={styles.report}>
        <div className={styles.sectionTitle}>
          <div>
            <p>LIVE DATA</p>
            <h2>Data Terbaru</h2>
          </div>

          <span>
            {rows.length} BARIS
          </span>
        </div>

        {rows.length === 0 ? (
          <div className={styles.empty}>
            Belum ada baris report untuk
            feature ini.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  {columns.map(
                    (column) => (
                      <th key={column}>
                        {column}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (
                    row: any,
                    rowIndex: number
                  ) => (
                    <tr key={rowIndex}>
                      {columns.map(
                        (column) => (
                          <td
                            key={column}
                          >
                            {String(
                              row?.[
                                column
                              ] ?? "-"
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        Generated:
        {" "}
        {String(
          report?.generatedAt ?? "-"
        )}
      </footer>
    </main>
  );
}