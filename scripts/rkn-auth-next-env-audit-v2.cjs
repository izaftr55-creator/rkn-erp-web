const crypto = require("node:crypto");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd(), false);

function fp(value) {
  if (!value) return null;

  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex")
    .slice(0, 12);
}

const secret =
  process.env.BETTER_AUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "";

const url =
  process.env.BETTER_AUTH_URL || "";

console.log("");
console.log("==============================================");
console.log(" RKN AUTH NEXT ENV AUDIT V2");
console.log("==============================================");

console.log(
  "BETTER_AUTH_SECRET_PRESENT =",
  secret.length > 0
);

console.log(
  "BETTER_AUTH_SECRET_LENGTH =",
  secret.length
);

console.log(
  "BETTER_AUTH_SECRET_FINGERPRINT =",
  fp(secret)
);

console.log(
  "BETTER_AUTH_URL =",
  url || "<NOT_SET>"
);

console.log("");
console.log("RKN_AUTH_NEXT_ENV_AUDIT_V2_PASS");
