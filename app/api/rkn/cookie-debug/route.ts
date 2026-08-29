import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { getAuth } from "@/lib/auth";

export async function GET() {
  const h = await headers();

  const rawCookie =
    h.get("cookie") ?? "";

  const cookieNames =
    rawCookie
      .split(";")
      .map((part) =>
        part.trim().split("=")[0]
      )
      .filter(Boolean);

  let session = null;
  let authError = null;

  try {
    session = await getAuth().api.getSession({
      headers: h,
    });
  }
  catch (error) {
    authError =
      error instanceof Error
        ? error.message
        : String(error);
  }

  return NextResponse.json({
    cookieHeaderPresent:
      rawCookie.length > 0,

    cookieNames,

    betterAuthCookiePresent:
      cookieNames.some((name) =>
        name.includes(
          "better-auth.session_token"
        )
      ),

    betterAuthGetSession:
      session
        ? {
            authenticated: true,
            userId:
              session.user?.id ?? null,
            username:
              session.user?.username ?? null,
          }
        : {
            authenticated: false,
          },

    authError,

    forwardedProto:
      h.get(
        "x-forwarded-proto"
      ) ?? null,

    forwardedHost:
      h.get(
        "x-forwarded-host"
      ) ?? null,

    host:
      h.get("host") ?? null,

    userAgent:
      h.get("user-agent") ?? null,
  });
}
