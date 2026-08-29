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
  "./data/rkn-erp.before-identity-code-" +
  stamp +
  ".sqlite";

async function main() {
  await db.backup(backupPath);

  const columns = db
    .prepare("PRAGMA table_info('erp_user_profile')")
    .all();

  const hasIdentityCode = columns.some(
    column => column.name === "identity_code"
  );

  const hasPrimaryRoleCode = columns.some(
    column => column.name === "primary_role_code"
  );

  if (!hasIdentityCode) {
    db.exec(`
      ALTER TABLE erp_user_profile
      ADD COLUMN identity_code TEXT;
    `);
  }

  if (!hasPrimaryRoleCode) {
    db.exec(`
      ALTER TABLE erp_user_profile
      ADD COLUMN primary_role_code TEXT;
    `);
  }

  const identities = [
    {
      personKey: "FATUR",
      identityCode: "ADM-0001",
      primaryRole: "SYSTEM_ADMIN",
    },
    {
      personKey: "DISA",
      identityCode: "MGR-0001",
      primaryRole: "SABLON_MANAGER",
    },
    {
      personKey: "MUMUH",
      identityCode: "SOW-0001",
      primaryRole: "SELLER_OWNER",
    },
    {
      personKey: "KOKO",
      identityCode: "GOW-0001",
      primaryRole: "GROUP_OWNER",
    },
  ];

  const findRole = db.prepare(`
    SELECT id
    FROM role
    WHERE code = ?
    LIMIT 1
  `);

  const findProfile = db.prepare(`
    SELECT user_id
    FROM erp_user_profile
    WHERE person_key = ?
    LIMIT 1
  `);

  const updateProfile = db.prepare(`
    UPDATE erp_user_profile
    SET
      identity_code = ?,
      primary_role_code = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE person_key = ?
  `);

  const assign = db.transaction(() => {
    for (const item of identities) {
      const profile =
        findProfile.get(item.personKey);

      if (!profile) {
        throw new Error(
          "PROFILE_NOT_FOUND: " +
          item.personKey
        );
      }

      const role =
        findRole.get(item.primaryRole);

      if (!role) {
        throw new Error(
          "ROLE_NOT_FOUND: " +
          item.primaryRole
        );
      }

      const result = updateProfile.run(
        item.identityCode,
        item.primaryRole,
        item.personKey
      );

      if (result.changes !== 1) {
        throw new Error(
          "IDENTITY_UPDATE_FAILED: " +
          item.personKey
        );
      }
    }
  });

  assign();

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      ux_erp_user_profile_identity_code
    ON erp_user_profile(identity_code);
  `);

  const rows = db.prepare(`
    SELECT
      p.identity_code,
      p.full_name,
      p.primary_role_code,
      r.name AS primary_role_name,
      u.username
    FROM erp_user_profile p
    JOIN user u
      ON u.id = p.user_id
    LEFT JOIN role r
      ON r.code = p.primary_role_code
    ORDER BY p.identity_code
  `).all();

  if (
    rows.length !== 4 ||
    rows.some(
      row =>
        !row.identity_code ||
        !row.primary_role_code ||
        !row.primary_role_name
    )
  ) {
    throw new Error(
      "IDENTITY_VALIDATION_FAILED"
    );
  }

  console.log("IDENTITY_CODE_V1_OK");
  console.log("IDENTITIES=" + rows.length);
  console.table(rows);

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