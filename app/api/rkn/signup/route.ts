import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_REQUESTED_ROLES =
  new Set([
    "OWNER",
    "ADMIN",
    "STAFF",
  ]);

function publicBase(request: Request) {
  const { env } = getCloudflareContext();
  const runtimeEnv = env as any;

  const configured =
    typeof runtimeEnv.BETTER_AUTH_URL === "string"
      ? runtimeEnv.BETTER_AUTH_URL.trim()
      : "";

  return (
    configured ||
    new URL(request.url).origin
  );
}

function back(
  request: Request,
  status: string
) {
  const url =
    new URL(
      "/signup",
      publicBase(request)
    );

  url.searchParams.set(
    "status",
    status
  );

  const response =
    NextResponse.redirect(
      url,
      303
    );

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  return response;
}

function normalizeUsername(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizeEmail(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizeWhatsapp(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}

export async function POST(
  request: Request
) {
  const { env } =
    getCloudflareContext();

  const runtimeEnv =
    env as any;

  const db =
    runtimeEnv.AUTH_DB;

  if (!db) {
    console.error(
      "RKN_SIGNUP_AUTH_DB_MISSING"
    );

    return back(
      request,
      "error"
    );
  }

  const form =
    await request.formData();

  const fullName =
    String(
      form.get("fullName") ?? ""
    ).trim();

  const username =
    normalizeUsername(
      String(
        form.get("username") ?? ""
      )
    );

  const email =
    normalizeEmail(
      String(
        form.get("email") ?? ""
      )
    );

  const whatsapp =
    normalizeWhatsapp(
      String(
        form.get("whatsapp") ?? ""
      )
    );

  const requestedRole =
    String(
      form.get("requestedRole") ?? ""
    )
      .trim()
      .toUpperCase();

  const password =
    String(
      form.get("password") ?? ""
    );

  const confirmPassword =
    String(
      form.get("confirmPassword") ?? ""
    );

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);

  const usernameValid =
    /^[a-z0-9._]{3,30}$/
      .test(username);

  const whatsappValid =
    whatsapp.length >= 8 &&
    whatsapp.length <= 18;

  const passwordValid =
    password.length >= 10 &&
    password.length <= 128;

  if (
    fullName.length < 3 ||
    fullName.length > 120 ||
    !emailValid ||
    !usernameValid ||
    !whatsappValid ||
    !ALLOWED_REQUESTED_ROLES.has(
      requestedRole
    ) ||
    !passwordValid ||
    password !== confirmPassword
  ) {
    return back(
      request,
      "invalid"
    );
  }

  /*
   * Generic duplicate check.
   *
   * Do not reveal whether the email or username caused
   * the conflict.
   */
  const existing =
    await db
      .prepare(`
        SELECT id
        FROM "user"
        WHERE
          lower(email) = ?
          OR lower(username) = ?
        LIMIT 1
      `)
      .bind(
        email,
        username
      )
      .first();

  if (existing) {
    return back(
      request,
      "exists"
    );
  }

  const existingRequest =
    await db
      .prepare(`
        SELECT id
        FROM rkn_signup_request
        WHERE
          lower(email) = ?
          OR lower(username) = ?
        LIMIT 1
      `)
      .bind(
        email,
        username
      )
      .first();

  if (existingRequest) {
    return back(
      request,
      "exists"
    );
  }

  try {
    const signup =
      await getAuth().api.signUpEmail({
        body: {
          name: fullName,
          email,
          password,
          username,
          displayUsername:
            username,
        } as any,
      });

    const userId =
      String(
        (signup as any)
          ?.user
          ?.id ?? ""
      ).trim();

    if (!userId) {
      console.error(
        "RKN_SIGNUP_USER_ID_MISSING"
      );

      return back(
        request,
        "error"
      );
    }

    try {
      await db
        .prepare(`
          INSERT INTO rkn_signup_request (
            id,
            user_id,
            full_name,
            email,
            username,
            whatsapp,
            requested_role,
            status,
            submitted_at
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            'PENDING',
            CURRENT_TIMESTAMP
          )
        `)
        .bind(
          crypto.randomUUID(),
          userId,
          fullName,
          email,
          username,
          whatsapp,
          requestedRole
        )
        .run();
    }
    catch (pendingError) {
      /*
       * Compensating cleanup:
       * the newly-created Better Auth account must not be
       * left orphaned when its pending record cannot be saved.
       *
       * autoSignIn is disabled, so this account has no intended
       * active login session at signup time.
       */
      console.error(
        "RKN_SIGNUP_PENDING_INSERT_FAILED",
        pendingError instanceof Error
          ? pendingError.message
          : "UNKNOWN"
      );

      try {
        await db.batch([
          db
            .prepare(`
              DELETE FROM "account"
              WHERE userId = ?
            `)
            .bind(userId),

          db
            .prepare(`
              DELETE FROM "user"
              WHERE id = ?
            `)
            .bind(userId),
        ]);
      }
      catch (cleanupError) {
        console.error(
          "RKN_SIGNUP_COMPENSATION_FAILED",
          cleanupError instanceof Error
            ? cleanupError.message
            : "UNKNOWN"
        );
      }

      return back(
        request,
        "error"
      );
    }

    console.log(
      "RKN_SIGNUP_PENDING_CREATED",
      {
        userId,
        requestedRole,
      }
    );

    return back(
      request,
      "pending"
    );
  }
  catch (error) {
    console.error(
      "RKN_SIGNUP_ERROR",
      error instanceof Error
        ? error.message
        : "UNKNOWN"
    );

    return back(
      request,
      "error"
    );
  }
}