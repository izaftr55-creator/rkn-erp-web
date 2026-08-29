import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json({
    ok: true,
    action: "LEGACY_NON_SECURE_AUTH_COOKIE_CLEARED",
  });

  const expired = {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax" as const,
  };

  /*
   * Remove only the legacy NON-secure Better Auth cookies.
   * Do not touch __Secure-better-auth.* cookies.
   */
  response.cookies.set({
    name: "better-auth.session_token",
    value: "",
    ...expired,
  });

  response.cookies.set({
    name: "better-auth.session_data",
    value: "",
    ...expired,
  });

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  return response;
}