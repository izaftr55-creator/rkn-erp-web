const Database = require("better-sqlite3");
const path = require("node:path");

const db = new Database("./data/rkn-erp.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const stamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");

const backupPath =
  "./data/rkn-erp.before-org-assignment-" +
  stamp +
  ".sqlite";

async function main() {
  await db.backup(backupPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS erp_user_profile (
      user_id TEXT PRIMARY KEY NOT NULL,
      person_key TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,

      active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),

      must_change_password INTEGER NOT NULL DEFAULT 1
        CHECK (must_change_password IN (0, 1)),

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES user(id)
        ON DELETE CASCADE
    );
  `);

  const people = [
    {
      key: "FATUR",
      username: "fatur",
      name: "LUTFIRZA FATURAHMAN",

      roles: [
        ["SYSTEM_ADMIN", null],
        ["RKN_OPERATIONS", "RKN"],
        ["SELLER_OWNER", "ORVIELLE"]
      ],

      scopes: [
        ["RKN", "MANAGE"],
        ["ORVIELLE", "OWNER"]
      ]
    },

    {
      key: "DISA",
      username: "disa",
      name: "DISA ADITYA KIRANA",

      roles: [
        ["SABLON_MANAGER", "SABLON"],
        ["SABLON_PAYROLL_OFFICER", "SABLON"]
      ],

      scopes: [
        ["SABLON", "MANAGE"]
      ]
    },

    {
      key: "MUMUH",
      username: "mumuh",
      name: "MUMUH MUHTAR",

      roles: [
        ["SELLER_OWNER", "JENNA"]
      ],

      scopes: [
        ["JENNA", "OWNER"]
      ]
    },

    {
      key: "KOKO",
      username: "koko",
      name: "KOKO INDRIYANTO",

      roles: [
        ["GROUP_OWNER", null]
      ],

      scopes: [
        ["RKN", "OWNER"],
        ["PLASTIC_TRADING", "OWNER"],
        ["SABLON", "OWNER"],
        ["OWNER_PERSONAL", "OWNER"]
      ]
    }
  ];

  const getUser = db.prepare(`
    SELECT id
    FROM user
    WHERE username = ?
  `);

  const getRole = db.prepare(`
    SELECT id
    FROM role
    WHERE code = ?
  `);

  const getUnit = db.prepare(`
    SELECT id
    FROM business_unit
    WHERE code = ?
  `);

  const upsertProfile = db.prepare(`
    INSERT INTO erp_user_profile (
      user_id,
      person_key,
      full_name,
      active,
      must_change_password
    )
    VALUES (?, ?, ?, 1, 1)

    ON CONFLICT(user_id)
    DO UPDATE SET
      person_key = excluded.person_key,
      full_name = excluded.full_name,
      active = 1,
      updated_at = CURRENT_TIMESTAMP
  `);

  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO user_role (
      id,
      user_id,
      role_id,
      business_unit_id
    )
    VALUES (?, ?, ?, ?)
  `);

  const upsertScope = db.prepare(`
    INSERT INTO user_business_scope (
      user_id,
      business_unit_id,
      access_level
    )
    VALUES (?, ?, ?)

    ON CONFLICT(user_id, business_unit_id)
    DO UPDATE SET
      access_level = excluded.access_level,
      updated_at = CURRENT_TIMESTAMP
  `);

  const assign = db.transaction(() => {
    for (const person of people) {
      const user = getUser.get(person.username);

      if (!user) {
        throw new Error(
          "USER_NOT_FOUND: " + person.username
        );
      }

      upsertProfile.run(
        user.id,
        person.key,
        person.name
      );

      for (const [roleCode, unitCode] of person.roles) {
        const role = getRole.get(roleCode);

        if (!role) {
          throw new Error(
            "ROLE_NOT_FOUND: " + roleCode
          );
        }

        let unitId = null;

        if (unitCode) {
          const unit = getUnit.get(unitCode);

          if (!unit) {
            throw new Error(
              "UNIT_NOT_FOUND: " + unitCode
            );
          }

          unitId = unit.id;
        }

        const assignmentId = [
          "UR",
          person.key,
          roleCode,
          unitCode ?? "GLOBAL"
        ].join("-");

        insertRole.run(
          assignmentId,
          user.id,
          role.id,
          unitId
        );
      }

      for (const [unitCode, level] of person.scopes) {
        const unit = getUnit.get(unitCode);

        if (!unit) {
          throw new Error(
            "UNIT_NOT_FOUND: " + unitCode
          );
        }

        upsertScope.run(
          user.id,
          unit.id,
          level
        );
      }
    }
  });

  assign();

  const profiles = db.prepare(`
    SELECT
      p.person_key,
      p.full_name,
      u.username,
      p.must_change_password
    FROM erp_user_profile p
    JOIN user u
      ON u.id = p.user_id
    ORDER BY p.person_key
  `).all();

  const roles = db.prepare(`
    SELECT
      p.person_key,
      r.code AS role,
      COALESCE(b.code, 'GLOBAL') AS scope
    FROM user_role ur
    JOIN erp_user_profile p
      ON p.user_id = ur.user_id
    JOIN role r
      ON r.id = ur.role_id
    LEFT JOIN business_unit b
      ON b.id = ur.business_unit_id
    ORDER BY p.person_key, r.code
  `).all();

  const scopes = db.prepare(`
    SELECT
      p.person_key,
      b.code AS business_unit,
      s.access_level
    FROM user_business_scope s
    JOIN erp_user_profile p
      ON p.user_id = s.user_id
    JOIN business_unit b
      ON b.id = s.business_unit_id
    ORDER BY p.person_key, b.code
  `).all();

  console.log("ORG_ASSIGNMENT_V1_OK");
  console.log("PROFILES=" + profiles.length);
  console.log("ROLE_ASSIGNMENTS=" + roles.length);
  console.log("BUSINESS_SCOPES=" + scopes.length);

  console.log("");
  console.log("=== PROFILES ===");
  console.table(profiles);

  console.log("");
  console.log("=== ROLES ===");
  console.table(roles);

  console.log("");
  console.log("=== SCOPES ===");
  console.table(scopes);

  console.log("");
  console.log(
    "DATABASE_BACKUP=" +
    path.resolve(backupPath)
  );

  db.close();
}

main().catch((error) => {
  console.error(error);
  db.close();
  process.exit(1);
});