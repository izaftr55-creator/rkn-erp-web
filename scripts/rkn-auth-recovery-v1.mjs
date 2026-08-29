import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import {
  hashPassword,
  verifyPassword,
} from "better-auth/crypto";

import {
  randomBytes,
} from "node:crypto";

import fs from "node:fs";
import path from "node:path";


/* =========================================================
   ENV LOADER
   ========================================================= */

const project = process.cwd();
const envPath = path.join(project, ".env.local");

if (fs.existsSync(envPath)) {

  const lines = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/);

  for (const line of lines) {

    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      !trimmed.includes("=")
    ) {
      continue;
    }

    const index = trimmed.indexOf("=");

    const key =
      trimmed.slice(0, index).trim();

    let value =
      trimmed.slice(index + 1).trim();

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


/* =========================================================
   DATABASE
   ========================================================= */

const dbPath =
  path.join(
    project,
    "data",
    "rkn-erp.sqlite"
  );

const db =
  new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 10000");


/* =========================================================
   BACKUP
   ========================================================= */

const stamp =
  new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");

const backupPath =
  path.join(
    project,
    "data",
    `rkn-erp.before-auth-recovery-${stamp}.sqlite`
  );

console.log("");
console.log(
  "=============================================="
);
console.log(
  " RKN AUTH RECOVERY V1"
);
console.log(
  "=============================================="
);

await db.backup(backupPath);

console.log(
  "DATABASE_BACKUP_PASS"
);

console.log(
  "BACKUP =",
  backupPath
);


/* =========================================================
   BETTER AUTH INSTANCE
   ========================================================= */

const auth =
  betterAuth({

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


/* =========================================================
   PEOPLE
   ========================================================= */

const people = [

  {
    username: "fatur",
    name: "LUTFIRZA FATURAHMAN",
    email: "fatur@rkn.invalid",
    identity: "ADM-0001",
    existing: true,
  },

  {
    username: "disa",
    name: "DISA ADITYA KIRANA",
    email: "disa@rkn.invalid",
    identity: "MGR-0001",
    existing: true,
  },

  {
    username: "koko",
    name: "KOKO INDRIYANTO",
    email: "koko@rkn.invalid",
    identity: "GOW-0001",
    existing: true,
  },

  {
    username: "mumuh",
    name: "MUMUH MUHTAR",
    email: "mumuh@rkn.invalid",
    identity: "SOW-0001",
    existing: true,
  },

  {
    username: "risma",
    name: "RISMA SRI WAHYUNI",
    email: "risma@rkn.invalid",
    identity: "GOW-0002",
    existing: false,
  },

];


/* =========================================================
   HELPERS
   ========================================================= */

function temporaryPassword() {

  return (
    "RKN!" +
    randomBytes(15)
      .toString("base64url")
  );
}


const findUser =
  db.prepare(`
    SELECT
      id,
      name,
      username,
      email
    FROM user
    WHERE username = ?
       OR email = ?
    LIMIT 1
  `);


function getUser(username, email) {

  return findUser.get(
    username,
    email
  );
}


const credentials = [];


/* =========================================================
   STEP 1
   RESET EXISTING USERS
   ========================================================= */

console.log("");
console.log(
  "=== RESET EXISTING CREDENTIALS ==="
);

for (const person of people.filter(
  (item) => item.existing
)) {

  const user =
    getUser(
      person.username,
      person.email
    );

  if (!user) {

    throw new Error(
      `EXISTING_USER_NOT_FOUND: ${person.username}`
    );
  }


  const password =
    temporaryPassword();

  const passwordHash =
    await hashPassword(password);


  const account =
    db.prepare(`
      SELECT
        id,
        password
      FROM account
      WHERE userId = ?
        AND providerId = 'credential'
      LIMIT 1
    `).get(user.id);


  if (!account) {

    throw new Error(
      `CREDENTIAL_ACCOUNT_NOT_FOUND: ${person.username}`
    );
  }


  db.prepare(`
    UPDATE account
    SET password = ?
    WHERE id = ?
  `).run(
    passwordHash,
    account.id
  );


  db.prepare(`
    UPDATE user
    SET
      name = ?,
      displayUsername = ?
    WHERE id = ?
  `).run(
    person.name,
    person.username,
    user.id
  );


  /*
   * Jangan paksa flag change-password existing.
   * Fatur/Disa tetap seperti status sekarang.
   * Koko/Mumuh tetap mengikuti flag existing.
   */

  const valid =
    await verifyPassword({
      hash: passwordHash,
      password,
    });


  if (!valid) {

    throw new Error(
      `PASSWORD_HASH_VERIFY_FAILED: ${person.username}`
    );
  }


  credentials.push({
    username: person.username,
    name: person.name,
    password,
  });


  console.log(
    `PASSWORD_RESET_PASS = ${person.username}`
  );
}


/* =========================================================
   STEP 2
   CREATE / RECOVER RISMA
   ========================================================= */

console.log("");
console.log(
  "=== OWNER-02 RISMA ==="
);

let risma =
  getUser(
    "risma",
    "risma@rkn.invalid"
  );

let rismaPassword =
  temporaryPassword();


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
    getUser(
      "risma",
      "risma@rkn.invalid"
    );


  if (!risma) {

    throw new Error(
      "RISMA_USER_CREATE_FAILED"
    );
  }


  console.log(
    "RISMA_USER_CREATE_PASS"
  );

}
else {

  const hash =
    await hashPassword(
      rismaPassword
    );

  const account =
    db.prepare(`
      SELECT id
      FROM account
      WHERE userId = ?
        AND providerId = 'credential'
      LIMIT 1
    `).get(risma.id);


  if (!account) {

    throw new Error(
      "RISMA_CREDENTIAL_ACCOUNT_MISSING"
    );
  }


  db.prepare(`
    UPDATE account
    SET password = ?
    WHERE id = ?
  `).run(
    hash,
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
    displayUsername = 'risma'
  WHERE id = ?
`).run(
  risma.id
);


/* =========================================================
   STEP 3
   RISMA ERP PROFILE
   CLONE OWNER-01 PROFILE STRUCTURE
   ========================================================= */

const koko =
  getUser(
    "koko",
    "koko@rkn.invalid"
  );

if (!koko) {

  throw new Error(
    "KOKO_OWNER_TEMPLATE_NOT_FOUND"
  );
}


const existingRismaProfile =
  db.prepare(`
    SELECT *
    FROM erp_user_profile
    WHERE user_id = ?
    LIMIT 1
  `).get(
    risma.id
  );


if (!existingRismaProfile) {

  const kokoProfile =
    db.prepare(`
      SELECT *
      FROM erp_user_profile
      WHERE user_id = ?
      LIMIT 1
    `).get(
      koko.id
    );


  if (!kokoProfile) {

    throw new Error(
      "KOKO_PROFILE_TEMPLATE_NOT_FOUND"
    );
  }


  const columns =
    db.prepare(`
      PRAGMA table_info(erp_user_profile)
    `).all();


  const cloned = {
    ...kokoProfile,
  };


  if ("user_id" in cloned) {
    cloned.user_id = risma.id;
  }

  if ("identity_code" in cloned) {
    cloned.identity_code = "GOW-0002";
  }

  if ("employee_id" in cloned) {
    cloned.employee_id = "GOW-0002";
  }

  if ("display_name" in cloned) {
    cloned.display_name =
      "RISMA SRI WAHYUNI";
  }

  if ("active" in cloned) {
    cloned.active = 1;
  }

  if ("must_change_password" in cloned) {
    cloned.must_change_password = 1;
  }


  /*
   * Jangan clone PK autoincrement.
   */

  for (const column of columns) {

    if (
      column.pk === 1 &&
      column.name !== "user_id"
    ) {
      delete cloned[column.name];
    }
  }


  const names =
    Object.keys(cloned);


  const placeholders =
    names
      .map(() => "?")
      .join(", ");


  const sql = `
    INSERT INTO erp_user_profile (
      ${names.join(", ")}
    )
    VALUES (
      ${placeholders}
    )
  `;


  db.prepare(sql).run(
    ...names.map(
      (name) => cloned[name]
    )
  );


  console.log(
    "RISMA_PROFILE_CREATE_PASS"
  );

}
else {

  db.prepare(`
    UPDATE erp_user_profile
    SET
      identity_code = 'GOW-0002',
      active = 1,
      must_change_password = 1
    WHERE user_id = ?
  `).run(
    risma.id
  );


  console.log(
    "RISMA_PROFILE_UPDATE_PASS"
  );
}


/* =========================================================
   STEP 4
   RISMA GROUP OWNER ROLE
   ========================================================= */

const groupOwnerRole =
  db.prepare(`
    SELECT id
    FROM role
    WHERE code = 'GROUP_OWNER'
    LIMIT 1
  `).get();


if (!groupOwnerRole) {

  throw new Error(
    "GROUP_OWNER_ROLE_NOT_FOUND"
  );
}


const existingGroupOwner =
  db.prepare(`
    SELECT 1
    FROM user_role
    WHERE user_id = ?
      AND role_id = ?
    LIMIT 1
  `).get(
    risma.id,
    groupOwnerRole.id
  );


if (!existingGroupOwner) {

  /*
   * GROUP_OWNER Koko adalah role global,
   * business_unit_id = NULL.
   */

  db.prepare(`
    INSERT INTO user_role (
      user_id,
      role_id,
      business_unit_id
    )
    VALUES (?, ?, NULL)
  `).run(
    risma.id,
    groupOwnerRole.id
  );


  console.log(
    "RISMA_GROUP_OWNER_ROLE_PASS"
  );

}
else {

  console.log(
    "RISMA_GROUP_OWNER_ROLE_ALREADY_PRESENT"
  );
}


/* =========================================================
   STEP 5
   SAVE RISMA PASSWORD
   ========================================================= */

credentials.push({

  username:
    "risma",

  name:
    "RISMA SRI WAHYUNI",

  password:
    rismaPassword,

});


/* =========================================================
   STEP 6
   DIRECT BETTER AUTH LOGIN TEST
   ========================================================= */

console.log("");
console.log(
  "=== BETTER AUTH LOGIN TEST ==="
);


for (const item of credentials) {

  try {

    const result =
      await auth.api.signInUsername({

        body: {

          username:
            item.username,

          password:
            item.password,

        },
      });


    if (!result) {

      throw new Error(
        "EMPTY_AUTH_RESPONSE"
      );
    }


    console.log(
      `LOGIN_TEST_PASS = ${item.username}`
    );

  }
  catch (error) {

    console.error(
      `LOGIN_TEST_FAIL = ${item.username}`
    );

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    throw error;
  }
}


/* =========================================================
   STEP 7
   REMOVE TEST SESSIONS
   ========================================================= */

const userIds =
  credentials
    .map((item) =>
      getUser(
        item.username,
        `${item.username}@rkn.invalid`
      )?.id
    )
    .filter(Boolean);


for (const userId of userIds) {

  db.prepare(`
    DELETE FROM session
    WHERE userId = ?
  `).run(
    userId
  );
}


console.log(
  "TEST_SESSIONS_CLEAN_PASS"
);


/* =========================================================
   STEP 8
   CREDENTIAL FILE
   ========================================================= */

const privateDir =
  path.join(
    project,
    "data",
    "private",
    "auth-recovery"
  );


fs.mkdirSync(
  privateDir,
  {
    recursive: true,
  }
);


const credentialPath =
  path.join(
    privateDir,
    `RKN-AUTH-RECOVERY-${stamp}.txt`
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


console.log("");
console.log(
  "CREDENTIAL_FILE_PASS"
);

console.log(
  "CREDENTIAL_FILE =",
  credentialPath
);


/* =========================================================
   STEP 9
   FINAL USER AUDIT
   ========================================================= */

console.log("");
console.log(
  "=== FINAL USERS ==="
);


const finalUsers =
  db.prepare(`
    SELECT
      u.username,
      u.name,
      p.identity_code,
      p.active,
      p.must_change_password
    FROM user u
    LEFT JOIN erp_user_profile p
      ON p.user_id = u.id
    WHERE u.username IN (
      'fatur',
      'disa',
      'koko',
      'mumuh',
      'risma'
    )
    ORDER BY u.username
  `).all();


console.table(
  finalUsers
);


console.log("");
console.log(
  "=== FINAL ROLES ==="
);


const finalRoles =
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
  `).all();


console.table(
  finalRoles
);


db.close();


console.log("");
console.log(
  "=============================================="
);
console.log(
  " RKN_AUTH_RECOVERY_V1_PASS"
);
console.log(
  " ALL_LOCAL_LOGIN_TESTS_PASS"
);
console.log(
  " OWNER_02_RISMA_READY"
);
console.log(
  "=============================================="
);

