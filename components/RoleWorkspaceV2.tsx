/* RKN_HUMAN_COPY_V1 */
"use client";

/*
 * RKN_ROLE_WORKSPACE_V2
 *
 * Shared role-aware ERP shell for:
 * - GROUP_OWNER
 * - SELLER_OWNER
 * - SABLON_MANAGER
 * - SABLON_PAYROLL_OFFICER
 *
 * The component only renders canonical report values returned by
 * RknErpCore.getRoleWorkspaceReport().
 */

import {
  useMemo,
  useState,
} from "react";

import ERPUserBadge from "./ERPUserBadge";
import styles from "./RoleWorkspaceV2.module.css";

type WorkspaceReport = {
  generatedAt?: string;
  profile?: {
    fullName?: string;
    primaryRoleCode?: string;
  };
  roles?: string[];
  businessUnits?: Array<{
    id?: string;
    code?: string;
    name?: string;
    kind?: string;
    accessLevel?: string;
  }>;
  metrics?: Record<string, number>;
  engine?: {
    enabled?: boolean;
    mode?: string;
    intervalMs?: number;
    maxBatch?: number;
    pendingCount?: number;
    retryCount?: number;
    reviewCount?: number;
    failedCount?: number;
    reconciliationReviewCount?: number;
    lastRun?: Record<string, unknown> | null;
  };
  capabilities?: Record<string, string>;
};

type ModuleSpec = {
  key: string;
  label: string;
  description: string;
  status: string;
};

const numberId =
  new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    }
  );

const moneyId =
  new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  );

function readMetric(
  report: WorkspaceReport,
  key: string
) {
  return Number(
    report.metrics?.[key] ?? 0
  );
}

function primaryRole(
  roleCodes: string[]
) {
  if (
    roleCodes.includes(
      "GROUP_OWNER"
    )
  ) {
    return "GROUP_OWNER";
  }

  if (
    roleCodes.includes(
      "SELLER_OWNER"
    )
  ) {
    return "SELLER_OWNER";
  }

  if (
    roleCodes.includes(
      "SABLON_MANAGER"
    )
  ) {
    return "SABLON_MANAGER";
  }

  if (
    roleCodes.includes(
      "SABLON_PAYROLL_OFFICER"
    )
  ) {
    return "SABLON_PAYROLL_OFFICER";
  }

  return (
    roleCodes[0] ??
    "PRIVATE"
  );
}

function moduleSet(
  role: string,
  roleCodes: string[]
): ModuleSpec[] {
  if (
    role === "GROUP_OWNER"
  ) {
    return [
      {
        key: "overview",
        label: "EXECUTIVE",
        description:
          "Ringkasan canonical seluruh business scope owner.",
        status: "LIVE",
      },
      {
        key: "marketplace",
        label: "MARKETPLACE",
        description:
          "Order, line, event, dan cost ledger marketplace.",
        status: "PARTIAL",
      },
      {
        key: "inventory",
        label: "PERSEDIAAN",
        description:
          "Stok fisik dan movement dari inventory ledger.",
        status: "LIVE",
      },
      {
        key: "finance",
        label: "KEUANGAN",
        description:
          "COGS tersedia. Settlement dan general finance ledger masih tahap berikut.",
        status: "SCHEMA REQUIRED",
      },
      {
        key: "people",
        label: "SDM",
        description:
          "Pekerja aktif dan registrasi pekerja dalam scope.",
        status: "LIVE",
      },
      {
        key: "engine",
        label: "ENGINE",
        description:
          "Scheduler, queue, review, dan reconciliation health.",
        status: "SHADOW",
      },
    ];
  }

  if (
    role === "SELLER_OWNER"
  ) {
    return [
      {
        key: "overview",
        label: "DASHBOARD",
        description:
          "Ringkasan seller berdasarkan business scope.",
        status: "LIVE",
      },
      {
        key: "marketplace",
        label: "MARKETPLACE",
        description:
          "Order dan event canonical seller.",
        status: "PARTIAL",
      },
      {
        key: "inventory",
        label: "PERSEDIAAN",
        description:
          "Stock dan movement seller.",
        status: "LIVE",
      },
      {
        key: "returns",
        label: "RETURN",
        description:
          "Return state machine akan menerima event official marketplace API.",
        status: "CONNECTOR REQUIRED",
      },
      {
        key: "settlement",
        label: "SETTLEMENT",
        description:
          "Finance settlement marketplace akan direkonsiliasi melalui official API.",
        status: "SCHEMA REQUIRED",
      },
      {
        key: "engine",
        label: "ENGINE",
        description:
          "Automation health untuk scope seller.",
        status: "SHADOW",
      },
    ];
  }

  const hasPayroll =
    roleCodes.includes(
      "SABLON_PAYROLL_OFFICER"
    );

  const modules: ModuleSpec[] = [
    {
      key: "overview",
      label: "DASHBOARD SABLON",
      description:
        "Operasional sablon dan plastic trading sesuai scope.",
      status: "LIVE",
    },
    {
      key: "sablon-order",
      label: "ORDER SABLON",
      description:
        "Order internal akan diinput admin dan dihitung oleh costing engine.",
      status: "NEXT",
    },
    {
      key: "production",
      label: "PRODUKSI",
      description:
        "WIP, material, output, dan variance produksi.",
      status: "NEXT",
    },
    {
      key: "workers",
      label: "PEKERJA",
      description:
        "Master pekerja dan registrasi aktif.",
      status: "LIVE",
    },
    {
      key: "costing",
      label: "COSTING",
      description:
        "HPP, material, labor, dan overhead versioned.",
      status: "PARTIAL",
    },
  ];

  if (hasPayroll) {
    modules.push({
      key: "payroll",
      label: "PAYROLL",
      description:
        "Borongan, kasbon, pembayaran, dan payslip.",
      status: "PARTIAL",
    });
  }

  modules.push({
    key: "engine",
    label: "ENGINE",
    description:
      "Automation health dan review queue.",
    status: "SHADOW",
  });

  return modules;
}

function statusClass(
  status: string
) {
  const normalized =
    status.toUpperCase();

  if (
    normalized === "LIVE"
  ) {
    return styles.live;
  }

  if (
    normalized.includes(
      "SHADOW"
    ) ||
    normalized.includes(
      "PARTIAL"
    )
  ) {
    return styles.partial;
  }

  return styles.pending;
}

export default function RoleWorkspaceV2({
  report,
}: {
  report: WorkspaceReport;
}) {
  const roleCodes =
    Array.isArray(
      report.roles
    )
      ? report.roles.map(String)
      : [];

  const role =
    primaryRole(
      roleCodes
    );

  const modules =
    useMemo(
      () =>
        moduleSet(
          role,
          roleCodes
        ),
      [
        role,
        roleCodes.join("|"),
      ]
    );

  const [
    activeKey,
    setActiveKey,
  ] =
    useState(
      modules[0]?.key ??
        "overview"
    );

  const activeModule =
    modules.find(
      (item) =>
        item.key ===
        activeKey
    ) ??
    modules[0];

  const units =
    Array.isArray(
      report.businessUnits
    )
      ? report.businessUnits
      : [];

  const engine =
    report.engine ?? {};

  /*
   * RKN_ROLE_ENGINE_OBSERVABILITY_V1
   * Exposes only read-model health already returned by ERP Core.
   * It does not trigger, retry, or mutate automation jobs.
   */
  const lastRun =
    (
      engine.lastRun &&
      typeof engine.lastRun === "object"
    )
      ? engine.lastRun
      : {};

  const lastRunStatus =
    String(
      lastRun.status ??
        "BELUM ADA RUN"
    );

  const lastRunTrigger =
    String(
      lastRun.trigger_type ??
        "-"
    );

  const lastRunStarted =
    String(
      lastRun.started_at ??
        "-"
    );

  const lastRunFinished =
    String(
      lastRun.finished_at ??
        "-"
    );

  const lastRunProcessed =
    Number(
      lastRun.processed_count ??
        0
    );

  const lastRunDue =
    Number(
      lastRun.due_job_count ??
        0
    );

  const roleTitle =
    role === "GROUP_OWNER"
      ? "OWNER CONTROL TOWER"
      : role === "SELLER_OWNER"
        ? "SELLER OWNER"
        : role === "SABLON_MANAGER"
          ? "SABLON OPERATIONS"
          : role ===
              "SABLON_PAYROLL_OFFICER"
            ? "SABLON PAYROLL"
            : "WORKSPACE";

  const mainMetrics = [
    {
      label: "ORDER CANONICAL",
      value:
        numberId.format(
          readMetric(
            report,
            "orderCount"
          )
        ),
      note:
        "business_order",
    },
    {
      label: "ORDER LINE",
      value:
        numberId.format(
          readMetric(
            report,
            "orderLineCount"
          )
        ),
      note:
        "business_order_line",
    },
    {
      label: "STOK FISIK",
      value:
        numberId.format(
          readMetric(
            report,
            "physicalStockQty"
          )
        ),
      note:
        "inventory_balance",
    },
    {
      label: "COGS TERCATAT",
      value:
        moneyId.format(
          readMetric(
            report,
            "cogsTotal"
          )
        ),
      note:
        "transaction_ledger",
    },
    {
      label: "MOVEMENT STOK",
      value:
        numberId.format(
          readMetric(
            report,
            "inventoryMovementCount"
          )
        ),
      note:
        "inventory_ledger",
    },
    {
      label: "ENGINE REVIEW",
      value:
        numberId.format(
          Number(
            engine.reviewCount ??
              0
          )
        ),
      note:
        "review / quarantine",
    },
  ];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            R
          </span>

          <div>
            <strong>RKN ERP</strong>
            <small>{roleTitle}</small>
          </div>
        </div>

        <div className={styles.roleCard}>
          <span>ROLE</span>
          <strong>{role}</strong>
          <small>
            {units.length} business scope
          </small>
        </div>

        <nav className={styles.nav}>
          {modules.map(
            (item) => (
              <button
                key={item.key}
                type="button"
                className={
                  item.key ===
                  activeModule?.key
                    ? styles.navActive
                    : styles.navButton
                }
                onClick={() =>
                  setActiveKey(
                    item.key
                  )
                }
              >
                <span>
                  {item.label}
                </span>

                <small
                  className={
                    statusClass(
                      item.status
                    )
                  }
                >
                  {item.status}
                </small>
              </button>
            )
          )}
        </nav>

        <div className={styles.user}>
          <ERPUserBadge />
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.kicker}>
              RKN ERP
            </span>

            <h1>
              {activeModule?.label ??
                roleTitle}
            </h1>

            <p>
              {activeModule?.description ??
                "Workspace ERP."}
            </p>
          </div>

          <div className={styles.topStatus}>
            <span
              className={
                engine.enabled
                  ? styles.live
                  : styles.pending
              }
            >
              ENGINE{" "}
              {engine.enabled
                ? "ON"
                : "OFF"}
            </span>

            <strong>
              {String(
                engine.mode ??
                  "SHADOW"
              )}
            </strong>
          </div>
        </header>

        <section className={styles.metricGrid}>
          {mainMetrics.map(
            (metric) => (
              <article
                key={metric.label}
                className={styles.metric}
              >
                <span>
                  {metric.label}
                </span>
                <strong>
                  {metric.value}
                </strong>
                <small>
                  {metric.note}
                </small>
              </article>
            )
          )}
        </section>

        {activeModule?.key ===
        "engine" ? (
          <section className={styles.panelGrid}>
            <article className={styles.panel}>
              <h2>AUTOMATION ENGINE</h2>

              <dl className={styles.definition}>
                <div>
                  <dt>Mode</dt>
                  <dd>
                    {String(
                      engine.mode ??
                        "SHADOW"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Interval</dt>
                  <dd>
                    {numberId.format(
                      Number(
                        engine.intervalMs ??
                          300000
                      ) / 1000
                    )}{" "}
                    detik
                  </dd>
                </div>
                <div>
                  <dt>Pending</dt>
                  <dd>
                    {numberId.format(
                      Number(
                        engine.pendingCount ??
                          0
                      )
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Retry</dt>
                  <dd>
                    {numberId.format(
                      Number(
                        engine.retryCount ??
                          0
                      )
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Review</dt>
                  <dd>
                    {numberId.format(
                      Number(
                        engine.reviewCount ??
                          0
                      )
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Failed</dt>
                  <dd>
                    {numberId.format(
                      Number(
                        engine.failedCount ??
                          0
                      )
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Last Run</dt>
                  <dd>
                    {lastRunStatus}
                  </dd>
                </div>

                <div>
                  <dt>Trigger</dt>
                  <dd>
                    {lastRunTrigger}
                  </dd>
                </div>

                <div>
                  <dt>Started</dt>
                  <dd>
                    {lastRunStarted}
                  </dd>
                </div>

                <div>
                  <dt>Finished</dt>
                  <dd>
                    {lastRunFinished}
                  </dd>
                </div>

                <div>
                  <dt>Due Jobs</dt>
                  <dd>
                    {numberId.format(
                      lastRunDue
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Processed</dt>
                  <dd>
                    {numberId.format(
                      lastRunProcessed
                    )}
                  </dd>
                </div>
              </dl>
            </article>

            <article className={styles.panel}>
              <h2>SAFETY CONTRACT</h2>

              <p>
                Scheduler aktif dalam SHADOW mode.
                Alarm hanya mencatat health/run
                dan mengamati due job.
              </p>

              <p>
                Inventory, finance, payroll,
                order effect, dan settlement
                belum boleh dimutasi oleh runner.
              </p>

              <p>
                Event ambigu nantinya diarahkan
                ke REVIEW / QUARANTINE sebelum
                business effect diaktifkan.
              </p>
            </article>

            <article className={styles.panel}>
              <h2>RECONCILIATION</h2>

              <strong className={styles.bigValue}>
                {numberId.format(
                  Number(
                    engine.reconciliationReviewCount ??
                      0
                  )
                )}
              </strong>

              <p>
                exception reconciliation
                yang memerlukan review.
              </p>
            </article>
          </section>
        ) : (
          <section className={styles.panelGrid}>
            <article className={styles.panel}>
              <h2>BUSINESS SCOPE</h2>

              {units.length ? (
                <div className={styles.scopeList}>
                  {units.map(
                    (unit) => (
                      <div
                        key={
                          unit.id ??
                          unit.code
                        }
                      >
                        <strong>
                          {unit.code ||
                            unit.name}
                        </strong>

                        <span>
                          {unit.name}
                        </span>

                        <small>
                          {unit.accessLevel}
                        </small>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p>
                  Tidak ada business scope aktif.
                </p>
              )}
            </article>

            <article className={styles.panel}>
              <h2>CANONICAL HEALTH</h2>

              <dl className={styles.definition}>
                <div>
                  <dt>Business Event</dt>
                  <dd>
                    {numberId.format(
                      readMetric(
                        report,
                        "businessEventCount"
                      )
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Draft Allocation</dt>
                  <dd>
                    {numberId.format(
                      readMetric(
                        report,
                        "allocationDraftCount"
                      )
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Confirmed Allocation</dt>
                  <dd>
                    {numberId.format(
                      readMetric(
                        report,
                        "allocationConfirmedCount"
                      )
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Physical SKU</dt>
                  <dd>
                    {numberId.format(
                      readMetric(
                        report,
                        "physicalSkuCount"
                      )
                    )}
                  </dd>
                </div>
              </dl>
            </article>

            <article className={styles.panel}>
              <h2>OPERASIONAL</h2>

              <dl className={styles.definition}>
                <div>
                  <dt>Pekerja Aktif</dt>
                  <dd>
                    {numberId.format(
                      readMetric(
                        report,
                        "workerCount"
                      )
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Registrasi Pending</dt>
                  <dd>
                    {numberId.format(
                      readMetric(
                        report,
                        "pendingWorkerRegistrationCount"
                      )
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Cost Ledger Lines</dt>
                  <dd>
                    {numberId.format(
                      readMetric(
                        report,
                        "transactionLineCount"
                      )
                    )}
                  </dd>
                </div>
              </dl>
            </article>

            <article className={styles.panel}>
              <h2>STATUS MODUL</h2>

              <div className={styles.capabilityList}>
                {Object.entries(
                  report.capabilities ??
                    {}
                ).map(
                  ([
                    key,
                    value,
                  ]) => (
                    <div key={key}>
                      <span>
                        {key}
                      </span>

                      <strong
                        className={
                          statusClass(
                            String(
                              value
                            )
                          )
                        }
                      >
                        {String(
                          value
                        )}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </article>
          </section>
        )}

        <footer className={styles.footer}>
          <span>
            GENERATED{" "}
            {String(
              report.generatedAt ??
                "-"
            )}
          </span>

          <span>
            CANONICAL DATA
          </span>
        </footer>
      </main>
    </div>
  );
}