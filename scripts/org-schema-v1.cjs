const Database = require("better-sqlite3");

const db = new Database("./data/rkn-erp.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const migrate = db.transaction(() => {

  // ==========================================================
  // BUSINESS UNITS
  // ==========================================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS business_unit (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      owner_key TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'BUSINESS'
        CHECK (kind IN ('BUSINESS', 'OWNER_PERSONAL')),
      active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ==========================================================
  // ROLES
  // ==========================================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS role (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      scope_mode TEXT NOT NULL DEFAULT 'UNIT'
        CHECK (scope_mode IN ('GLOBAL', 'UNIT')),
      is_system INTEGER NOT NULL DEFAULT 1
        CHECK (is_system IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS permission (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      module TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ==========================================================
  // ROLE -> PERMISSION
  // ==========================================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permission (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (role_id, permission_id),

      FOREIGN KEY (role_id)
        REFERENCES role(id)
        ON DELETE CASCADE,

      FOREIGN KEY (permission_id)
        REFERENCES permission(id)
        ON DELETE CASCADE
    );
  `);

  // ==========================================================
  // USER -> ROLE
  // business_unit_id NULL = GLOBAL ROLE
  // ==========================================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_role (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      business_unit_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES user(id)
        ON DELETE CASCADE,

      FOREIGN KEY (role_id)
        REFERENCES role(id)
        ON DELETE CASCADE,

      FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_user_role_assignment
    ON user_role (
      user_id,
      role_id,
      IFNULL(business_unit_id, '__GLOBAL__')
    );
  `);

  // ==========================================================
  // USER -> BUSINESS SCOPE
  // ==========================================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_business_scope (
      user_id TEXT NOT NULL,
      business_unit_id TEXT NOT NULL,
      access_level TEXT NOT NULL DEFAULT 'VIEW'
        CHECK (
          access_level IN (
            'VIEW',
            'OPERATE',
            'MANAGE',
            'OWNER'
          )
        ),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (user_id, business_unit_id),

      FOREIGN KEY (user_id)
        REFERENCES user(id)
        ON DELETE CASCADE,

      FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON DELETE CASCADE
    );
  `);

  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY NOT NULL,
      actor_user_id TEXT,
      business_unit_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      reason TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (actor_user_id)
        REFERENCES user(id)
        ON DELETE SET NULL,

      FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON DELETE SET NULL
    );
  `);

  // ==========================================================
  // BUSINESS UNIT SEED
  // ==========================================================

  const businessUnits = [
    ["BU-RKN", "RKN", "RKN Hijab", "KOKO", "BUSINESS"],
    ["BU-PLASTIC", "PLASTIC_TRADING", "Plastic Trading", "KOKO", "BUSINESS"],
    ["BU-SABLON", "SABLON", "Sablon Plastik", "KOKO", "BUSINESS"],
    ["BU-KOKO-PERSONAL", "OWNER_PERSONAL", "Koko Personal", "KOKO", "OWNER_PERSONAL"],
    ["BU-ORVIELLE", "ORVIELLE", "Orviellé ID", "FATUR", "BUSINESS"],
    ["BU-JENNA", "JENNA", "jenna_collection09", "MUMUH", "BUSINESS"]
  ];

  const insertUnit = db.prepare(`
    INSERT OR IGNORE INTO business_unit
      (id, code, name, owner_key, kind)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const unit of businessUnits) {
    insertUnit.run(...unit);
  }

  // ==========================================================
  // ROLE SEED
  // ==========================================================

  const roles = [
    [
      "ROLE-SYSTEM-ADMIN",
      "SYSTEM_ADMIN",
      "System Administrator",
      "Full ERP system administration.",
      "GLOBAL"
    ],
    [
      "ROLE-GROUP-OWNER",
      "GROUP_OWNER",
      "Group Owner",
      "Owner-level approval and financial oversight.",
      "GLOBAL"
    ],
    [
      "ROLE-RKN-OPERATIONS",
      "RKN_OPERATIONS",
      "RKN Operations",
      "Marketplace and inventory operations.",
      "UNIT"
    ],
    [
      "ROLE-SABLON-MANAGER",
      "SABLON_MANAGER",
      "Sablon Manager",
      "Operational management for Sablon Plastik.",
      "UNIT"
    ],
    [
      "ROLE-SABLON-PAYROLL",
      "SABLON_PAYROLL_OFFICER",
      "Sablon Payroll Officer",
      "Input, verify and submit Sablon payroll.",
      "UNIT"
    ],
    [
      "ROLE-SELLER-OWNER",
      "SELLER_OWNER",
      "Seller Owner",
      "Owner role for independently owned marketplace seller.",
      "UNIT"
    ]
  ];

  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO role
      (id, code, name, description, scope_mode)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const role of roles) {
    insertRole.run(...role);
  }

  // ==========================================================
  // PERMISSION SEED
  // ==========================================================

  const permissions = [
    ["PERM-SYSTEM-USERS", "system.manage_users", "SYSTEM", "Manage Users"],
    ["PERM-SYSTEM-ROLES", "system.manage_roles", "SYSTEM", "Manage Roles"],
    ["PERM-SYSTEM-AUDIT", "system.view_audit", "SYSTEM", "View Audit Log"],

    ["PERM-MP-VIEW", "marketplace.view", "MARKETPLACE", "View Marketplace"],
    ["PERM-MP-MANAGE", "marketplace.manage", "MARKETPLACE", "Manage Marketplace"],

    ["PERM-INV-VIEW", "inventory.view", "INVENTORY", "View Inventory"],
    ["PERM-INV-MANAGE", "inventory.manage", "INVENTORY", "Manage Inventory"],

    ["PERM-PAYROLL-VIEW", "payroll.view", "PAYROLL", "View Payroll"],
    ["PERM-PAYROLL-ENTRY", "payroll.entry", "PAYROLL", "Create/Edit Payroll Entries"],
    ["PERM-PAYROLL-VERIFY", "payroll.verify", "PAYROLL", "Verify Payroll"],
    ["PERM-PAYROLL-SUBMIT", "payroll.submit", "PAYROLL", "Submit Payroll"],
    ["PERM-PAYROLL-APPROVE", "payroll.approve", "PAYROLL", "Approve Payroll"],
    ["PERM-PAYROLL-REOPEN", "payroll.reopen", "PAYROLL", "Reopen Approved Payroll"],
    ["PERM-PAYROLL-PAID", "payroll.mark_paid", "PAYROLL", "Mark Payroll Paid"],
    ["PERM-PAYROLL-PAYSLIP", "payroll.payslip", "PAYROLL", "Generate Payslip"],

    ["PERM-FIN-VIEW", "finance.view", "FINANCE", "View Finance"],
    ["PERM-FIN-EXPENSE", "finance.expense.create", "FINANCE", "Create Expense"],
    ["PERM-FIN-APPROVE", "finance.expense.approve", "FINANCE", "Approve Expense"],
    ["PERM-FIN-POST", "finance.post", "FINANCE", "Post Ledger Transaction"]
  ];

  const insertPermission = db.prepare(`
    INSERT OR IGNORE INTO permission
      (id, code, module, name)
    VALUES (?, ?, ?, ?)
  `);

  for (const permission of permissions) {
    insertPermission.run(...permission);
  }

});

migrate();

console.log("ORG_SCHEMA_V1_OK");
console.log(
  "BUSINESS_UNITS=" +
  db.prepare("SELECT COUNT(*) AS n FROM business_unit").get().n
);
console.log(
  "ROLES=" +
  db.prepare("SELECT COUNT(*) AS n FROM role").get().n
);
console.log(
  "PERMISSIONS=" +
  db.prepare("SELECT COUNT(*) AS n FROM permission").get().n
);

db.close();