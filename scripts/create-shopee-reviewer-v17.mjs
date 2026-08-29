import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import fs from "node:fs";
import path from "node:path";
const REVIEWER = {
  username: "shopeereviewer",
  email: "shopee.reviewer@rkngroup.my.id",
  name: "Shopee Reviewer",
};
const ROLE = {
  id: "ROLE-SHOPEE-REVIEWER",
  code: "SHOPEE_REVIEWER",
  name: "Shopee Reviewer",
  description:
    "External read-only reviewer for Shopee Open Platform application review.",
};
const BUSINESS_UNIT_CODE = "ORVIELLE";
const ALLOWED_PERMISSIONS = [
  "marketplace.view",
  "inventory.view",
];
const password =
  String(
    process.env.RKN_SHOPEE_REVIEWER_PASSWORD ?? ""
  );
if (password.length < 20) {
  throw new Error(
    "REVIEWER_PASSWORD_MISSING_OR_TOO_SHORT"
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
/*
 * ----------------------------------------------------------
 * BACKUP BEFORE MUTATION
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
  {
    recursive: true,
  }
);
const backupPath =
  path.join(
    backupDir,
    `rkn-erp.before-shopee-reviewer-${stamp}.sqlite`
  );
await db.backup(
  backupPath
);
console.log(
  "DATABASE_BACKUP      : PASS"
);
/*
 * ----------------------------------------------------------
 * BETTER AUTH
 * ----------------------------------------------------------
 */
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
const findUser =
  db.prepare(`
    SELECT
      id,
      name,
      email,
      username
    FROM user
    WHERE username = ?
       OR email = ?
    LIMIT 1
  `);
let reviewer =
  findUser.get(
    REVIEWER.username,
    REVIEWER.email
  );
let userCreated = false;
/*
 * ----------------------------------------------------------
 * CREATE USER THROUGH BETTER AUTH
 * ----------------------------------------------------------
 */
if (!reviewer) {
  await auth.api.signUpEmail({
    body: {
      name:
        REVIEWER.name,
      email:
        REVIEWER.email,
      password,
      username:
        REVIEWER.username,
      displayUsername:
        REVIEWER.username,
    },
  });
  reviewer =
    findUser.get(
      REVIEWER.username,
      REVIEWER.email
    );
  if (!reviewer) {
    throw new Error(
      "SHOPEE_REVIEWER_USER_CREATE_FAILED"
    );
  }
  userCreated = true;
}
else {
  /*
   * Safe rerun:
   * existing reviewer is accepted only if the password
   * supplied by the current PowerShell session matches.
   */
  const existingLogin =
    await auth.api.signInUsername({
      body: {
        username:
          REVIEWER.username,
        password,
      },
      headers:
        new Headers(),
      asResponse:
        true,
    });
  if (!existingLogin.ok) {
    throw new Error(
      "SHOPEE_REVIEWER_ALREADY_EXISTS_WITH_DIFFERENT_PASSWORD"
    );
  }
}
console.log(
  `USER_CREATED         : ${userCreated}`
);
console.log(
  "USER_AUTH            : PASS"
);
/*
 * ----------------------------------------------------------
 * RESOLVE ORVIELLE
 * ----------------------------------------------------------
 */
const businessUnit =
  db.prepare(`
    SELECT
      id,
      code,
      name
    FROM business_unit
    WHERE code = ?
      AND active = 1
    LIMIT 1
  `).get(
    BUSINESS_UNIT_CODE
  );
if (!businessUnit) {
  throw new Error(
    "ORVIELLE_BUSINESS_UNIT_NOT_FOUND"
  );
}
/*
 * ----------------------------------------------------------
 * RESOLVE PERMISSIONS
 * ----------------------------------------------------------
 */
const permissions =
  db.prepare(`
    SELECT
      id,
      code
    FROM permission
    WHERE code IN (?, ?)
    ORDER BY code
  `).all(
    ALLOWED_PERMISSIONS[0],
    ALLOWED_PERMISSIONS[1]
  );
if (permissions.length !== 2) {
  throw new Error(
    "REQUIRED_REVIEWER_PERMISSIONS_NOT_FOUND"
  );
}
/*
 * ----------------------------------------------------------
 * CREATE / NORMALIZE ROLE + SCOPE
 * ----------------------------------------------------------
 */
const configureReviewer =
  db.transaction(() => {
    let role =
      db.prepare(`
        SELECT id
        FROM role
        WHERE code = ?
        LIMIT 1
      `).get(
        ROLE.code
      );
    if (!role) {
      db.prepare(`
        INSERT INTO role (
          id,
          code,
          name,
          description,
          scope_mode,
          is_system,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          'UNIT',
          1,
          datetime('now'),
          datetime('now')
        )
      `).run(
        ROLE.id,
        ROLE.code,
        ROLE.name,
        ROLE.description
      );
      role = {
        id: ROLE.id,
      };
    }
    else {
      db.prepare(`
        UPDATE role
        SET
          name = ?,
          description = ?,
          scope_mode = 'UNIT',
          is_system = 1,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        ROLE.name,
        ROLE.description,
        role.id
      );
    }
    /*
     * Remove everything first.
     * Reviewer role must have EXACTLY two permissions.
     */
    db.prepare(`
      DELETE FROM role_permission
      WHERE role_id = ?
    `).run(
      role.id
    );
    const insertPermission =
      db.prepare(`
        INSERT INTO role_permission (
          role_id,
          permission_id,
          created_at
        )
        VALUES (
          ?,
          ?,
          datetime('now')
        )
      `);
    for (const permission of permissions) {
      insertPermission.run(
        role.id,
        permission.id
      );
    }
    /*
     * Dedicated reviewer:
     * remove all previous role and business scope assignments
     * before assigning Orvielle VIEW only.
     */
    db.prepare(`
      DELETE FROM user_role
      WHERE user_id = ?
    `).run(
      reviewer.id
    );
    db.prepare(`
      DELETE FROM user_business_scope
      WHERE user_id = ?
    `).run(
      reviewer.id
    );
    db.prepare(`
      INSERT INTO user_role (
        id,
        user_id,
        role_id,
        business_unit_id,
        created_at
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        datetime('now')
      )
    `).run(
      "UR-SHOPEE-REVIEWER-ORVIELLE",
      reviewer.id,
      role.id,
      businessUnit.id
    );
    db.prepare(`
      INSERT INTO user_business_scope (
        user_id,
        business_unit_id,
        access_level,
        created_at,
        updated_at
      )
      VALUES (
        ?,
        ?,
        'VIEW',
        datetime('now'),
        datetime('now')
      )
    `).run(
      reviewer.id,
      businessUnit.id
    );
  });
configureReviewer();
/*
 * ----------------------------------------------------------
 * AUTH LOGIN SMOKE TEST
 * ----------------------------------------------------------
 */
const loginTest =
  await auth.api.signInUsername({
    body: {
      username:
        REVIEWER.username,
      password,
    },
    headers:
      new Headers(),
    asResponse:
      true,
  });
if (!loginTest.ok) {
  throw new Error(
    "SHOPEE_REVIEWER_LOGIN_TEST_FAILED"
  );
}
console.log(
  "LOGIN_SMOKE_TEST      : PASS"
);
/*
 * ----------------------------------------------------------
 * RBAC AUDIT
 * ----------------------------------------------------------
 */
const auditPermissions =
  db.prepare(`
    SELECT
      p.code
    FROM role r
    JOIN role_permission rp
      ON rp.role_id = r.id
    JOIN permission p
      ON p.id = rp.permission_id
    WHERE r.code = ?
    ORDER BY p.code
  `).all(
    ROLE.code
  );
const auditScope =
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
const otherScopeCount =
  db.prepare(`
    SELECT COUNT(*) AS count
    FROM user_business_scope ubs
    JOIN business_unit bu
      ON bu.id = ubs.business_unit_id
    WHERE ubs.user_id = ?
      AND bu.code <> ?
  `).get(
    reviewer.id,
    BUSINESS_UNIT_CODE
  ).count;
const globalRoleCount =
  db.prepare(`
    SELECT COUNT(*) AS count
    FROM user_role ur
    JOIN role r
      ON r.id = ur.role_id
    WHERE ur.user_id = ?
      AND r.scope_mode = 'GLOBAL'
  `).get(
    reviewer.id
  ).count;
const actualPermissionCodes =
  auditPermissions.map(
    (row) => row.code
  );
const permissionPass =
  actualPermissionCodes.length === 2 &&
  ALLOWED_PERMISSIONS.every(
    (code) =>
      actualPermissionCodes.includes(code)
  );
const scopePass =
  auditScope.length === 1 &&
  auditScope[0].role ===
    "SHOPEE_REVIEWER" &&
  auditScope[0].scope_mode ===
    "UNIT" &&
  auditScope[0].business_unit ===
    "ORVIELLE" &&
  auditScope[0].access_level ===
    "VIEW" &&
  Number(otherScopeCount) === 0 &&
  Number(globalRoleCount) === 0;
if (!permissionPass) {
  throw new Error(
    "REVIEWER_PERMISSION_AUDIT_FAILED"
  );
}
if (!scopePass) {
  throw new Error(
    "REVIEWER_SCOPE_AUDIT_FAILED"
  );
}
console.log("");
console.log(
  "=== SHOPEE REVIEWER RBAC ==="
);
console.log(
  "USERNAME              : " +
  REVIEWER.username
);
console.log(
  "ROLE                  : SHOPEE_REVIEWER"
);
console.log(
  "SCOPE_MODE            : UNIT"
);
console.log(
  "BUSINESS_UNIT         : ORVIELLE"
);
console.log(
  "ACCESS_LEVEL          : VIEW"
);
console.log(
  "PERMISSIONS           : " +
  actualPermissionCodes.join(", ")
);
console.log(
  "OTHER_SCOPE_COUNT     : " +
  otherScopeCount
);
console.log(
  "GLOBAL_ROLE_COUNT     : " +
  globalRoleCount
);
console.log("");
console.log(
  "RKN_SHOPEE_REVIEW_ENV_V17_0_DB_PASS"
);
db.close();
