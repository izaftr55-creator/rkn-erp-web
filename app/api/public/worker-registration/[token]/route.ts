import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {

  const { token } =
    await context.params;

  return getErpCoreRpcStub()
    .getPublicWorkerRegistrationByToken(
      request.clone(),
      token
    );
}

export async function POST(
  request: Request,
  context: RouteContext
) {

  const { token } =
    await context.params;

  return getErpCoreRpcStub()
    .submitPublicWorkerRegistration(
      request.clone(),
      token
    );
}
