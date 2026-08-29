import fs from "node:fs";
import path from "node:path";

const project = process.cwd();

console.log("");
console.log("==============================================");
console.log(" RKN LIVE SESSION COOKIE AUDIT V1");
console.log("==============================================");

/* -------------------------------------------
   LOAD LATEST FATUR PASSWORD
------------------------------------------- */

const credentialDir = path.join(
  project,
  "data",
  "private",
  "auth-recovery"
);

const credentialFiles = fs
  .readdirSync(credentialDir)
  .filter((name) =>
    name.startsWith("RKN-AUTH-RECOVERY-V2-") &&
    name.endsWith(".txt")
  )
  .map((name) => ({
    name,
    path: path.join(credentialDir, name),
    mtime: fs.statSync(
      path.join(credentialDir, name)
    ).mtimeMs,
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (!credentialFiles.length) {
  throw new Error("NO_CREDENTIAL_FILE");
}

const credentialText = fs.readFileSync(
  credentialFiles[0].path,
  "utf8"
);

const match = credentialText.match(
  /LUTFIRZA FATURAHMAN[\s\S]*?Username:\s*fatur[\s\S]*?Temporary Password:\s*([^\r\n]+)/i
);

if (!match) {
  throw new Error("FATUR_PASSWORD_NOT_FOUND");
}

const password = match[1].trim();

/* -------------------------------------------
   PUBLIC SIGN-IN
------------------------------------------- */

const loginResponse = await fetch(
  "https://erp.rkngroup.my.id/api/auth/sign-in/username",
  {
    method: "POST",
    redirect: "manual",

    headers: {
      "Content-Type": "application/json",
      "Origin": "https://erp.rkngroup.my.id",
      "Referer": "https://erp.rkngroup.my.id/login",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    },

    body: JSON.stringify({
      username: "fatur",
      password,
    }),
  }
);

console.log("");
console.log("LOGIN_STATUS =", loginResponse.status);

const setCookies =
  loginResponse.headers.getSetCookie
    ? loginResponse.headers.getSetCookie()
    : [loginResponse.headers.get("set-cookie")].filter(Boolean);

console.log("");
console.log("=== SET-COOKIE ===");

for (const cookie of setCookies) {

  const safe = cookie.replace(
    /=([^;]+)/,
    "=<REDACTED>"
  );

  console.log(safe);
}

console.log("");
console.log("COOKIE_COUNT =", setCookies.length);

for (const cookie of setCookies) {

  const lower = cookie.toLowerCase();

  if (
    lower.includes("session_token") ||
    lower.includes("better-auth")
  ) {

    console.log("");
    console.log("=== SESSION COOKIE ATTRIBUTES ===");

    console.log(
      "SECURE =",
      lower.includes("; secure")
    );

    console.log(
      "HTTPONLY =",
      lower.includes("; httponly")
    );

    console.log(
      "SAMESITE_LAX =",
      lower.includes("samesite=lax")
    );

    console.log(
      "SAMESITE_NONE =",
      lower.includes("samesite=none")
    );

    const domain =
      cookie.match(/domain=([^;]+)/i);

    console.log(
      "DOMAIN =",
      domain ? domain[1] : "<HOST-ONLY>"
    );
  }
}

console.log("");
console.log("RKN_LIVE_SESSION_COOKIE_AUDIT_V1_PASS");
