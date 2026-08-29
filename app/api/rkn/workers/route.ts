import { getAuth } from "@/lib/auth";

import {
  getErpCoreRpcStub,
  type RknRpcSessionUser,
} from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

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

export async function GET(
  request: Request
) {

  const sessionUser =
    await getRpcSessionUser(
      request
    );

  return getErpCoreRpcStub().listWorkers(
    sessionUser,
    request.clone()
  );
}

export async function POST(
  request: Request
) {

  const sessionUser =
    await getRpcSessionUser(
      request
    );

  return getErpCoreRpcStub().createWorker(
    sessionUser,
    request.clone()
  );
}
