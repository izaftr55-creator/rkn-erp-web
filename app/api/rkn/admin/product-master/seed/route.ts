import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

import seed from "@/cloudflare/seeds/rkn-product-master-v1.json";

export async function POST(
  request: NextRequest
) {
  const session =
    await getAuth().api.getSession({
      headers: request.headers,
    });

  if (!session) {
    return NextResponse.redirect(
      new URL("/", request.url),
      303
    );
  }

  try {
    await getErpCoreRpcStub()
      .seedCanonicalProductMasterV1(
        session.user.id,
        seed
      );

    return NextResponse.redirect(
      new URL(
        "/admin/product-master?result=seeded",
        request.url
      ),
      303
    );
  }
  catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    const url =
      new URL(
        "/admin/product-master",
        request.url
      );

    url.searchParams.set(
      "result",
      "error"
    );

    url.searchParams.set(
      "message",
      message.slice(0, 180)
    );

    return NextResponse.redirect(
      url,
      303
    );
  }
}