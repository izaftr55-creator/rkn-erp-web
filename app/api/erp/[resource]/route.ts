import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

const allowed =
  new Set([
    "stores",
    "products",
    "skuColors",
    "colors",
  ]);

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      resource: string;
    }>;
  }
) {
  const session =
    await getAuth().api.getSession({
      headers: request.headers,
    });

  if (!session) {
    return NextResponse.json(
      {
        error:
          "AUTH_REQUIRED",
      },
      {
        status: 401,
      }
    );
  }

  const { resource } =
    await context.params;

  if (!allowed.has(resource)) {
    return NextResponse.json(
      {
        error:
          "Unknown ERP resource",
      },
      {
        status: 404,
      }
    );
  }

  try {
    const data =
      await getErpCoreRpcStub()
        .getCanonicalMasterResource(
          session.user.id,
          resource
        );

    return NextResponse.json({
      data,
      source:
        "CANONICAL_ERP_CORE",
    });
  }
  catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}