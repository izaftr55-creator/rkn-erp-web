/* RKN_PLASTIC_V2_MODULE_IMPORT */
import { initPlasticTradingV2, getPlasticTradingViewV2, mutatePlasticTradingV2 } from "./plasticTradingV2";
import { DurableObject } from "cloudflare:workers";

import { createDoSqliteCompat } from "./do-sqlite-compat";
import { createGlobalBusinessCore } from "./core/globalBusinessCore";
import { createInventoryCore } from "./core/inventoryCore";
import { createTransactionCore } from "./core/transactionCore";
import { createPublicWorkerRegistrationOps } from "./ops/public-worker-registration";
import { createHppOps } from "./ops/hpp";
import { createWhatsappOutboxOps } from "./ops/whatsapp-outbox";
import { createInviteDetailOps } from "./ops/invite-detail";
import { createInvitesOps } from "./ops/invites";
import { createRegistrationDetailOps } from "./ops/registration-detail";
import { createRegistrationsOps } from "./ops/registrations";
import { createWorkersOps } from "./ops/workers";
import { createInventoryReadModelOps } from "./ops/inventory-read-model";


const ERP_SCHEMA_VERSION =
  "0001-rkn-erp-do-schema";

const ERP_SCHEMA_SHA256 =
  "6F0111803A23CB7FA05D383DE1968517DEC2F398509A439C3783B07ED0FEBE28";

const ERP_SCHEMA_V1 =
  "-- TABLE audit_log\nCREATE TABLE audit_log (\n  id TEXT PRIMARY KEY NOT NULL,\n  actor_user_id TEXT,\n  business_unit_id TEXT,\n  action TEXT NOT NULL,\n  entity_type TEXT NOT NULL,\n  entity_id TEXT,\n  reason TEXT,\n  details_json TEXT,\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (business_unit_id)\n        REFERENCES business_unit(id)\n        ON DELETE SET NULL\n);\n\n-- TABLE business_event\nCREATE TABLE business_event (\n  event_key TEXT PRIMARY KEY,\n  event_type TEXT NOT NULL,\n  business_unit_id TEXT NOT NULL,\n  order_key TEXT NOT NULL\n          DEFAULT '',\n  business_line_key TEXT NOT NULL\n          DEFAULT '',\n  source TEXT NOT NULL\n          DEFAULT '',\n  source_ref TEXT NOT NULL\n          DEFAULT '',\n  actor_user_id TEXT NOT NULL\n          DEFAULT '',\n  payload_json TEXT NOT NULL\n          DEFAULT '{}',\n  occurred_at TEXT NOT NULL,\n  recorded_at TEXT NOT NULL\n);\n\n-- TABLE business_line_alias\nCREATE TABLE business_line_alias (\n  alias_key TEXT PRIMARY KEY,\n  business_line_key TEXT NOT NULL,\n  order_key TEXT NOT NULL,\n  business_unit_id TEXT NOT NULL,\n  platform TEXT NOT NULL,\n  store_id TEXT NOT NULL,\n  alias_type TEXT NOT NULL,\n  alias_value TEXT NOT NULL,\n  source TEXT NOT NULL\n          DEFAULT '',\n  created_at TEXT NOT NULL,\n  UNIQUE (\n          business_unit_id,\n          platform,\n          store_id,\n          alias_type,\n          alias_value\n        )\n);\n\n-- TABLE business_order\nCREATE TABLE business_order (\n  order_key TEXT PRIMARY KEY,\n  business_unit_id TEXT NOT NULL,\n  platform TEXT NOT NULL,\n  store_id TEXT NOT NULL,\n  marketplace_order_id TEXT NOT NULL,\n  order_date TEXT NOT NULL\n          DEFAULT '',\n  order_status TEXT NOT NULL\n          DEFAULT '',\n  first_seen_at TEXT NOT NULL,\n  last_seen_at TEXT NOT NULL,\n  UNIQUE (\n          business_unit_id,\n          platform,\n          store_id,\n          marketplace_order_id\n        )\n);\n\n-- TABLE business_order_line\nCREATE TABLE business_order_line (\n  business_line_key TEXT PRIMARY KEY,\n  order_key TEXT NOT NULL,\n  business_unit_id TEXT NOT NULL,\n  platform TEXT NOT NULL,\n  store_id TEXT NOT NULL,\n  marketplace_order_id TEXT NOT NULL,\n  source_sku TEXT NOT NULL\n          DEFAULT '',\n  canonical_sku TEXT NOT NULL\n          DEFAULT '',\n  product_name TEXT NOT NULL\n          DEFAULT '',\n  variation_name TEXT NOT NULL\n          DEFAULT '',\n  qty REAL NOT NULL\n          CHECK (\n            qty > 0\n          ),\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL\n);\n\n-- TABLE business_unit\nCREATE TABLE business_unit (\n  id TEXT PRIMARY KEY NOT NULL,\n  code TEXT NOT NULL UNIQUE,\n  name TEXT NOT NULL,\n  owner_key TEXT NOT NULL,\n  kind TEXT NOT NULL DEFAULT 'BUSINESS'\n        CHECK (kind IN ('BUSINESS', 'OWNER_PERSONAL')),\n  active INTEGER NOT NULL DEFAULT 1\n        CHECK (active IN (0, 1)),\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n);\n\n-- TABLE erp_user_profile\nCREATE TABLE erp_user_profile (\n  user_id TEXT PRIMARY KEY NOT NULL,\n  person_key TEXT NOT NULL UNIQUE,\n  full_name TEXT NOT NULL,\n  active INTEGER NOT NULL DEFAULT 1\n        CHECK (active IN (0, 1)),\n  must_change_password INTEGER NOT NULL DEFAULT 1\n        CHECK (must_change_password IN (0, 1)),\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  identity_code TEXT,\n  primary_role_code TEXT\n);\n\n-- TABLE hpp_history\nCREATE TABLE hpp_history (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  cost_key TEXT NOT NULL,\n  product_id TEXT NOT NULL DEFAULT '',\n  sku TEXT NOT NULL DEFAULT '',\n  product_name TEXT NOT NULL DEFAULT '',\n  method TEXT NOT NULL,\n  manual_hpp REAL NOT NULL DEFAULT 0,\n  calculated_hpp REAL NOT NULL DEFAULT 0,\n  effective_hpp REAL NOT NULL DEFAULT 0,\n  components_json TEXT NOT NULL DEFAULT '[]',\n  effective_from TEXT NOT NULL,\n  source_note TEXT NOT NULL DEFAULT '',\n  changed_by TEXT NOT NULL DEFAULT '',\n  changed_at TEXT NOT NULL\n);\n\n-- TABLE hpp_master\nCREATE TABLE hpp_master (\n  cost_key TEXT PRIMARY KEY,\n  product_id TEXT NOT NULL DEFAULT '',\n  sku TEXT NOT NULL DEFAULT '',\n  product_name TEXT NOT NULL DEFAULT '',\n  method TEXT NOT NULL\n        CHECK (method IN ('MANUAL', 'AUTO')),\n  manual_hpp REAL NOT NULL DEFAULT 0,\n  calculated_hpp REAL NOT NULL DEFAULT 0,\n  effective_hpp REAL NOT NULL DEFAULT 0,\n  components_json TEXT NOT NULL DEFAULT '[]',\n  effective_from TEXT NOT NULL,\n  source_note TEXT NOT NULL DEFAULT '',\n  updated_by TEXT NOT NULL DEFAULT '',\n  updated_at TEXT NOT NULL\n);\n\n-- TABLE inventory_balance\nCREATE TABLE inventory_balance (\n  business_unit_id TEXT NOT NULL,\n  warehouse_id TEXT NOT NULL,\n  physical_sku TEXT NOT NULL,\n  qty_on_hand REAL NOT NULL DEFAULT 0\n        CHECK (qty_on_hand >= 0),\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL,\n  PRIMARY KEY (\n        business_unit_id,\n        warehouse_id,\n        physical_sku\n      )\n);\n\n-- TABLE inventory_ledger\nCREATE TABLE inventory_ledger (\n  movement_key TEXT PRIMARY KEY,\n  business_unit_id TEXT NOT NULL,\n  warehouse_id TEXT NOT NULL,\n  physical_sku TEXT NOT NULL,\n  qty_delta REAL NOT NULL\n        CHECK (qty_delta <> 0),\n  movement_type TEXT NOT NULL\n        CHECK (\n          movement_type IN (\n            'OPENING',\n            'ADJUSTMENT',\n            'ORDER_OUT',\n            'RETURN_IN',\n            'BORROW_OUT',\n            'BORROW_IN'\n          )\n        ),\n  source_type TEXT NOT NULL DEFAULT '',\n  source_key TEXT NOT NULL DEFAULT '',\n  order_id TEXT NOT NULL DEFAULT '',\n  order_line_key TEXT NOT NULL DEFAULT '',\n  allocation_item_key TEXT NOT NULL DEFAULT '',\n  actor_user_id TEXT NOT NULL DEFAULT '',\n  note TEXT NOT NULL DEFAULT '',\n  created_at TEXT NOT NULL\n);\n\n-- TABLE marketplace_store_scope\nCREATE TABLE marketplace_store_scope (\n  platform TEXT NOT NULL,\n  store_id TEXT NOT NULL,\n  business_unit_id TEXT NOT NULL,\n  store_name TEXT NOT NULL\n          DEFAULT '',\n  source TEXT NOT NULL\n          DEFAULT '',\n  active INTEGER NOT NULL\n          DEFAULT 1\n          CHECK (\n            active IN (0, 1)\n          ),\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL,\n  PRIMARY KEY (\n          platform,\n          store_id\n        )\n);\n\n-- TABLE order_allocation\nCREATE TABLE order_allocation (\n  line_key TEXT PRIMARY KEY,\n  business_unit_id TEXT NOT NULL,\n  warehouse_id TEXT NOT NULL,\n  platform TEXT NOT NULL DEFAULT '',\n  store_id TEXT NOT NULL DEFAULT '',\n  order_id TEXT NOT NULL,\n  order_date TEXT NOT NULL DEFAULT '',\n  sell_sku TEXT NOT NULL DEFAULT '',\n  ordered_qty REAL NOT NULL,\n  required_qty REAL NOT NULL,\n  status TEXT NOT NULL DEFAULT 'DRAFT'\n        CHECK (\n          status IN (\n            'DRAFT',\n            'CONFIRMED',\n            'CANCELLED'\n          )\n        ),\n  confirmed_at TEXT NOT NULL DEFAULT '',\n  confirmed_by TEXT NOT NULL DEFAULT '',\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL\n);\n\n-- TABLE order_allocation_item\nCREATE TABLE order_allocation_item (\n  item_key TEXT PRIMARY KEY,\n  line_key TEXT NOT NULL,\n  physical_sku TEXT NOT NULL,\n  qty REAL NOT NULL\n        CHECK (qty > 0),\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL\n);\n\n-- TABLE payroll_department\nCREATE TABLE payroll_department (\n  id TEXT PRIMARY KEY,\n  business_unit_id TEXT NOT NULL,\n  code TEXT NOT NULL,\n  name TEXT NOT NULL,\n  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),\n  sort_order INTEGER NOT NULL DEFAULT 0,\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL,\n  FOREIGN KEY (business_unit_id)\n            REFERENCES business_unit(id),\n  UNIQUE (business_unit_id, code)\n);\n\n-- TABLE permission\nCREATE TABLE permission (\n  id TEXT PRIMARY KEY NOT NULL,\n  code TEXT NOT NULL UNIQUE,\n  module TEXT NOT NULL,\n  name TEXT NOT NULL,\n  description TEXT,\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n);\n\n-- TABLE role\nCREATE TABLE role (\n  id TEXT PRIMARY KEY NOT NULL,\n  code TEXT NOT NULL UNIQUE,\n  name TEXT NOT NULL,\n  description TEXT,\n  scope_mode TEXT NOT NULL DEFAULT 'UNIT'\n        CHECK (scope_mode IN ('GLOBAL', 'UNIT')),\n  is_system INTEGER NOT NULL DEFAULT 1\n        CHECK (is_system IN (0, 1)),\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP\n);\n\n-- TABLE role_permission\nCREATE TABLE role_permission (\n  role_id TEXT NOT NULL,\n  permission_id TEXT NOT NULL,\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (role_id, permission_id),\n  FOREIGN KEY (role_id)\n        REFERENCES role(id)\n        ON DELETE CASCADE,\n  FOREIGN KEY (permission_id)\n        REFERENCES permission(id)\n        ON DELETE CASCADE\n);\n\n-- TABLE user_business_scope\nCREATE TABLE user_business_scope (\n  user_id TEXT NOT NULL,\n  business_unit_id TEXT NOT NULL,\n  access_level TEXT NOT NULL DEFAULT 'VIEW'\n        CHECK (\n          access_level IN (\n            'VIEW',\n            'OPERATE',\n            'MANAGE',\n            'OWNER'\n          )\n        ),\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (user_id, business_unit_id),\n  FOREIGN KEY (business_unit_id)\n        REFERENCES business_unit(id)\n        ON DELETE CASCADE\n);\n\n-- TABLE user_role\nCREATE TABLE user_role (\n  id TEXT PRIMARY KEY NOT NULL,\n  user_id TEXT NOT NULL,\n  role_id TEXT NOT NULL,\n  business_unit_id TEXT,\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (role_id)\n        REFERENCES role(id)\n        ON DELETE CASCADE,\n  FOREIGN KEY (business_unit_id)\n        REFERENCES business_unit(id)\n        ON DELETE CASCADE\n);\n\n-- TABLE whatsapp_message_outbox\nCREATE TABLE whatsapp_message_outbox (\n  id TEXT PRIMARY KEY,\n  business_unit_id TEXT NOT NULL,\n  registration_id TEXT,\n  worker_id TEXT,\n  event_type TEXT NOT NULL\n        CHECK (event_type IN (\n          'WORKER_APPROVED',\n          'WORKER_REJECTED'\n        )),\n  provider TEXT NOT NULL DEFAULT 'META_WHATSAPP_CLOUD'\n        CHECK (provider IN (\n          'META_WHATSAPP_CLOUD'\n        )),\n  recipient_whatsapp TEXT NOT NULL,\n  recipient_name TEXT,\n  template_name TEXT,\n  payload_json TEXT NOT NULL,\n  dedupe_key TEXT NOT NULL UNIQUE,\n  status TEXT NOT NULL DEFAULT 'QUEUED'\n        CHECK (status IN (\n          'QUEUED',\n          'SENDING',\n          'SENT',\n          'DELIVERED',\n          'READ',\n          'FAILED'\n        )),\n  provider_message_id TEXT,\n  attempt_count INTEGER NOT NULL DEFAULT 0\n        CHECK (attempt_count >= 0),\n  last_error TEXT,\n  last_attempt_at TEXT,\n  next_attempt_at TEXT,\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  sent_at TEXT,\n  delivered_at TEXT,\n  read_at TEXT,\n  FOREIGN KEY (business_unit_id)\n        REFERENCES business_unit(id),\n  FOREIGN KEY (registration_id)\n        REFERENCES worker_registration(id),\n  FOREIGN KEY (worker_id)\n        REFERENCES worker(id)\n);\n\n-- TABLE worker\nCREATE TABLE worker (\n  id TEXT PRIMARY KEY NOT NULL,\n  worker_code TEXT NOT NULL UNIQUE,\n  business_unit_id TEXT NOT NULL,\n  full_name TEXT NOT NULL,\n  nickname TEXT,\n  worker_type TEXT NOT NULL DEFAULT 'BORONGAN'\n        CHECK (\n          worker_type IN (\n            'BORONGAN',\n            'HARIAN',\n            'BULANAN',\n            'OTHER'\n          )\n        ),\n  whatsapp TEXT,\n  payment_method TEXT NOT NULL DEFAULT 'CASH'\n        CHECK (\n          payment_method IN (\n            'CASH',\n            'BANK_TRANSFER',\n            'EWALLET',\n            'OTHER'\n          )\n        ),\n  start_date TEXT,\n  end_date TEXT,\n  active INTEGER NOT NULL DEFAULT 1\n        CHECK (active IN (0, 1)),\n  notes TEXT,\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  address TEXT,\n  FOREIGN KEY (business_unit_id)\n        REFERENCES business_unit(id)\n        ON UPDATE CASCADE\n        ON DELETE RESTRICT\n);\n\n-- TABLE worker_code_sequence\nCREATE TABLE worker_code_sequence (\n  business_unit_id TEXT PRIMARY KEY NOT NULL,\n  prefix TEXT NOT NULL UNIQUE,\n  last_number INTEGER NOT NULL DEFAULT 0\n        CHECK (last_number >= 0),\n  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (business_unit_id)\n        REFERENCES business_unit(id)\n        ON UPDATE CASCADE\n        ON DELETE RESTRICT\n);\n\n-- TABLE worker_department_assignment\nCREATE TABLE worker_department_assignment (\n  id TEXT PRIMARY KEY,\n  worker_id TEXT NOT NULL,\n  department_id TEXT NOT NULL,\n  start_date TEXT,\n  end_date TEXT,\n  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),\n  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0,1)),\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL,\n  FOREIGN KEY (worker_id)\n            REFERENCES worker(id),\n  FOREIGN KEY (department_id)\n            REFERENCES payroll_department(id),\n  CHECK (\n            start_date IS NULL OR\n            start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'\n          ),\n  CHECK (\n            end_date IS NULL OR\n            end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'\n          ),\n  CHECK (\n            start_date IS NULL OR\n            end_date IS NULL OR\n            end_date >= start_date\n          ),\n  UNIQUE(worker_id, department_id, start_date)\n);\n\n-- TABLE worker_registration\nCREATE TABLE worker_registration (\n  id TEXT PRIMARY KEY,\n  invite_id TEXT NOT NULL,\n  business_unit_id TEXT NOT NULL,\n  full_name TEXT NOT NULL,\n  nickname TEXT,\n  whatsapp TEXT NOT NULL,\n  address TEXT,\n  notes TEXT,\n  status TEXT NOT NULL DEFAULT 'PENDING'\n            CHECK(status IN ('PENDING','APPROVED','REJECTED')),\n  submitted_at TEXT NOT NULL,\n  reviewed_by_user_id TEXT,\n  reviewed_at TEXT,\n  review_reason TEXT,\n  worker_id TEXT,\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL,\n  FOREIGN KEY (invite_id)\n            REFERENCES worker_registration_invite(id),\n  FOREIGN KEY (business_unit_id)\n            REFERENCES business_unit(id),\n  FOREIGN KEY (worker_id)\n            REFERENCES worker(id)\n);\n\n-- TABLE worker_registration_invite\nCREATE TABLE worker_registration_invite (\n  id TEXT PRIMARY KEY,\n  business_unit_id TEXT NOT NULL,\n  token_hash TEXT NOT NULL UNIQUE,\n  active INTEGER NOT NULL DEFAULT 1\n            CHECK(active IN (0,1)),\n  expires_at TEXT,\n  max_uses INTEGER\n            CHECK(max_uses IS NULL OR max_uses > 0),\n  use_count INTEGER NOT NULL DEFAULT 0\n            CHECK(use_count >= 0),\n  created_by_user_id TEXT NOT NULL,\n  notes TEXT,\n  created_at TEXT NOT NULL,\n  updated_at TEXT NOT NULL,\n  revoked_at TEXT,\n  FOREIGN KEY (business_unit_id)\n            REFERENCES business_unit(id)\n);\n\n-- TABLE transaction_ledger\nCREATE TABLE IF NOT EXISTS transaction_ledger (\n      line_key TEXT PRIMARY KEY,\n      source TEXT NOT NULL DEFAULT '',\n      platform TEXT NOT NULL DEFAULT '',\n      store_id TEXT NOT NULL DEFAULT '',\n      order_id TEXT NOT NULL DEFAULT '',\n      order_date TEXT NOT NULL DEFAULT '',\n      order_date_key TEXT NOT NULL DEFAULT '',\n      order_status TEXT NOT NULL DEFAULT '',\n      canonical_sku TEXT NOT NULL DEFAULT '',\n      qty REAL NOT NULL DEFAULT 1,\n      hpp_snapshot REAL NOT NULL DEFAULT 0,\n      hpp_effective_from TEXT NOT NULL DEFAULT '',\n      hpp_cost_key TEXT NOT NULL DEFAULT '',\n      cost_source TEXT NOT NULL DEFAULT '',\n      cogs_total REAL NOT NULL DEFAULT 0,\n      cost_status TEXT NOT NULL DEFAULT 'HPP_MISSING'\n        CHECK (\n          cost_status IN (\n            'FOUND',\n            'HPP_ZERO',\n            'HPP_MISSING',\n            'SKU_MISSING',\n            'ORDER_DATE_INVALID'\n          )\n        ),\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL\n    );\n\n-- INDEX idx_business_event_line\nCREATE INDEX idx_business_event_line\n\n    ON business_event (\n      business_line_key,\n      recorded_at\n    );\n\n-- INDEX idx_business_event_order\nCREATE INDEX idx_business_event_order\n\n    ON business_event (\n      business_unit_id,\n      order_key,\n      recorded_at\n    );\n\n-- INDEX idx_business_event_type\nCREATE INDEX idx_business_event_type\n\n    ON business_event (\n      business_unit_id,\n      event_type,\n      recorded_at\n    );\n\n-- INDEX idx_business_line_alias_line\nCREATE INDEX idx_business_line_alias_line\n\n    ON business_line_alias (\n      business_line_key\n    );\n\n-- INDEX idx_business_order_line_order\nCREATE INDEX idx_business_order_line_order\n\n    ON business_order_line (\n      order_key\n    );\n\n-- INDEX idx_business_order_line_scope\nCREATE INDEX idx_business_order_line_scope\n\n    ON business_order_line (\n      business_unit_id,\n      platform,\n      store_id,\n      marketplace_order_id\n    );\n\n-- INDEX idx_business_order_scope\nCREATE INDEX idx_business_order_scope\n\n    ON business_order (\n      business_unit_id,\n      platform,\n      store_id,\n      marketplace_order_id\n    );\n\n-- INDEX idx_hpp_history_cost_key\nCREATE INDEX idx_hpp_history_cost_key\n    ON hpp_history (\n      cost_key,\n      changed_at DESC\n    );\n\n-- INDEX idx_hpp_master_effective_from\nCREATE INDEX idx_hpp_master_effective_from\n    ON hpp_master (\n      effective_from\n    );\n\n-- INDEX idx_inventory_balance_sku\nCREATE INDEX idx_inventory_balance_sku\n    ON inventory_balance (\n      business_unit_id,\n      physical_sku\n    );\n\n-- INDEX idx_inventory_ledger_order\nCREATE INDEX idx_inventory_ledger_order\n    ON inventory_ledger (\n      order_id,\n      order_line_key\n    );\n\n-- INDEX idx_inventory_ledger_sku\nCREATE INDEX idx_inventory_ledger_sku\n    ON inventory_ledger (\n      business_unit_id,\n      warehouse_id,\n      physical_sku,\n      created_at DESC\n    );\n\n-- INDEX idx_marketplace_store_scope_bu\nCREATE INDEX idx_marketplace_store_scope_bu\n\n    ON marketplace_store_scope (\n      business_unit_id,\n      active\n    );\n\n-- INDEX idx_order_allocation_item_line\nCREATE INDEX idx_order_allocation_item_line\n    ON order_allocation_item (\n      line_key\n    );\n\n-- INDEX idx_order_allocation_order\nCREATE INDEX idx_order_allocation_order\n    ON order_allocation (\n      business_unit_id,\n      platform,\n      store_id,\n      order_id\n    );\n\n-- INDEX idx_order_allocation_status\nCREATE INDEX idx_order_allocation_status\n    ON order_allocation (\n      business_unit_id,\n      warehouse_id,\n      status\n    );\n\n-- INDEX idx_payroll_department_active\nCREATE INDEX idx_payroll_department_active\n          ON payroll_department(active);\n\n-- INDEX idx_payroll_department_business_unit\nCREATE INDEX idx_payroll_department_business_unit\n          ON payroll_department(business_unit_id);\n\n-- INDEX idx_whatsapp_outbox_business_unit\nCREATE INDEX idx_whatsapp_outbox_business_unit\n      ON whatsapp_message_outbox(business_unit_id);\n\n-- INDEX idx_whatsapp_outbox_provider_message\nCREATE INDEX idx_whatsapp_outbox_provider_message\n      ON whatsapp_message_outbox(provider_message_id);\n\n-- INDEX idx_whatsapp_outbox_registration\nCREATE INDEX idx_whatsapp_outbox_registration\n      ON whatsapp_message_outbox(registration_id);\n\n-- INDEX idx_whatsapp_outbox_status_created\nCREATE INDEX idx_whatsapp_outbox_status_created\n      ON whatsapp_message_outbox(status, created_at);\n\n-- INDEX idx_whatsapp_outbox_worker\nCREATE INDEX idx_whatsapp_outbox_worker\n      ON whatsapp_message_outbox(worker_id);\n\n-- INDEX idx_worker_active\nCREATE INDEX idx_worker_active\n      ON worker(active);\n\n-- INDEX idx_worker_business_unit\nCREATE INDEX idx_worker_business_unit\n      ON worker(business_unit_id);\n\n-- INDEX idx_worker_department_active\nCREATE INDEX idx_worker_department_active\n          ON worker_department_assignment(active);\n\n-- INDEX idx_worker_department_department\nCREATE INDEX idx_worker_department_department\n          ON worker_department_assignment(department_id);\n\n-- INDEX idx_worker_department_worker\nCREATE INDEX idx_worker_department_worker\n          ON worker_department_assignment(worker_id);\n\n-- INDEX idx_worker_full_name\nCREATE INDEX idx_worker_full_name\n      ON worker(full_name);\n\n-- INDEX idx_worker_registration_bu_status\nCREATE INDEX idx_worker_registration_bu_status\n          ON worker_registration(business_unit_id, status);\n\n-- INDEX idx_worker_registration_invite_active\nCREATE INDEX idx_worker_registration_invite_active\n          ON worker_registration_invite(active);\n\n-- INDEX idx_worker_registration_invite_bu\nCREATE INDEX idx_worker_registration_invite_bu\n          ON worker_registration_invite(business_unit_id);\n\n-- INDEX idx_worker_registration_submitted\nCREATE INDEX idx_worker_registration_submitted\n          ON worker_registration(submitted_at);\n\n-- INDEX idx_worker_registration_whatsapp\nCREATE INDEX idx_worker_registration_whatsapp\n          ON worker_registration(whatsapp);\n\n-- INDEX ux_erp_user_profile_identity_code\nCREATE UNIQUE INDEX ux_erp_user_profile_identity_code\n    ON erp_user_profile(identity_code);\n\n-- INDEX ux_user_role_assignment\nCREATE UNIQUE INDEX ux_user_role_assignment\n    ON user_role (\n      user_id,\n      role_id,\n      IFNULL(business_unit_id, '__GLOBAL__')\n    );\n\n-- INDEX idx_transaction_ledger_cost_status\nCREATE INDEX IF NOT EXISTS\n      idx_transaction_ledger_cost_status\n    ON transaction_ledger (\n      cost_status\n    );\n\n-- INDEX idx_transaction_ledger_order\nCREATE INDEX IF NOT EXISTS\n      idx_transaction_ledger_order\n    ON transaction_ledger (\n      platform,\n      store_id,\n      order_id\n    );\n\n-- INDEX idx_transaction_ledger_sku_date\nCREATE INDEX IF NOT EXISTS\n      idx_transaction_ledger_sku_date\n    ON transaction_ledger (\n      canonical_sku,\n      order_date_key\n    );\n\n-- TRIGGER trg_worker_department_same_bu_insert\nCREATE TRIGGER trg_worker_department_same_bu_insert\n        BEFORE INSERT ON worker_department_assignment\n        FOR EACH ROW\n        BEGIN\n          SELECT CASE\n            WHEN (\n              SELECT w.business_unit_id\n              FROM worker w\n              WHERE w.id = NEW.worker_id\n            ) != (\n              SELECT d.business_unit_id\n              FROM payroll_department d\n              WHERE d.id = NEW.department_id\n            )\n            THEN RAISE(ABORT, 'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH')\n          END;\n        END;\n\n-- TRIGGER trg_worker_department_same_bu_update\nCREATE TRIGGER trg_worker_department_same_bu_update\n        BEFORE UPDATE OF worker_id, department_id\n        ON worker_department_assignment\n        FOR EACH ROW\n        BEGIN\n          SELECT CASE\n            WHEN (\n              SELECT w.business_unit_id\n              FROM worker w\n              WHERE w.id = NEW.worker_id\n            ) != (\n              SELECT d.business_unit_id\n              FROM payroll_department d\n              WHERE d.id = NEW.department_id\n            )\n            THEN RAISE(ABORT, 'WORKER_DEPARTMENT_BUSINESS_UNIT_MISMATCH')\n          END;\n        END;\n\n-- TRIGGER trg_worker_registration_invite_bu_insert\nCREATE TRIGGER trg_worker_registration_invite_bu_insert\n        BEFORE INSERT ON worker_registration\n        FOR EACH ROW\n        BEGIN\n          SELECT CASE\n            WHEN (\n              SELECT business_unit_id\n              FROM worker_registration_invite\n              WHERE id = NEW.invite_id\n            ) != NEW.business_unit_id\n            THEN RAISE(ABORT, 'REGISTRATION_INVITE_BUSINESS_UNIT_MISMATCH')\n          END;\n        END;\n\n-- TRIGGER trg_worker_registration_worker_bu_update\nCREATE TRIGGER trg_worker_registration_worker_bu_update\n        BEFORE UPDATE OF worker_id ON worker_registration\n        FOR EACH ROW\n        WHEN NEW.worker_id IS NOT NULL\n        BEGIN\n          SELECT CASE\n            WHEN (\n              SELECT business_unit_id\n              FROM worker\n              WHERE id = NEW.worker_id\n            ) != NEW.business_unit_id\n            THEN RAISE(ABORT, 'REGISTRATION_WORKER_BUSINESS_UNIT_MISMATCH')\n          END;\n        END;\n";

const ERP_SCHEMA_BOOTSTRAP =
  ERP_SCHEMA_V1
    .replace(
      /\bCREATE TABLE (?!IF NOT EXISTS\b)/g,
      "CREATE TABLE IF NOT EXISTS "
    )
    .replace(
      /\bCREATE UNIQUE INDEX (?!IF NOT EXISTS\b)/g,
      "CREATE UNIQUE INDEX IF NOT EXISTS "
    )
    .replace(
      /\bCREATE INDEX (?!IF NOT EXISTS\b)/g,
      "CREATE INDEX IF NOT EXISTS "
    )
    .replace(
      /\bCREATE TRIGGER (?!IF NOT EXISTS\b)/g,
      "CREATE TRIGGER IF NOT EXISTS "
    );

type RknErpCoreEnv =
  Record<string, unknown>;



export type RknRpcAccessLevel =
  | "VIEW"
  | "MANAGE"
  | "OWNER";


export type RknServerDerivedRpcAccess = {
  actorUserId: string;
  permissionCode: string;
  businessUnitId?: string | null;
  allowedAccessLevels?: RknRpcAccessLevel[];
};


type RknNormalizedRpcAccess = {
  actorUserId: string;
  permissionCode: string;
  businessUnitId: string | null;
  allowedAccessLevels: RknRpcAccessLevel[];
};


type RknRpcDb =
  ReturnType<typeof createDoSqliteCompat>;


function cleanRpcText(
  value: unknown,
  maxLength = 240
) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}


function normalizeRpcAccess(
  access: RknServerDerivedRpcAccess
): RknNormalizedRpcAccess {

  const actorUserId =
    cleanRpcText(
      access?.actorUserId,
      180
    );

  const permissionCode =
    cleanRpcText(
      access?.permissionCode,
      180
    );

  const businessUnitId =
    cleanRpcText(
      access?.businessUnitId,
      180
    ) || null;

  const requestedLevels =
    Array.isArray(
      access?.allowedAccessLevels
    )
      ? access.allowedAccessLevels
      : [
          "VIEW",
          "MANAGE",
          "OWNER",
        ];

  const allowedAccessLevels =
    requestedLevels.filter(
      (
        level
      ): level is RknRpcAccessLevel =>
        level === "VIEW" ||
        level === "MANAGE" ||
        level === "OWNER"
    );

  if (!actorUserId) {
    throw new Error(
      "RPC_SERVER_ACTOR_REQUIRED"
    );
  }

  if (!permissionCode) {
    throw new Error(
      "RPC_PERMISSION_REQUIRED"
    );
  }

  if (
    allowedAccessLevels.length === 0
  ) {
    throw new Error(
      "RPC_ACCESS_LEVEL_REQUIRED"
    );
  }

  return {
    actorUserId,
    permissionCode,
    businessUnitId,
    allowedAccessLevels,
  };
}


function assertActiveRpcProfile(
  db: RknRpcDb,
  actorUserId: string
) {

  const profile =
    db.prepare(`
      SELECT active
      FROM erp_user_profile
      WHERE user_id = ?
      LIMIT 1
    `).get(
      actorUserId
    ) as
      | {
          active?: unknown;
        }
      | undefined;

  if (
    !profile ||
    Number(profile.active) !== 1
  ) {
    throw new Error(
      "RPC_PROFILE_INACTIVE"
    );
  }
}


function getRpcBusinessScope(
  db: RknRpcDb,
  actorUserId: string,
  businessUnitId: string
): RknRpcAccessLevel | null {

  const row =
    db.prepare(`
      SELECT access_level
      FROM user_business_scope
      WHERE user_id = ?
        AND business_unit_id = ?
      LIMIT 1
    `).get(
      actorUserId,
      businessUnitId
    ) as
      | {
          access_level?: unknown;
        }
      | undefined;

  const accessLevel =
    cleanRpcText(
      row?.access_level,
      30
    );

  if (
    accessLevel !== "VIEW" &&
    accessLevel !== "MANAGE" &&
    accessLevel !== "OWNER"
  ) {
    return null;
  }

  return accessLevel;
}


function rpcHasBusinessPermission(
  db: RknRpcDb,
  actorUserId: string,
  businessUnitId: string,
  permissionCode: string
) {

  const row =
    db.prepare(`
      SELECT 1 AS allowed
      FROM user_role ur
      JOIN role_permission rp
        ON rp.role_id = ur.role_id
      JOIN permission p
        ON p.id = rp.permission_id
      WHERE ur.user_id = ?
        AND p.code = ?
        AND (
          ur.business_unit_id IS NULL
          OR ur.business_unit_id = ?
        )
      LIMIT 1
    `).get(
      actorUserId,
      permissionCode,
      businessUnitId
    );

  return Boolean(row);
}


function rpcHasGlobalPermission(
  db: RknRpcDb,
  actorUserId: string,
  permissionCode: string
) {

  const row =
    db.prepare(`
      SELECT 1 AS allowed
      FROM user_role ur
      JOIN role_permission rp
        ON rp.role_id = ur.role_id
      JOIN permission p
        ON p.id = rp.permission_id
      WHERE ur.user_id = ?
        AND ur.business_unit_id IS NULL
        AND p.code = ?
      LIMIT 1
    `).get(
      actorUserId,
      permissionCode
    );

  return Boolean(row);
}


function assertRpcMutationAccess(
  db: RknRpcDb,
  access: RknServerDerivedRpcAccess
) {

  const normalized =
    normalizeRpcAccess(
      access
    );

  assertActiveRpcProfile(
    db,
    normalized.actorUserId
  );

  if (
    normalized.businessUnitId
  ) {

    const accessLevel =
      getRpcBusinessScope(
        db,
        normalized.actorUserId,
        normalized.businessUnitId
      );

    if (
      !accessLevel ||
      !normalized.allowedAccessLevels.includes(
        accessLevel
      )
    ) {
      throw new Error(
        "RPC_SCOPE_DENIED"
      );
    }

    if (
      !rpcHasBusinessPermission(
        db,
        normalized.actorUserId,
        normalized.businessUnitId,
        normalized.permissionCode
      )
    ) {
      throw new Error(
        "RPC_PERMISSION_DENIED"
      );
    }

    return normalized;
  }

  if (
    !rpcHasGlobalPermission(
      db,
      normalized.actorUserId,
      normalized.permissionCode
    )
  ) {
    throw new Error(
      "RPC_PERMISSION_DENIED"
    );
  }

  return normalized;
}


function assertRpcReadAccess(
  db: RknRpcDb,
  access: RknServerDerivedRpcAccess
) {

  const normalized =
    normalizeRpcAccess(
      access
    );

  assertActiveRpcProfile(
    db,
    normalized.actorUserId
  );

  if (
    normalized.businessUnitId
  ) {

    const accessLevel =
      getRpcBusinessScope(
        db,
        normalized.actorUserId,
        normalized.businessUnitId
      );

    if (
      accessLevel &&
      normalized.allowedAccessLevels.includes(
        accessLevel
      ) &&
      rpcHasBusinessPermission(
        db,
        normalized.actorUserId,
        normalized.businessUnitId,
        normalized.permissionCode
      )
    ) {
      return normalized;
    }

    if (
      rpcHasGlobalPermission(
        db,
        normalized.actorUserId,
        "system.view_all_business_data"
      )
    ) {
      return normalized;
    }

    if (
      !accessLevel ||
      !normalized.allowedAccessLevels.includes(
        accessLevel
      )
    ) {
      throw new Error(
        "RPC_SCOPE_DENIED"
      );
    }

    throw new Error(
      "RPC_PERMISSION_DENIED"
    );
  }

  if (
    rpcHasGlobalPermission(
      db,
      normalized.actorUserId,
      normalized.permissionCode
    ) ||
    rpcHasGlobalPermission(
      db,
      normalized.actorUserId,
      "system.view_all_business_data"
    )
  ) {
    return normalized;
  }

  throw new Error(
    "RPC_PERMISSION_DENIED"
  );
}


function applyServerDerivedActor(
  operation: string,
  args: unknown[],
  actorUserId: string
) {

  const next =
    [...args];

  switch (operation) {

    case "ingestCanonicalOrderObservationV11": {
      const current = next[0];

      if (
        !current ||
        typeof current !== "object" ||
        Array.isArray(current)
      ) {
        throw new Error("RPC_MUTATION_OBJECT_REQUIRED");
      }

      next[0] = {
        ...(current as Record<string, unknown>),
        actorUserId: actorUserId,
      };

      return next;
    }

    case "applyInventoryAdjustment": {
      const current = next[0];

      if (
        !current ||
        typeof current !== "object" ||
        Array.isArray(current)
      ) {
        throw new Error("RPC_MUTATION_OBJECT_REQUIRED");
      }

      next[0] = {
        ...(current as Record<string, unknown>),
        actorUserId: actorUserId,
      };

      return next;
    }

    case "confirmAllocation":
      next[1] = actorUserId;
      return next;

    case "upsertAllocationDraft": {
      const current = next[0];

      if (
        !current ||
        typeof current !== "object" ||
        Array.isArray(current)
      ) {
        throw new Error("RPC_MUTATION_OBJECT_REQUIRED");
      }

      next[0] = {
        ...(current as Record<string, unknown>),
        actorUserId: actorUserId,
      };

      return next;
    }
    default:
      return next;
  }
}


function readErpAccessContext(
  db: RknRpcDb,
  actorUserIdValue: string
) {

  const actorUserId =
    cleanRpcText(
      actorUserIdValue,
      180
    );

  if (!actorUserId) {
    throw new Error(
      "RPC_SERVER_ACTOR_REQUIRED"
    );
  }

  const profile =
    db.prepare(`
      SELECT *
      FROM erp_user_profile
      WHERE user_id = ?
      LIMIT 1
    `).get(
      actorUserId
    ) ?? null;

  const scopes =
    db.prepare(`
      SELECT *
      FROM user_business_scope
      WHERE user_id = ?
      ORDER BY business_unit_id
    `).all(
      actorUserId
    );

  const userRoles =
    db.prepare(`
      SELECT *
      FROM user_role
      WHERE user_id = ?
      ORDER BY business_unit_id, role_id
    `).all(
      actorUserId
    );

  const roles =
    db.prepare(`
      SELECT DISTINCT r.*
      FROM user_role ur
      JOIN role r
        ON r.id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY r.id
    `).all(
      actorUserId
    );

  const permissions =
    db.prepare(`
      SELECT
        ur.business_unit_id,
        p.id AS permission_id,
        p.code AS permission_code
      FROM user_role ur
      JOIN role_permission rp
        ON rp.role_id = ur.role_id
      JOIN permission p
        ON p.id = rp.permission_id
      WHERE ur.user_id = ?
      ORDER BY
        ur.business_unit_id,
        p.code
    `).all(
      actorUserId
    );

  const businessUnits =
    db.prepare(`
      SELECT DISTINCT bu.*
      FROM user_business_scope ubs
      JOIN business_unit bu
        ON bu.id = ubs.business_unit_id
      WHERE ubs.user_id = ?
      ORDER BY bu.id
    `).all(
      actorUserId
    );

  return {
    actorUserId,
    profile,
    scopes,
    userRoles,
    roles,
    permissions,
    businessUnits,
  };
}



type RknRpcSessionUser = {

  id: string;

  name?: string | null;

  email?: string | null;

  username?: string | null;
};


function legacyAccessError(
  error: unknown
) {

  const code =
    error instanceof Error
      ? error.message
      : "";


  if (
    code ===
      "RPC_PROFILE_INACTIVE"
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "PROFILE_INACTIVE",
    } as const;
  }


  if (
    code ===
      "RPC_SCOPE_DENIED"
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "SCOPE_DENIED",
    } as const;
  }


  if (
    code ===
      "RPC_PERMISSION_DENIED"
  ) {

    return {

      ok: false,

      status: 403,

      error:
        "PERMISSION_DENIED",
    } as const;
  }


  throw error;
}


function createLegacyAccessBridge(
  db: RknRpcDb,

  sessionUser:
    RknRpcSessionUser | null
) {

  const denied =
    () => ({

      ok: false,

      status: 401,

      error:
        "UNAUTHENTICATED",

    } as const);


  const session =
    sessionUser
      ? {
          user:
            sessionUser,
        }
      : null;


  return {


    requireBusinessPermission: async (
      permissionCode: string,

      businessUnitId: string,

      allowedAccessLevels:
        RknRpcAccessLevel[]
    ) => {

      if (!sessionUser) {

        return denied();
      }


      try {

        const granted =
          assertRpcMutationAccess(
            db,
            {
              actorUserId:
                sessionUser.id,

              permissionCode,

              businessUnitId,

              allowedAccessLevels,
            }
          );


        return {

          ok: true,

          session,

          accessLevel:
            businessUnitId
              ? getRpcBusinessScope(
                  db,
                  granted.actorUserId,
                  businessUnitId
                )
              : null,
        };
      }
      catch (error) {

        return legacyAccessError(
          error
        );
      }
    },


    requireBusinessReadPermission: async (
      permissionCode: string,

      businessUnitId: string,

      allowedAccessLevels:
        RknRpcAccessLevel[]
    ) => {

      if (!sessionUser) {

        return denied();
      }


      try {

        const granted =
          assertRpcReadAccess(
            db,
            {
              actorUserId:
                sessionUser.id,

              permissionCode,

              businessUnitId,

              allowedAccessLevels,
            }
          );


        const accessLevel =
          businessUnitId
            ? getRpcBusinessScope(
                db,
                granted.actorUserId,
                businessUnitId
              )
            : null;


        const businessAllowed =
          Boolean(
            businessUnitId &&
            accessLevel &&
            allowedAccessLevels.includes(
              accessLevel
            ) &&
            rpcHasBusinessPermission(
              db,
              granted.actorUserId,
              businessUnitId,
              permissionCode
            )
          );


        return {

          ok: true,

          session,

          accessLevel:
            businessAllowed
              ? accessLevel
              : null,

          accessMode:
            businessAllowed
              ? "BUSINESS"
              : "SYSTEM_OBSERVER",
        };
      }
      catch (error) {

        return legacyAccessError(
          error
        );
      }
    },
  };
}
/*
 * RKN_CANONICAL_PRODUCT_MASTER_SCHEMA_V1
 *
 * Additive schema only.
 * Does not modify ERP_SCHEMA_V1 or its frozen canonical hash.
 */
const ERP_PRODUCT_MASTER_SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS product_master (
  product_id TEXT PRIMARY KEY NOT NULL,
  product_family TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  variant_name TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'PCS',
  canonical_parent_sku TEXT NOT NULL DEFAULT '',
  hpp_default REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','ARCHIVED','INACTIVE')),
  source TEXT NOT NULL DEFAULT 'RKN_BLUEPRINT_V1',
  source_created_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS color_master (
  color_key TEXT PRIMARY KEY NOT NULL,
  color_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','INACTIVE')),
  sync_allowed INTEGER NOT NULL DEFAULT 1
    CHECK (sync_allowed IN (0,1)),
  notes TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'MASTER_SKU_COLOR',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_variant (
  sku_variant TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  product_family TEXT NOT NULL,
  canonical_parent_sku TEXT NOT NULL,
  physical_sku TEXT NOT NULL UNIQUE,
  color_key TEXT NOT NULL,
  color_name TEXT NOT NULL,
  size_name TEXT NOT NULL DEFAULT '',
  validation_status TEXT NOT NULL DEFAULT 'OK',
  sync_eligible INTEGER NOT NULL DEFAULT 1
    CHECK (sync_eligible IN (0,1)),
  source_sheet TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
    CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id)
    REFERENCES product_master(product_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (color_key)
    REFERENCES color_master(color_key)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS physical_sku_master (
  physical_sku TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  product_family TEXT NOT NULL,
  canonical_parent_sku TEXT NOT NULL,
  color_key TEXT NOT NULL,
  color_name TEXT NOT NULL,
  size_name TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
    CHECK (active IN (0,1)),
  source TEXT NOT NULL DEFAULT 'MASTER_SKU_COLOR',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id)
    REFERENCES product_master(product_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (color_key)
    REFERENCES color_master(color_key)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS product_master_seed_state (
  seed_version TEXT PRIMARY KEY NOT NULL,
  seed_sha256 TEXT NOT NULL UNIQUE,
  source_spreadsheet_id TEXT NOT NULL,
  product_count INTEGER NOT NULL,
  variant_count INTEGER NOT NULL,
  color_count INTEGER NOT NULL,
  applied_by_user_id TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_master_status
ON product_master(status, product_family);

CREATE INDEX IF NOT EXISTS idx_product_variant_product
ON product_variant(product_id, active);

CREATE INDEX IF NOT EXISTS idx_product_variant_family
ON product_variant(product_family, active);

CREATE INDEX IF NOT EXISTS idx_product_variant_parent
ON product_variant(canonical_parent_sku, active);

CREATE INDEX IF NOT EXISTS idx_product_variant_color
ON product_variant(color_key, active);

CREATE INDEX IF NOT EXISTS idx_physical_sku_product
ON physical_sku_master(product_id, active);
`;
/*
 * RKN_SAFE_AUTOMATION_SCHEMA_V1
 *
 * Additive foundation for:
 * - marketplace raw events
 * - idempotent automation jobs
 * - automation run ledger
 * - review / quarantine
 * - reconciliation state
 *
 * Default execution mode is SHADOW.
 * No inventory or finance business effect is performed by this layer yet.
 */
const ERP_AUTOMATION_SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS automation_engine_config (
  engine_key TEXT PRIMARY KEY NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
    CHECK (enabled IN (0,1)),
  execution_mode TEXT NOT NULL DEFAULT 'SHADOW'
    CHECK (execution_mode IN ('SHADOW','GUARDED','ACTIVE','PAUSED')),
  interval_ms INTEGER NOT NULL DEFAULT 300000
    CHECK (interval_ms >= 60000),
  max_batch INTEGER NOT NULL DEFAULT 25
    CHECK (max_batch > 0 AND max_batch <= 500),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS marketplace_raw_event (
  event_key TEXT PRIMARY KEY NOT NULL,
  platform TEXT NOT NULL,
  store_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_event_id TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'RECEIVED'
    CHECK (
      status IN (
        'RECEIVED',
        'NORMALIZED',
        'DUPLICATE',
        'REVIEW',
        'FAILED'
      )
    ),
  received_at TEXT NOT NULL,
  normalized_at TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS automation_job (
  job_key TEXT PRIMARY KEY NOT NULL,
  business_unit_id TEXT NOT NULL DEFAULT '',
  job_type TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_key TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  source_ref TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL DEFAULT '{}',
  execution_mode TEXT NOT NULL DEFAULT 'SHADOW'
    CHECK (execution_mode IN ('SHADOW','GUARDED','ACTIVE')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (
      status IN (
        'PENDING',
        'RUNNING',
        'SUCCESS',
        'RETRY',
        'REVIEW',
        'FAILED',
        'CANCELLED'
      )
    ),
  attempt_count INTEGER NOT NULL DEFAULT 0
    CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5
    CHECK (max_attempts > 0),
  next_run_at TEXT NOT NULL DEFAULT '',
  locked_at TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS automation_run (
  run_id TEXT PRIMARY KEY NOT NULL,
  trigger_type TEXT NOT NULL
    CHECK (trigger_type IN ('ALARM','MANUAL','API','INGEST')),
  engine_mode TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('RUNNING','SUCCESS','FAILED')),
  alarm_retry_count INTEGER NOT NULL DEFAULT 0,
  due_job_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_text TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS automation_review_queue (
  review_key TEXT PRIMARY KEY NOT NULL,
  job_key TEXT NOT NULL DEFAULT '',
  business_unit_id TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT '',
  entity_key TEXT NOT NULL DEFAULT '',
  reason_code TEXT NOT NULL,
  reason_text TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','RESOLVED','IGNORED')),
  created_at TEXT NOT NULL,
  resolved_at TEXT NOT NULL DEFAULT '',
  resolved_by TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS automation_idempotency_receipt (
  receipt_key TEXT PRIMARY KEY NOT NULL,
  effect_type TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  job_key TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'RESERVED'
    CHECK (status IN ('RESERVED','APPLIED','RELEASED')),
  created_at TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS reconciliation_state (
  reconciliation_key TEXT PRIMARY KEY NOT NULL,
  business_unit_id TEXT NOT NULL DEFAULT '',
  reconciliation_type TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  store_id TEXT NOT NULL DEFAULT '',
  entity_key TEXT NOT NULL DEFAULT '',
  expected_value REAL NOT NULL DEFAULT 0,
  actual_value REAL NOT NULL DEFAULT 0,
  difference_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','MATCHED','REVIEW','FAILED')),
  details_json TEXT NOT NULL DEFAULT '{}',
  checked_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_raw_event_status
ON marketplace_raw_event(platform, store_id, status, received_at);

CREATE INDEX IF NOT EXISTS idx_automation_job_due
ON automation_job(status, next_run_at, created_at);

CREATE INDEX IF NOT EXISTS idx_automation_job_business_unit
ON automation_job(business_unit_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_automation_run_started
ON automation_run(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_review_open
ON automation_review_queue(status, business_unit_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reconciliation_scope
ON reconciliation_state(
  business_unit_id,
  reconciliation_type,
  status,
  updated_at
);

INSERT OR IGNORE INTO automation_engine_config (
  engine_key,
  enabled,
  execution_mode,
  interval_ms,
  max_batch,
  updated_at
) VALUES (
  'RKN_MAIN',
  1,
  'SHADOW',
  300000,
  25,
  CURRENT_TIMESTAMP
);
`;
/*
 * RKN_PLASTIC_TRADING_DASHBOARD_V1
 *
 * Dedicated additive schema for Plastic Trading.
 * This does not repurpose marketplace transaction/inventory tables.
 * All money fields are integer rupiah.
 * All operational records are scoped to BU-PLASTIC.
 */
const ERP_PLASTIC_TRADING_SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS plastic_product_variant (
  variant_id TEXT PRIMARY KEY NOT NULL,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  product_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'POLYMAILER',
  color TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  base_unit TEXT NOT NULL DEFAULT 'ROLL',
  pack_unit TEXT NOT NULL DEFAULT 'BALL',
  units_per_pack INTEGER NOT NULL DEFAULT 1 CHECK (units_per_pack > 0),
  default_buy_price_rp INTEGER NOT NULL DEFAULT 0 CHECK (default_buy_price_rp >= 0),
  default_sell_price_base_rp INTEGER NOT NULL DEFAULT 0 CHECK (default_sell_price_base_rp >= 0),
  default_sell_price_pack_rp INTEGER NOT NULL DEFAULT 0 CHECK (default_sell_price_pack_rp >= 0),
  low_stock_base_qty REAL NOT NULL DEFAULT 0 CHECK (low_stock_base_qty >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plastic_variant_active
ON plastic_product_variant (business_unit_id, active, product_name, color, size);

CREATE TABLE IF NOT EXISTS plastic_customer (
  customer_id TEXT PRIMARY KEY NOT NULL,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plastic_customer_name
ON plastic_customer (business_unit_id, active, customer_name);

CREATE TABLE IF NOT EXISTS plastic_inventory_balance (
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  variant_id TEXT NOT NULL,
  qty_base REAL NOT NULL DEFAULT 0 CHECK (qty_base >= 0),
  avg_cost_rp INTEGER NOT NULL DEFAULT 0 CHECK (avg_cost_rp >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (business_unit_id, variant_id)
);

CREATE TABLE IF NOT EXISTS plastic_inventory_movement (
  movement_id TEXT PRIMARY KEY NOT NULL,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  variant_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  date_key TEXT NOT NULL,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN (
      'OPENING',
      'IN',
      'OUT',
      'RETURN_IN',
      'RETURN_OUT',
      'ADJUSTMENT_IN',
      'ADJUSTMENT_OUT'
    )),
  qty_base REAL NOT NULL CHECK (qty_base > 0),
  unit_cost_rp INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost_rp >= 0),
  source_type TEXT NOT NULL DEFAULT '',
  source_key TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plastic_movement_period
ON plastic_inventory_movement (business_unit_id, period_key, date_key, movement_type);

CREATE INDEX IF NOT EXISTS idx_plastic_movement_variant
ON plastic_inventory_movement (business_unit_id, variant_id, occurred_at);

CREATE TABLE IF NOT EXISTS plastic_sales_invoice (
  invoice_id TEXT PRIMARY KEY NOT NULL,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  invoice_no TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL DEFAULT '',
  period_key TEXT NOT NULL,
  date_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','PAID','PARTIAL','VOID')),
  subtotal_rp INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_rp >= 0),
  discount_rp INTEGER NOT NULL DEFAULT 0 CHECK (discount_rp >= 0),
  shipping_rp INTEGER NOT NULL DEFAULT 0 CHECK (shipping_rp >= 0),
  grand_total_rp INTEGER NOT NULL DEFAULT 0 CHECK (grand_total_rp >= 0),
  due_date_key TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  actor_user_id TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plastic_invoice_period
ON plastic_sales_invoice (business_unit_id, period_key, date_key, status);

CREATE INDEX IF NOT EXISTS idx_plastic_invoice_customer
ON plastic_sales_invoice (business_unit_id, customer_id, date_key);

CREATE TABLE IF NOT EXISTS plastic_sales_line (
  line_id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  qty_base REAL NOT NULL CHECK (qty_base > 0),
  unit_price_rp INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_rp >= 0),
  line_total_rp INTEGER NOT NULL DEFAULT 0 CHECK (line_total_rp >= 0),
  unit_cogs_rp INTEGER NOT NULL DEFAULT 0 CHECK (unit_cogs_rp >= 0),
  cogs_total_rp INTEGER NOT NULL DEFAULT 0 CHECK (cogs_total_rp >= 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plastic_sales_line_invoice
ON plastic_sales_line (invoice_id);

CREATE INDEX IF NOT EXISTS idx_plastic_sales_line_variant
ON plastic_sales_line (variant_id);

CREATE TABLE IF NOT EXISTS plastic_payment (
  payment_id TEXT PRIMARY KEY NOT NULL,
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  invoice_id TEXT NOT NULL,
  customer_id TEXT NOT NULL DEFAULT '',
  period_key TEXT NOT NULL,
  date_key TEXT NOT NULL,
  amount_rp INTEGER NOT NULL CHECK (amount_rp > 0),
  payment_method TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'POSTED'
    CHECK (status IN ('POSTED','REVERSED')),
  actor_user_id TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plastic_payment_invoice
ON plastic_payment (business_unit_id, invoice_id, status);

CREATE TABLE IF NOT EXISTS plastic_month_close (
  business_unit_id TEXT NOT NULL DEFAULT 'BU-PLASTIC',
  period_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','CLOSED')),
  opening_stock_qty REAL NOT NULL DEFAULT 0,
  inbound_qty REAL NOT NULL DEFAULT 0,
  outbound_qty REAL NOT NULL DEFAULT 0,
  adjustment_qty REAL NOT NULL DEFAULT 0,
  closing_stock_qty REAL NOT NULL DEFAULT 0,
  sales_rp INTEGER NOT NULL DEFAULT 0,
  cogs_rp INTEGER NOT NULL DEFAULT 0,
  gross_profit_rp INTEGER NOT NULL DEFAULT 0,
  receivable_rp INTEGER NOT NULL DEFAULT 0,
  closing_inventory_value_rp INTEGER NOT NULL DEFAULT 0,
  closed_at TEXT NOT NULL DEFAULT '',
  closed_by TEXT NOT NULL DEFAULT '',
  reopen_reason TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (business_unit_id, period_key)
);
`;
export class RknErpCore
  extends DurableObject<RknErpCoreEnv> {

  readonly #globalCore:
    ReturnType<typeof createGlobalBusinessCore>;

  readonly #inventoryCore:
    ReturnType<typeof createInventoryCore>;

  readonly #transactionCore:
    ReturnType<typeof createTransactionCore>;

  constructor(
    ctx: DurableObjectState,
    env: RknErpCoreEnv
  ) {

    super(ctx, env);
    initPlasticTradingV2(this.ctx.storage);
    this.ctx.storage.sql
      .exec(ERP_PLASTIC_TRADING_SCHEMA_V1)
      .toArray();

    this.ctx.storage.sql
      .exec(ERP_SCHEMA_BOOTSTRAP)
      .toArray();
    this.ctx.storage.sql
      .exec(ERP_PRODUCT_MASTER_SCHEMA_V1)
      .toArray();
    this.ctx.storage.sql
      .exec(ERP_AUTOMATION_SCHEMA_V1)
      .toArray();

    /*
     * RKN_SAFE_AUTOMATION_ALARM_INIT_V1
     * Cloudflare alarms are at-least-once.
     * We only ensure an alarm when none already exists.
     * Business effects remain disabled because default mode is SHADOW.
     */
    this.ctx.blockConcurrencyWhile(
      async () => {
        const currentAlarm =
          await this.ctx.storage.getAlarm();

        if (currentAlarm == null) {
          await this.ctx.storage.setAlarm(
            Date.now() + 300000
          );
        }
      }
    );

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    this.#globalCore =
      createGlobalBusinessCore(db);

    this.#inventoryCore =
      createInventoryCore(db);

    this.#transactionCore =
      createTransactionCore(db);
  }

  kernelStatus() {

    return {
      ok: true,
      className: "RknErpCore",
      storage: "SQLITE",
      schemaVersion: ERP_SCHEMA_VERSION,
      schemaSha256: ERP_SCHEMA_SHA256,
      rpcSurface: "KERNEL_ONLY_W1_R3",

      coreMethodCounts: {
        globalBusiness:
          Object.keys(this.#globalCore).length,

        inventory:
          Object.keys(this.#inventoryCore).length,

        transaction:
          Object.keys(this.#transactionCore).length,
      },
    } as const;
  }


  getErpAccessContext(
    actorUserId: string
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    return readErpAccessContext(
      db,
      actorUserId
    );
  }


  ingestCanonicalOrderObservationV11(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcMutationAccess(
        db,
        access
      );

    const core =
      createGlobalBusinessCore(
        db
      );

    const safeArgs =
      applyServerDerivedActor(
        "ingestCanonicalOrderObservationV11",
        args,
        granted.actorUserId
      );

    return (
      core.ingestCanonicalOrderObservationV11 as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  resolveActiveStoreBusinessScopeV11(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createGlobalBusinessCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.resolveActiveStoreBusinessScopeV11 as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  applyInventoryAdjustment(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcMutationAccess(
        db,
        access
      );

    const core =
      createInventoryCore(
        db
      );

    const safeArgs =
      applyServerDerivedActor(
        "applyInventoryAdjustment",
        args,
        granted.actorUserId
      );

    return (
      core.applyInventoryAdjustment as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  confirmAllocation(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcMutationAccess(
        db,
        access
      );

    const core =
      createInventoryCore(
        db
      );

    const safeArgs =
      applyServerDerivedActor(
        "confirmAllocation",
        args,
        granted.actorUserId
      );

    return (
      core.confirmAllocation as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  getAllocation(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createInventoryCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.getAllocation as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  getInventoryBalance(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createInventoryCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.getInventoryBalance as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  getInventoryCoreStats(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createInventoryCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.getInventoryCoreStats as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  getRecentInventoryLedger(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createInventoryCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.getRecentInventoryLedger as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  upsertAllocationDraft(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcMutationAccess(
        db,
        access
      );

    const core =
      createInventoryCore(
        db
      );

    const safeArgs =
      applyServerDerivedActor(
        "upsertAllocationDraft",
        args,
        granted.actorUserId
      );

    return (
      core.upsertAllocationDraft as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  getRecentTransactions(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createTransactionCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.getRecentTransactions as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  getTransactionCoreStats(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createTransactionCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.getTransactionCoreStats as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  lookupHistoricalHpp(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcReadAccess(
        db,
        access
      );

    const core =
      createTransactionCore(
        db
      );

    const safeArgs =
      args;

    return (
      core.lookupHistoricalHpp as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  upsertTransactionLine(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcMutationAccess(
        db,
        access
      );

    const core =
      createTransactionCore(
        db
      );

    const safeArgs =
      applyServerDerivedActor(
        "upsertTransactionLine",
        args,
        granted.actorUserId
      );

    return (
      core.upsertTransactionLine as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }


  upsertTransactionLines(
    access: RknServerDerivedRpcAccess,
    ...args: unknown[]
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const granted =
      assertRpcMutationAccess(
        db,
        access
      );

    const core =
      createTransactionCore(
        db
      );

    const safeArgs =
      applyServerDerivedActor(
        "upsertTransactionLines",
        args,
        granted.actorUserId
      );

    return (
      core.upsertTransactionLines as (
        ...innerArgs: any[]
      ) => unknown
    )(
      ...safeArgs
    );
  }




  getPublicWorkerRegistrationByToken(
    request: Request,
    token: string
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const ops =
      createPublicWorkerRegistrationOps({

        db,

        sessionUser:
          null,
      });


    return ops.GET(
      request,
      {
        params:
          Promise.resolve({
            token,
          }),
      }
    );
  }


  submitPublicWorkerRegistration(
    request: Request,
    token: string
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const ops =
      createPublicWorkerRegistrationOps({

        db,

        sessionUser:
          null,
      });


    return ops.POST(
      request,
      {
        params:
          Promise.resolve({
            token,
          }),
      }
    );
  }


  /*
   * RKN_ADMIN_ACCESS_PROVISIONING_V1
   * SYSTEM_ADMIN-only access directory + provisioning.
   */
  getAdminAccessDirectory(
    actorUserIdValue: string
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    if (!actorUserId) {
      throw new Error(
        "RPC_SERVER_ACTOR_REQUIRED"
      );
    }

    const admin =
      db.prepare(`
        SELECT 1 AS ok
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE
          ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
      `).get(actorUserId);

    if (!admin) {
      throw new Error(
        "RPC_SYSTEM_ADMIN_REQUIRED"
      );
    }

    const roles =
      db.prepare(`
        SELECT
          id,
          code,
          name,
          description,
          scope_mode,
          is_system
        FROM role
        ORDER BY
          is_system DESC,
          name,
          code
      `).all();

    const businessUnits =
      db.prepare(`
        SELECT
          id,
          code,
          name,
          owner_key,
          kind,
          active
        FROM business_unit
        WHERE active = 1
        ORDER BY
          kind,
          name,
          code
      `).all();

    const profiles =
      db.prepare(`
        SELECT
          user_id,
          person_key,
          full_name,
          active,
          must_change_password,
          identity_code,
          primary_role_code,
          created_at,
          updated_at
        FROM erp_user_profile
        ORDER BY
          full_name,
          user_id
      `).all();

    const assignments =
      db.prepare(`
        SELECT
          ur.user_id,
          ur.role_id,
          r.code AS role_code,
          r.name AS role_name,
          r.scope_mode,
          ur.business_unit_id
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        ORDER BY
          ur.user_id,
          r.code
      `).all();

    const scopes =
      db.prepare(`
        SELECT
          ubs.user_id,
          ubs.business_unit_id,
          bu.code AS business_unit_code,
          bu.name AS business_unit_name,
          ubs.access_level
        FROM user_business_scope ubs
        JOIN business_unit bu
          ON bu.id = ubs.business_unit_id
        ORDER BY
          ubs.user_id,
          bu.code
      `).all();

    return {
      ok: true,
      roles,
      businessUnits,
      profiles,
      assignments,
      scopes,
    };
  }


  provisionPendingErpUserAccess(
    actorUserIdValue: string,
    targetUserIdValue: string,
    fullNameValue: string,
    roleCodeValue: string,
    businessUnitIdValue: string,
    accessLevelValue: string
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    const targetUserId =
      cleanRpcText(
        targetUserIdValue,
        180
      );

    const fullName =
      cleanRpcText(
        fullNameValue,
        180
      );

    const roleCode =
      cleanRpcText(
        roleCodeValue,
        80
      ).toUpperCase();

    const requestedBusinessUnitId =
      cleanRpcText(
        businessUnitIdValue,
        180
      );

    const accessLevel =
      cleanRpcText(
        accessLevelValue,
        30
      ).toUpperCase();

    if (
      !actorUserId ||
      !targetUserId ||
      !fullName ||
      !roleCode
    ) {
      throw new Error(
        "RPC_APPROVAL_INPUT_REQUIRED"
      );
    }

    const allowedAccess =
      new Set([
        "VIEW",
        "OPERATE",
        "MANAGE",
        "OWNER",
      ]);

    if (!allowedAccess.has(accessLevel)) {
      throw new Error(
        "RPC_ACCESS_LEVEL_INVALID"
      );
    }

    const admin =
      db.prepare(`
        SELECT 1 AS ok
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE
          ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
      `).get(actorUserId);

    if (!admin) {
      throw new Error(
        "RPC_SYSTEM_ADMIN_REQUIRED"
      );
    }

    const role =
      db.prepare(`
        SELECT
          id,
          code,
          scope_mode
        FROM role
        WHERE code = ?
        LIMIT 1
      `).get(roleCode) as
        | {
            id?: unknown;
            code?: unknown;
            scope_mode?: unknown;
          }
        | undefined;

    if (!role) {
      throw new Error(
        "RPC_ROLE_NOT_FOUND"
      );
    }

    const roleId =
      String(role.id ?? "");

    const scopeMode =
      String(
        role.scope_mode ?? ""
      ).toUpperCase();

    let businessUnitId = "";

    if (scopeMode === "UNIT") {
      businessUnitId =
        requestedBusinessUnitId;

      if (!businessUnitId) {
        throw new Error(
          "RPC_BUSINESS_UNIT_REQUIRED"
        );
      }

      const unit =
        db.prepare(`
          SELECT id
          FROM business_unit
          WHERE
            id = ?
            AND active = 1
          LIMIT 1
        `).get(businessUnitId);

      if (!unit) {
        throw new Error(
          "RPC_BUSINESS_UNIT_NOT_FOUND"
        );
      }
    }

    const personKey =
      `AUTH:${targetUserId}`;

    const apply =
      db.transaction(
        () => {
          db.prepare(`
            INSERT INTO erp_user_profile (
              user_id,
              person_key,
              full_name,
              active,
              must_change_password,
              primary_role_code
            )
            VALUES (
              ?, ?, ?, 1, 0, ?
            )
            ON CONFLICT(user_id)
            DO UPDATE SET
              full_name = excluded.full_name,
              active = 1,
              must_change_password = 0,
              primary_role_code =
                excluded.primary_role_code,
              updated_at =
                CURRENT_TIMESTAMP
          `).run(
            targetUserId,
            personKey,
            fullName,
            roleCode
          );

          db.prepare(`
            DELETE FROM user_business_scope
            WHERE user_id = ?
          `).run(targetUserId);

          db.prepare(`
            DELETE FROM user_role
            WHERE user_id = ?
          `).run(targetUserId);

          db.prepare(`
            INSERT INTO user_role (
              id,
              user_id,
              role_id,
              business_unit_id
            )
            VALUES (?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            targetUserId,
            roleId,
            businessUnitId || null
          );

          if (scopeMode === "UNIT") {
            db.prepare(`
              INSERT INTO user_business_scope (
                user_id,
                business_unit_id,
                access_level
              )
              VALUES (?, ?, ?)
            `).run(
              targetUserId,
              businessUnitId,
              accessLevel
            );
          }

          db.prepare(`
            INSERT INTO audit_log (
              id,
              actor_user_id,
              action,
              entity_type,
              entity_id,
              details_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            actorUserId,
            "AUTH_ACCOUNT_APPROVED",
            "USER",
            targetUserId,
            JSON.stringify({
              roleCode,
              scopeMode,
              businessUnitId:
                businessUnitId || null,
              accessLevel:
                scopeMode === "UNIT"
                  ? accessLevel
                  : null,
            })
          );

          return {
            ok: true,
            userId: targetUserId,
            roleCode,
            scopeMode,
            businessUnitId:
              businessUnitId || null,
            accessLevel:
              scopeMode === "UNIT"
                ? accessLevel
                : null,
          };
        }
      );

    return apply();
  }

  /*
   * RKN_ROLE_WORKSPACE_REPORT_V2
   *
   * Canonical role-aware read model.
   * It never fabricates finance or settlement values.
   * Every numeric metric below is derived from an existing canonical table.
   */
  /*
   * RKN_PLASTIC_TRADING_DASHBOARD_V1
   * Server-derived actor only. SYSTEM_ADMIN or scoped BU-PLASTIC user may read.
   */
  /* RKN_PLASTIC_V2_WRAPPERS */
  getPlasticTradingView(actorUserId:string,view?:string,periodKey?:string){
    return getPlasticTradingViewV2(this.ctx.storage,actorUserId,view,periodKey);
  }

  mutatePlasticTrading(actorUserId:string,command:string,payload?:unknown){
    return mutatePlasticTradingV2(this.ctx.storage,actorUserId,command,payload);
  }

  getPlasticTradingDashboard(
    actorUserIdValue: string,
    periodKeyValue?: string
  ) {
    const sql = this.ctx.storage.sql;

    const actorUserId =
      String(actorUserIdValue ?? "").trim();

    if (!actorUserId) {
      throw new Error("PLASTIC_ACTOR_REQUIRED");
    }

    const profileRows =
      sql.exec(
        `
        SELECT
          active,
          full_name,
          primary_role_code
        FROM erp_user_profile
        WHERE user_id = ?
        LIMIT 1
        `,
        actorUserId
      ).toArray() as any[];

    const profile = profileRows[0];

    if (!profile || Number(profile.active) !== 1) {
      throw new Error("PLASTIC_PROFILE_INACTIVE");
    }

    const buRows =
      sql.exec(
        `
        SELECT id, code, name
        FROM business_unit
        WHERE id = 'BU-PLASTIC'
          AND code = 'PLASTIC_TRADING'
          AND active = 1
        LIMIT 1
        `
      ).toArray() as any[];

    const businessUnit = buRows[0];

    if (!businessUnit) {
      throw new Error("PLASTIC_BUSINESS_UNIT_MISSING");
    }

    const adminRows =
      sql.exec(
        `
        SELECT 1 AS allowed
        FROM user_role ur
        JOIN role r ON r.id = ur.role_id
        WHERE ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
        `,
        actorUserId
      ).toArray() as any[];

    const isSystemAdmin = adminRows.length > 0;

    const scopeRows =
      sql.exec(
        `
        SELECT access_level
        FROM user_business_scope
        WHERE user_id = ?
          AND business_unit_id = 'BU-PLASTIC'
        LIMIT 1
        `,
        actorUserId
      ).toArray() as any[];

    const accessLevel =
      isSystemAdmin
        ? "OWNER"
        : String(scopeRows[0]?.access_level ?? "");

    if (
      !isSystemAdmin &&
      !["VIEW", "OPERATE", "MANAGE", "OWNER"].includes(accessLevel)
    ) {
      throw new Error("PLASTIC_SCOPE_DENIED");
    }

    const jakartaPeriodParts =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
        }
      ).formatToParts(new Date());

    const currentYear =
      jakartaPeriodParts.find(
        (part) => part.type === "year"
      )?.value ?? "";

    const currentMonth =
      jakartaPeriodParts.find(
        (part) => part.type === "month"
      )?.value ?? "";

    const currentPeriod =
      `${currentYear}-${currentMonth}`;

    const requested =
      String(periodKeyValue ?? "").trim();

    const periodKey =
      /^\d{4}-\d{2}$/.test(requested)
        ? requested
        : currentPeriod;

    const scalar = (
      query: string,
      ...bindings: Array<string | number>
    ) => {
      const rows =
        sql.exec(query, ...bindings).toArray() as any[];
      return Number(rows[0]?.value ?? 0);
    };

    const inboundQty =
      scalar(
        `
        SELECT COALESCE(SUM(qty_base), 0) AS value
        FROM plastic_inventory_movement
        WHERE business_unit_id = 'BU-PLASTIC'
          AND period_key = ?
          AND movement_type IN (
            'OPENING',
            'IN',
            'RETURN_IN',
            'ADJUSTMENT_IN'
          )
        `,
        periodKey
      );

    const outboundQty =
      scalar(
        `
        SELECT COALESCE(SUM(qty_base), 0) AS value
        FROM plastic_inventory_movement
        WHERE business_unit_id = 'BU-PLASTIC'
          AND period_key = ?
          AND movement_type IN (
            'OUT',
            'RETURN_OUT',
            'ADJUSTMENT_OUT'
          )
        `,
        periodKey
      );

    const salesRp =
      scalar(
        `
        SELECT COALESCE(SUM(grand_total_rp), 0) AS value
        FROM plastic_sales_invoice
        WHERE business_unit_id = 'BU-PLASTIC'
          AND period_key = ?
          AND status <> 'VOID'
        `,
        periodKey
      );

    const cogsRp =
      scalar(
        `
        SELECT COALESCE(SUM(sl.cogs_total_rp), 0) AS value
        FROM plastic_sales_line sl
        JOIN plastic_sales_invoice si
          ON si.invoice_id = sl.invoice_id
        WHERE si.business_unit_id = 'BU-PLASTIC'
          AND si.period_key = ?
          AND si.status <> 'VOID'
        `,
        periodKey
      );

    const receivableRp =
      scalar(
        `
        SELECT COALESCE(
          SUM(
            CASE
              WHEN i.grand_total_rp - COALESCE(p.paid_rp, 0) > 0
              THEN i.grand_total_rp - COALESCE(p.paid_rp, 0)
              ELSE 0
            END
          ),
          0
        ) AS value
        FROM plastic_sales_invoice i
        LEFT JOIN (
          SELECT
            invoice_id,
            SUM(
              CASE
                WHEN status = 'POSTED' THEN amount_rp
                ELSE 0
              END
            ) AS paid_rp
          FROM plastic_payment
          WHERE business_unit_id = 'BU-PLASTIC'
          GROUP BY invoice_id
        ) p
          ON p.invoice_id = i.invoice_id
        WHERE i.business_unit_id = 'BU-PLASTIC'
          AND i.status <> 'VOID'
        `
      );

    const stockQty =
      scalar(
        `
        SELECT COALESCE(SUM(qty_base), 0) AS value
        FROM plastic_inventory_balance
        WHERE business_unit_id = 'BU-PLASTIC'
        `
      );

    const stockValueRp =
      scalar(
        `
        SELECT COALESCE(
          SUM(qty_base * avg_cost_rp),
          0
        ) AS value
        FROM plastic_inventory_balance
        WHERE business_unit_id = 'BU-PLASTIC'
        `
      );

    const movementTrend =
      sql.exec(
        `
        SELECT
          date_key AS dateKey,
          SUM(
            CASE
              WHEN movement_type IN (
                'OPENING',
                'IN',
                'RETURN_IN',
                'ADJUSTMENT_IN'
              )
              THEN qty_base
              ELSE 0
            END
          ) AS inboundQty,
          SUM(
            CASE
              WHEN movement_type IN (
                'OUT',
                'RETURN_OUT',
                'ADJUSTMENT_OUT'
              )
              THEN qty_base
              ELSE 0
            END
          ) AS outboundQty
        FROM plastic_inventory_movement
        WHERE business_unit_id = 'BU-PLASTIC'
          AND period_key = ?
        GROUP BY date_key
        ORDER BY date_key
        `,
        periodKey
      ).toArray() as any[];

    const salesTrend =
      sql.exec(
        `
        SELECT
          date_key AS dateKey,
          COALESCE(SUM(grand_total_rp), 0) AS salesRp
        FROM plastic_sales_invoice
        WHERE business_unit_id = 'BU-PLASTIC'
          AND period_key = ?
          AND status <> 'VOID'
        GROUP BY date_key
        ORDER BY date_key
        `,
        periodKey
      ).toArray() as any[];

    const topCustomers =
      sql.exec(
        `
        SELECT
          COALESCE(c.customer_name, 'Tanpa Customer') AS customerName,
          COUNT(DISTINCT i.invoice_id) AS invoiceCount,
          COALESCE(SUM(i.grand_total_rp), 0) AS salesRp,
          COALESCE(
            SUM(
              CASE
                WHEN i.grand_total_rp - COALESCE(pp.paid_rp, 0) > 0
                THEN i.grand_total_rp - COALESCE(pp.paid_rp, 0)
                ELSE 0
              END
            ),
            0
          ) AS outstandingRp
        FROM plastic_sales_invoice i
        LEFT JOIN plastic_customer c
          ON c.customer_id = i.customer_id
        LEFT JOIN (
          SELECT
            invoice_id,
            SUM(
              CASE
                WHEN status = 'POSTED' THEN amount_rp
                ELSE 0
              END
            ) AS paid_rp
          FROM plastic_payment
          WHERE business_unit_id = 'BU-PLASTIC'
          GROUP BY invoice_id
        ) pp
          ON pp.invoice_id = i.invoice_id
        WHERE i.business_unit_id = 'BU-PLASTIC'
          AND i.period_key = ?
          AND i.status <> 'VOID'
        GROUP BY i.customer_id, c.customer_name
        ORDER BY salesRp DESC
        LIMIT 5
        `,
        periodKey
      ).toArray() as any[];

    const lowStock =
      sql.exec(
        `
        SELECT
          v.product_name AS productName,
          v.color,
          v.size,
          v.base_unit AS baseUnit,
          v.pack_unit AS packUnit,
          v.units_per_pack AS unitsPerPack,
          COALESCE(b.qty_base, 0) AS qtyBase,
          v.low_stock_base_qty AS lowStockBaseQty
        FROM plastic_product_variant v
        LEFT JOIN plastic_inventory_balance b
          ON b.business_unit_id = v.business_unit_id
          AND b.variant_id = v.variant_id
        WHERE v.business_unit_id = 'BU-PLASTIC'
          AND v.active = 1
          AND COALESCE(b.qty_base, 0) <= v.low_stock_base_qty
        ORDER BY COALESCE(b.qty_base, 0), v.product_name, v.color, v.size
        LIMIT 8
        `
      ).toArray() as any[];

    const closeRows =
      sql.exec(
        `
        SELECT status, closed_at, closed_by
        FROM plastic_month_close
        WHERE business_unit_id = 'BU-PLASTIC'
          AND period_key = ?
        LIMIT 1
        `,
        periodKey
      ).toArray() as any[];

    return {
      marker: "RKN_PLASTIC_TRADING_DASHBOARD_V1",
      generatedAt: new Date().toISOString(),
      timeZone: "Asia/Jakarta",
      periodKey,
      periodStatus: String(closeRows[0]?.status ?? "OPEN"),
      closedAt: String(closeRows[0]?.closed_at ?? ""),
      businessUnit: {
        id: String(businessUnit.id ?? "BU-PLASTIC"),
        code: String(businessUnit.code ?? "PLASTIC_TRADING"),
        name: String(businessUnit.name ?? "Plastic Trading"),
      },
      actor: {
        userId: actorUserId,
        fullName: String(profile.full_name ?? ""),
        roleCode: String(profile.primary_role_code ?? ""),
        accessLevel,
        isSystemAdmin,
      },
      metrics: {
        inboundQty,
        outboundQty,
        stockQty,
        salesRp,
        cogsRp,
        grossProfitRp: salesRp - cogsRp,
        receivableRp,
        stockValueRp,
      },
      movementTrend: movementTrend.map((row) => ({
        dateKey: String(row.dateKey ?? ""),
        inboundQty: Number(row.inboundQty ?? 0),
        outboundQty: Number(row.outboundQty ?? 0),
      })),
      salesTrend: salesTrend.map((row) => ({
        dateKey: String(row.dateKey ?? ""),
        salesRp: Number(row.salesRp ?? 0),
      })),
      topCustomers: topCustomers.map((row) => ({
        customerName: String(row.customerName ?? ""),
        invoiceCount: Number(row.invoiceCount ?? 0),
        salesRp: Number(row.salesRp ?? 0),
        outstandingRp: Number(row.outstandingRp ?? 0),
      })),
      lowStock: lowStock.map((row) => ({
        productName: String(row.productName ?? ""),
        color: String(row.color ?? ""),
        size: String(row.size ?? ""),
        baseUnit: String(row.baseUnit ?? "ROLL"),
        packUnit: String(row.packUnit ?? "BALL"),
        unitsPerPack: Number(row.unitsPerPack ?? 1),
        qtyBase: Number(row.qtyBase ?? 0),
        lowStockBaseQty: Number(row.lowStockBaseQty ?? 0),
      })),
    };
  }

  getRoleWorkspaceReport(
    actorUserIdValue: string
  ) {
    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    if (!actorUserId) {
      throw new Error(
        "RPC_SERVER_ACTOR_REQUIRED"
      );
    }

    const sql =
      this.ctx.storage.sql;

    const profileRows =
      sql.exec(
        `
        SELECT
          user_id,
          full_name,
          active,
          primary_role_code
        FROM erp_user_profile
        WHERE user_id = ?
        LIMIT 1
        `,
        actorUserId
      ).toArray() as any[];

    const profile =
      profileRows[0] ?? null;

    if (
      !profile ||
      Number(profile.active) !== 1
    ) {
      throw new Error(
        "RPC_ACTIVE_PROFILE_REQUIRED"
      );
    }

    const roleRows =
      sql.exec(
        `
        SELECT DISTINCT
          r.code AS role_code
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE ur.user_id = ?
        ORDER BY r.code
        `,
        actorUserId
      ).toArray() as any[];

    const roleCodes =
      roleRows
        .map(
          (row) =>
            String(
              row.role_code ?? ""
            )
        )
        .filter(Boolean);

    const isSystemAdmin =
      roleCodes.includes(
        "SYSTEM_ADMIN"
      );

    const unitRows =
      (
        isSystemAdmin
          ? sql.exec(
              `
              SELECT
                id,
                code,
                name,
                kind,
                'OWNER' AS access_level
              FROM business_unit
              WHERE active = 1
              ORDER BY code
              `
            )
          : sql.exec(
              `
              SELECT DISTINCT
                bu.id,
                bu.code,
                bu.name,
                bu.kind,
                ubs.access_level
              FROM user_business_scope ubs
              JOIN business_unit bu
                ON bu.id =
                  ubs.business_unit_id
              WHERE
                ubs.user_id = ?
                AND bu.active = 1
              ORDER BY bu.code
              `,
              actorUserId
            )
      ).toArray() as any[];

    const scalar = (
      query: string,
      ...bindings:
        Array<string | number>
    ) => {
      const rows =
        sql.exec(
          query,
          ...bindings
        ).toArray() as any[];

      return Number(
        rows[0]?.value ?? 0
      );
    };

    let orderCount = 0;
    let orderLineCount = 0;
    let businessEventCount = 0;
    let physicalStockQty = 0;
    let inventoryMovementCount = 0;
    let allocationDraftCount = 0;
    let allocationConfirmedCount = 0;
    let workerCount = 0;
    let pendingWorkerRegistrationCount = 0;
    let transactionLineCount = 0;
    let cogsTotal = 0;
    let automationPendingCount = 0;
    let automationRetryCount = 0;
    let automationReviewCount = 0;
    let automationFailedCount = 0;
    let reconciliationReviewCount = 0;

    for (const unit of unitRows) {
      const businessUnitId =
        String(
          unit.id ?? ""
        );

      if (!businessUnitId) {
        continue;
      }

      orderCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM business_order
          WHERE business_unit_id = ?
          `,
          businessUnitId
        );

      orderLineCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM business_order_line
          WHERE business_unit_id = ?
          `,
          businessUnitId
        );

      businessEventCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM business_event
          WHERE business_unit_id = ?
          `,
          businessUnitId
        );

      physicalStockQty +=
        scalar(
          `
          SELECT
            COALESCE(
              SUM(qty_on_hand),
              0
            ) AS value
          FROM inventory_balance
          WHERE business_unit_id = ?
          `,
          businessUnitId
        );

      inventoryMovementCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM inventory_ledger
          WHERE business_unit_id = ?
          `,
          businessUnitId
        );

      allocationDraftCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM order_allocation
          WHERE
            business_unit_id = ?
            AND status = 'DRAFT'
          `,
          businessUnitId
        );

      allocationConfirmedCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM order_allocation
          WHERE
            business_unit_id = ?
            AND status = 'CONFIRMED'
          `,
          businessUnitId
        );

      workerCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM worker
          WHERE
            business_unit_id = ?
            AND active = 1
          `,
          businessUnitId
        );

      pendingWorkerRegistrationCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM worker_registration
          WHERE
            business_unit_id = ?
            AND status = 'PENDING'
          `,
          businessUnitId
        );

      transactionLineCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM transaction_ledger t
          JOIN marketplace_store_scope s
            ON
              s.platform = t.platform
              AND s.store_id = t.store_id
              AND s.active = 1
          WHERE
            s.business_unit_id = ?
          `,
          businessUnitId
        );

      cogsTotal +=
        scalar(
          `
          SELECT
            COALESCE(
              SUM(t.cogs_total),
              0
            ) AS value
          FROM transaction_ledger t
          JOIN marketplace_store_scope s
            ON
              s.platform = t.platform
              AND s.store_id = t.store_id
              AND s.active = 1
          WHERE
            s.business_unit_id = ?
          `,
          businessUnitId
        );

      automationPendingCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM automation_job
          WHERE
            business_unit_id = ?
            AND status = 'PENDING'
          `,
          businessUnitId
        );

      automationRetryCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM automation_job
          WHERE
            business_unit_id = ?
            AND status = 'RETRY'
          `,
          businessUnitId
        );

      automationReviewCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM automation_review_queue
          WHERE
            business_unit_id = ?
            AND status = 'OPEN'
          `,
          businessUnitId
        );

      automationFailedCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM automation_job
          WHERE
            business_unit_id = ?
            AND status = 'FAILED'
          `,
          businessUnitId
        );

      reconciliationReviewCount +=
        scalar(
          `
          SELECT COUNT(*) AS value
          FROM reconciliation_state
          WHERE
            business_unit_id = ?
            AND status IN (
              'REVIEW',
              'FAILED'
            )
          `,
          businessUnitId
        );
    }

    const productCount =
      scalar(
        `
        SELECT COUNT(*) AS value
        FROM product_master
        WHERE status = 'ACTIVE'
        `
      );

    const physicalSkuCount =
      scalar(
        `
        SELECT COUNT(*) AS value
        FROM physical_sku_master
        WHERE active = 1
        `
      );

    const configRows =
      sql.exec(
        `
        SELECT
          enabled,
          execution_mode,
          interval_ms,
          max_batch,
          updated_at
        FROM automation_engine_config
        WHERE engine_key = 'RKN_MAIN'
        LIMIT 1
        `
      ).toArray() as any[];

    const config =
      configRows[0] ?? {};

    const lastRunRows =
      sql.exec(
        `
        SELECT
          run_id,
          trigger_type,
          engine_mode,
          status,
          due_job_count,
          processed_count,
          review_count,
          failed_count,
          started_at,
          finished_at
        FROM automation_run
        ORDER BY started_at DESC
        LIMIT 1
        `
      ).toArray() as any[];

    return {
      generatedAt:
        new Date().toISOString(),

      profile: {
        fullName:
          String(
            profile.full_name ?? ""
          ),
        primaryRoleCode:
          String(
            profile.primary_role_code ?? ""
          ),
      },

      roles:
        roleCodes,

      businessUnits:
        unitRows.map(
          (row) => ({
            id:
              String(
                row.id ?? ""
              ),
            code:
              String(
                row.code ?? ""
              ),
            name:
              String(
                row.name ?? ""
              ),
            kind:
              String(
                row.kind ?? ""
              ),
            accessLevel:
              String(
                row.access_level ?? ""
              ),
          })
        ),

      metrics: {
        businessUnitCount:
          unitRows.length,
        orderCount,
        orderLineCount,
        businessEventCount,
        physicalStockQty,
        inventoryMovementCount,
        allocationDraftCount,
        allocationConfirmedCount,
        workerCount,
        pendingWorkerRegistrationCount,
        transactionLineCount,
        cogsTotal,
        productCount,
        physicalSkuCount,
      },

      engine: {
        enabled:
          Number(
            config.enabled ?? 0
          ) === 1,
        mode:
          String(
            config.execution_mode ??
              "SHADOW"
          ),
        intervalMs:
          Number(
            config.interval_ms ??
              300000
          ),
        maxBatch:
          Number(
            config.max_batch ??
              25
          ),
        pendingCount:
          automationPendingCount,
        retryCount:
          automationRetryCount,
        reviewCount:
          automationReviewCount,
        failedCount:
          automationFailedCount,
        reconciliationReviewCount,
        lastRun:
          lastRunRows[0] ?? null,
      },

      capabilities: {
        canonicalOrders:
          "LIVE",
        inventoryLedger:
          "LIVE",
        hppAndCogs:
          "PARTIAL",
        marketplaceApi:
          "CONNECTOR_REQUIRED",
        settlementLedger:
          "SCHEMA_REQUIRED",
        financeLedger:
          "SCHEMA_REQUIRED",
        automationBusinessEffects:
          "SHADOW",
        reviewQuarantine:
          "LIVE_FOUNDATION",
        reconciliation:
          "LIVE_FOUNDATION",
      },
    };
  }

  /*
   * RKN_SAFE_AUTOMATION_RUNNER_V1
   *
   * The alarm is active, but business effects are not.
   * In SHADOW mode the runner records heartbeat/run health and observes
   * due jobs without mutating inventory, orders, HPP, payroll, or finance.
   */
  #runAutomationTickInternal(
    triggerTypeValue: string,
    alarmRetryCountValue: number
  ) {
    const sql =
      this.ctx.storage.sql;

    const startedAt =
      new Date().toISOString();

    const runId =
      "AUTO-" +
      crypto.randomUUID();

    const configRows =
      sql.exec(
        `
        SELECT
          enabled,
          execution_mode,
          interval_ms,
          max_batch
        FROM automation_engine_config
        WHERE engine_key = 'RKN_MAIN'
        LIMIT 1
        `
      ).toArray() as any[];

    const config =
      configRows[0] ?? {};

    const enabled =
      Number(
        config.enabled ?? 1
      ) === 1;

    const engineMode =
      String(
        config.execution_mode ??
          "SHADOW"
      );

    const intervalMs =
      Math.max(
        60000,
        Number(
          config.interval_ms ??
            300000
        )
      );

    const maxBatch =
      Math.max(
        1,
        Math.min(
          500,
          Number(
            config.max_batch ??
              25
          )
        )
      );

    sql.exec(
      `
      INSERT INTO automation_run (
        run_id,
        trigger_type,
        engine_mode,
        status,
        alarm_retry_count,
        due_job_count,
        processed_count,
        success_count,
        retry_count,
        review_count,
        failed_count,
        error_text,
        started_at,
        finished_at
      ) VALUES (
        ?,
        ?,
        ?,
        'RUNNING',
        ?,
        0,
        0,
        0,
        0,
        0,
        0,
        '',
        ?,
        ''
      )
      `,
      runId,
      triggerTypeValue,
      engineMode,
      Math.max(
        0,
        Number(
          alarmRetryCountValue ?? 0
        )
      ),
      startedAt
    ).toArray();

    try {
      let dueJobCount = 0;

      if (enabled) {
        const now =
          new Date().toISOString();

        const dueRows =
          sql.exec(
            `
            SELECT
              job_key
            FROM automation_job
            WHERE
              status IN (
                'PENDING',
                'RETRY'
              )
              AND (
                next_run_at = ''
                OR next_run_at <= ?
              )
            ORDER BY created_at
            LIMIT ${maxBatch}
            `,
            now
          ).toArray() as any[];

        dueJobCount =
          dueRows.length;
      }

      const finishedAt =
        new Date().toISOString();

      sql.exec(
        `
        UPDATE automation_run
        SET
          status = 'SUCCESS',
          due_job_count = ?,
          finished_at = ?
        WHERE run_id = ?
        `,
        dueJobCount,
        finishedAt,
        runId
      ).toArray();

      return {
        intervalMs,
        runId,
        mode:
          engineMode,
        enabled,
        dueJobCount,
      };
    }
    catch (error) {
      const finishedAt =
        new Date().toISOString();

      const errorText =
        error instanceof Error
          ? error.message
          : String(error);

      sql.exec(
        `
        UPDATE automation_run
        SET
          status = 'FAILED',
          error_text = ?,
          finished_at = ?
        WHERE run_id = ?
        `,
        errorText.slice(0, 1000),
        finishedAt,
        runId
      ).toArray();

      return {
        intervalMs,
        runId,
        mode:
          engineMode,
        enabled,
        dueJobCount:
          0,
      };
    }
  }

  async alarm(
    alarmInfo?: {
      retryCount?: number;
      isRetry?: boolean;
    }
  ) {
    const result =
      this.#runAutomationTickInternal(
        "ALARM",
        Number(
          alarmInfo?.retryCount ?? 0
        )
      );

    await this.ctx.storage.setAlarm(
      Date.now() +
        result.intervalMs
    );
  }
  /*
   * RKN_GLOBAL_MODULE_REPORT_V1
   *
   * Read-only SYSTEM_ADMIN module report surface.
   * It reports only what the canonical ERP schema can prove today.
   * Missing business ledgers are surfaced as SCHEMA_REQUIRED rather
   * than being fabricated from unrelated data.
   */
  getAdminModuleReport(
    actorUserIdValue: string,
    featureKeyValue: string,
    businessUnitIdValue: string
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    const featureKey =
      cleanRpcText(
        featureKeyValue,
        100
      ).toLowerCase();

    const businessUnitId =
      cleanRpcText(
        businessUnitIdValue,
        180
      );

    if (!actorUserId) {
      throw new Error(
        "RPC_SERVER_ACTOR_REQUIRED"
      );
    }

    const admin =
      db.prepare(`
        SELECT 1 AS ok
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE
          ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
      `).get(actorUserId);

    if (!admin) {
      throw new Error(
        "RPC_SYSTEM_ADMIN_REQUIRED"
      );
    }

    if (businessUnitId) {
      const unit =
        db.prepare(`
          SELECT id
          FROM business_unit
          WHERE
            id = ?
            AND active = 1
          LIMIT 1
        `).get(businessUnitId);

      if (!unit) {
        throw new Error(
          "RPC_BUSINESS_UNIT_NOT_FOUND"
        );
      }
    }

    const businessUnits =
      db.prepare(`
        SELECT
          id,
          code,
          name,
          kind
        FROM business_unit
        WHERE active = 1
        ORDER BY
          kind,
          name,
          code
      `).all();

    const inventoryKeys =
      new Set([
        "dasbor-persediaan",
        "stok-fisik",
        "barang-masuk",
        "barang-keluar",
        "stok-opname",
        "ledger-persediaan",
      ]);

    const inventorySchemaKeys =
      new Set([
        "pusat-barcode",
        "aset",
      ]);

    const financeKeys =
      new Set([
        "dasbor-keuangan",
        "kas-bank",
        "pemasukan",
        "pengeluaran",
        "settlement-marketplace",
        "rekonsiliasi",
        "pengadaan-vendor",
        "hutang-piutang",
        "dana-pemilik",
        "laba-rugi",
      ]);

    const marketplaceKeys =
      new Set([
        "dasbor-marketplace",
        "penjualan",
        "pusat-integrasi-api",
      ]);

    const sdmKeys =
      new Set([
        "dasbor-sdm",
        "payroll",
      ]);

    const analyticsKeys =
      new Set([
        "dasbor-analitik",
        "laporan-penjualan",
        "laporan-persediaan",
        "laporan-keuangan",
        "pusat-ekspor",
      ]);

    const systemKeys =
      new Set([
        "dasbor-sistem",
        "pusat-persetujuan",
        "pusat-peringatan",
        "log-audit",
        "status-integrasi",
      ]);

    let domain =
      "GENERAL";

    if (
      inventoryKeys.has(featureKey) ||
      inventorySchemaKeys.has(featureKey)
    ) {
      domain = "INVENTORY";
    }
    else if (financeKeys.has(featureKey)) {
      domain = "FINANCE";
    }
    else if (marketplaceKeys.has(featureKey)) {
      domain = "MARKETPLACE";
    }
    else if (sdmKeys.has(featureKey)) {
      domain = "SDM";
    }
    else if (analyticsKeys.has(featureKey)) {
      domain = "ANALYTICS";
    }
    else if (systemKeys.has(featureKey)) {
      domain = "SYSTEM";
    }

    let engineState:
      | "LIVE"
      | "PARTIAL"
      | "SCHEMA_REQUIRED" =
        "PARTIAL";

    if (inventoryKeys.has(featureKey)) {
      engineState = "LIVE";
    }
    else if (inventorySchemaKeys.has(featureKey)) {
      engineState = "SCHEMA_REQUIRED";
    }
    else if (
      featureKey === "dasbor-marketplace" ||
      featureKey === "penjualan" ||
      featureKey === "dasbor-sdm" ||
      featureKey === "laporan-penjualan" ||
      featureKey === "laporan-persediaan" ||
      featureKey === "log-audit" ||
      featureKey === "dasbor-sistem"
    ) {
      engineState = "LIVE";
    }
    else if (
      financeKeys.has(featureKey)
    ) {
      engineState = "SCHEMA_REQUIRED";
    }
    else {
      engineState = "PARTIAL";
    }

    const metrics:
      Array<{
        key: string;
        label: string;
        value: number | string;
        note?: string;
      }> = [];

    const limitations:
      string[] = [];

    let rows:
      Array<Record<string, unknown>> = [];

    if (domain === "INVENTORY") {
      const balance =
        db.prepare(`
          SELECT
            COUNT(*) AS sku_count,
            COALESCE(
              SUM(qty_on_hand),
              0
            ) AS qty_on_hand
          FROM inventory_balance
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const ledger =
        db.prepare(`
          SELECT
            COUNT(*) AS movement_count,
            COALESCE(
              SUM(ABS(qty_delta)),
              0
            ) AS moved_qty
          FROM inventory_ledger
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const allocation =
        db.prepare(`
          SELECT
            COUNT(*) AS allocation_count,
            COALESCE(
              SUM(
                CASE
                  WHEN status = 'DRAFT'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS draft_count
          FROM order_allocation
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      metrics.push(
        {
          key: "sku_count",
          label: "SKU Bersaldo",
          value:
            Number(
              balance?.sku_count ?? 0
            ),
        },
        {
          key: "qty_on_hand",
          label: "Qty On Hand",
          value:
            Number(
              balance?.qty_on_hand ?? 0
            ),
        },
        {
          key: "movement_count",
          label: "Gerakan Ledger",
          value:
            Number(
              ledger?.movement_count ?? 0
            ),
        },
        {
          key: "draft_allocation",
          label: "Alokasi Draft",
          value:
            Number(
              allocation?.draft_count ?? 0
            ),
        }
      );

      rows =
        db.prepare(`
          SELECT
            movement_type,
            physical_sku,
            qty_delta,
            warehouse_id,
            order_id,
            created_at
          FROM inventory_ledger
          WHERE
            (? = '' OR business_unit_id = ?)
          ORDER BY created_at DESC
          LIMIT 20
        `).all(
          businessUnitId,
          businessUnitId
        ) as any;

      if (
        inventorySchemaKeys.has(
          featureKey
        )
      ) {
        limitations.push(
          "Barcode dan aset belum memiliki tabel canonical dedicated. Modul ditandai SCHEMA_REQUIRED sampai schema writer dibuat."
        );
      }
    }

    if (domain === "MARKETPLACE") {
      const stores =
        db.prepare(`
          SELECT
            COUNT(*) AS store_count
          FROM marketplace_store_scope
          WHERE
            active = 1
            AND (
              ? = ''
              OR business_unit_id = ?
            )
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const orders =
        db.prepare(`
          SELECT
            COUNT(*) AS order_count
          FROM business_order
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const lines =
        db.prepare(`
          SELECT
            COUNT(*) AS line_count,
            COALESCE(
              SUM(qty),
              0
            ) AS item_qty
          FROM business_order_line
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      metrics.push(
        {
          key: "store_count",
          label: "Toko Aktif",
          value:
            Number(
              stores?.store_count ?? 0
            ),
        },
        {
          key: "order_count",
          label: "Order Canonical",
          value:
            Number(
              orders?.order_count ?? 0
            ),
        },
        {
          key: "line_count",
          label: "Baris Order",
          value:
            Number(
              lines?.line_count ?? 0
            ),
        },
        {
          key: "item_qty",
          label: "Qty Item",
          value:
            Number(
              lines?.item_qty ?? 0
            ),
        }
      );

      rows =
        db.prepare(`
          SELECT
            platform,
            store_id,
            marketplace_order_id,
            order_date,
            order_status,
            last_seen_at
          FROM business_order
          WHERE
            (? = '' OR business_unit_id = ?)
          ORDER BY last_seen_at DESC
          LIMIT 20
        `).all(
          businessUnitId,
          businessUnitId
        ) as any;

      if (
        featureKey ===
          "pusat-integrasi-api"
      ) {
        limitations.push(
          "Status API provider-specific masih berada di route integrasi marketplace dan belum menjadi registry integrasi lintas provider."
        );
      }
    }

    if (domain === "FINANCE") {
      const hpp =
        db.prepare(`
          SELECT
            COUNT(*) AS hpp_count
          FROM hpp_master
        `).get() as any;

      const transaction =
        db.prepare(`
          SELECT
            COUNT(*) AS transaction_count,
            COALESCE(
              SUM(tl.cogs_total),
              0
            ) AS cogs_total,
            COALESCE(
              SUM(
                CASE
                  WHEN tl.cost_status = 'FOUND'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS cost_found
          FROM transaction_ledger tl
          LEFT JOIN marketplace_store_scope mss
            ON mss.platform = tl.platform
            AND mss.store_id = tl.store_id
          WHERE
            (
              ? = ''
              OR mss.business_unit_id = ?
            )
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      metrics.push(
        {
          key: "hpp_count",
          label: "HPP Master",
          value:
            Number(
              hpp?.hpp_count ?? 0
            ),
          note:
            "HPP master saat ini bersifat global.",
        },
        {
          key: "transaction_count",
          label: "Baris Costing",
          value:
            Number(
              transaction?.transaction_count ?? 0
            ),
        },
        {
          key: "cogs_total",
          label: "COGS Tercatat",
          value:
            Number(
              transaction?.cogs_total ?? 0
            ),
        },
        {
          key: "cost_found",
          label: "Cost FOUND",
          value:
            Number(
              transaction?.cost_found ?? 0
            ),
        }
      );

      rows =
        db.prepare(`
          SELECT
            tl.platform,
            tl.store_id,
            tl.order_id,
            tl.order_date_key,
            tl.canonical_sku,
            tl.qty,
            tl.hpp_snapshot,
            tl.cogs_total,
            tl.cost_status
          FROM transaction_ledger tl
          LEFT JOIN marketplace_store_scope mss
            ON mss.platform = tl.platform
            AND mss.store_id = tl.store_id
          WHERE
            (
              ? = ''
              OR mss.business_unit_id = ?
            )
          ORDER BY
            tl.updated_at DESC
          LIMIT 20
        `).all(
          businessUnitId,
          businessUnitId
        ) as any;

      limitations.push(
        "Belum ada canonical ledger untuk Kas & Bank, pemasukan, pengeluaran, hutang/piutang, dana pemilik, vendor/pengadaan, dan settlement."
      );

      limitations.push(
        "Transaction ledger saat ini menyimpan COGS/HPP tetapi belum menyimpan revenue neto. Karena itu Laba Rugi final belum boleh dihitung dari data ini."
      );
    }

    if (domain === "SDM") {
      const worker =
        db.prepare(`
          SELECT
            COUNT(*) AS worker_count,
            COALESCE(
              SUM(
                CASE
                  WHEN active = 1
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) AS active_count
          FROM worker
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const registration =
        db.prepare(`
          SELECT
            COUNT(*) AS pending_count
          FROM worker_registration
          WHERE
            status = 'PENDING'
            AND (
              ? = ''
              OR business_unit_id = ?
            )
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const departments =
        db.prepare(`
          SELECT
            COUNT(*) AS department_count
          FROM payroll_department
          WHERE
            active = 1
            AND (
              ? = ''
              OR business_unit_id = ?
            )
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      metrics.push(
        {
          key: "worker_count",
          label: "Total Pekerja",
          value:
            Number(
              worker?.worker_count ?? 0
            ),
        },
        {
          key: "active_count",
          label: "Pekerja Aktif",
          value:
            Number(
              worker?.active_count ?? 0
            ),
        },
        {
          key: "pending_count",
          label: "Registrasi Pending",
          value:
            Number(
              registration?.pending_count ?? 0
            ),
        },
        {
          key: "department_count",
          label: "Departemen",
          value:
            Number(
              departments?.department_count ?? 0
            ),
        }
      );

      rows =
        db.prepare(`
          SELECT
            worker_code,
            full_name,
            worker_type,
            payment_method,
            active,
            updated_at
          FROM worker
          WHERE
            (? = '' OR business_unit_id = ?)
          ORDER BY updated_at DESC
          LIMIT 20
        `).all(
          businessUnitId,
          businessUnitId
        ) as any;

      if (featureKey === "payroll") {
        engineState =
          "PARTIAL";

        limitations.push(
          "Master pekerja dan departemen payroll sudah ada, tetapi payroll run, komponen upah, periode, slip, dan payment ledger belum memiliki canonical tables."
        );
      }
    }

    if (domain === "ANALYTICS") {
      const orders =
        db.prepare(`
          SELECT
            COUNT(*) AS order_count
          FROM business_order
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const stock =
        db.prepare(`
          SELECT
            COALESCE(
              SUM(qty_on_hand),
              0
            ) AS qty_on_hand
          FROM inventory_balance
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const movements =
        db.prepare(`
          SELECT
            COUNT(*) AS movement_count
          FROM inventory_ledger
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      metrics.push(
        {
          key: "order_count",
          label: "Order Canonical",
          value:
            Number(
              orders?.order_count ?? 0
            ),
        },
        {
          key: "qty_on_hand",
          label: "Qty On Hand",
          value:
            Number(
              stock?.qty_on_hand ?? 0
            ),
        },
        {
          key: "movement_count",
          label: "Gerakan Inventory",
          value:
            Number(
              movements?.movement_count ?? 0
            ),
        }
      );

      rows =
        db.prepare(`
          SELECT
            platform,
            store_id,
            marketplace_order_id,
            order_date,
            order_status,
            last_seen_at
          FROM business_order
          WHERE
            (? = '' OR business_unit_id = ?)
          ORDER BY last_seen_at DESC
          LIMIT 20
        `).all(
          businessUnitId,
          businessUnitId
        ) as any;

      if (
        featureKey ===
          "laporan-keuangan"
      ) {
        engineState =
          "SCHEMA_REQUIRED";

        limitations.push(
          "Laporan keuangan final menunggu finance ledger canonical."
        );
      }

      if (
        featureKey ===
          "pusat-ekspor"
      ) {
        engineState =
          "PARTIAL";

        limitations.push(
          "Read model tersedia; generator ekspor per modul akan disambungkan pada fase export engine."
        );
      }
    }

    if (domain === "SYSTEM") {
      const audit =
        db.prepare(`
          SELECT
            COUNT(*) AS audit_count
          FROM audit_log
          WHERE
            (
              ? = ''
              OR business_unit_id = ?
            )
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      const events =
        db.prepare(`
          SELECT
            COUNT(*) AS event_count
          FROM business_event
          WHERE
            (? = '' OR business_unit_id = ?)
        `).get(
          businessUnitId,
          businessUnitId
        ) as any;

      metrics.push(
        {
          key: "audit_count",
          label: "Audit Log",
          value:
            Number(
              audit?.audit_count ?? 0
            ),
        },
        {
          key: "event_count",
          label: "Business Event",
          value:
            Number(
              events?.event_count ?? 0
            ),
        }
      );

      rows =
        db.prepare(`
          SELECT
            action,
            entity_type,
            entity_id,
            actor_user_id,
            business_unit_id,
            created_at
          FROM audit_log
          WHERE
            (
              ? = ''
              OR business_unit_id = ?
            )
          ORDER BY created_at DESC
          LIMIT 20
        `).all(
          businessUnitId,
          businessUnitId
        ) as any;

      if (
        featureKey ===
          "pusat-persetujuan"
      ) {
        engineState =
          "PARTIAL";

        limitations.push(
          "Approval worker tersedia di ERP DO. Approval akun ERP berada di AUTH_DB dan akan digabungkan pada approval center berikutnya."
        );
      }

      if (
        featureKey ===
          "pusat-peringatan" ||
        featureKey ===
          "status-integrasi"
      ) {
        engineState =
          "PARTIAL";

        limitations.push(
          "Alert rules dan integration registry lintas provider belum memiliki canonical tables."
        );
      }
    }

    if (domain === "GENERAL") {
      limitations.push(
        "Feature key belum dipetakan ke canonical module report."
      );
    }

    return {
      ok: true,
      featureKey,
      domain,
      engineState,
      businessUnitId:
        businessUnitId || null,
      businessUnits,
      metrics,
      rows,
      limitations,
      generatedAt:
        new Date().toISOString(),
    };
  }

  /*
   * RKN_CANONICAL_PRODUCT_MASTER_RPC_V1
   */
  getCanonicalProductMasterStatus(
    actorUserIdValue: string
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    const admin =
      db.prepare(`
        SELECT 1 AS ok
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE
          ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
      `).get(actorUserId);

    if (!admin) {
      throw new Error(
        "RPC_SYSTEM_ADMIN_REQUIRED"
      );
    }

    const productCount =
      Number(
        (
          db.prepare(`
            SELECT COUNT(*) AS n
            FROM product_master
          `).get() as any
        )?.n ?? 0
      );

    const variantCount =
      Number(
        (
          db.prepare(`
            SELECT COUNT(*) AS n
            FROM product_variant
            WHERE active = 1
          `).get() as any
        )?.n ?? 0
      );

    const colorCount =
      Number(
        (
          db.prepare(`
            SELECT COUNT(*) AS n
            FROM color_master
            WHERE status = 'ACTIVE'
          `).get() as any
        )?.n ?? 0
      );

    const physicalSkuCount =
      Number(
        (
          db.prepare(`
            SELECT COUNT(*) AS n
            FROM physical_sku_master
            WHERE active = 1
          `).get() as any
        )?.n ?? 0
      );

    const productsWithoutVariants =
      db.prepare(`
        SELECT
          pm.product_id,
          pm.product_family,
          pm.product_name
        FROM product_master pm
        LEFT JOIN product_variant pv
          ON pv.product_id = pm.product_id
          AND pv.active = 1
        WHERE
          pm.status = 'ACTIVE'
        GROUP BY
          pm.product_id,
          pm.product_family,
          pm.product_name
        HAVING COUNT(pv.sku_variant) = 0
        ORDER BY pm.product_family
      `).all();

    const seedState =
      db.prepare(`
        SELECT
          seed_version,
          seed_sha256,
          source_spreadsheet_id,
          product_count,
          variant_count,
          color_count,
          applied_by_user_id,
          applied_at
        FROM product_master_seed_state
        ORDER BY applied_at DESC
        LIMIT 1
      `).get() ?? null;

    return {
      ok: true,
      ready:
        productCount > 0 &&
        variantCount > 0 &&
        colorCount > 0 &&
        physicalSkuCount === variantCount,
      productCount,
      variantCount,
      colorCount,
      physicalSkuCount,
      productsWithoutVariants,
      seedState,
    };
  }

  seedCanonicalProductMasterV1(
    actorUserIdValue: string,
    seedValue: any
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    const admin =
      db.prepare(`
        SELECT 1 AS ok
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE
          ur.user_id = ?
          AND r.code = 'SYSTEM_ADMIN'
        LIMIT 1
      `).get(actorUserId);

    if (!admin) {
      throw new Error(
        "RPC_SYSTEM_ADMIN_REQUIRED"
      );
    }

    const seed =
      seedValue &&
      typeof seedValue === "object"
        ? seedValue
        : null;

    const seedVersion =
      cleanRpcText(
        seed?.seedVersion,
        180
      );

    const seedSha256 =
      cleanRpcText(
        seed?.seedSha256,
        180
      );

    const sourceSpreadsheetId =
      cleanRpcText(
        seed?.source?.spreadsheetId,
        220
      );

    const products =
      Array.isArray(seed?.products)
        ? seed.products
        : [];

    const variants =
      Array.isArray(seed?.variants)
        ? seed.variants
        : [];

    const colors =
      Array.isArray(seed?.colors)
        ? seed.colors
        : [];

    if (
      !seedVersion ||
      !seedSha256 ||
      !sourceSpreadsheetId ||
      products.length === 0 ||
      variants.length === 0 ||
      colors.length === 0
    ) {
      throw new Error(
        "RPC_PRODUCT_MASTER_SEED_INVALID"
      );
    }

    const existingSeed =
      db.prepare(`
        SELECT
          seed_version,
          seed_sha256
        FROM product_master_seed_state
        WHERE seed_version = ?
        LIMIT 1
      `).get(seedVersion) as any;

    if (existingSeed) {
      if (
        String(
          existingSeed.seed_sha256 ?? ""
        ) !== seedSha256
      ) {
        throw new Error(
          "RPC_PRODUCT_MASTER_SEED_HASH_CONFLICT"
        );
      }

      return {
        ok: true,
        alreadyApplied: true,
        seedVersion,
        seedSha256,
      };
    }

    const existingProducts =
      Number(
        (
          db.prepare(`
            SELECT COUNT(*) AS n
            FROM product_master
          `).get() as any
        )?.n ?? 0
      );

    if (existingProducts > 0) {
      throw new Error(
        "RPC_PRODUCT_MASTER_NOT_EMPTY_REVIEW"
      );
    }

    const productIds =
      new Set<string>();

    const productFamilies =
      new Set<string>();

    for (const product of products) {
      const productId =
        cleanRpcText(
          product?.productId,
          120
        );

      const family =
        cleanRpcText(
          product?.productFamily,
          120
        );

      if (
        !productId ||
        !family ||
        productIds.has(productId) ||
        productFamilies.has(family)
      ) {
        throw new Error(
          "RPC_PRODUCT_MASTER_PRODUCT_DUPLICATE_OR_INVALID"
        );
      }

      productIds.add(productId);
      productFamilies.add(family);
    }

    const variantSkus =
      new Set<string>();

    const parentByFamily =
      new Map<string, string>();

    for (const variant of variants) {
      const productId =
        cleanRpcText(
          variant?.productId,
          120
        );

      const family =
        cleanRpcText(
          variant?.productFamily,
          120
        );

      const parentSku =
        cleanRpcText(
          variant?.canonicalParentSku,
          160
        );

      const physicalSku =
        cleanRpcText(
          variant?.physicalSku,
          160
        );

      if (
        !productIds.has(productId) ||
        !productFamilies.has(family) ||
        !parentSku ||
        !physicalSku ||
        variantSkus.has(physicalSku)
      ) {
        throw new Error(
          "RPC_PRODUCT_MASTER_VARIANT_INVALID"
        );
      }

      const priorParent =
        parentByFamily.get(family);

      if (
        priorParent &&
        priorParent !== parentSku
      ) {
        throw new Error(
          "RPC_PRODUCT_MASTER_MULTI_PARENT_FAMILY"
        );
      }

      parentByFamily.set(
        family,
        parentSku
      );

      variantSkus.add(
        physicalSku
      );
    }

    const colorKeyByName =
      new Map<string, string>();

    for (const color of colors) {
      const colorKey =
        cleanRpcText(
          color?.colorKey,
          160
        );

      const colorName =
        cleanRpcText(
          color?.colorName,
          160
        );

      if (
        !colorKey ||
        !colorName ||
        colorKeyByName.has(colorName)
      ) {
        throw new Error(
          "RPC_PRODUCT_MASTER_COLOR_INVALID"
        );
      }

      colorKeyByName.set(
        colorName,
        colorKey
      );
    }

    for (const variant of variants) {
      const colorName =
        cleanRpcText(
          variant?.colorName,
          160
        );

      if (
        !colorKeyByName.has(
          colorName
        )
      ) {
        throw new Error(
          "RPC_PRODUCT_MASTER_VARIANT_COLOR_MISSING"
        );
      }
    }

    const now =
      new Date().toISOString();

    const tx =
      db.transaction(() => {
        const insertProduct =
          db.prepare(`
            INSERT INTO product_master (
              product_id,
              product_family,
              product_name,
              category,
              variant_name,
              unit,
              canonical_parent_sku,
              hpp_default,
              status,
              source,
              source_created_at,
              created_at,
              updated_at
            )
            VALUES (
              ?,?,?,?,?,?,?,?,?,?,?,?,?
            )
          `);

        for (const product of products) {
          const family =
            cleanRpcText(
              product?.productFamily,
              120
            );

          insertProduct.run(
            cleanRpcText(
              product?.productId,
              120
            ),
            family,
            cleanRpcText(
              product?.productName,
              240
            ),
            cleanRpcText(
              product?.category,
              160
            ),
            cleanRpcText(
              product?.variantName,
              180
            ),
            cleanRpcText(
              product?.unit,
              40
            ) || "PCS",
            parentByFamily.get(
              family
            ) ?? "",
            Number(
              product?.hppDefault ?? 0
            ),
            cleanRpcText(
              product?.status,
              40
            ) || "ACTIVE",
            "RKN_BLUEPRINT_V1",
            cleanRpcText(
              product?.sourceCreatedAt,
              80
            ),
            now,
            now
          );
        }

        const insertColor =
          db.prepare(`
            INSERT INTO color_master (
              color_key,
              color_name,
              status,
              sync_allowed,
              notes,
              source,
              created_at,
              updated_at
            )
            VALUES (
              ?,?,?,?,?,?,?,?
            )
          `);

        for (const color of colors) {
          insertColor.run(
            cleanRpcText(
              color?.colorKey,
              160
            ),
            cleanRpcText(
              color?.colorName,
              160
            ),
            cleanRpcText(
              color?.status,
              40
            ) || "ACTIVE",
            color?.syncAllowed
              ? 1
              : 0,
            cleanRpcText(
              color?.notes,
              400
            ),
            "MASTER_SKU_COLOR_DERIVED",
            now,
            now
          );
        }

        const insertVariant =
          db.prepare(`
            INSERT INTO product_variant (
              sku_variant,
              product_id,
              product_family,
              canonical_parent_sku,
              physical_sku,
              color_key,
              color_name,
              size_name,
              validation_status,
              sync_eligible,
              source_sheet,
              notes,
              active,
              created_at,
              updated_at
            )
            VALUES (
              ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )
          `);

        const insertPhysical =
          db.prepare(`
            INSERT INTO physical_sku_master (
              physical_sku,
              product_id,
              product_family,
              canonical_parent_sku,
              color_key,
              color_name,
              size_name,
              active,
              source,
              created_at,
              updated_at
            )
            VALUES (
              ?,?,?,?,?,?,?,?,?,?,?
            )
          `);

        for (const variant of variants) {
          const physicalSku =
            cleanRpcText(
              variant?.physicalSku,
              160
            );

          const colorName =
            cleanRpcText(
              variant?.colorName,
              160
            );

          const colorKey =
            colorKeyByName.get(
              colorName
            ) ?? "";

          const productId =
            cleanRpcText(
              variant?.productId,
              120
            );

          const family =
            cleanRpcText(
              variant?.productFamily,
              120
            );

          const parentSku =
            cleanRpcText(
              variant?.canonicalParentSku,
              160
            );

          const sizeName =
            cleanRpcText(
              variant?.sizeName,
              120
            );

          insertVariant.run(
            physicalSku,
            productId,
            family,
            parentSku,
            physicalSku,
            colorKey,
            colorName,
            sizeName,
            cleanRpcText(
              variant?.validationStatus,
              40
            ) || "OK",
            variant?.syncEligible
              ? 1
              : 0,
            cleanRpcText(
              variant?.sourceSheet,
              180
            ),
            cleanRpcText(
              variant?.notes,
              500
            ),
            1,
            now,
            now
          );

          insertPhysical.run(
            physicalSku,
            productId,
            family,
            parentSku,
            colorKey,
            colorName,
            sizeName,
            1,
            "MASTER_SKU_COLOR",
            now,
            now
          );
        }

        db.prepare(`
          INSERT INTO product_master_seed_state (
            seed_version,
            seed_sha256,
            source_spreadsheet_id,
            product_count,
            variant_count,
            color_count,
            applied_by_user_id,
            applied_at
          )
          VALUES (
            ?,?,?,?,?,?,?,?
          )
        `).run(
          seedVersion,
          seedSha256,
          sourceSpreadsheetId,
          products.length,
          variants.length,
          colors.length,
          actorUserId,
          now
        );

        db.prepare(`
          INSERT INTO audit_log (
            id,
            actor_user_id,
            business_unit_id,
            action,
            entity_type,
            entity_id,
            reason,
            details_json,
            created_at
          )
          VALUES (
            ?,?,?,?,?,?,?,?,?
          )
        `).run(
          crypto.randomUUID(),
          actorUserId,
          null,
          "PRODUCT_MASTER_SEEDED",
          "PRODUCT_MASTER",
          seedVersion,
          "F18 canonical recovery from frozen RKN Blueprint v1",
          JSON.stringify({
            seedVersion,
            seedSha256,
            productCount:
              products.length,
            variantCount:
              variants.length,
            colorCount:
              colors.length,
          }),
          now
        );
      });

    tx();

    return {
      ok: true,
      alreadyApplied: false,
      seedVersion,
      seedSha256,
      productCount:
        products.length,
      variantCount:
        variants.length,
      colorCount:
        colors.length,
    };
  }

  getCanonicalMasterResource(
    actorUserIdValue: string,
    resourceNameValue: string
  ) {
    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );

    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );

    const resourceName =
      cleanRpcText(
        resourceNameValue,
        80
      );

    const profile =
      db.prepare(`
        SELECT active
        FROM erp_user_profile
        WHERE user_id = ?
        LIMIT 1
      `).get(actorUserId) as any;

    if (
      !profile ||
      Number(profile.active) !== 1
    ) {
      throw new Error(
        "RPC_ACTIVE_ERP_PROFILE_REQUIRED"
      );
    }

    if (resourceName === "products") {
      return db.prepare(`
        SELECT
          product_id AS PRODUCT_ID,
          product_family AS SKU,
          product_name AS PRODUCT_NAME,
          category AS CATEGORY,
          variant_name AS VARIANT,
          unit AS UNIT,
          hpp_default AS HPP_DEFAULT,
          status AS STATUS,
          source_created_at AS CREATED_AT
        FROM product_master
        ORDER BY product_id
      `).all();
    }

    if (resourceName === "skuColors") {
      return db.prepare(`
        SELECT
          pm.product_name AS PRODUCT_NAME,
          pv.product_family AS PRODUCT_FAMILY,
          pv.canonical_parent_sku AS SKU_INDUK,
          pv.sku_variant AS SKU_VARIAN,
          pv.color_name AS COLOR,
          pv.size_name AS SIZE,
          pv.validation_status AS VALIDATION_STATUS,
          pv.sync_eligible AS SYNC_ELIGIBLE,
          pv.source_sheet AS SOURCE_SHEET,
          pv.notes AS NOTES
        FROM product_variant pv
        JOIN product_master pm
          ON pm.product_id = pv.product_id
        WHERE pv.active = 1
        ORDER BY
          pv.product_family,
          pv.sku_variant
      `).all();
    }

    if (resourceName === "colors") {
      return db.prepare(`
        SELECT
          color_key AS COLOR_ID,
          color_name AS COLOR_NAME,
          status AS STATUS,
          sync_allowed AS SYNC_ALLOWED,
          notes AS NOTES
        FROM color_master
        WHERE status = 'ACTIVE'
        ORDER BY color_name
      `).all();
    }

    if (resourceName === "stores") {
      const systemAdmin =
        db.prepare(`
          SELECT 1 AS ok
          FROM user_role ur
          JOIN role r
            ON r.id = ur.role_id
          WHERE
            ur.user_id = ?
            AND r.code = 'SYSTEM_ADMIN'
          LIMIT 1
        `).get(actorUserId);

      if (systemAdmin) {
        return db.prepare(`
          SELECT
            mss.store_id AS STORE_ID,
            bu.owner_key AS OWNER_ID,
            mss.platform AS PLATFORM,
            mss.store_name AS STORE_NAME,
            '' AS STORE_CODE,
            CASE
              WHEN mss.active = 1
              THEN 'ACTIVE'
              ELSE 'INACTIVE'
            END AS STATUS,
            mss.source AS API_STATUS,
            mss.created_at AS CREATED_AT,
            '' AS STORE_URL
          FROM marketplace_store_scope mss
          JOIN business_unit bu
            ON bu.id = mss.business_unit_id
          ORDER BY
            mss.platform,
            mss.store_id
        `).all();
      }

      return db.prepare(`
        SELECT
          mss.store_id AS STORE_ID,
          bu.owner_key AS OWNER_ID,
          mss.platform AS PLATFORM,
          mss.store_name AS STORE_NAME,
          '' AS STORE_CODE,
          CASE
            WHEN mss.active = 1
            THEN 'ACTIVE'
            ELSE 'INACTIVE'
          END AS STATUS,
          mss.source AS API_STATUS,
          mss.created_at AS CREATED_AT,
          '' AS STORE_URL
        FROM marketplace_store_scope mss
        JOIN business_unit bu
          ON bu.id = mss.business_unit_id
        JOIN user_business_scope ubs
          ON ubs.business_unit_id =
             mss.business_unit_id
        WHERE
          ubs.user_id = ?
          AND mss.active = 1
        ORDER BY
          mss.platform,
          mss.store_id
      `).all(actorUserId);
    }

    throw new Error(
      "RPC_MASTER_RESOURCE_UNKNOWN"
    );
  }

  recordPasswordChangeCompletion(
    actorUserIdValue: string
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const actorUserId =
      cleanRpcText(
        actorUserIdValue,
        180
      );


    if (!actorUserId) {

      throw new Error(
        "RPC_SERVER_ACTOR_REQUIRED"
      );
    }


    const complete =
      db.transaction(
        () => {

          const profile =
            db.prepare(`
              SELECT
                active,
                must_change_password
              FROM erp_user_profile
              WHERE user_id = ?
              LIMIT 1
            `).get(
              actorUserId
            ) as
              | {
                  active?: unknown;
                  must_change_password?: unknown;
                }
              | undefined;


          if (
            !profile ||
            Number(
              profile.active
            ) !== 1
          ) {

            throw new Error(
              "RPC_PROFILE_INACTIVE"
            );
          }


          if (
            Number(
              profile.must_change_password
            ) === 0
          ) {

            return {

              ok: true,

              changed:
                false,

              mustChangePassword:
                false,
            };
          }


          db.prepare(`
            UPDATE erp_user_profile
            SET
              must_change_password = 0,
              updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).run(
            actorUserId
          );


          db.prepare(`
            INSERT INTO audit_log (
              id,
              actor_user_id,
              action,
              entity_type,
              entity_id,
              details_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            actorUserId,
            "AUTH_PASSWORD_CHANGED",
            "USER",
            actorUserId,
            JSON.stringify({
              initialPasswordChange:
                true,
            })
          );


          return {

            ok: true,

            changed:
              true,

            mustChangePassword:
              false,
          };
        }
      );


    return complete();
  }


  getHppManagementState(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const ops =
      createHppOps({

        db,

        sessionUser,
      });


    return ops.GET(
      request
    );
  }


  upsertHppRecord(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const ops =
      createHppOps({

        db,

        sessionUser,
      });


    return ops.POST(
      request
    );
  }


  getInventoryRouteReadModel(
    access:
      RknServerDerivedRpcAccess,

    businessUnitIdValue:
      string,

    warehouseIdValue:
      string,

    limitValue:
      number
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const businessUnitId =
      cleanRpcText(
        businessUnitIdValue,
        180
      );


    const warehouseId =
      cleanRpcText(
        warehouseIdValue,
        180
      );


    const accessBusinessUnitId =
      cleanRpcText(
        access?.businessUnitId,
        180
      );


    if (
      !businessUnitId ||
      accessBusinessUnitId !==
        businessUnitId
    ) {

      throw new Error(
        "RPC_SCOPE_DENIED"
      );
    }


    assertRpcReadAccess(
      db,
      {
        ...access,

        businessUnitId,

        permissionCode:
          "inventory.view",

        allowedAccessLevels: [
          "VIEW",
          "MANAGE",
          "OWNER",
        ],
      }
    );


    const rawLimit =
      Number(
        limitValue
      );


    const limit =
      Number.isFinite(
        rawLimit
      )
        ? Math.max(
            1,
            Math.min(
              500,
              Math.trunc(
                rawLimit
              )
            )
          )
        : 100;


    const ops =
      createInventoryReadModelOps(
        db
      );


    return ops.getInventoryRouteReadModel(
      businessUnitId,
      warehouseId,
      limit
    );
  }


  getWhatsappOutbox(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createWhatsappOutboxOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.GET();
  }


  updateWorkerRegistrationInvite(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request,

    inviteId: string
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createInviteDetailOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.PATCH(
      request,
      {
        params:
          Promise.resolve({
            inviteId,
          }),
      }
    );
  }


  listWorkerRegistrationInvites(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createInvitesOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.GET();
  }


  createWorkerRegistrationInvite(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createInvitesOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.POST(
      request
    );
  }


  reviewWorkerRegistration(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request,

    registrationId: string
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createRegistrationDetailOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.PATCH(
      request,
      {
        params:
          Promise.resolve({
            registrationId,
          }),
      }
    );
  }


  listWorkerRegistrations(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createRegistrationsOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.GET(
      request
    );
  }


  listWorkers(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createWorkersOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.GET(
      request
    );
  }


  createWorker(
    sessionUser:
      RknRpcSessionUser | null,

    request: Request
  ) {

    const db =
      createDoSqliteCompat(
        this.ctx.storage
      );


    const access =
      createLegacyAccessBridge(
        db,
        sessionUser
      );


    const ops =
      createWorkersOps({

        db,

        sessionUser,

        ...access,
      });


    return ops.POST(
      request
    );
  }
}
