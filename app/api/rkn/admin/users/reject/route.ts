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