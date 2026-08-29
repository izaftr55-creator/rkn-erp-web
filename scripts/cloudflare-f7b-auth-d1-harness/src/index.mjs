import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { getMigrations } from "better-auth/db/migration";


/*
 * RKN CLOUDFLARE F7B
 *
 * LOCAL-ONLY Better Auth + D1 compatibility harness.
 *
 * IMPORTANT:
 * - no production users
 * - no production passwords
 * - no production sessions
 * - no production auth secret
 * - no RKN SQLite database
 *
 * The credential below is deterministic test data only.
 */


const HARNESS_BASE_URL =
  "http://127.0.0.1:8793";


const LOCAL_TEST_AUTH_SECRET =
  "RKN-F7B-LOCAL-ONLY-AUTH-SECRET-NOT-FOR-PRODUCTION-2026";


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

      /*
       * Production signup remains locked.
       * F7B explicitly enables signup because this is an
       * isolated local test database containing dummy users.
       */
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


function sqlQuoteIdentifier(name) {
  return '"' +
    String(name).replaceAll('"', '""') +
    '"';
}


function cookieHeaderFromResponse(response) {

  let setCookies = [];

  if (
    typeof response.headers.getSetCookie === "function"
  ) {

    setCookies =
      response.headers.getSetCookie();

  }
  else {

    const single =
      response.headers.get("set-cookie");

    if (single) {
      setCookies = [single];
    }
  }


  return setCookies
    .map(cookie =>
      cookie.split(";")[0]
    )
    .filter(Boolean)
    .join("; ");
}


async function inspectSchema(db) {

  const expectedTables = [
    "user",
    "account",
    "session",
    "verification"
  ];


  const tables =
    await db.prepare(`
      SELECT
        name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name
    `).all();


  const tableNames =
    (tables.results || [])
      .map(row => row.name);


  const tablePresence =
    Object.fromEntries(
      expectedTables.map(table => [
        table,
        tableNames.includes(table)
      ])
    );


  const userColumnsResult =
    await db.prepare(`
      PRAGMA table_info("user")
    `).all();


  const userColumns =
    (userColumnsResult.results || [])
      .map(row => row.name);


  return {
    tableNames,
    tablePresence,

    userColumns,

    usernamePresent:
      userColumns.includes("username"),

    displayUsernamePresent:
      userColumns.includes(
        "displayUsername"
      )
  };
}


async function authCounts(db) {

  const tables = [
    "user",
    "account",
    "session",
    "verification"
  ];


  const counts = {};


  for (const table of tables) {

    const result =
      await db.prepare(
        `SELECT COUNT(*) AS n
         FROM ${sqlQuoteIdentifier(table)}`
      ).first();


    counts[table] =
      Number(result?.n ?? 0);
  }


  return counts;
}


async function runProbe(env) {

  const auth =
    createAuth(env);


  /* ========================================================
     1 · PROGRAMMATIC D1 MIGRATION
     ======================================================== */

  const migrationPlan =
    await getMigrations(
      auth.options
    );


  const toBeCreatedBefore =
    Array.isArray(
      migrationPlan.toBeCreated
    )
      ? migrationPlan.toBeCreated.length
      : null;


  const toBeAddedBefore =
    Array.isArray(
      migrationPlan.toBeAdded
    )
      ? migrationPlan.toBeAdded.length
      : null;


  await migrationPlan.runMigrations();


  const schema =
    await inspectSchema(
      env.AUTH_DB
    );


  const schemaPass =
    schema.tablePresence.user &&
    schema.tablePresence.account &&
    schema.tablePresence.session &&
    schema.tablePresence.verification &&
    schema.usernamePresent &&
    schema.displayUsernamePresent;


  /* ========================================================
     2 · DUMMY IDENTITY
     ======================================================== */

  const suffix =
    crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 12);


  const email =
    `f7b-${suffix}@example.invalid`;


  const usernameValue =
    `f7b_${suffix}`;


  const displayUsername =
    `F7B_${suffix}`;


  const password =
    "F7b-Local-Only-Password-12345";


  /* ========================================================
     3 · SIGN UP VIA BETTER AUTH
     ======================================================== */

  const signUp =
    await auth.api.signUpEmail({
      body: {
        name:
          "F7B Local User",

        email,
        password,

        username:
          usernameValue,

        displayUsername
      }
    });


  const signUpUserId =
    String(
      signUp?.user?.id ?? ""
    );


  const signUpPass =
    signUpUserId.length > 0;


  /* ========================================================
     4 · VERIFY USERNAME PLUGIN PERSISTENCE
     ======================================================== */

  const userRow =
    await env.AUTH_DB
      .prepare(`
        SELECT
          id,
          username,
          displayUsername
        FROM "user"
        WHERE id = ?
      `)
      .bind(
        signUpUserId
      )
      .first();


  const usernamePersistencePass =
    Boolean(userRow) &&
    userRow.username ===
      usernameValue.toLowerCase() &&
    userRow.displayUsername ===
      displayUsername;


  /* ========================================================
     5 · SIGN IN BY USERNAME
     ======================================================== */

  const signInResponse =
    await auth.api.signInUsername({
      body: {
        username:
          usernameValue,

        password
      },

      asResponse: true
    });


  const signInHttpPass =
    signInResponse.status >= 200 &&
    signInResponse.status < 300;


  const cookieHeader =
    cookieHeaderFromResponse(
      signInResponse
    );


  const sessionCookiePresent =
    cookieHeader.length > 0;


  /* ========================================================
     6 · GET SESSION WITH RETURNED COOKIE
     ======================================================== */

  const sessionHeaders =
    new Headers();


  if (sessionCookiePresent) {

    sessionHeaders.set(
      "cookie",
      cookieHeader
    );
  }


  const session =
    await auth.api.getSession({
      headers:
        sessionHeaders
    });


  const sessionUserId =
    String(
      session?.user?.id ?? ""
    );


  const sessionPass =
    sessionCookiePresent &&
    sessionUserId ===
      signUpUserId;


  /* ========================================================
     7 · D1 STORAGE COUNTS
     ======================================================== */

  const counts =
    await authCounts(
      env.AUTH_DB
    );


  const databaseWritePass =
    counts.user >= 1 &&
    counts.account >= 1 &&
    counts.session >= 1;


  /* ========================================================
     8 · FINAL RESULT
     ======================================================== */

  const result = {

    harness:
      "RKN_CLOUDFLARE_F7B",

    storage:
      "D1_LOCAL",

    betterAuth:
      "1.6.26",

    config: {
      emailPassword:
        true,

      minPasswordLength:
        10,

      maxPasswordLength:
        128,

      autoSignIn:
        false,

      usernamePlugin:
        true,

      minUsernameLength:
        3,

      maxUsernameLength:
        30,

      useSecureCookies:
        true
    },

    migration: {
      toBeCreatedBefore,
      toBeAddedBefore,
      completed:
        true
    },

    schema: {
      tablePresence:
        schema.tablePresence,

      usernamePresent:
        schema.usernamePresent,

      displayUsernamePresent:
        schema.displayUsernamePresent,

      passed:
        schemaPass
    },

    signup: {
      userCreated:
        signUpPass
    },

    username: {
      persistencePassed:
        usernamePersistencePass
    },

    signIn: {
      httpStatus:
        signInResponse.status,

      responsePassed:
        signInHttpPass,

      sessionCookiePresent
    },

    session: {
      userMatched:
        sessionPass
    },

    counts,

    pass:
      schemaPass &&
      signUpPass &&
      usernamePersistencePass &&
      signInHttpPass &&
      sessionPass &&
      databaseWritePass
  };


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
      url.pathname !== "/probe"
    ) {

      return Response.json({
        harness:
          "RKN_CLOUDFLARE_F7B",

        endpoint:
          "/probe",

        localOnly:
          true,

        productionData:
          false
      });
    }


    try {

      const result =
        await runProbe(env);


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
            "RKN_CLOUDFLARE_F7B",

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
