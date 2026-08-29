import { getAuth } from "@/lib/auth";

import {
  getErpCoreRpcStub,
  type RknRpcSessionUser,
} from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    inviteId: string;
  }>;
};

async function getRpcSessionUser(
  request: Request
): Promise<RknRpcSessionUser | null> {

  const session =
    await getAuth().api.getSession({
      headers:
        request.headers,
    });

  if (!session) {
    return null;
  }

  const rawUser =
    session.user as
      typeof session.user & {
        username?: string | null;
      };

  return {
    id:
      session.user.id,

    name:
      session.user.name ?? null,

    email:
      session.user.email ?? null,

    username:
      rawUser.username ?? null,
  };
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {

  const sessionUser =
    await getRpcSessionUser(
      request
    );

  const { inviteId } =
    await context.params;

  return getErpCoreRpcStub().updateWorkerRegistrationInvite(
    sessionUser,
    request.clone(),
    inviteId
  );
}
