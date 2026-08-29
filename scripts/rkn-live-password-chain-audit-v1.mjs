import Database from "better-sqlite3";
import { verifyPassword } from "better-auth/crypto";
import fs from "node:fs";
import path from "node:path";

const project = process.cwd();

console.log("");
console.log("==============================================");
console.log(" RKN LIVE PASSWORD CHAIN AUDIT V1");
console.log("==============================================");

/* ============================================
   FIND LATEST V2 CREDENTIAL FILE
   ============================================ */

const credentialDir = path.join(
  project,
  "data",
  "private",
  "auth-recovery"
);

const files = fs
  .readdirSync(credentialDir)
  .filter((name) =>
    name.startsWith("RKN-AUTH-RECOVERY-V2-") &&
    name.endsWith(".txt")
  )
  .map((name) => ({
    name,
    fullPath: path.join(credentialDir, name),
    mtime: fs.statSync(
      path.join(credentialDir, name)
    ).mtimeMs,
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (files.length === 0) {
  throw new Error("NO_V2_CREDENTIAL_FILE");
}

const latest = files[0];

console.log("");
console.log("CREDENTIAL_FILE =", latest.name);

/* ============================================
   EXTRACT FATUR PASSWORD
   DO NOT PRINT IT
   ============================================ */

const text = fs.readFileSync(
  latest.fullPath,
  "utf8"
);

const block = text.match(
  /LUTFIRZA FATURAHMAN[\s\S]*?Username:\s*fatur[\s\S]*?Temporary Password:\s*([^\r\n]+)/i
);

if (!block) {
  throw new Error(
    "FATUR_CREDENTIAL_NOT_FOUND"
  );
}

const password = block[1].trim();

console.log(
  "CREDENTIAL_PASSWORD_LENGTH =",
  password.length
);

/* ============================================
   ACTIVE DATABASE
   ============================================ */

const db = new Database(
  "./data/rkn-erp.sqlite",
  {
    readonly: true,
    fileMustExist: true
  }
);

const user = db.prepare(`
  SELECT id, username, name
  FROM user
  WHERE username = 'fatur'
  LIMIT 1
`).get();

if (!user) {
  throw new Error("FATUR_USER_NOT_FOUND");
}

console.log("");
console.log("ACTIVE_DB_USER_PASS");

const account = db.prepare(`
  SELECT
    providerId,
    password
  FROM account
  WHERE userId = ?
    AND providerId = 'credential'
  LIMIT 1
`).get(user.id);

if (!account?.password) {
  throw new Error(
    "FATUR_CREDENTIAL_HASH_NOT_FOUND"
  );
}

const dbPasswordPass =
  await verifyPassword({
    hash: account.password,
    password,
  });

console.log(
  "ACTIVE_DB_PASSWORD_VERIFY =",
  dbPasswordPass ? "PASS" : "FAIL"
);

db.close();

/* ============================================
   LIVE PRODUCTION ENDPOINT
   ============================================ */

console.log("");
console.log("=== LOCAL PRODUCTION AUTH TEST ===");

let response;

try {

  response = await fetch(
    "http://127.0.0.1:3000/api/auth/sign-in/username",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Origin":
          "https://erp.rkngroup.my.id",
        "Referer":
          "https://erp.rkngroup.my.id/login",
      },

      body: JSON.stringify({
        username: "fatur",
        password,
      }),
    }
  );

  const responseText =
    await response.text();

  console.log(
    "LOCAL_PRODUCTION_HTTP_STATUS =",
    response.status
  );

  console.log(
    "LOCAL_PRODUCTION_LOGIN =",
    response.ok ? "PASS" : "FAIL"
  );

  if (!response.ok) {

    console.log(
      "LOCAL_RESPONSE_PREVIEW =",
      responseText.slice(0, 300)
    );
  }

}
catch (error) {

  console.log(
    "LOCAL_PRODUCTION_REQUEST_FAIL =",
    error.message
  );
}

/* ============================================
   PUBLIC DOMAIN TEST
   ============================================ */

console.log("");
console.log("=== PUBLIC DOMAIN AUTH TEST ===");

try {

  const publicResponse = await fetch(
    "https://erp.rkngroup.my.id/api/auth/sign-in/username",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Origin":
          "https://erp.rkngroup.my.id",
        "Referer":
          "https://erp.rkngroup.my.id/login",
      },

      body: JSON.stringify({
        username: "fatur",
        password,
      }),
    }
  );

  const publicText =
    await publicResponse.text();

  console.log(
    "PUBLIC_HTTP_STATUS =",
    publicResponse.status
  );

  console.log(
    "PUBLIC_LOGIN =",
    publicResponse.ok ? "PASS" : "FAIL"
  );

  if (!publicResponse.ok) {

    console.log(
      "PUBLIC_RESPONSE_PREVIEW =",
      publicText.slice(0, 300)
    );
  }

}
catch (error) {

  console.log(
    "PUBLIC_REQUEST_FAIL =",
    error.message
  );
}

console.log("");
console.log(
  "RKN_LIVE_PASSWORD_CHAIN_AUDIT_V1_PASS"
);
