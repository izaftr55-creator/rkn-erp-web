const fs = require("node:fs");

const file = process.argv[2];
let src = fs.readFileSync(file, "utf8");

if (/useSecureCookies\s*:/.test(src)) {
  src = src.replace(
    /useSecureCookies\s*:\s*(true|false)/,
    "useSecureCookies: true"
  );

  console.log("USE_SECURE_COOKIES_UPDATED_PASS");
}
else if (/advanced\s*:\s*\{/.test(src)) {
  src = src.replace(
    /advanced\s*:\s*\{/,
    `advanced: {
    useSecureCookies: true,`
  );

  console.log("USE_SECURE_COOKIES_INSERTED_IN_ADVANCED_PASS");
}
else {
  const marker = "betterAuth({";

  if (!src.includes(marker)) {
    throw new Error("BETTER_AUTH_CONFIG_NOT_FOUND");
  }

  src = src.replace(
    marker,
    `betterAuth({
  /*
   * RKN_MOBILE_SECURE_SESSION_V1
   * Force one canonical HTTPS session-cookie namespace.
   */
  advanced: {
    useSecureCookies: true,
  },`
  );

  console.log("ADVANCED_SECURE_COOKIE_CONFIG_CREATED_PASS");
}

fs.writeFileSync(file, src, "utf8");
console.log("AUTH_SOURCE_WRITE_PASS");
