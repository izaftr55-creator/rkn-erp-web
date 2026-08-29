import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";

import ChangePasswordForm from "./ChangePasswordForm";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

type ProfileRow = {
  full_name: string;
  active: number;
  must_change_password: number;
};

export default async function ChangePasswordPage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const erpContext =
    await getErpCoreRpcStub()
      .getErpAccessContext(
        session.user.id
      ) as any;

  const profile =
    erpContext?.profile as
      | ProfileRow
      | undefined;

  if (!profile || profile.active !== 1) {
    redirect("/login");
  }

  if (profile.must_change_password !== 1) {
    redirect("/");
  }

  return (
    <ChangePasswordForm
      name={profile.full_name}
    />
  );
}