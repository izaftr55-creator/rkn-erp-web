import fs from "node:fs";
import path from "node:path";

console.log("");
console.log("==============================================");
console.log(" RKN BETTER AUTH PASSWORD API AUDIT V2");
console.log("==============================================");

console.log("");
console.log("=== PACKAGE VERSION ===");

try {
  const pkgPath = path.join(
    process.cwd(),
    "node_modules",
    "better-auth",
    "package.json"
  );

  const pkg = JSON.parse(
    fs.readFileSync(pkgPath, "utf8")
  );

  console.log("BETTER_AUTH_VERSION =", pkg.version);
} catch (error) {
  console.log("PACKAGE_VERSION_FAIL =", error.message);
}

console.log("");
console.log("=== MAIN EXPORTS ===");

try {
  const pkg = await import("better-auth");

  console.log(
    Object.keys(pkg)
      .filter((key) =>
        /password|hash|auth/i.test(key)
      )
      .sort()
  );
} catch (error) {
  console.log("MAIN_EXPORT_FAIL =", error.message);
}

console.log("");
console.log("=== CRYPTO EXPORTS ===");

try {
  const crypto = await import("better-auth/crypto");

  console.log(
    Object.keys(crypto).sort()
  );
} catch (error) {
  console.log(
    "BETTER_AUTH_CRYPTO_NOT_EXPORTED"
  );
  console.log(error.message);
}

console.log("");
console.log("=== PLUGIN EXPORTS ===");

try {
  const plugins = await import(
    "better-auth/plugins"
  );

  console.log(
    "ADMIN_PLUGIN_AVAILABLE =",
    typeof plugins.admin === "function"
  );

  console.log(
    "USERNAME_PLUGIN_AVAILABLE =",
    typeof plugins.username === "function"
  );
} catch (error) {
  console.log(
    "PLUGIN_EXPORT_FAIL =",
    error.message
  );
}

console.log("");
console.log(
  "RKN_BETTER_AUTH_PASSWORD_API_AUDIT_V2_PASS"
);
