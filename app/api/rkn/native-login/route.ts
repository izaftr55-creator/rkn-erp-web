import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";

export const dynamic = "force-dynamic";

/* RKN_LOGIN_AS_WORKSPACE_V2H_R4 */
/* RKN_NATIVE_LOGIN_R5_1_RECOVERY */

type LoginIntent =
  | "AUTO"
  | "MARKETPLACE_ADMIN"
  | "PLASTIC_SYSTEM_ADMIN"
  | "PLASTIC_OWNER"
  | "PLASTIC_ADMIN"
  | "PLASTIC_SUPERVISOR";

function publicBase(request: Request) {
  const { env } = getCloudflareContext();
  const runtimeEnv = env as any;

  const configured =
    typeof runtimeEnv.BETTER_AUTH_URL === "string"
      ? runtimeEnv.BETTER_AUTH_URL.trim()
      : "";

  return configured || new URL(request.url).origin;
}

function backToLogin(
  request: Request,
  reason: string
) {
  const url = new URL("/", publicBase(request));
  url.searchParams.set("auth", reason);

  const response = NextResponse.redirect(url, 303);
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  return response;
}

function normalizeIntent(value: unknown): LoginIntent {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();

  switch (raw) {
    case "MARKETPLACE_ADMIN":
    case "PLASTIC_SYSTEM_ADMIN":
    case "PLASTIC_OWNER":
    case "PLASTIC_ADMIN":
    case "PLASTIC_SUPERVISOR":
      return raw;
    default:
      return "AUTO";
  }
}

function accessFacts(context: any) {
  const roles = Array.isArray(context?.roles)
    ? context.roles
    : [];

  const businessUnits = Array.isArray(context?.businessUnits)
    ? context.businessUnits
    : [];

  const scopes = Array.isArray(context?.scopes)
    ? context.scopes
    : [];

  const roleCodes = new Set(
    roles.map((row: any) =>
      String(
        row?.code ??
          row?.role_code ??
          ""
      ).toUpperCase()
    )
  );

  const unitById = new Map(
    businessUnits.map((row: any) => [
      String(row?.id ?? ""),
      {
        code: String(
          row?.code ?? ""
        ).toUpperCase(),
        active: Number(
          row?.active ?? 1
        ),
      },
    ])
  );

  let plasticLevel = "";

  for (const row of scopes) {
    const unitId = String(
      row?.business_unit_id ??
        row?.businessUnitId ??
        ""
    );

    const mapped =
      unitById.get(unitId) as
        | { code: string; active: number }
        | undefined;

    const code = String(
      mapped?.code ??
        row?.business_unit ??
        row?.businessUnit ??
        unitId
    ).toUpperCase();

    const active = mapped?.active ?? 1;

    if (
      active === 1 &&
      (
        code === "PLASTIC_TRADING" ||
        unitId === "BU-PLASTIC"
      )
    ) {
      plasticLevel = String(
        row?.access_level ??
          row?.accessLevel ??
          ""
      ).toUpperCase();

      break;
    }
  }

  return {
    roleCodes,
    plasticLevel,
    profileActive:
      Number(
        context?.profile?.active ?? 0
      ) === 1,
  };
}

function authorizeIntent(
  requested: LoginIntent,
  context: any
) {
  const {
    roleCodes,
    plasticLevel,
    profileActive,
  } = accessFacts(context);

  if (!profileActive) {
    return {
      allowed: false,
      destination: "/",
      effectiveIntent: requested,
    };
  }

  const isSystemAdmin =
    roleCodes.has("SYSTEM_ADMIN");

  const isPlasticOwner =
    roleCodes.has("GROUP_OWNER") &&
    plasticLevel === "OWNER";

  const isPlasticAdmin =
    roleCodes.has("PLASTIC_ADMIN") &&
    (
      plasticLevel === "MANAGE" ||
      plasticLevel === "OWNER"
    );

  const isPlasticSupervisor =
    roleCodes.has("SUPERVISORY_BOARD") &&
    plasticLevel === "VIEW";

  let intent = requested;

  if (intent === "AUTO") {
    if (isSystemAdmin) {
      intent = "MARKETPLACE_ADMIN";
    }
    else if (isPlasticOwner) {
      intent = "PLASTIC_OWNER";
    }
    else if (isPlasticAdmin) {
      intent = "PLASTIC_ADMIN";
    }
    else if (isPlasticSupervisor) {
      intent = "PLASTIC_SUPERVISOR";
    }
    else {
      return {
        allowed: true,
        destination: "/",
        effectiveIntent: "AUTO" as LoginIntent,
      };
    }
  }

  switch (intent) {
    case "MARKETPLACE_ADMIN":
      return {
        allowed: isSystemAdmin,
        destination: "/",
        effectiveIntent: intent,
      };

    case "PLASTIC_SYSTEM_ADMIN":
      return {
        allowed: isSystemAdmin,
        destination: "/plastic-trading",
        effectiveIntent: intent,
      };

    case "PLASTIC_OWNER":
      return {
        allowed: isPlasticOwner,
        destination: "/plastic-trading",
        effectiveIntent: intent,
      };

    case "PLASTIC_ADMIN":
      return {
        allowed: isPlasticAdmin,
        destination: "/plastic-trading",
        effectiveIntent: intent,
      };

    case "PLASTIC_SUPERVISOR":
      return {
        allowed: isPlasticSupervisor,
        destination: "/plastic-trading",
        effectiveIntent: intent,
      };

    default:
      return {
        allowed: false,
        destination: "/",
        effectiveIntent: intent,
      };
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
  code: string
): Promise<T> {
  let handle:
    | ReturnType<typeof setTimeout>
    | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        handle = setTimeout(
          () => reject(new Error(code)),
          milliseconds
        );
      }),
    ]);
  }
  finally {
    if (handle) {
      clearTimeout(handle);
    }
  }
}

export async function POST(
  request: Request
) {
  const form = await request.formData();

  const username = String(
    form.get("username") ?? ""
  ).trim();

  const password = String(
    form.get("password") ?? ""
  );

  const requestedIntent =
    normalizeIntent(
      form.get("login_as")
    );

  if (!username || !password) {
    return backToLogin(
      request,
      "required"
    );
  }

  try {
    const authResponse =
      await getAuth().api.signInUsername({
        body: {
          username,
          password,
        },
        headers: request.headers,
        asResponse: true,
      });

    if (!authResponse.ok) {
      return backToLogin(
        request,
        "invalid"
      );
    }

    const authHeaders =
      authResponse.headers as Headers & {
        getSetCookie?: () => string[];
      };

    let cookies: string[] = [];

    if (
      typeof authHeaders.getSetCookie ===
      "function"
    ) {
      cookies =
        authHeaders.getSetCookie();
    }
    else {
      const cookie =
        authHeaders.get("set-cookie");

      if (cookie) {
        cookies = [cookie];
      }
    }

    if (cookies.length === 0) {
      return backToLogin(
        request,
        "cookie"
      );
    }

    /*
     * R5.1 recovery:
     * Better Auth is the source of truth for the authenticated user id.
     * Consume the successful response body directly (no clone, no
     * second session read, no direct AUTH_DB lookup).
     */
    const authJson =
      await withTimeout(
        authResponse.json() as Promise<any>,
        3000,
        "RKN_NATIVE_LOGIN_AUTH_RESPONSE_TIMEOUT"
      );

    const userId = String(
      authJson?.user?.id ?? ""
    );

    if (!userId) {
      return backToLogin(
        request,
        "user"
      );
    }

    /*
     * Preserve server-authoritative role/scope verification, but bound
     * the ERP RPC so the browser cannot hang indefinitely.
     */
    const erpContext =
      await withTimeout(
        getErpCoreRpcStub()
          .getErpAccessContext(
            userId
          ),
        5000,
        "RKN_NATIVE_LOGIN_ACCESS_TIMEOUT"
      );

    const decision =
      authorizeIntent(
        requestedIntent,
        erpContext
      );

    if (!decision.allowed) {
      return backToLogin(
        request,
        "workspace"
      );
    }

    const response =
      NextResponse.redirect(
        new URL(
          decision.destination,
          publicBase(request)
        ),
        303
      );

    /*
     * R5.2 COOKIE ORDER HOTFIX
     *
     * NextResponse.cookies.set may rewrite the Set-Cookie header.
     * Write the non-authoritative preference first, then append the
     * Better Auth session cookies afterwards so they survive.
     */
    response.cookies.set(
      "rkn_login_as",
      decision.effectiveIntent,
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      }
    );

    for (const cookie of cookies) {
      response.headers.append(
        "set-cookie",
        cookie
      );
    }

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return response;
  }
  catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN";

    console.error(
      "RKN_NATIVE_LOGIN_ERROR",
      message
    );

    if (
      message ===
      "RKN_NATIVE_LOGIN_ACCESS_TIMEOUT"
    ) {
      return backToLogin(
        request,
        "workspace-timeout"
      );
    }

    if (
      message ===
      "RKN_NATIVE_LOGIN_AUTH_RESPONSE_TIMEOUT"
    ) {
      return backToLogin(
        request,
        "auth-timeout"
      );
    }

    return backToLogin(
      request,
      "invalid"
    );
  }
}
