import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

/**
 * RKN_GLOBAL_PATCH_V1
 *
 * One canonical SYSTEM_ADMIN direct-route gate.
 * This helper intentionally performs no Auth DB or ERP writes.
 */
export async function requireRknSystemAdmin() {
  const session =
    await getAuth().api.getSession({
      headers: await headers(),
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
          String(row?.code ?? "")
      )
    );

  if (!roleCodes.has("SYSTEM_ADMIN")) {
    redirect("/");
  }

  return {
    session,
    erpContext,
    profile,
    roleCodes,
  };
}