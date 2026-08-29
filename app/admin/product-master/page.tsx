/* RKN_HUMAN_COPY_V1 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

import styles from "./product-master.module.css";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    embed?: string | string[];
    result?:
      | string
      | string[];
    message?:
      | string
      | string[];
  }>;
};

function first(
  value:
    | string
    | string[]
    | undefined
) {
  return Array.isArray(value)
    ? String(value[0] ?? "")
    : String(value ?? "");
}

export default async function ProductMasterAdminPage({
  searchParams,
}: PageProps) {
  /*
   * RKN_PRODUCT_MASTER_DIRECT_ROUTE_GUARD_V1
   *
   * Keep this direct/deep-link page aligned with the authenticated
   * root shell. Authentication, active-profile, forced-password-change,
   * and SYSTEM_ADMIN role checks are resolved before Product Master RPC.
   * A Product Master status RPC failure is rendered as an admin-visible
   * diagnostic instead of silently redirecting back to the login shell.
   */
  const session =
    await getAuth().api.getSession({
      headers:
        await headers(),
    });

  if (!session) {
    redirect("/");
  }

  const erpContext =
    await getErpCoreRpcStub()
      .getErpAccessContext(
        session.user.id
      ) as any;

  const profile =
    erpContext?.profile as any;

  if (
    !profile ||
    Number(profile.active ?? 0) !== 1
  ) {
    redirect("/");
  }

  if (
    Number(
      profile.must_change_password ?? 0
    ) === 1
  ) {
    redirect("/change-password");
  }

  const roleCodes =
    new Set(
      (
        Array.isArray(erpContext?.roles)
          ? erpContext.roles
          : []
      ).map(
        (row: any) =>
          String(
            row?.code ?? ""
          )
      )
    );

  if (!roleCodes.has("SYSTEM_ADMIN")) {
    redirect("/");
  }

  let status: any = null;
  let statusError = "";

  try {
    status =
      await getErpCoreRpcStub()
        .getCanonicalProductMasterStatus(
          session.user.id
        );
  }
  catch (error) {
    statusError =
      error instanceof Error
        ? error.message
        : "UNKNOWN_PRODUCT_MASTER_STATUS_ERROR";
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

  const result =
    first(params.result);

  const message =
    first(params.message);

  const gaps =
    Array.isArray(
      status?.productsWithoutVariants
    )
      ? status.productsWithoutVariants
      : [];

  return (
    <main className={embedded ? `${styles.page} ${styles.embed}` : styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            RKN ERP / SYSTEM ADMIN
          </p>

          <h1>
            Product Master
          </h1>

          <p className={styles.subtitle}>
            Source of truth produk,
            parent SKU, physical SKU,
            warna, dan size untuk seluruh
            marketplace.
          </p>
        </div>

        <a
          href="/"
          className={styles.back}
        >
          KEMBALI KE ERP
        </a>
      </header>

      {result === "seeded" ? (
        <section
          className={styles.success}
        >
          Product Master seed berhasil
          diterapkan.
        </section>
      ) : null}

      {result === "error" ? (
        <section
          className={styles.error}
        >
          Seed gagal:
          {" "}
          {message || "UNKNOWN"}
        </section>
      ) : null}

            {statusError ? (
        <section
          className={styles.error}
        >
          Product Master status gagal:
          {" "}
          {statusError}
        </section>
      ) : null}

      <section className={styles.metrics}>
        <article>
          <span>PRODUCT</span>
          <strong>
            {Number(
              status?.productCount ??
                0
            ).toLocaleString("id-ID")}
          </strong>
        </article>

        <article>
          <span>PHYSICAL SKU</span>
          <strong>
            {Number(
              status?.physicalSkuCount ??
                0
            ).toLocaleString("id-ID")}
          </strong>
        </article>

        <article>
          <span>VARIANT</span>
          <strong>
            {Number(
              status?.variantCount ??
                0
            ).toLocaleString("id-ID")}
          </strong>
        </article>

        <article>
          <span>COLOR</span>
          <strong>
            {Number(
              status?.colorCount ??
                0
            ).toLocaleString("id-ID")}
          </strong>
        </article>
      </section>

      <section className={styles.card}>
        <div>
          <p className={styles.label}>
            STATUS
          </p>

          <h2>
            {status?.ready
              ? "MASTER SIAP"
              : "BELUM SIAP"}
          </h2>

          <p>
            Seed version:
            {" "}
            {String(
              status?.seedState
                ?.seed_version ??
                "-"
            )}
          </p>
        </div>

        {!statusError && !status?.ready ? (
          <form
            action="/api/rkn/admin/product-master/seed"
            method="post"
          >
            <button type="submit">
              INITIALIZE FROZEN MASTER
            </button>
          </form>
        ) : null}
      </section>

      <section className={styles.card}>
        <div>
          <p className={styles.label}>
            PERLU DICEK
          </p>

          <h2>
            Product tanpa variant
          </h2>
        </div>

        {gaps.length === 0 ? (
          <p>
            Tidak ada gap.
          </p>
        ) : (
          <ul>
            {gaps.map(
              (row: any) => (
                <li
                  key={String(
                    row.product_id
                  )}
                >
                  {String(
                    row.product_family
                  )}
                  {" / "}
                  {String(
                    row.product_name
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </section>
    </main>
  );
}