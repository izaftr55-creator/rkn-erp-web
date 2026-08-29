import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";

import {
  hashPassword,
  verifyPassword,
} from "better-auth/crypto";

import { randomBytes, randomUUID } from "node:crypto";

import fs from "node:fs";
import path from "node:path";


/* =========================================================
   RKN AUTH RECOVERY V2
   ========================================================= */

const project = process.cwd();

const dbPath = path.join(
  project,
  "data",
  "rkn-erp.sqlite"
);

const walPath = dbPath + "-wal";
const shmPath = dbPath + "-shm";

const stamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");

const backupPath = path.join(
  project,
  "data",
  `rkn-erp.before-auth-recovery-v2-${stamp}.sqlite`
);

let db = null;


/* =========================================================
   ENV
   ========================================================= */

function loadEnvLocal() {

  const envPath = path.join(
    project,
    ".env.local"
  );

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/);

  for (const raw of lines) {

    const line = raw.trim();

    if (
      !line ||
      line.startsWith("#") ||
      !line.includes("=")
    ) {
      continue;
    }

    const index = line.indexOf("=");

    const key =
      line.slice(0, index).trim();

    let value =
      line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}


loadEnvLocal();


/* =========================================================
   HELPERS
   ========================================================= */

function makePassword() {

  return (
    "RKN!" +
    randomBytes(18)
      .toString("base64url")
  );
}


function cleanSidecars() {

  for (const file of [
    walPath,
    shmPath,
  ]) {

    try {

      if (fs.existsSync(file)) {
        fs.rmSync(file, {
          force: true
        });
      }

    }
    catch {}
  }
}


async function rollback(error) {

  console.error("");
  console.error(
    "=============================================="
  );

  console.error(
    " RKN AUTH RECOVERY V2 FAILED"
  );

  console.error(
    "=============================================="
  );

  console.error(
    error instanceof Error
      ? error.stack || error.message
      : error
  );

  try {

    if (db) {
      db.close();
      db = null;
    }

  }
  catch {}


  cleanSidecars();


  if (fs.existsSync(backupPath)) {

    fs.copyFileSync(
      backupPath,
      dbPath
    );

    cleanSidecars();

    console.error("");
    console.error(
      "DATABASE_ROLLBACK_PASS"
    );

  }
  else {

    console.error(
      "DATABASE_ROLLBACK_BACKUP_NOT_FOUND"
    );
  }


  process.exitCode = 1;
}


/* =========================================================
   MAIN
   ========================================================= */

try {

  console.log("");
  console.log(
    "=============================================="
  );

  console.log(
    " RKN AUTH RECOVERY V2"
  );

  console.log(
    "=============================================="
  );


  cleanSidecars();


  db = new Database(dbPath);

  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 10000");


  console.log("");
  console.log(
    "=== PRECHECK ==="
  );


  const integrity =
    db.pragma(
      "integrity_check",
      {
        simple: true
      }
    );


  if (integrity !== "ok") {

    throw new Error(
      `SQLITE_INTEGRITY_FAIL: ${integrity}`
    );
  }


  console.log(
    "SQLITE_INTEGRITY_PASS"
  );


  await db.backup(
    backupPath
  );


  console.log(
    "DATABASE_BACKUP_PASS"
  );

  console.log(
    "BACKUP =",
    backupPath
  );


  /* =======================================================
     BETTER AUTH
     ======================================================= */

  const auth = betterAuth({

    database: db,

    secret:
      process.env.BETTER_AUTH_SECRET,

    baseURL:
      process.env.BETTER_AUTH_URL,

    emailAndPassword: {

      enabled: true,

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


  /* =======================================================
     USERS
     ======================================================= */

  const existingPeople = [

    {
      username: "fatur",
      email: "fatur@rkn.invalid",
      name: "LUTFIRZA FATURAHMAN",
    },

    {
      username: "disa",
      email: "disa@rkn.invalid",
      name: "DISA ADITYA KIRANA",
    },

    {
      username: "koko",
      email: "koko@rkn.invalid",
      name: "KOKO INDRIYANTO",
    },

    {
      username: "mumuh",
      email: "mumuh@rkn.invalid",
      name: "MUMUH MUHTAR",
    },

  ];


  const findUser = db.prepare(`
    SELECT
      id,
      username,
      name,
      email
    FROM user
    WHERE username = ?
       OR email = ?
    LIMIT 1
  `);


  const findCredential =
    db.prepare(`
      SELECT
        id,
        password
      FROM account
      WHERE userId = ?
        AND providerId = 'credential'
      LIMIT 1
    `);


  const credentials = [];


  console.log("");
  console.log(
    "=== RESET EXISTING USERS ==="
  );


  for (const person of existingPeople) {

    const user = findUser.get(
      person.username,
      person.email
    );


    if (!user) {

      throw new Error(
        `USER_NOT_FOUND: ${person.username}`
      );
    }


    const account =
      findCredential.get(
        user.id
      );


    if (!account) {

      throw new Error(
        `CREDENTIAL_NOT_FOUND: ${person.username}`
      );
    }


    const password =
      makePassword();


    const hash =
      await hashPassword(
        password
      );


    const verified =
      await verifyPassword({

        hash,

        password,

      });


    if (!verified) {

      throw new Error(
        `HASH_VERIFY_FAIL: ${person.username}`
      );
    }


    db.prepare(`
      UPDATE account
      SET
        password = ?,
        updatedAt = ?
      WHERE id = ?
    `).run(
      hash,
      new Date().toISOString(),
      account.id
    );


    db.prepare(`
      UPDATE user
      SET
        name = ?,
        displayUsername = ?,
        updatedAt = ?
      WHERE id = ?
    `).run(
      person.name,
      person.username,
      new Date().toISOString(),
      user.id
    );


    credentials.push({

      username:
        person.username,

      name:
        person.name,

      password,

    });


    console.log(
      `PASSWORD_RESET_PASS = ${person.username}`
    );
  }


  /* =======================================================
     RISMA USER
     ======================================================= */

  console.log("");
  console.log(
    "=== OWNER-02 RISMA ==="
  );


  const rismaPassword =
    makePassword();


  let risma =
    findUser.get(
      "risma",
      "risma@rkn.invalid"
    );


  if (!risma) {

    await auth.api.signUpEmail({

      body: {

        name:
          "RISMA SRI WAHYUNI",

        email:
          "risma@rkn.invalid",

        password:
          rismaPassword,

        username:
          "risma",

        displayUsername:
          "risma",

      },
    });


    risma =
      findUser.get(
        "risma",
        "risma@rkn.invalid"
      );


    if (!risma) {

      throw new Error(
        "RISMA_CREATE_FAILED"
      );
    }


    console.log(
      "RISMA_USER_CREATE_PASS"
    );

  }
  else {

    const account =
      findCredential.get(
        risma.id
      );


    if (!account) {

      throw new Error(
        "RISMA_CREDENTIAL_NOT_FOUND"
      );
    }


    const hash =
      await hashPassword(
        rismaPassword
      );


    db.prepare(`
      UPDATE account
      SET
        password = ?,
        updatedAt = ?
      WHERE id = ?
    `).run(
      hash,
      new Date().toISOString(),
      account.id
    );


    console.log(
      "RISMA_PASSWORD_RESET_PASS"
    );
  }


  db.prepare(`
    UPDATE user
    SET
      name = 'RISMA SRI WAHYUNI',
      username = 'risma',
      displayUsername = 'risma',
      updatedAt = ?
    WHERE id = ?
  `).run(
    new Date().toISOString(),
    risma.id
  );


  /* =======================================================
     RISMA PROFILE
     ======================================================= */

  const currentRismaProfile =
    db.prepare(`
      SELECT
        user_id,
        person_key,
        identity_code
      FROM erp_user_profile
      WHERE user_id = ?
      LIMIT 1
    `).get(
      risma.id
    );


  if (!currentRismaProfile) {

    db.prepare(`
      INSERT INTO erp_user_profile (
        user_id,
        person_key,
        full_name,
        active,
        must_change_password,
        identity_code,
        primary_role_code
      )
      VALUES (
        ?,
        'RISMA',
        'RISMA SRI WAHYUNI',
        1,
        1,
        'GOW-0002',
        'GROUP_OWNER'
      )
    `).run(
      risma.id
    );


    console.log(
      "RISMA_PROFILE_CREATE_PASS"
    );

  }
  else {

    db.prepare(`
      UPDATE erp_user_profile
      SET
        person_key = 'RISMA',
        full_name = 'RISMA SRI WAHYUNI',
        active = 1,
        must_change_password = 1,
        identity_code = 'GOW-0002',
        primary_role_code = 'GROUP_OWNER',
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      risma.id
    );


    console.log(
      "RISMA_PROFILE_UPDATE_PASS"
    );
  }


  /* =======================================================
     VERIFY UNIQUE PROFILE VALUES
     ======================================================= */

  const personCollision =
    db.prepare(`
      SELECT COUNT(*) AS total
      FROM erp_user_profile
      WHERE person_key = 'RISMA'
    `).get();


  const identityCollision =
    db.prepare(`
      SELECT COUNT(*) AS total
      FROM erp_user_profile
      WHERE identity_code = 'GOW-0002'
    `).get();


  if (
    personCollision.total !== 1
  ) {

    throw new Error(
      "RISMA_PERSON_KEY_VERIFY_FAIL"
    );
  }


  if (
    identityCollision.total !== 1
  ) {

    throw new Error(
      "RISMA_IDENTITY_VERIFY_FAIL"
    );
  }


  console.log(
    "RISMA_UNIQUE_PROFILE_VERIFY_PASS"
  );


  /* =======================================================
     RISMA ROLE
     ======================================================= */

  const groupOwnerRole =
    db.prepare(`
      SELECT
        id,
        code
      FROM role
      WHERE code = 'GROUP_OWNER'
      LIMIT 1
    `).get();


  if (!groupOwnerRole) {

    throw new Error(
      "GROUP_OWNER_ROLE_NOT_FOUND"
    );
  }


  const existingRismaRole =
    db.prepare(`
      SELECT 1
      FROM user_role
      WHERE user_id = ?
        AND role_id = ?
        AND business_unit_id IS NULL
      LIMIT 1
    `).get(
      risma.id,
      groupOwnerRole.id
    );


  if (!existingRismaRole) {

    db.prepare(`
      INSERT INTO user_role (
        id,
        user_id,
        role_id,
        business_unit_id
      )
      VALUES (
        ?,
        ?,
        ?,
        NULL
      )
    `).run(
      randomUUID(),
      risma.id,
      groupOwnerRole.id
    );


    console.log(
      "RISMA_GROUP_OWNER_ROLE_CREATE_PASS"
    );

  }
  else {

    console.log(
      "RISMA_GROUP_OWNER_ROLE_ALREADY_PRESENT"
    );
  }


  credentials.push({

    username:
      "risma",

    name:
      "RISMA SRI WAHYUNI",

    password:
      rismaPassword,

  });


  /* =======================================================
     HASH VERIFY FROM DATABASE
     ======================================================= */

  console.log("");
  console.log(
    "=== DATABASE PASSWORD VERIFY ==="
  );


  for (const item of credentials) {

    const user =
      findUser.get(
        item.username,
        `${item.username}@rkn.invalid`
      );


    if (!user) {

      throw new Error(
        `VERIFY_USER_NOT_FOUND: ${item.username}`
      );
    }


    const account =
      findCredential.get(
        user.id
      );


    if (
      !account ||
      !account.password
    ) {

      throw new Error(
        `VERIFY_ACCOUNT_FAIL: ${item.username}`
      );
    }


    const valid =
      await verifyPassword({

        hash:
          account.password,

        password:
          item.password,

      });


    if (!valid) {

      throw new Error(
        `DATABASE_PASSWORD_VERIFY_FAIL: ${item.username}`
      );
    }


    console.log(
      `DATABASE_PASSWORD_VERIFY_PASS = ${item.username}`
    );
  }


  /* =======================================================
     BETTER AUTH LOGIN TEST
     ======================================================= */

  console.log("");
  console.log(
    "=== BETTER AUTH USERNAME LOGIN TEST ==="
  );


  for (const item of credentials) {

    try {

      const response =
        await auth.api.signInUsername({

          body: {

            username:
              item.username,

            password:
              item.password,

          },
        });


      if (!response) {

        throw new Error(
          "EMPTY_SIGN_IN_RESPONSE"
        );
      }


      console.log(
        `LOGIN_TEST_PASS = ${item.username}`
      );

    }
    catch (error) {

      throw new Error(
        `LOGIN_TEST_FAIL_${item.username}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }


  /* =======================================================
     DELETE TEST SESSIONS
     ======================================================= */

  for (const item of credentials) {

    const user =
      findUser.get(
        item.username,
        `${item.username}@rkn.invalid`
      );


    if (user) {

      db.prepare(`
        DELETE FROM session
        WHERE userId = ?
      `).run(
        user.id
      );
    }
  }


  console.log(
    "TEST_SESSIONS_CLEAN_PASS"
  );


  /* =======================================================
     CREDENTIAL FILE
     ======================================================= */

  const credentialDir =
    path.join(
      project,
      "data",
      "private",
      "auth-recovery"
    );


  fs.mkdirSync(
    credentialDir,
    {
      recursive: true
    }
  );


  const credentialPath =
    path.join(
      credentialDir,
      `RKN-AUTH-RECOVERY-V2-${stamp}.txt`
    );


  const credentialText =
    credentials
      .flatMap(
        (item) => [

          item.name,

          `Username: ${item.username}`,

          `Temporary Password: ${item.password}`,

          "",

        ]
      )
      .join("\r\n");


  fs.writeFileSync(
    credentialPath,
    credentialText,
    "utf8"
  );


  console.log(
    "CREDENTIAL_FILE_PASS"
  );

  console.log(
    "CREDENTIAL_FILE =",
    credentialPath
  );


  /* =======================================================
     FINAL AUDIT
     ======================================================= */

  console.log("");
  console.log(
    "=== FINAL USERS ==="
  );


  console.table(

    db.prepare(`
      SELECT
        u.username,
        u.name,
        p.person_key,
        p.identity_code,
        p.primary_role_code,
        p.active,
        p.must_change_password
      FROM user u
      JOIN erp_user_profile p
        ON p.user_id = u.id
      WHERE u.username IN (
        'fatur',
        'disa',
        'koko',
        'mumuh',
        'risma'
      )
      ORDER BY u.username
    `).all()

  );


  console.log("");
  console.log(
    "=== FINAL ROLES ==="
  );


  console.table(

    db.prepare(`
      SELECT
        u.username,
        r.code AS role_code,
        ur.business_unit_id
      FROM user u
      JOIN user_role ur
        ON ur.user_id = u.id
      JOIN role r
        ON r.id = ur.role_id
      WHERE u.username IN (
        'fatur',
        'disa',
        'koko',
        'mumuh',
        'risma'
      )
      ORDER BY
        u.username,
        r.code
    `).all()

  );


  const finalIntegrity =
    db.pragma(
      "integrity_check",
      {
        simple: true
      }
    );


  if (
    finalIntegrity !== "ok"
  ) {

    throw new Error(
      `FINAL_SQLITE_INTEGRITY_FAIL: ${finalIntegrity}`
    );
  }


  console.log(
    "FINAL_SQLITE_INTEGRITY_PASS"
  );


  db.close();
  db = null;


  console.log("");
  console.log(
    "=============================================="
  );

  console.log(
    " RKN_AUTH_RECOVERY_V2_PASS"
  );

  console.log(
    " ALL_5_LOGIN_TESTS_PASS"
  );

  console.log(
    " OWNER_02_RISMA_READY"
  );

  console.log(
    "=============================================="
  );

}
catch (error) {

  await rollback(error);
}


