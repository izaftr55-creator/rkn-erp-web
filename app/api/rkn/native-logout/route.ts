import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function publicBase(
  request: Request
) {
  return (
    process.env.BETTER_AUTH_URL ||
    new URL(request.url).origin
  );
}

function copySetCookies(
  source: Response,
  target: NextResponse
) {
  const headers =
    source.headers as Headers & {
      getSetCookie?: () => string[];
    };

  let cookies: string[] = [];

  if (
    typeof headers.getSetCookie ===
    "function"
  ) {
    cookies =
      headers.getSetCookie();
  }
  else {
    const cookie =
      headers.get("set-cookie");

    if (cookie) {
      cookies = [cookie];
    }
  }

  for (const cookie of cookies) {
    target.headers.append(
      "set-cookie",
      cookie
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const authResponse =
      await getAuth().api.signOut({
        headers: request.headers,
        asResponse: true,
      });

    const loginUrl =
      new URL(
        "/login",
        publicBase(request)
      );

    const response =
      NextResponse.redirect(
        loginUrl,
        303
      );

    copySetCookies(
      authResponse,
      response
    );

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return response;
  }
  catch (error) {
    console.error(
      "RKN_NATIVE_LOGOUT_ERROR",
      error instanceof Error
        ? error.message
        : "UNKNOWN"
    );

    const errorUrl =
      new URL(
        "/login?logout=error",
        publicBase(request)
      );

    return NextResponse.redirect(
      errorUrl,
      303
    );
  }
}