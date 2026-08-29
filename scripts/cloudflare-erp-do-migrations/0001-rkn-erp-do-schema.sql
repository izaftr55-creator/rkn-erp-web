-- TABLE audit_log
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT,
  business_unit_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  reason TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON DELETE SET NULL
);

-- TABLE business_event
CREATE TABLE business_event (
  event_key TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,
  order_key TEXT NOT NULL
          DEFAULT '',
  business_line_key TEXT NOT NULL
          DEFAULT '',
  source TEXT NOT NULL
          DEFAULT '',
  source_ref TEXT NOT NULL
          DEFAULT '',
  actor_user_id TEXT NOT NULL
          DEFAULT '',
  payload_json TEXT NOT NULL
          DEFAULT '{}',
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

-- TABLE business_line_alias
CREATE TABLE business_line_alias (
  alias_key TEXT PRIMARY KEY,
  business_line_key TEXT NOT NULL,
  order_key TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  store_id TEXT NOT NULL,
  alias_type TEXT NOT NULL,
  alias_value TEXT NOT NULL,
  source TEXT NOT NULL
          DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE (
          business_unit_id,
          platform,
          store_id,
          alias_type,
          alias_value
        )
);

-- TABLE business_order
CREATE TABLE business_order (
  order_key TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  store_id TEXT NOT NULL,
  marketplace_order_id TEXT NOT NULL,
  order_date TEXT NOT NULL
          DEFAULT '',
  order_status TEXT NOT NULL
          DEFAULT '',
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  UNIQUE (
          business_unit_id,
          platform,
          store_id,
          marketplace_order_id
        )
);

-- TABLE business_order_line
CREATE TABLE business_order_line (
  business_line_key TEXT PRIMARY KEY,
  order_key TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  store_id TEXT NOT NULL,
  marketplace_order_id TEXT NOT NULL,
  source_sku TEXT NOT NULL
          DEFAULT '',
  canonical_sku TEXT NOT NULL
          DEFAULT '',
  product_name TEXT NOT NULL
          DEFAULT '',
  variation_name TEXT NOT NULL
          DEFAULT '',
  qty REAL NOT NULL
          CHECK (
            qty > 0
          ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- TABLE business_unit
CREATE TABLE business_unit (
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

-- TABLE erp_user_profile
CREATE TABLE erp_user_profile (
  user_id TEXT PRIMARY KEY NOT NULL,
  person_key TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
  must_change_password INTEGER NOT NULL DEFAULT 1
        CHECK (must_change_password IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  identity_code TEXT,
  primary_role_code TEXT
);

-- TABLE hpp_history
CREATE TABLE hpp_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cost_key TEXT NOT NULL,
  product_id TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL,
  manual_hpp REAL NOT NULL DEFAULT 0,
  calculated_hpp REAL NOT NULL DEFAULT 0,
  effective_hpp REAL NOT NULL DEFAULT 0,
  components_json TEXT NOT NULL DEFAULT '[]',
  effective_from TEXT NOT NULL,
  source_note TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT '',
  changed_at TEXT NOT NULL
);

-- TABLE hpp_master
CREATE TABLE hpp_master (
  cost_key TEXT PRIMARY KEY,
  product_id TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL
        CHECK (method IN ('MANUAL', 'AUTO')),
  manual_hpp REAL NOT NULL DEFAULT 0,
  calculated_hpp REAL NOT NULL DEFAULT 0,
  effective_hpp REAL NOT NULL DEFAULT 0,
  components_json TEXT NOT NULL DEFAULT '[]',
  effective_from TEXT NOT NULL,
  source_note TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

-- TABLE inventory_balance
CREATE TABLE inventory_balance (
  business_unit_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  physical_sku TEXT NOT NULL,
  qty_on_hand REAL NOT NULL DEFAULT 0
        CHECK (qty_on_hand >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (
        business_unit_id,
        warehouse_id,
        physical_sku
      )
);

-- TABLE inventory_ledger
CREATE TABLE inventory_ledger (
  movement_key TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  physical_sku TEXT NOT NULL,
  qty_delta REAL NOT NULL
        CHECK (qty_delta <> 0),
  movement_type TEXT NOT NULL
        CHECK (
          movement_type IN (
            'OPENING',
            'ADJUSTMENT',
            'ORDER_OUT',
            'RETURN_IN',
            'BORROW_OUT',
            'BORROW_IN'
          )
        ),
  source_type TEXT NOT NULL DEFAULT '',
  source_key TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL DEFAULT '',
  order_line_key TEXT NOT NULL DEFAULT '',
  allocation_item_key TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- TABLE marketplace_store_scope
CREATE TABLE marketplace_store_scope (
  platform TEXT NOT NULL,
  store_id TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,
  store_name TEXT NOT NULL
          DEFAULT '',
  source TEXT NOT NULL
          DEFAULT '',
  active INTEGER NOT NULL
          DEFAULT 1
          CHECK (
            active IN (0, 1)
          ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (
          platform,
          store_id
        )
);

-- TABLE order_allocation
CREATE TABLE order_allocation (
  line_key TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  store_id TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL,
  order_date TEXT NOT NULL DEFAULT '',
  sell_sku TEXT NOT NULL DEFAULT '',
  ordered_qty REAL NOT NULL,
  required_qty REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
        CHECK (
          status IN (
            'DRAFT',
            'CONFIRMED',
            'CANCELLED'
          )
        ),
  confirmed_at TEXT NOT NULL DEFAULT '',
  confirmed_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- TABLE order_allocation_item
CREATE TABLE order_allocation_item (
  item_key TEXT PRIMARY KEY,
  line_key TEXT NOT NULL,
  physical_sku TEXT NOT NULL,
  qty REAL NOT NULL
        CHECK (qty > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- TABLE payroll_department
CREATE TABLE payroll_department (
  id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (business_unit_id)
            REFERENCES business_unit(id),
  UNIQUE (business_unit_id, code)
);

-- TABLE permission
CREATE TABLE permission (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TABLE role
CREATE TABLE role (
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

-- TABLE role_permission
CREATE TABLE role_permission (
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

-- TABLE user_business_scope
CREATE TABLE user_business_scope (
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
  FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON DELETE CASCADE
);

-- TABLE user_role
CREATE TABLE user_role (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  business_unit_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id)
        REFERENCES role(id)
        ON DELETE CASCADE,
  FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON DELETE CASCADE
);

-- TABLE whatsapp_message_outbox
CREATE TABLE whatsapp_message_outbox (
  id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL,
  registration_id TEXT,
  worker_id TEXT,
  event_type TEXT NOT NULL
        CHECK (event_type IN (
          'WORKER_APPROVED',
          'WORKER_REJECTED'
        )),
  provider TEXT NOT NULL DEFAULT 'META_WHATSAPP_CLOUD'
        CHECK (provider IN (
          'META_WHATSAPP_CLOUD'
        )),
  recipient_whatsapp TEXT NOT NULL,
  recipient_name TEXT,
  template_name TEXT,
  payload_json TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'QUEUED'
        CHECK (status IN (
          'QUEUED',
          'SENDING',
          'SENT',
          'DELIVERED',
          'READ',
          'FAILED'
        )),
  provider_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0
        CHECK (attempt_count >= 0),
  last_error TEXT,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  delivered_at TEXT,
  read_at TEXT,
  FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id),
  FOREIGN KEY (registration_id)
        REFERENCES worker_registration(id),
  FOREIGN KEY (worker_id)
        REFERENCES worker(id)
);

-- TABLE worker
CREATE TABLE worker (
  id TEXT PRIMARY KEY NOT NULL,
  worker_code TEXT NOT NULL UNIQUE,
  business_unit_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  worker_type TEXT NOT NULL DEFAULT 'BORONGAN'
        CHECK (
          worker_type IN (
            'BORONGAN',
            'HARIAN',
            'BULANAN',
            'OTHER'
          )
        ),
  whatsapp TEXT,
  payment_method TEXT NOT NULL DEFAULT 'CASH'
        CHECK (
          payment_method IN (
            'CASH',
            'BANK_TRANSFER',
            'EWALLET',
            'OTHER'
          )
        ),
  start_date TEXT,
  end_date TEXT,
  active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  address TEXT,
  FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- TABLE worker_code_sequence
CREATE TABLE worker_code_sequence (
  business_unit_id TEXT PRIMARY KEY NOT NULL,
  prefix TEXT NOT NULL UNIQUE,
  last_number INTEGER NOT NULL DEFAULT 0
        CHECK (last_number >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_unit_id)
        REFERENCES business_unit(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- TABLE worker_department_assignment
CREATE TABLE worker_department_assignment (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (worker_id)
            REFERENCES worker(id),
  FOREIGN KEY (department_id)
            REFERENCES payroll_department(id),
  CHECK (
            start_date IS NULL OR
            start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
          ),
  CHECK (
            end_date IS NULL OR
            end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
          ),
  CHECK (
            start_date IS NULL OR
            end_date IS NULL OR
            end_date >= start_date
          ),
  UNIQUE(worker_id, department_id, start_date)
);

-- TABLE worker_registration
CREATE TABLE worker_registration (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL,
  business_unit_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  whatsapp TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
            CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  submitted_at TEXT NOT NULL,
  reviewed_by_user_id TEXT,
  reviewed_at TEXT,
  review_reason TEXT,
  worker_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (invite_id)
            REFERENCES worker_registration_invite(id),
  FOREIGN KEY (business_unit_id)
            REFERENCES business_unit(id),
  FOREIGN KEY (worker_id)
            REFERENCES worker(id)
);

-- TABLE worker_registration_invite
CREATE TABLE worker_registration_invite (
  id TEXT PRIMARY KEY,
  business_unit_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1
            CHECK(active IN (0,1)),
  expires_at TEXT,
  max_uses INTEGER
            CHECK(max_uses IS NULL OR max_uses > 0),
  use_count INTEGER NOT NULL DEFAULT 0
            CHECK(use_count >= 0),
  created_by_user_id TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (business_unit_id)
            REFERENCES business_unit(id)
);

-- TABLE transaction_ledger
CREATE TABLE IF NOT EXISTS transaction_ledger (
      line_key TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT '',
      store_id TEXT NOT NULL DEFAULT '',
      order_id TEXT NOT NULL DEFAULT '',
      order_date TEXT NOT NULL DEFAULT '',
      order_date_key TEXT NOT NULL DEFAULT '',
      order_status TEXT NOT NULL DEFAULT '',
      canonical_sku TEXT NOT NULL DEFAULT '',
      qty REAL NOT NULL DEFAULT 1,
      hpp_snapshot REAL NOT NULL DEFAULT 0,
      hpp_effective_from TEXT NOT NULL DEFAULT '',
      hpp_cost_key TEXT NOT NULL DEFAULT '',
      cost_source TEXT NOT NULL DEFAULT '',
      cogs_total REAL NOT NULL DEFAULT 0,
      cost_status TEXT NOT NULL DEFAULT 'HPP_MISSING'
        CHECK (
          cost_status IN (
            'FOUND',
            'HPP_ZERO',
            'HPP_MISSING',
            'SKU_MISSING',
            'ORDER_DATE_INVALID'
          )
        ),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

-- INDEX idx_business_event_line
CREATE INDEX idx_business_event_line

    ON business_event (
      business_line_key,
      recorded_at
    );

-- INDEX idx_business_event_order
CREATE INDEX idx_business_event_order

    ON business_event (
      business_unit_id,
      order_key,
      recorded_at
    );

-- INDEX idx_business_event_type
CREATE INDEX idx_business_event_type

    ON business_event (
      business_unit_id,
      event_type,
      recorded_at
    );

-- INDEX idx_business_line_alias_line
CREATE INDEX idx_business_line_alias_line

    ON business_line_alias (
      business_line_key
    );

-- INDEX idx_business_order_line_order
CREATE INDEX idx_business_order_line_order

    ON business_order_line (
      order_key
    );

-- INDEX idx_business_order_line_scope
CREATE INDEX idx_business_order_line_scope

    ON business_order_line (
      business_unit_id,
      platform,
      store_id,
      marketplace_order_id
    );

-- INDEX idx_business_order_scope
CREATE INDEX idx_business_order_scope

    ON business_order (
      business_unit_id,
      platform,
      store_id,
      marketplace_order_id
    );

-- INDEX idx_hpp_history_cost_key
CREATE INDEX idx_hpp_history_cost_key
    ON hpp_history (
      cost_key,
      changed_at DESC
    );

-- INDEX idx_hpp_master_effective_from
CREATE INDEX idx_hpp_master_effective_from
    ON hpp_master (
      effective_from
    );

-- INDEX idx_inventory_balance_sku
CREATE INDEX idx_inventory_balance_sku
    ON inventory_balance (
      business_unit_id,
      physical_sku
    );

-- INDEX idx_inventory_ledger_order
CREATE INDEX idx_inventory_ledger_order
    ON inventory_ledger (
      order_id,
      order_line_key
    );

-- INDEX idx_inventory_ledger_sku
CREATE INDEX idx_inventory_ledger_sku
    ON inventory_ledger (
      business_unit_id,
      warehouse_id,
      physical_sku,
      created_at DESC
    );

-- INDEX idx_marketplace_store_scope_bu
CREATE INDEX idx_marketplace_store_scope_bu

    ON marketplace_store_scope (
      business_unit_id,
      active
    );

-- INDEX idx_order_allocation_item_line
CREATE INDEX idx_order_allocation_item_line
    ON order_allocation_item (
      line_key
    );

-- INDEX idx_order_allocation_order
CREATE INDEX idx_order_allocation_order
    ON order_allocation (
      business_unit_id,
      platform,
      store_id,
      order_id
    );

-- INDEX idx_order_allocation_status
CREATE INDEX idx_order_allocation_status
    ON order_allocation (
      business_unit_id,
      warehouse_id,
      status
    );

-- INDEX idx_payroll_department_active
CREATE INDEX idx_payroll_department_active
          ON payroll_department(active);

-- INDEX idx_payroll_department_business_unit
CREATE INDEX idx_payroll_department_business_unit
          ON payroll_department(business_unit_id);

-- INDEX idx_whatsapp_outbox_business_unit
CREATE INDEX idx_whatsapp_outbox_business_unit
      ON whatsapp_message_outbox(business_unit_id);

-- INDEX idx_whatsapp_outbox_provider_message
CREATE INDEX idx_whatsapp_outbox_provider_message
      ON whatsapp_message_outbox(provider_message_id);

-- INDEX idx_whatsapp_outbox_registration
CREATE INDEX idx_whatsapp_outbox_registration
      ON whatsapp_message_outbox(registration_id);

-- INDEX idx_whatsapp_outbox_status_created
CREATE INDEX idx_whatsapp_outbox_status_created
      ON whatsapp_message_outbox(status, created_at);

-- INDEX idx_whatsapp_outbox_worker
CREATE INDEX idx_whatsapp_outbox_worker
      ON whatsapp_message_outbox(worker_id);

-- INDEX idx_worker_active
CREATE INDEX idx_worker_active
      ON worker(active);

-- INDEX idx_worker_business_unit
CREATE INDEX idx_worker_business_unit
      ON worker(business_unit_id);

-- INDEX idx_worker_department_active
CREATE INDEX idx_worker_department_active
          ON worker_department_assignment(active);

-- INDEX idx_worker_department_department
CREATE INDEX idx_worker_department_department
          ON worker_department_assignment(department_id);

-- INDEX idx_worker_department_worker
CREATE INDEX idx_worker_department_worker
          ON worker_department_assignment(worker_id);

-- INDEX idx_worker_full_name
CREATE INDEX idx_worker_full_name
      ON worker(full_name);

-- INDEX idx_worker_registration_bu_status
CREATE INDEX idx_worker_registration_bu_status
          ON worker_registration(business_unit_id, status);

-- INDEX idx_worker_registration_invite_active
CREATE INDEX idx_worker_registration_invite_active
          ON worker_registration_invite(active);

-- INDEX idx_worker_registration_invite_bu
CREATE INDEX idx_worker_registration_invite_bu
          ON worker_registration_invite(business_unit_id);

-- INDEX idx_worker_registration_submitted
CREATE INDEX idx_worker_registration_submitted
          ON worker_registration(submitted_at);

-- INDEX idx_worker_registration_whatsapp
CREATE INDEX idx_worker_registration_whatsapp
          ON worker_registration(whatsapp);

-- INDEX ux_erp_user_profile_identity_code
CREATE UNIQUE INDEX ux_erp_user_profile_identity_code
    ON erp_user_profile(identity_code);

-- INDEX ux_user_role_assignment
CREATE UNIQUE INDEX ux_user_role_assignment
    ON user_role (
      user_id,
      role_id,
      IFNULL(business_unit_id, '__GLOBAL__')
    );

-- INDEX idx_transaction_ledger_cost_status
CREATE INDEX IF NOT EXISTS
      idx_transaction_ledger_cost_status
    ON transaction_ledger (
      cost_status
    );

-- INDEX idx_transaction_ledger_order
CREATE INDEX IF NOT EXISTS
      idx_transaction_ledger_order
    ON transaction_ledger (
      platform,
      store_id,
      order_id
    );

-- INDEX idx_transaction_ledger_sku_date
CREATE INDEX IF NOT EXISTS
      idx_transaction_ledger_sku_date
    ON transaction_ledger (
      canonical_sku,
      order_date_key
    );

-- TRIGGER trg_worker_department_same_bu_insert
CREATE TRIGGER trg_worker_department_same_bu_insert
        BEFORE INSERT ON worker_department_assignment
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN (
              SELECT w.business_unit_id
              FROM worker w
              WHERE w.id = NEW.worker_id
            ) != (
              SELECT d.business_unit_id
              FROM payroll_department d
              WHERE d.id = NEW.department_id
            )
            THEN RAISE(ABORT, 'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH')
          END;
        END;

-- TRIGGER trg_worker_department_same_bu_update
CREATE TRIGGER trg_worker_department_same_bu_update
        BEFORE UPDATE OF worker_id, department_id
        ON worker_department_assignment
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN (
              SELECT w.business_unit_id
              FROM worker w
              WHERE w.id = NEW.worker_id
            ) != (
              SELECT d.business_unit_id
              FROM payroll_department d
              WHERE d.id = NEW.department_id
            )
            THEN RAISE(ABORT, 'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH')
          END;
        END;

-- TRIGGER trg_worker_registration_invite_bu_insert
CREATE TRIGGER trg_worker_registration_invite_bu_insert
        BEFORE INSERT ON worker_registration
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN (
              SELECT business_unit_id
              FROM worker_registration_invite
              WHERE id = NEW.invite_id
            ) != NEW.business_unit_id
            THEN RAISE(ABORT, 'REGISTRATION_INVITE_BUSINESS_UNIT_MISMATCH')
          END;
        END;

-- TRIGGER trg_worker_registration_worker_bu_update
CREATE TRIGGER trg_worker_registration_worker_bu_update
        BEFORE UPDATE OF worker_id ON worker_registration
        FOR EACH ROW
        WHEN NEW.worker_id IS NOT NULL
        BEGIN
          SELECT CASE
            WHEN (
              SELECT business_unit_id
              FROM worker
              WHERE id = NEW.worker_id
            ) != NEW.business_unit_id
            THEN RAISE(ABORT, 'REGISTRATION_WORKER_BUSINESS_UNIT_MISMATCH')
          END;
        END;
