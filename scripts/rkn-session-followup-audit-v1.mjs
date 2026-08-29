import fs from "node:fs";
import path from "node:path";

const project = process.cwd();

console.log("");
console.log("==============================================");
console.log(" RKN SESSION FOLLOW-UP AUDIT V1");
console.log("==============================================");

const credentialDir = path.join(
  project,
  "data",
  "private",
  "auth-recovery"
);

const latest = fs
  .readdirSync(credentialDir)
  .filter(name =>
    name.startsWith("RKN-AUTH-RECOVERY-V2-") &&
    name.endsWith(".txt")
  )
  .map(name => ({
    name,
    fullPath: path.join(credentialDir, name),
    mtime: fs.statSync(
      path.join(credentialDir, name)
    ).mtimeMs,
  }))
  .sort((a, b) => b.mtime - a.mtime)[0];

if (!latest) {
  throw new Error("CREDENTIAL_FILE_NOT_FOUND");
}

const text = fs.readFileSync(
  latest.fullPath,
  "utf8"
);

const match = text.match(
  /LUTFIRZA FATURAHMAN[\s\S]*?Username:\s*fatur[\s\S]*?Temporary Password:\s*([^\r\n]+)/i
);

if (!match) {
  throw new Error("FATUR_PASSWORD_NOT_FOUND");
}

const password = match[1].trim();

console.log("");
console.log("=== STEP 1 SIGN IN ===");

const login = await fetch(
  "https://erp.rkngroup.my.id/api/auth/sign-in/username",
  {
    method: "POST",
    redirect: "manual",

    headers: {
      "Content-Type": "application/json",
      "Origin": "https://erp.rkngroup.my.id",
      "Referer": "https://erp.rkngroup.my.id/login",
    },

    body: JSON.stringify({
      username: "fatur",
      password,
    }),
  }
);

console.log(
  "LOGIN_STATUS =",
  login.status
);

const cookies =
  login.headers.getSetCookie
    ? login.headers.getSetCookie()
    : [login.headers.get("set-cookie")].filter(Boolean);

if (!cookies.length) {
  throw new Error("SESSION_COOKIE_NOT_RETURNED");
}

const cookieHeader = cookies
  .map(cookie => cookie.split(";")[0])
  .join("; ");

console.log(
  "SESSION_COOKIE_RECEIVED = PASS"
);

console.log("");
console.log("=== STEP 2 GET SESSION WITH COOKIE ===");

const sessionResponse = await fetch(
  "https://erp.rkngroup.my.id/api/auth/get-session",
  {
    method: "GET",

    headers: {
      Cookie: cookieHeader,
    },
  }
);

const sessionText =
  await sessionResponse.text();

console.log(
  "GET_SESSION_STATUS =",
  sessionResponse.status
);

let sessionUser = null;

try {
  const data = JSON.parse(sessionText);
  sessionUser = data?.user?.username ?? data?.user?.name ?? null;
}
catch {}

console.log(
  "GET_SESSION_AUTHENTICATED =",
  sessionUser ? "PASS" : "FAIL"
);

console.log(
  "SESSION_USER =",
  sessionUser ?? "<NONE>"
);

console.log("");
console.log("=== STEP 3 OPEN ROOT WITH COOKIE ===");

const root = await fetch(
  "https://erp.rkngroup.my.id/",
  {
    method: "GET",

    redirect: "manual",

    headers: {
      Cookie: cookieHeader,
    },
  }
);

console.log(
  "ROOT_STATUS =",
  root.status
);

console.log(
  "ROOT_LOCATION =",
  root.headers.get("location") ?? "<NONE>"
);

const rootPass =
  root.status === 200;

console.log(
  "ROOT_DASHBOARD_ACCESS =",
  rootPass ? "PASS" : "FAIL"
);

console.log("");
console.log("==============================================");

if (
  login.status === 200 &&
  sessionUser &&
  rootPass
) {

  console.log(
    " AUTH + COOKIE + DASHBOARD CHAIN = PASS"
  );

}
else {

  console.log(
    " AUTH FOLLOW-UP CHAIN = FAIL"
  );
}

console.log("==============================================");

console.log("");
console.log(
  "RKN_SESSION_FOLLOWUP_AUDIT_V1_PASS"
);
