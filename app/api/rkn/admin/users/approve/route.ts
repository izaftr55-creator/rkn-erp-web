import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub, type RknRpcAccessLevel } from "@/lib/erpCoreRpc";
import { sendAccountApprovedEmail } from "@/lib/zohoMailer";

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

  const roleCode =
    String(
      form.get("roleCode") ?? ""
    ).trim();

  const businessUnitId =
    String(
      form.get("businessUnitId") ?? ""
    ).trim();

  const rawAccessLevel =
    String(
      form.get("accessLevel") ?? "VIEW"
    ).trim();

  const allowedAccessLevels =
    new Set<RknRpcAccessLevel>([
      "VIEW",
      "OPERATE",
      "MANAGE",
      "OWNER",
    ]);

  if (
    !allowedAccessLevels.has(
      rawAccessLevel as RknRpcAccessLevel
    )
  ) {
    return back(request, "error");
  }

  const accessLevel =
    rawAccessLevel as RknRpcAccessLevel;

  const reviewNote =
    String(
      form.get("reviewNote") ?? ""
    )
      .trim()
      .slice(0, 300);

  if (!requestId || !roleCode) {
    return back(request, "error");
  }

  const { env } =
    getCloudflareContext();

  const db =
    (env as any).AUTH_DB;

  const signup =
    await db.prepare(`
      SELECT
        id,
        user_id,
        full_name,
        email,
        status
      FROM rkn_signup_request
      WHERE id = ?
      LIMIT 1
    `)
      .bind(requestId)
      .first();

  if (
    !signup ||
    String(signup.status ?? "") !== "PENDING"
  ) {
    return back(request, "error");
  }

  try {
    await getErpCoreRpcStub()
      .provisionPendingErpUserAccess(
        session.user.id,
        String(signup.user_id),
        String(signup.full_name),
        roleCode,
        businessUnitId,
        accessLevel
      );

    await db.prepare(`
      UPDATE rkn_signup_request
      SET
        status = 'APPROVED',
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

    if (signup.email) {
      sendAccountApprovedEmail({
        to: String(signup.email),
        fullName: String(signup.full_name || "User"),
        roleCode,
        accessLevel,
      }).catch((err) => console.error("ZOHO_APPROVE_USER_EMAIL_ERR:", err));
    }

    return back(
      request,
      "approved"
    );
  }
  catch (error) {
    console.error(
      "RKN_ADMIN_USER_APPROVE_ERROR",
      error instanceof Error
        ? error.message
        : "UNKNOWN"
    );

    return back(request, "error");
  }
}