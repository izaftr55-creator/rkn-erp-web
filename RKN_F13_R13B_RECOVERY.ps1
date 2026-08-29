$ErrorActionPreference = "Stop"

Set-Location "C:\RKN-ERP\rkn-erp-web"

Write-Host "`n=== RKN F13-R13B · RECOVERY PATCH ===" -ForegroundColor Cyan
Write-Host "SOURCE WRITE = YES"
Write-Host "PRODUCTION DEPLOY = NO"
Write-Host "ERP DATA WRITE = NO"
Write-Host "AUTH DATA WRITE = NO"
Write-Host ""

$coreFile = ".\cloudflare\rkn-erp-core.ts"
$loginCss = ".\app\login\login.module.css"
$pageDir = ".\app\admin\users"
$approveDir = ".\app\api\rkn\admin\users\approve"
$rejectDir = ".\app\api\rkn\admin\users\reject"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = ".\data\private\checkpoints\f13-r13b-recovery-$stamp"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Copy-Item $coreFile "$backupDir\rkn-erp-core.ts.bak"
Copy-Item $loginCss "$backupDir\login.module.css.bak"

$utf8 = New-Object System.Text.UTF8Encoding($false)

# ==========================================================
# 1. DURABLE OBJECT ADMIN ACCESS RPC
# ==========================================================

$corePath = (Resolve-Path $coreFile).Path
$core = [IO.File]::ReadAllText($corePath)

$rpcMarker = "RKN_ADMIN_ACCESS_PROVISIONING_V1"

if (-not $core.Contains($rpcMarker)) {
    $insertBefore = "  recordPasswordChangeCompletion("

    if (-not $core.Contains($insertBefore)) {
        throw "R13B_RPC_INSERT_MARKER_NOT_FOUND"
    }

    $rpcPatch = @'
  /*
   * RKN_ADMIN_ACCESS_PROVISIONING_V1
   * SYSTEM_ADMIN-only access directory + provisioning.
   */
  getAdminAccessDirectory(
    actorUserIdValue: string
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    if (!actorUserId) {
      throw new Error(
        "RPC_SERVER_ACTOR_REQUIRED"
      );
    }

    const admin =
      db.prepare(`
        SELECT 1 AS ok
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE
          ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
      `).get(actorUserId);

    if (!admin) {
      throw new Error(
        "RPC_SYSTEM_ADMIN_REQUIRED"
      );
    }

    const roles =
      db.prepare(`
        SELECT
          id,
          code,
          name,
          description,
          scope_mode,
          is_system
        FROM role
        ORDER BY
          is_system DESC,
          name,
          code
      `).all();

    const businessUnits =
      db.prepare(`
        SELECT
          id,
          code,
          name,
          owner_key,
          kind,
          active
        FROM business_unit
        WHERE active = 1
        ORDER BY
          kind,
          name,
          code
      `).all();

    const profiles =
      db.prepare(`
        SELECT
          user_id,
          person_key,
          full_name,
          active,
          must_change_password,
          identity_code,
          primary_role_code,
          created_at,
          updated_at
        FROM erp_user_profile
        ORDER BY
          full_name,
          user_id
      `).all();

    const assignments =
      db.prepare(`
        SELECT
          ur.user_id,
          ur.role_id,
          r.code AS role_code,
          r.name AS role_name,
          r.scope_mode,
          ur.business_unit_id
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        ORDER BY
          ur.user_id,
          r.code
      `).all();

    const scopes =
      db.prepare(`
        SELECT
          ubs.user_id,
          ubs.business_unit_id,
          bu.code AS business_unit_code,
          bu.name AS business_unit_name,
          ubs.access_level
        FROM user_business_scope ubs
        JOIN business_unit bu
          ON bu.id = ubs.business_unit_id
        ORDER BY
          ubs.user_id,
          bu.code
      `).all();

    return {
      ok: true,
      roles,
      businessUnits,
      profiles,
      assignments,
      scopes,
    };
  }


  provisionPendingErpUserAccess(
    actorUserIdValue: string,
    targetUserIdValue: string,
    fullNameValue: string,
    roleCodeValue: string,
    businessUnitIdValue: string,
    accessLevelValue: string
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    const targetUserId =
      cleanRpcText(
        targetUserIdValue,
        180
      );

    const fullName =
      cleanRpcText(
        fullNameValue,
        180
      );

    const roleCode =
      cleanRpcText(
        roleCodeValue,
        80
      ).toUpperCase();

    const requestedBusinessUnitId =
      cleanRpcText(
        businessUnitIdValue,
        180
      );

    const accessLevel =
      cleanRpcText(
        accessLevelValue,
        30
      ).toUpperCase();

    if (
      !actorUserId ||
      !targetUserId ||
      !fullName ||
      !roleCode
    ) {
      throw new Error(
        "RPC_APPROVAL_INPUT_REQUIRED"
      );
    }

    const allowedAccess =
      new Set([
        "VIEW",
        "OPERATE",
        "MANAGE",
        "OWNER",
      ]);

    if (!allowedAccess.has(accessLevel)) {
      throw new Error(
        "RPC_ACCESS_LEVEL_INVALID"
      );
    }

    const admin =
      db.prepare(`
        SELECT 1 AS ok
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE
          ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
      `).get(actorUserId);

    if (!admin) {
      throw new Error(
        "RPC_SYSTEM_ADMIN_REQUIRED"
      );
    }

    const role =
      db.prepare(`
        SELECT
          id,
          code,
          scope_mode
        FROM role
        WHERE code = ?
        LIMIT 1
      `).get(roleCode) as
        | {
            id?: unknown;
            code?: unknown;
            scope_mode?: unknown;
          }
        | undefined;

    if (!role) {
      throw new Error(
        "RPC_ROLE_NOT_FOUND"
      );
    }

    const roleId =
      String(role.id ?? "");

    const scopeMode =
      String(
        role.scope_mode ?? ""
      ).toUpperCase();

    let businessUnitId = "";

    if (scopeMode === "UNIT") {
      businessUnitId =
        requestedBusinessUnitId;

      if (!businessUnitId) {
        throw new Error(
          "RPC_BUSINESS_UNIT_REQUIRED"
        );
      }

      const unit =
        db.prepare(`
          SELECT id
          FROM business_unit
          WHERE
            id = ?
            AND active = 1
          LIMIT 1
        `).get(businessUnitId);

      if (!unit) {
        throw new Error(
          "RPC_BUSINESS_UNIT_NOT_FOUND"
        );
      }
    }

    const personKey =
      `AUTH:${targetUserId}`;

    const apply =
      db.transaction(
        () => {
          db.prepare(`
            INSERT INTO erp_user_profile (
              user_id,
              person_key,
              full_name,
              active,
              must_change_password,
              primary_role_code
            )
            VALUES (
              ?, ?, ?, 1, 0, ?
            )
            ON CONFLICT(user_id)
            DO UPDATE SET
              full_name = excluded.full_name,
              active = 1,
              must_change_password = 0,
              primary_role_code =
                excluded.primary_role_code,
              updated_at =
                CURRENT_TIMESTAMP
          `).run(
            targetUserId,
            personKey,
            fullName,
            roleCode
          );

          db.prepare(`
            DELETE FROM user_business_scope
            WHERE user_id = ?
          `).run(targetUserId);

          db.prepare(`
            DELETE FROM user_role
            WHERE user_id = ?
          `).run(targetUserId);

          db.prepare(`
            INSERT INTO user_role (
              id,
              user_id,
              role_id,
              business_unit_id
            )
            VALUES (?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            targetUserId,
            roleId,
            businessUnitId || null
          );

          if (scopeMode === "UNIT") {
            db.prepare(`
              INSERT INTO user_business_scope (
                user_id,
                business_unit_id,
                access_level
              )
              VALUES (?, ?, ?)
            `).run(
              targetUserId,
              businessUnitId,
              accessLevel
            );
          }

          db.prepare(`
            INSERT INTO audit_log (
              id,
              actor_user_id,
              action,
              entity_type,
              entity_id,
              details_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            actorUserId,
            "AUTH_ACCOUNT_APPROVED",
            "USER",
            targetUserId,
            JSON.stringify({
              roleCode,
              scopeMode,
              businessUnitId:
                businessUnitId || null,
              accessLevel:
                scopeMode === "UNIT"
                  ? accessLevel
                  : null,
            })
          );

          return {
            ok: true,
            userId: targetUserId,
            roleCode,
            scopeMode,
            businessUnitId:
              businessUnitId || null,
            accessLevel:
              scopeMode === "UNIT"
                ? accessLevel
                : null,
          };
        }
      );

    return apply();
  }


'@

    $core = $core.Replace(
        $insertBefore,
        $rpcPatch + $insertBefore
    )

    [IO.File]::WriteAllText(
        $corePath,
        $core,
        $utf8
    )
}

# ==========================================================
# 2. ADMIN USERS PAGE + API
# ==========================================================

New-Item -ItemType Directory -Force -Path $pageDir | Out-Null
New-Item -ItemType Directory -Force -Path $approveDir | Out-Null
New-Item -ItemType Directory -Force -Path $rejectDir | Out-Null

$pageSource = @'
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

import styles from "./users.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    result?: string | string[];
  }>;
};

function rows(value: any) {
  return Array.isArray(value?.results)
    ? value.results
    : [];
}

function suggestedRole(
  requestedRole: string,
  roles: any[]
) {
  const wanted =
    requestedRole === "OWNER"
      ? "GROUP_OWNER"
      : requestedRole === "ADMIN"
        ? "SYSTEM_ADMIN"
        : "";

  return roles.some(
    (role) =>
      String(role.code) === wanted
  )
    ? wanted
    : "";
}

export default async function AdminUsersPage({
  searchParams,
}: PageProps) {
  const session =
    await getAuth().api.getSession({
      headers: await headers(),
    });

  if (!session) {
    redirect("/");
  }

  let directory: any;

  try {
    directory =
      await getErpCoreRpcStub()
        .getAdminAccessDirectory(
          session.user.id
        );
  }
  catch {
    redirect("/");
  }

  const { env } =
    getCloudflareContext();

  const db =
    (env as any).AUTH_DB;

  const authUsersResult =
    await db.prepare(`
      SELECT
        id,
        name,
        email,
        username,
        emailVerified,
        createdAt
      FROM "user"
      ORDER BY
        name,
        email
    `).all();

  const requestsResult =
    await db.prepare(`
      SELECT
        id,
        user_id,
        full_name,
        email,
        username,
        whatsapp,
        requested_role,
        status,
        submitted_at,
        reviewed_by_user_id,
        reviewed_at,
        review_note
      FROM rkn_signup_request
      ORDER BY submitted_at DESC
    `).all();

  const authUsers =
    rows(authUsersResult);

  const requests =
    rows(requestsResult);

  const roles =
    Array.isArray(directory?.roles)
      ? directory.roles
      : [];

  const businessUnits =
    Array.isArray(directory?.businessUnits)
      ? directory.businessUnits
      : [];

  const profiles =
    Array.isArray(directory?.profiles)
      ? directory.profiles
      : [];

  const assignments =
    Array.isArray(directory?.assignments)
      ? directory.assignments
      : [];

  const scopes =
    Array.isArray(directory?.scopes)
      ? directory.scopes
      : [];

  const profileByUser =
    new Map(
      profiles.map(
        (row: any) => [
          String(row.user_id),
          row,
        ]
      )
    );

  const rolesByUser =
    new Map<string, string[]>();

  for (const row of assignments) {
    const userId =
      String(row.user_id);

    const list =
      rolesByUser.get(userId) ?? [];

    list.push(
      String(row.role_code)
    );

    rolesByUser.set(
      userId,
      list
    );
  }

  const scopesByUser =
    new Map<string, string[]>();

  for (const row of scopes) {
    const userId =
      String(row.user_id);

    const list =
      scopesByUser.get(userId) ?? [];

    list.push(
      `${String(
        row.business_unit_code
      )} · ${String(
        row.access_level
      )}`
    );

    scopesByUser.set(
      userId,
      list
    );
  }

  const pending =
    requests.filter(
      (row: any) =>
        String(row.status) ===
        "PENDING"
    );

  const rejected =
    requests.filter(
      (row: any) =>
        String(row.status) ===
        "REJECTED"
    );

  const activeUsers =
    authUsers.filter(
      (user: any) =>
        Number(
          profileByUser.get(
            String(user.id)
          )?.active ?? 0
        ) === 1
    );

  const params =
    await searchParams;

  const rawResult =
    params?.result;

  const result =
    Array.isArray(rawResult)
      ? String(rawResult[0] ?? "")
      : String(rawResult ?? "");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            RKN ERP · SYSTEM ADMIN
          </p>

          <h1>SDM &amp; AKSES</h1>

          <p className={styles.subtitle}>
            Approval akun, peran, izin,
            dan ruang lingkup akses ERP.
          </p>
        </div>

        <a
          href="/"
          className={styles.back}
        >
          ← Kembali ke ERP
        </a>
      </header>

      {result ? (
        <div className={styles.notice}>
          {result === "approved"
            ? "Akun berhasil disetujui dan diaktifkan."
            : result === "rejected"
              ? "Permintaan akun berhasil ditolak."
              : "Permintaan belum dapat diproses."}
        </div>
      ) : null}

      <section className={styles.metrics}>
        <article>
          <span>MENUNGGU APPROVAL</span>
          <strong>{pending.length}</strong>
        </article>

        <article>
          <span>PENGGUNA AKTIF</span>
          <strong>{activeUsers.length}</strong>
        </article>

        <article>
          <span>DITOLAK</span>
          <strong>{rejected.length}</strong>
        </article>

        <article>
          <span>ROLE TERSEDIA</span>
          <strong>{roles.length}</strong>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <div>
            <p>APPROVAL QUEUE</p>
            <h2>Menunggu Persetujuan</h2>
          </div>

          <span className={styles.badge}>
            {pending.length} PENDING
          </span>
        </div>

        {pending.length === 0 ? (
          <div className={styles.empty}>
            Tidak ada akun yang menunggu approval.
          </div>
        ) : (
          <div className={styles.requestGrid}>
            {pending.map(
              (request: any) => {
                const defaultRole =
                  suggestedRole(
                    String(
                      request.requested_role
                    ),
                    roles
                  );

                return (
                  <article
                    className={styles.requestCard}
                    key={String(request.id)}
                  >
                    <div className={styles.identity}>
                      <div>
                        <strong>
                          {String(request.full_name)}
                        </strong>

                        <span>
                          @{String(request.username)}
                        </span>
                      </div>

                      <span className={styles.pending}>
                        PENDING
                      </span>
                    </div>

                    <dl className={styles.details}>
                      <div>
                        <dt>Email</dt>
                        <dd>{String(request.email)}</dd>
                      </div>

                      <div>
                        <dt>WhatsApp</dt>
                        <dd>{String(request.whatsapp)}</dd>
                      </div>

                      <div>
                        <dt>Akses diajukan</dt>
                        <dd>{String(request.requested_role)}</dd>
                      </div>

                      <div>
                        <dt>Didaftarkan</dt>
                        <dd>{String(request.submitted_at)}</dd>
                      </div>
                    </dl>

                    <form
                      action="/api/rkn/admin/users/approve"
                      method="post"
                      className={styles.approvalForm}
                    >
                      <input
                        type="hidden"
                        name="requestId"
                        value={String(request.id)}
                      />

                      <label>
                        <span>ROLE FINAL ERP</span>

                        <select
                          name="roleCode"
                          defaultValue={defaultRole}
                          required
                        >
                          <option value="">
                            Pilih role
                          </option>

                          {roles.map(
                            (role: any) => (
                              <option
                                key={String(role.id)}
                                value={String(role.code)}
                              >
                                {String(role.name)}
                                {" · "}
                                {String(role.code)}
                                {" · "}
                                {String(role.scope_mode)}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label>
                        <span>BUSINESS SCOPE</span>

                        <select
                          name="businessUnitId"
                          defaultValue=""
                        >
                          <option value="">
                            GLOBAL / Tidak diperlukan
                          </option>

                          {businessUnits.map(
                            (unit: any) => (
                              <option
                                key={String(unit.id)}
                                value={String(unit.id)}
                              >
                                {String(unit.name)}
                                {" · "}
                                {String(unit.code)}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label>
                        <span>ACCESS LEVEL</span>

                        <select
                          name="accessLevel"
                          defaultValue="VIEW"
                        >
                          <option value="VIEW">VIEW</option>
                          <option value="OPERATE">OPERATE</option>
                          <option value="MANAGE">MANAGE</option>
                          <option value="OWNER">OWNER</option>
                        </select>
                      </label>

                      <label>
                        <span>CATATAN ADMIN</span>

                        <input
                          name="reviewNote"
                          maxLength={300}
                          placeholder="Opsional"
                        />
                      </label>

                      <button
                        className={styles.approve}
                        type="submit"
                      >
                        SETUJUI &amp; AKTIFKAN
                      </button>
                    </form>

                    <form
                      action="/api/rkn/admin/users/reject"
                      method="post"
                      className={styles.rejectForm}
                    >
                      <input
                        type="hidden"
                        name="requestId"
                        value={String(request.id)}
                      />

                      <input
                        name="reviewNote"
                        maxLength={300}
                        placeholder="Alasan penolakan (opsional)"
                      />

                      <button type="submit">
                        TOLAK PERMINTAAN
                      </button>
                    </form>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <div>
            <p>ERP DIRECTORY</p>
            <h2>Pengguna Aktif</h2>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email / Username</th>
                <th>Role</th>
                <th>Scope</th>
              </tr>
            </thead>

            <tbody>
              {activeUsers.map(
                (user: any) => (
                  <tr key={String(user.id)}>
                    <td>
                      {String(
                        profileByUser.get(
                          String(user.id)
                        )?.full_name ??
                        user.name
                      )}
                    </td>

                    <td>
                      {String(user.email)}
                      <small>
                        @{String(
                          user.username ?? "-"
                        )}
                      </small>
                    </td>

                    <td>
                      {(
                        rolesByUser.get(
                          String(user.id)
                        ) ?? []
                      ).join(", ") || "-"}
                    </td>

                    <td>
                      {(
                        scopesByUser.get(
                          String(user.id)
                        ) ?? []
                      ).join(", ") || "GLOBAL"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="roles"
        className={styles.section}
      >
        <div className={styles.sectionTitle}>
          <div>
            <p>ACCESS CATALOG</p>
            <h2>Peran &amp; Izin</h2>
          </div>
        </div>

        <div className={styles.catalog}>
          {roles.map(
            (role: any) => (
              <article key={String(role.id)}>
                <strong>{String(role.name)}</strong>
                <code>{String(role.code)}</code>
                <span>
                  Scope: {String(role.scope_mode)}
                </span>
                <p>
                  {String(role.description ?? "-")}
                </p>
              </article>
            )
          )}
        </div>
      </section>

      <section
        id="scopes"
        className={styles.section}
      >
        <div className={styles.sectionTitle}>
          <div>
            <p>BUSINESS ACCESS</p>
            <h2>Ruang Lingkup Akses</h2>
          </div>
        </div>

        <div className={styles.catalog}>
          {businessUnits.map(
            (unit: any) => (
              <article key={String(unit.id)}>
                <strong>{String(unit.name)}</strong>
                <code>{String(unit.code)}</code>
                <span>{String(unit.kind)}</span>
              </article>
            )
          )}
        </div>
      </section>
    </main>
  );
}
'@

$pageCss = @'
.page {
  min-height: 100vh;
  padding: 36px;
  background:
    radial-gradient(circle at 15% 10%, rgba(50, 83, 220, .16), transparent 32%),
    #07101f;
  color: #eef2ff;
}

.header {
  max-width: 1380px;
  margin: 0 auto 28px;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.eyebrow,
.sectionTitle p {
  margin: 0 0 7px;
  color: #6f86d8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .15em;
}

.header h1 {
  margin: 0;
  font-size: 34px;
}

.subtitle {
  color: #8f9bb9;
}

.back {
  padding: 11px 15px;
  border: 1px solid #253866;
  border-radius: 12px;
  color: #b9c7ff;
  text-decoration: none;
  background: #0b1629;
}

.notice {
  max-width: 1380px;
  margin: 0 auto 20px;
  padding: 14px 16px;
  border: 1px solid #29457f;
  border-radius: 13px;
  background: #0b1a35;
}

.metrics {
  max-width: 1380px;
  margin: 0 auto 24px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.metrics article,
.section,
.requestCard,
.catalog article {
  border: 1px solid #1d3159;
  background: #0a1426;
  box-shadow: 0 18px 45px rgba(0,0,0,.18);
}

.metrics article {
  padding: 18px;
  border-radius: 15px;
}

.metrics span {
  color: #7788ad;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .1em;
}

.metrics strong {
  display: block;
  margin-top: 8px;
  font-size: 27px;
}

.section {
  max-width: 1380px;
  margin: 0 auto 22px;
  padding: 22px;
  border-radius: 18px;
}

.sectionTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.sectionTitle h2 {
  margin: 0;
  font-size: 21px;
}

.badge,
.pending {
  border: 1px solid #405aa7;
  border-radius: 999px;
  padding: 6px 10px;
  color: #9eb3ff;
  background: #111f42;
  font-size: 10px;
  font-weight: 800;
}

.empty {
  padding: 28px;
  border: 1px dashed #263858;
  border-radius: 14px;
  color: #71809f;
  text-align: center;
}

.requestGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 16px;
}

.requestCard {
  padding: 18px;
  border-radius: 16px;
}

.identity {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.identity strong {
  display: block;
  font-size: 17px;
}

.identity span {
  color: #7d8dad;
  font-size: 12px;
}

.details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
  margin: 18px 0;
}

.details div {
  padding: 11px;
  border-radius: 11px;
  background: #0d1a30;
}

.details dt {
  color: #65769b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .1em;
}

.details dd {
  margin: 5px 0 0;
  word-break: break-word;
  color: #dce4ff;
  font-size: 12px;
}

.approvalForm {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.approvalForm label {
  display: grid;
  gap: 6px;
}

.approvalForm label span {
  color: #7484aa;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .08em;
}

.approvalForm select,
.approvalForm input,
.rejectForm input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #29406f;
  border-radius: 10px;
  padding: 11px 12px;
  outline: none;
  background: #0b172b;
  color: #edf2ff;
  color-scheme: dark;
}

.approve {
  grid-column: 1 / -1;
  border: 1px solid #6987ff;
  border-radius: 11px;
  padding: 12px;
  cursor: pointer;
  background: #365bea;
  color: white;
  font-weight: 800;
}

.rejectForm {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 9px;
  margin-top: 10px;
}

.rejectForm button {
  border: 1px solid #77374b;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  background: #27101a;
  color: #ff9caf;
  font-weight: 800;
}

.tableWrap {
  overflow-x: auto;
}

.tableWrap table {
  width: 100%;
  border-collapse: collapse;
}

.tableWrap th,
.tableWrap td {
  padding: 13px 12px;
  border-bottom: 1px solid #182a4b;
  text-align: left;
  font-size: 12px;
}

.tableWrap th {
  color: #66779d;
  font-size: 9px;
  letter-spacing: .09em;
}

.tableWrap td small {
  display: block;
  margin-top: 4px;
  color: #627394;
}

.catalog {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 12px;
}

.catalog article {
  padding: 16px;
  border-radius: 13px;
}

.catalog strong,
.catalog code,
.catalog span {
  display: block;
}

.catalog code {
  margin-top: 8px;
  color: #88a2ff;
}

.catalog span,
.catalog p {
  color: #7484a6;
  font-size: 11px;
}

@media (max-width: 900px) {
  .page {
    padding: 20px;
  }

  .header {
    display: grid;
  }

  .metrics {
    grid-template-columns: 1fr 1fr;
  }

  .requestGrid,
  .catalog {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page {
    padding: 14px;
  }

  .metrics,
  .details,
  .approvalForm {
    grid-template-columns: 1fr;
  }

  .approve {
    grid-column: auto;
  }

  .rejectForm {
    grid-template-columns: 1fr;
  }
}
'@

$approveSource = @'
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

function back(
  request: Request,
  result: string
) {
  const { env } =
    getCloudflareContext();

  const base =
    typeof (env as any).BETTER_AUTH_URL === "string"
      ? String((env as any).BETTER_AUTH_URL)
      : new URL(request.url).origin;

  const url =
    new URL("/admin/users", base);

  url.searchParams.set(
    "result",
    result
  );

  return NextResponse.redirect(
    url,
    303
  );
}

export async function POST(
  request: Request
) {
  const session =
    await getAuth().api.getSession({
      headers: request.headers,
    });

  if (!session) {
    return back(request, "error");
  }

  const form =
    await request.formData();

  const requestId =
    String(
      form.get("requestId") ?? ""
    ).trim();

  const roleCode =
    String(
      form.get("roleCode") ?? ""
    ).trim();

  const businessUnitId =
    String(
      form.get("businessUnitId") ?? ""
    ).trim();

  const accessLevel =
    String(
      form.get("accessLevel") ?? "VIEW"
    ).trim();

  const reviewNote =
    String(
      form.get("reviewNote") ?? ""
    )
      .trim()
      .slice(0, 300);

  if (!requestId || !roleCode) {
    return back(request, "error");
  }

  const { env } =
    getCloudflareContext();

  const db =
    (env as any).AUTH_DB;

  const signup =
    await db.prepare(`
      SELECT
        id,
        user_id,
        full_name,
        status
      FROM rkn_signup_request
      WHERE id = ?
      LIMIT 1
    `)
      .bind(requestId)
      .first();

  if (
    !signup ||
    String(signup.status ?? "") !== "PENDING"
  ) {
    return back(request, "error");
  }

  try {
    await getErpCoreRpcStub()
      .provisionPendingErpUserAccess(
        session.user.id,
        String(signup.user_id),
        String(signup.full_name),
        roleCode,
        businessUnitId,
        accessLevel
      );

    await db.prepare(`
      UPDATE rkn_signup_request
      SET
        status = 'APPROVED',
        reviewed_by_user_id = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        review_note = ?
      WHERE
        id = ?
        AND status = 'PENDING'
    `)
      .bind(
        session.user.id,
        reviewNote || null,
        requestId
      )
      .run();

    return back(
      request,
      "approved"
    );
  }
  catch (error) {
    console.error(
      "RKN_ADMIN_USER_APPROVE_ERROR",
      error instanceof Error
        ? error.message
        : "UNKNOWN"
    );

    return back(request, "error");
  }
}
'@

$rejectSource = @'
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

function back(
  request: Request,
  result: string
) {
  const { env } =
    getCloudflareContext();

  const base =
    typeof (env as any).BETTER_AUTH_URL === "string"
      ? String((env as any).BETTER_AUTH_URL)
      : new URL(request.url).origin;

  const url =
    new URL("/admin/users", base);

  url.searchParams.set(
    "result",
    result
  );

  return NextResponse.redirect(
    url,
    303
  );
}

export async function POST(
  request: Request
) {
  const session =
    await getAuth().api.getSession({
      headers: request.headers,
    });

  if (!session) {
    return back(request, "error");
  }

  const form =
    await request.formData();

  const requestId =
    String(
      form.get("requestId") ?? ""
    ).trim();

  const reviewNote =
    String(
      form.get("reviewNote") ?? ""
    )
      .trim()
      .slice(0, 300);

  if (!requestId) {
    return back(request, "error");
  }

  try {
    await getErpCoreRpcStub()
      .getAdminAccessDirectory(
        session.user.id
      );

    const { env } =
      getCloudflareContext();

    const db =
      (env as any).AUTH_DB;

    await db.prepare(`
      UPDATE rkn_signup_request
      SET
        status = 'REJECTED',
        reviewed_by_user_id = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        review_note = ?
      WHERE
        id = ?
        AND status = 'PENDING'
    `)
      .bind(
        session.user.id,
        reviewNote || null,
        requestId
      )
      .run();

    return back(
      request,
      "rejected"
    );
  }
  catch (error) {
    console.error(
      "RKN_ADMIN_USER_REJECT_ERROR",
      error instanceof Error
        ? error.message
        : "UNKNOWN"
    );

    return back(request, "error");
  }
}
'@

[IO.File]::WriteAllText(
    (Join-Path (Get-Location) "$pageDir\page.tsx"),
    $pageSource,
    $utf8
)

[IO.File]::WriteAllText(
    (Join-Path (Get-Location) "$pageDir\users.module.css"),
    $pageCss,
    $utf8
)

[IO.File]::WriteAllText(
    (Join-Path (Get-Location) "$approveDir\route.ts"),
    $approveSource,
    $utf8
)

[IO.File]::WriteAllText(
    (Join-Path (Get-Location) "$rejectDir\route.ts"),
    $rejectSource,
    $utf8
)

# ==========================================================
# 3. PASSWORD SEAM FIX (only if not already present)
# ==========================================================

$loginCssPath = (Resolve-Path $loginCss).Path
$login = [IO.File]::ReadAllText($loginCssPath)

$seamMarker = "RKN_LOGIN_PASSWORD_SEAM_FIX_V1"

if (-not $login.Contains($seamMarker)) {
    $seamPatch = @'

/* RKN_LOGIN_PASSWORD_SEAM_FIX_V1 */
.inputShell {
  background: #0d172a !important;
}

.inputShell:focus-within {
  background: #0d172a !important;
}

.eyeButton,
.eyeButton:hover,
.eyeButton:active {
  background: #0d172a !important;
  border-left: 0 !important;
  box-shadow: none !important;
}

.field input:-webkit-autofill,
.field input:-webkit-autofill:hover,
.field input:-webkit-autofill:focus,
.field input:-webkit-autofill:active {
  -webkit-text-fill-color: #f3f6ff !important;
  -webkit-box-shadow:
    0 0 0 1000px #0d172a inset !important;
  box-shadow:
    0 0 0 1000px #0d172a inset !important;
}

'@

    [IO.File]::WriteAllText(
        $loginCssPath,
        $login + $seamPatch,
        $utf8
    )
}

# ==========================================================
# FINAL SOURCE GATE
# ==========================================================

$coreAfter = [IO.File]::ReadAllText($corePath)
$loginAfter = [IO.File]::ReadAllText($loginCssPath)

$checks = [ordered]@{
    "RPC MARKER" =
        $coreAfter.Contains(
            "RKN_ADMIN_ACCESS_PROVISIONING_V1"
        )

    "DIRECTORY RPC" =
        $coreAfter.Contains(
            "getAdminAccessDirectory("
        )

    "PROVISION RPC" =
        $coreAfter.Contains(
            "provisionPendingErpUserAccess("
        )

    "ADMIN PAGE" =
        (Test-Path ".\app\admin\users\page.tsx")

    "ADMIN CSS" =
        (Test-Path ".\app\admin\users\users.module.css")

    "APPROVE ROUTE" =
        (Test-Path ".\app\api\rkn\admin\users\approve\route.ts")

    "REJECT ROUTE" =
        (Test-Path ".\app\api\rkn\admin\users\reject\route.ts")

    "PASSWORD SEAM FIX" =
        $loginAfter.Contains(
            "RKN_LOGIN_PASSWORD_SEAM_FIX_V1"
        )
}

Write-Host "`n=== R13B RECOVERY POSTCHECK ===" -ForegroundColor Yellow

$checks.GetEnumerator() |
    ForEach-Object {
        Write-Host "$($_.Key) = $($_.Value)"
    }

if ($checks.Values -contains $false) {
    throw "F13_R13B_RECOVERY_FAILED"
}

Write-Host ""
Write-Host "BACKUP = $backupDir"
Write-Host "F13-R13B RECOVERY = PASS" -ForegroundColor Green
