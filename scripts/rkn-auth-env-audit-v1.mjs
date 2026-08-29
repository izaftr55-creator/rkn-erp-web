import crypto from "node:crypto";

function fp(value) {
  if (!value) return null;

  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex")
    .slice(0, 12);
}

const secret =
  process.env.BETTER_AUTH_SECRET ?? "";

const url =
  process.env.BETTER_AUTH_URL ?? "";

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
