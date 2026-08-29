import { DurableObject } from "cloudflare:workers";

import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { getMigrations } from "better-auth/db/migration";


/*
 * RKN CLOUDFLARE F8C
 *
 * AUTHENTICATED D1 → ERP SQLITE DO RPC HARNESS
 *
 * LOCAL TEST ONLY.
 *
 * PURPOSE:
 * 1. Better Auth authenticates dummy user in D1.
 * 2. Worker derives actor identity ONLY from session.user.id.
 * 3. Client-supplied actorUserId is deliberately ignored.
 * 4. Worker calls ERP Durable Object through RPC.
 * 5. DO validates ERP profile + BU scope + permission.
 * 6. DO writes audit_log.actor_user_id from authenticated ID.
 *
 * NOT PRODUCTION MIGRATION.
 * NO PRODUCTION USER DATA.
 */


const HARNESS_BASE_URL =
  "http://127.0.0.1:8794";


const LOCAL_TEST_AUTH_SECRET =
  "RKN-F8C-LOCAL-ONLY-AUTH-SECRET-NOT-FOR-PRODUCTION-2026";


function createAuth(env) {

  return betterAuth({

    database:
      env.AUTH_DB,

    secret:
      LOCAL_TEST_AUTH_SECRET,

    baseURL:
      HARNESS_BASE_URL,

    advanced: {
      useSecureCookies: true
    },

    trustedOrigins: [
      HARNESS_BASE_URL
    ],

    emailAndPassword: {
      enabled: true,
      disableSignUp: false,

      minPasswordLength: 10,
      maxPasswordLength: 128,

      autoSignIn: false
    },

    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30
      })
    ]
  });
}


function cookieHeaderFromResponse(
  response
) {

  let cookies = [];


  if (
    typeof response.headers.getSetCookie ===
      "function"
  ) {

    cookies =
      response.headers.getSetCookie();

  }
  else {

    const single =
      response.headers.get(
        "set-cookie"
      );


    if (single) {
      cookies = [single];
    }
  }


  return cookies
    .map(
      cookie =>
        cookie.split(";")[0]
    )
    .filter(Boolean)
    .join("; ");
}


function firstRow(cursor) {

  const rows =
    cursor.toArray();


  return rows.length > 0
    ? rows[0]
    : null;
}


/* ==========================================================
   ERP DURABLE OBJECT
   ========================================================== */

export class RknErpRpcHarness extends DurableObject {

  constructor(
    ctx,
    env
  ) {

    super(
      ctx,
      env
    );


    this.ctx =
      ctx;


    this.sql =
      ctx.storage.sql;


    ctx.blockConcurrencyWhile(
      async () => {

        const ddl = [

`
CREATE TABLE IF NOT EXISTS erp_user_profile (
  user_id TEXT PRIMARY KEY,
  active INTEGER NOT NULL
    CHECK (active IN (0, 1))
)
`,

`
CREATE TABLE IF NOT EXISTS user_business_scope (
  user_id TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,
  access_level TEXT NOT NULL,

  PRIMARY KEY (
    user_id,
    business_unit_id
  )
)
`,

`
CREATE TABLE IF NOT EXISTS role (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
)
`,

`
CREATE TABLE IF NOT EXISTS permission (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE
)
`,

`
CREATE TABLE IF NOT EXISTS role_permission (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,

  PRIMARY KEY (
    role_id,
    permission_id
  )
)
`,

`
CREATE TABLE IF NOT EXISTS user_role (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,

  PRIMARY KEY (
    user_id,
    role_id,
    business_unit_id
  )
)
`,

`
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,

  actor_user_id TEXT,
  business_unit_id TEXT,

  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,

  created_at TEXT NOT NULL
)
`

        ];


        for (
          const statement
          of ddl
        ) {

          this.sql.exec(
            statement
          );
        }
      }
    );
  }


  /*
   * LOCAL HARNESS BOOTSTRAP ONLY.
   *
   * Production must provision ERP identity through its
   * controlled user-management path, not this method.
   */

  async seedAuthorizedIdentity(
    input
  ) {

    return this.ctx.storage.transactionSync(
      () => {

        this.sql.exec(`
          INSERT INTO erp_user_profile (
            user_id,
            active
          )
          VALUES (?, 1)
        `,
          input.actorUserId
        );


        this.sql.exec(`
          INSERT INTO user_business_scope (
            user_id,
            business_unit_id,
            access_level
          )
          VALUES (?, ?, ?)
        `,
          input.actorUserId,
          input.businessUnitId,
          "OWNER"
        );


        this.sql.exec(`
          INSERT INTO role (
            id,
            name
          )
          VALUES (?, ?)
        `,
          input.roleId,
          "F8C LOCAL OPERATIONS"
        );


        this.sql.exec(`
          INSERT INTO permission (
            id,
            code
          )
          VALUES (?, ?)
        `,
          input.permissionId,
          input.permissionCode
        );


        this.sql.exec(`
          INSERT INTO role_permission (
            role_id,
            permission_id
          )
          VALUES (?, ?)
        `,
          input.roleId,
          input.permissionId
        );


        this.sql.exec(`
          INSERT INTO user_role (
            user_id,
            role_id,
            business_unit_id
          )
          VALUES (?, ?, ?)
        `,
          input.actorUserId,
          input.roleId,
          input.businessUnitId
        );


        return {
          ok: true
        };
      }
    );
  }


  async performBusinessOperation(
    input
  ) {

    return this.ctx.storage.transactionSync(
      () => {

        /*
         * PROFILE
         */

        const profile =
          firstRow(
            this.sql.exec(`
              SELECT
                active
              FROM erp_user_profile
              WHERE user_id = ?
              LIMIT 1
            `,
              input.actorUserId
            )
          );


        if (
          !profile ||
          Number(profile.active) !== 1
        ) {

          return {
            ok: false,
            error:
              "PROFILE_INACTIVE"
          };
        }


        /*
         * BUSINESS SCOPE
         */

        const scope =
          firstRow(
            this.sql.exec(`
              SELECT
                access_level
              FROM user_business_scope
              WHERE user_id = ?
                AND business_unit_id = ?
              LIMIT 1
            `,
              input.actorUserId,
              input.businessUnitId
            )
          );


        if (
          !scope ||
          ![
            "VIEW",
            "MANAGE",
            "OWNER"
          ].includes(
            String(
              scope.access_level
            )
          )
        ) {

          return {
            ok: false,
            error:
              "SCOPE_DENIED"
          };
        }


        /*
         * ROLE / PERMISSION
         */

        const permission =
          firstRow(
            this.sql.exec(`
              SELECT
                p.code
              FROM user_role ur

              JOIN role_permission rp
                ON rp.role_id =
                   ur.role_id

              JOIN permission p
                ON p.id =
                   rp.permission_id

              WHERE ur.user_id = ?
                AND ur.business_unit_id = ?
                AND p.code = ?

              LIMIT 1
            `,
              input.actorUserId,
              input.businessUnitId,
              input.permissionCode
            )
          );


        if (!permission) {

          return {
            ok: false,
            error:
              "PERMISSION_DENIED"
          };
        }


        /*
         * BUSINESS WRITE REPRESENTATION + AUDIT
         *
         * actor_user_id is a LOGICAL reference to D1 user.id.
         * There is deliberately no cross-database FK.
         */

        this.sql.exec(`
          INSERT INTO audit_log (
            id,
            actor_user_id,
            business_unit_id,
            action,
            entity_type,
            entity_id,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          input.operationKey,
          input.actorUserId,
          input.businessUnitId,
          input.action,
          "F8C_TEST",
          input.operationKey,
          "2026-08-14T00:00:00Z"
        );


        return {
          ok: true,

          actorUserId:
            input.actorUserId,

          businessUnitId:
            input.businessUnitId,

          permissionCode:
            input.permissionCode
        };
      }
    );
  }


  async getAudit(
    operationKey
  ) {

    const row =
      firstRow(
        this.sql.exec(`
          SELECT
            id,
            actor_user_id,
            business_unit_id,
            action
          FROM audit_log
          WHERE id = ?
          LIMIT 1
        `,
          operationKey
        )
      );


    if (!row) {
      return null;
    }


    return {
      id:
        String(row.id),

      actorUserId:
        row.actor_user_id === null
          ? null
          : String(
              row.actor_user_id
            ),

      businessUnitId:
        row.business_unit_id === null
          ? null
          : String(
              row.business_unit_id
            ),

      action:
        String(
          row.action
        )
    };
  }


  async auditCount(
    operationKey
  ) {

    const row =
      firstRow(
        this.sql.exec(`
          SELECT
            COUNT(*) AS n
          FROM audit_log
          WHERE id = ?
        `,
          operationKey
        )
      );


    return Number(
      row?.n ?? 0
    );
  }
}


/* ==========================================================
   WORKER PROBE
   ========================================================== */

async function runProbe(
  request,
  env
) {

  const auth =
    createAuth(
      env
    );


  /*
   * AUTH D1 MIGRATION
   */

  const migrationPlan =
    await getMigrations(
      auth.options
    );


  await migrationPlan
    .runMigrations();


  /*
   * LOCAL DUMMY USER
   */

  const suffix =
    crypto.randomUUID()
      .replaceAll("-", "")
      .slice(
        0,
        12
      );


  const email =
    `f8c-${suffix}@example.invalid`;


  const usernameValue =
    `f8c_${suffix}`;


  const password =
    "F8c-Local-Only-Password-12345";


  const signUp =
    await auth.api.signUpEmail({
      body: {
        name:
          "F8C Local User",

        email,

        password,

        username:
          usernameValue,

        displayUsername:
          usernameValue
      }
    });


  const createdUserId =
    String(
      signUp?.user?.id ?? ""
    );


  if (!createdUserId) {

    throw new Error(
      "F8C_SIGNUP_FAILED"
    );
  }


  /*
   * LOGIN
   */

  const signInResponse =
    await auth.api.signInUsername({

      body: {
        username:
          usernameValue,

        password
      },

      asResponse:
        true
    });


  if (
    signInResponse.status < 200 ||
    signInResponse.status >= 300
  ) {

    throw new Error(
      "F8C_SIGNIN_FAILED"
    );
  }


  const cookie =
    cookieHeaderFromResponse(
      signInResponse
    );


  if (!cookie) {

    throw new Error(
      "F8C_SESSION_COOKIE_MISSING"
    );
  }


  const sessionHeaders =
    new Headers();


  sessionHeaders.set(
    "cookie",
    cookie
  );


  const session =
    await auth.api.getSession({
      headers:
        sessionHeaders
    });


  if (
    !session?.user?.id
  ) {

    throw new Error(
      "F8C_SESSION_MISSING"
    );
  }


  /*
   * THE ONLY TRUSTED ACTOR IDENTITY
   */

  const authenticatedActorId =
    String(
      session.user.id
    );


  /*
   * DELIBERATELY READ AN UNTRUSTED CLIENT ATTEMPT.
   *
   * It is NEVER used for RPC actor identity.
   */

  const requestUrl =
    new URL(
      request.url
    );


  const clientActorAttempt =
    String(
      requestUrl.searchParams.get(
        "actorUserId"
      ) ?? ""
    );


  /*
   * ERP RPC
   */

  const stub =
    env.RKN_ERP_CORE.getByName(
      "rkn-f8c-local-only"
    );


  const businessUnitId =
    "BU-F8C-" +
    suffix;


  const wrongBusinessUnitId =
    "BU-F8C-WRONG-" +
    suffix;


  const roleId =
    "ROLE-F8C-" +
    suffix;


  const permissionId =
    "PERM-F8C-" +
    suffix;


  const permissionCode =
    "inventory.manage.f8c." +
    suffix;


  const missingPermissionCode =
    "inventory.denied.f8c." +
    suffix;


  await stub.seedAuthorizedIdentity({
    actorUserId:
      authenticatedActorId,

    businessUnitId,

    roleId,

    permissionId,

    permissionCode
  });


  /*
   * AUTHORIZED OPERATION
   */

  const operationKey =
    "AUDIT-F8C-" +
    suffix;


  const authorized =
    await stub.performBusinessOperation({

      actorUserId:
        authenticatedActorId,

      businessUnitId,

      permissionCode,

      action:
        "F8C_AUTHENTICATED_OPERATION",

      operationKey
    });


  const audit =
    await stub.getAudit(
      operationKey
    );


  const auditRows =
    await stub.auditCount(
      operationKey
    );


  const authenticatedIdentityPass =
    authorized.ok === true &&
    authorized.actorUserId ===
      authenticatedActorId;


  const forgedIdentityIgnored =
    clientActorAttempt.length > 0 &&
    authenticatedActorId !==
      clientActorAttempt &&
    audit?.actorUserId ===
      authenticatedActorId &&
    audit?.actorUserId !==
      clientActorAttempt;


  const auditPass =
    auditRows === 1 &&
    audit?.actorUserId ===
      authenticatedActorId &&
    audit?.businessUnitId ===
      businessUnitId;


  /*
   * WRONG BUSINESS SCOPE
   */

  const deniedScopeKey =
    "AUDIT-F8C-SCOPE-" +
    suffix;


  const scopeDenied =
    await stub.performBusinessOperation({

      actorUserId:
        authenticatedActorId,

      businessUnitId:
        wrongBusinessUnitId,

      permissionCode,

      action:
        "F8C_SCOPE_DENIED_TEST",

      operationKey:
        deniedScopeKey
    });


  const scopeDeniedAuditRows =
    await stub.auditCount(
      deniedScopeKey
    );


  const scopeDeniedPass =
    scopeDenied.ok === false &&
    scopeDenied.error ===
      "SCOPE_DENIED" &&
    scopeDeniedAuditRows === 0;


  /*
   * MISSING PERMISSION
   */

  const deniedPermissionKey =
    "AUDIT-F8C-PERM-" +
    suffix;


  const permissionDenied =
    await stub.performBusinessOperation({

      actorUserId:
        authenticatedActorId,

      businessUnitId,

      permissionCode:
        missingPermissionCode,

      action:
        "F8C_PERMISSION_DENIED_TEST",

      operationKey:
        deniedPermissionKey
    });


  const permissionDeniedAuditRows =
    await stub.auditCount(
      deniedPermissionKey
    );


  const permissionDeniedPass =
    permissionDenied.ok === false &&
    permissionDenied.error ===
      "PERMISSION_DENIED" &&
    permissionDeniedAuditRows === 0;


  /*
   * FINAL
   */

  const result = {

    harness:
      "RKN_CLOUDFLARE_F8C",

    authStorage:
      "D1_LOCAL",

    erpStorage:
      "SQLITE_DURABLE_OBJECT_LOCAL",

    rpc:
      true,

    identity: {

      source:
        "SESSION_USER_ID",

      sessionUserMatchesSignup:
        authenticatedActorId ===
          createdUserId,

      clientActorAttemptPresent:
        clientActorAttempt.length > 0,

      clientActorIgnored:
        forgedIdentityIgnored,

      passed:
        authenticatedIdentityPass &&
        forgedIdentityIgnored
    },

    authorizedOperation: {

      ok:
        authorized.ok === true,

      auditRows,

      auditActorMatched:
        audit?.actorUserId ===
          authenticatedActorId,

      auditBusinessUnitMatched:
        audit?.businessUnitId ===
          businessUnitId,

      passed:
        authenticatedIdentityPass &&
        auditPass
    },

    scopeDenied: {

      error:
        scopeDenied.error ?? null,

      auditRows:
        scopeDeniedAuditRows,

      passed:
        scopeDeniedPass
    },

    permissionDenied: {

      error:
        permissionDenied.error ?? null,

      auditRows:
        permissionDeniedAuditRows,

      passed:
        permissionDeniedPass
    }
  };


  result.pass =
    result.identity
      .sessionUserMatchesSignup &&
    result.identity
      .passed &&
    result.authorizedOperation
      .passed &&
    result.scopeDenied
      .passed &&
    result.permissionDenied
      .passed;


  return result;
}


export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(
        request.url
      );


    if (
      url.pathname !==
        "/probe"
    ) {

      return Response.json({

        harness:
          "RKN_CLOUDFLARE_F8C",

        endpoint:
          "/probe",

        localOnly:
          true,

        clientMayControlActor:
          false
      });
    }


    try {

      const result =
        await runProbe(
          request,
          env
        );


      return Response.json(
        result,
        {
          status:
            result.pass
              ? 200
              : 500
        }
      );

    }
    catch (error) {

      return Response.json(
        {
          harness:
            "RKN_CLOUDFLARE_F8C",

          pass:
            false,

          error:
            error instanceof Error
              ? error.message
              : String(error)
        },
        {
          status: 500
        }
      );
    }
  }
};
