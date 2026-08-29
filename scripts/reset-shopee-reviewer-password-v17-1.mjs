import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import fs from "node:fs";
import path from "node:path";
const USERNAME =
  "shopeereviewer";
const newPassword =
  String(
    process.env.RKN_SHOPEE_REVIEWER_NEW_PASSWORD ?? ""
  );
if (newPassword.length < 20) {
  throw new Error(
    "NEW_PASSWORD_MISSING_OR_TOO_SHORT"
  );
}
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET_MISSING"
  );
}
if (!process.env.BETTER_AUTH_URL) {
  throw new Error(
    "BETTER_AUTH_URL_MISSING"
  );
}
const db =
  new Database("./data/rkn-erp.sqlite");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
const auth =
  betterAuth({
    database: db,
    secret:
      process.env.BETTER_AUTH_SECRET,
    baseURL:
      process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
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
/*
 * ----------------------------------------------------------
 * VERIFY INSTALLED BETTER AUTH PASSWORD HASHER
 * ----------------------------------------------------------
 */
const ctx =
  await auth.$context;
if (
  !ctx ||
  !ctx.password ||
  typeof ctx.password.hash !== "function"
) {
  throw new Error(
    "BETTER_AUTH_PASSWORD_HASHER_NOT_AVAILABLE"
  );
}
console.log(
  "PASSWORD_HASHER       : READY"
);
/*
 * ----------------------------------------------------------
 * FIND REVIEWER + CREDENTIAL ACCOUNT
 * ----------------------------------------------------------
 */
const reviewer =
  db.prepare(`
    SELECT
      id,
      username
    FROM user
    WHERE username = ?
    LIMIT 1
  `).get(
    USERNAME
  );
if (!reviewer) {
  throw new Error(
    "SHOPEE_REVIEWER_NOT_FOUND"
  );
}
const credential =
  db.prepare(`
    SELECT
      id,
      password
    FROM account
    WHERE userId = ?
      AND providerId = 'credential'
    LIMIT 1
  `).get(
    reviewer.id
  );
if (
  !credential ||
  !credential.password
) {
  throw new Error(
    "SHOPEE_REVIEWER_CREDENTIAL_NOT_FOUND"
  );
}
console.log(
  "REVIEWER_ACCOUNT      : FOUND"
);
/*
 * ----------------------------------------------------------
 * BACKUP BEFORE PASSWORD CHANGE
 * ----------------------------------------------------------
 */
const stamp =
  new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");
const backupDir =
  "./data/private/backup";
fs.mkdirSync(
  backupDir,
  { recursive: true }
);
const backupPath =
  path.join(
    backupDir,
    `rkn-erp.before-shopee-password-reset-${stamp}.sqlite`
  );
await db.backup(
  backupPath
);
console.log(
  "DATABASE_BACKUP       : PASS"
);
/*
 * ----------------------------------------------------------
 * HASH USING BETTER AUTH ITSELF
 * ----------------------------------------------------------
 */
const oldHash =
  credential.password;
const newHash =
  await ctx.password.hash(
    newPassword
  );
if (
  typeof newHash !== "string" ||
  newHash.length < 20
) {
  throw new Error(
    "NEW_PASSWORD_HASH_INVALID"
  );
}
/*
 * ----------------------------------------------------------
 * UPDATE ONLY CREDENTIAL PASSWORD
 * ----------------------------------------------------------
 */
db.prepare(`
  UPDATE account
  SET
    password = ?,
    updatedAt = ?
  WHERE id = ?
`).run(
  newHash,
  new Date().toISOString(),
  credential.id
);
/*
 * ----------------------------------------------------------
 * VERIFY LOGIN WITH NEW PASSWORD
 * ----------------------------------------------------------
 */
let loginPass = false;
try {
  const login =
    await auth.api.signInUsername({
      body: {
        username:
          USERNAME,
        password:
          newPassword,
      },
      headers:
        new Headers(),
      asResponse:
        true,
    });
  loginPass =
    login.ok === true;
}
catch {
  loginPass = false;
}
if (!loginPass) {
  /*
   * Automatic rollback if new password cannot authenticate.
   */
  db.prepare(`
    UPDATE account
    SET
      password = ?,
      updatedAt = ?
    WHERE id = ?
  `).run(
    oldHash,
    new Date().toISOString(),
    credential.id
  );
  throw new Error(
    "PASSWORD_RESET_LOGIN_FAILED_ROLLED_BACK"
  );
}
console.log(
  "NEW_PASSWORD_LOGIN    : PASS"
);
/*
 * ----------------------------------------------------------
 * VERIFY REVIEWER RBAC WAS NOT CHANGED
 * ----------------------------------------------------------
 */
const permissions =
  db.prepare(`
    SELECT
      p.code
    FROM user u
    JOIN user_role ur
      ON ur.user_id = u.id
    JOIN role r
      ON r.id = ur.role_id
    JOIN role_permission rp
      ON rp.role_id = r.id
    JOIN permission p
      ON p.id = rp.permission_id
    WHERE u.id = ?
    ORDER BY p.code
  `).all(
    reviewer.id
  ).map(
    row => row.code
  );
const scope =
  db.prepare(`
    SELECT
      r.code AS role,
      r.scope_mode,
      bu.code AS business_unit,
      ubs.access_level
    FROM user u
    JOIN user_role ur
      ON ur.user_id = u.id
    JOIN role r
      ON r.id = ur.role_id
    JOIN user_business_scope ubs
      ON ubs.user_id = u.id
    JOIN business_unit bu
      ON bu.id = ubs.business_unit_id
    WHERE u.id = ?
  `).all(
    reviewer.id
  );
const expectedPermissions = [
  "inventory.view",
  "marketplace.view",
];
const permissionPass =
  permissions.length === 2 &&
  expectedPermissions.every(
    code => permissions.includes(code)
  );
const scopePass =
  scope.length === 1 &&
  scope[0].role ===
    "SHOPEE_REVIEWER" &&
  scope[0].scope_mode ===
    "UNIT" &&
  scope[0].business_unit ===
    "ORVIELLE" &&
  scope[0].access_level ===
    "VIEW";
if (!permissionPass) {
  throw new Error(
    "RBAC_PERMISSION_CHANGED_UNEXPECTEDLY"
  );
}
if (!scopePass) {
  throw new Error(
    "RBAC_SCOPE_CHANGED_UNEXPECTEDLY"
  );
}
console.log(
  "RBAC_UNCHANGED        : PASS"
);
console.log(
  "ROLE                  : SHOPEE_REVIEWER"
);
console.log(
  "BUSINESS_UNIT         : ORVIELLE"
);
console.log(
  "ACCESS_LEVEL          : VIEW"
);
console.log(
  "PERMISSIONS           : " +
  permissions.join(", ")
);
console.log("");
console.log(
  "RKN_SHOPEE_REVIEWER_PASSWORD_V17_1_PASS"
);
db.close();

