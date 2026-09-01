import { betterAuth } from "better-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { username } from "better-auth/plugins";


export function getAuth() {
  let runtimeEnv: any = {};
  try {
    const { env } = getCloudflareContext();
    runtimeEnv = env || {};
  } catch {}

  const authDb = runtimeEnv.AUTH_DB;
  const secret =
    typeof runtimeEnv.BETTER_AUTH_SECRET === "string" &&
    runtimeEnv.BETTER_AUTH_SECRET.length >= 32
      ? runtimeEnv.BETTER_AUTH_SECRET
      : typeof process.env.BETTER_AUTH_SECRET === "string" &&
        process.env.BETTER_AUTH_SECRET.length >= 32
      ? process.env.BETTER_AUTH_SECRET
      : "";

  const baseUrl =
    typeof runtimeEnv.BETTER_AUTH_URL === "string" &&
    runtimeEnv.BETTER_AUTH_URL.trim().length > 0
      ? runtimeEnv.BETTER_AUTH_URL.trim()
      : typeof process.env.BETTER_AUTH_URL === "string" &&
        process.env.BETTER_AUTH_URL.trim().length > 0
      ? process.env.BETTER_AUTH_URL.trim()
      : undefined;

  if (!authDb) {
    throw new Error("AUTH_DB binding is required.");
  }

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET binding is required and must be at least 32 characters.");
  }

  return betterAuth({
  /*
   * RKN_MOBILE_SECURE_SESSION_V1
   * Force one canonical HTTPS session-cookie namespace.
   */
  advanced: {
    useSecureCookies: true,
  },
  trustedOrigins: [
    "https://rkngroup.my.id",
    "https://erp.rkngroup.my.id",

    // Cloudflare terminates public TLS before forwarding
    // the request to the local origin. Better Auth logs
    // this exact origin during the proxied mobile request.
    "http://erp.rkngroup.my.id",

    // Local development only.
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000"]
      : []),
  ],
  baseURL: baseUrl,

  database: authDb,
  secret: secret,

  /*
   * RKN_PENDING_ACCOUNT_SESSION_GATE_V1
   *
   * Legacy/pre-existing accounts have no signup-request row and
   * remain unaffected.
   *
   * New self-registered accounts cannot create a login session
   * until their signup request is APPROVED.
   */
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const row =
            await runtimeEnv.AUTH_DB
              .prepare(`
                SELECT status
                FROM rkn_signup_request
                WHERE user_id = ?
                LIMIT 1
              `)
              .bind(session.userId)
              .first();

          if (
            row &&
            String(
              (row as any).status ?? ""
            ) !== "APPROVED"
          ) {
            return false;
          }
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,

    /*
     * RKN_CONTROLLED_SIGNUP_V1
     *
     * Better Auth signup engine is enabled internally.
     * Public direct signup is blocked by /api/auth/[...all].
     * RKN users must register through /api/rkn/signup.
     */
    disableSignUp: false,

    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: false,
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
  ],
});
}

export type RknAuthSession = ReturnType<typeof getAuth>["$Infer"]["Session"];