import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

type ProfileRow = {
  active: number;
  must_change_password: number;
};

export async function POST(request: NextRequest) {
  const requestHeaders = await headers();

  const session = await getAuth().api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHENTICATED",
      },
      {
        status: 401,
      }
    );
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
    return NextResponse.json(
      {
        ok: false,
        error: "ERP_PROFILE_NOT_ACTIVE",
      },
      {
        status: 403,
      }
    );
  }

  if (profile.must_change_password !== 1) {
    return NextResponse.json(
      {
        ok: false,
        error: "PASSWORD_CHANGE_NOT_REQUIRED",
      },
      {
        status: 409,
      }
    );
  }

  let body: {
    currentPassword?: string;
    newPassword?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_REQUEST_BODY",
      },
      {
        status: 400,
      }
    );
  }

  const currentPassword =
    String(body.currentPassword ?? "");

  const newPassword =
    String(body.newPassword ?? "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      {
        ok: false,
        error: "PASSWORD_REQUIRED",
      },
      {
        status: 400,
      }
    );
  }

  if (newPassword.length < 10) {
    return NextResponse.json(
      {
        ok: false,
        error: "PASSWORD_TOO_SHORT",
      },
      {
        status: 400,
      }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      {
        ok: false,
        error: "NEW_PASSWORD_MUST_DIFFER",
      },
      {
        status: 400,
      }
    );
  }

  try {
    await getAuth().api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: requestHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "PASSWORD_CHANGE_FAILED";

    return NextResponse.json(
      {
        ok: false,
        error: "PASSWORD_CHANGE_FAILED",
        message,
      },
      {
        status: 400,
      }
    );
  }

  await getErpCoreRpcStub()
    .recordPasswordChangeCompletion(
      session.user.id
    );

  

  return NextResponse.json({
    ok: true,
    mustChangePassword: false,
  });
}