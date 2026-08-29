import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

import styles from "./users.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    embed?: string | string[];
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

  const profileByUser = new Map<string, any>(profiles.map((row: any) => [String(row.user_id), row] as [string, any]));

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
      )}  / ${String(
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
  // RKN_SINGLE_SHELL_EMBED_V1
  const rawEmbed =
    params?.embed;

  const embedded =
    Array.isArray(rawEmbed)
      ? String(rawEmbed[0] ?? "") === "1"
      : String(rawEmbed ?? "") === "1";

  const rawResult =
    params?.result;

  const result =
    Array.isArray(rawResult)
      ? String(rawResult[0] ?? "")
      : String(rawResult ?? "");

  return (
    <main className={embedded ? `${styles.page} ${styles.embed}` : styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            RKN ERP / SYSTEM ADMIN
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
          KEMBALI KE ERP
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
                                {"  / "}
                                {String(role.code)}
                                {"  / "}
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
                                {"  / "}
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
