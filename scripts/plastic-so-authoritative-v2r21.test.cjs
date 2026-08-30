const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const projectRoot = path.resolve(__dirname, "..");
const Database = require(path.join(projectRoot, "node_modules", "better-sqlite3"));
const ts = require(path.join(projectRoot, "node_modules", "typescript"));

function loadEngine() {
  const filename = path.join(projectRoot, "cloudflare", "plasticTradingV2.ts");
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
    fileName: filename,
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(output, filename);
  return loaded.exports;
}

function createStorage() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = OFF");
  db.exec(`
    CREATE TABLE erp_user_profile(
      user_id TEXT PRIMARY KEY,
      active INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      primary_role_code TEXT NOT NULL
    );
    CREATE TABLE user_role(user_id TEXT, role_id TEXT);
    CREATE TABLE user_business_scope(
      user_id TEXT,
      business_unit_id TEXT,
      access_level TEXT
    );
    CREATE TABLE role(
      id TEXT PRIMARY KEY, code TEXT, name TEXT, description TEXT,
      scope_mode TEXT, is_system INTEGER, created_at TEXT, updated_at TEXT
    );
    CREATE TABLE permission(
      id TEXT PRIMARY KEY, code TEXT, module TEXT, name TEXT,
      description TEXT, created_at TEXT
    );
    CREATE TABLE role_permission(
      role_id TEXT, permission_id TEXT, created_at TEXT,
      UNIQUE(role_id, permission_id)
    );
    CREATE TABLE audit_log(
      id TEXT PRIMARY KEY, actor_user_id TEXT, business_unit_id TEXT,
      action TEXT, entity_type TEXT, entity_id TEXT, reason TEXT,
      details_json TEXT, created_at TEXT
    );
  `);

  const execute = (query, bindings) => {
    if (bindings.length) {
      const statement = db.prepare(query);
      return statement.reader
        ? statement.all(...bindings)
        : (statement.run(...bindings), []);
    }
    try {
      const statement = db.prepare(query);
      return statement.reader ? statement.all() : (statement.run(), []);
    } catch (error) {
      if (!String(error.message).includes("more than one statement")) throw error;
      db.exec(query);
      return [];
    }
  };

  return {
    db,
    storage: {
      sql: {
        exec(query, ...bindings) {
          return { toArray: () => execute(query, bindings) };
        },
      },
      transactionSync(callback) {
        return db.transaction(callback)();
      },
    },
  };
}

function run() {
  const engine = loadEngine();
  const { db, storage } = createStorage();
  db.prepare(
    "INSERT INTO erp_user_profile(user_id,active,full_name,primary_role_code) VALUES(?,?,?,?)"
  ).run("test-owner", 1, "Test Owner", "GROUP_OWNER");
  db.prepare(
    "INSERT INTO user_business_scope(user_id,business_unit_id,access_level) VALUES(?,?,?)"
  ).run("test-owner", "BU-PLASTIC", "OWNER");
  engine.initPlasticTradingV2(storage);

  const variantId = "PL-POLY-KUNING-17X30";
  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_INBOUND", {
    dateKey: "2026-08-26",
    lines: [{ variantId, qty: 2, unit: "BALL", unitCostRp: 1175000 }],
  });
  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_SALE", {
    dateKey: "2026-08-27",
    customerName: "Authoritative SO Test",
    paymentStatus: "NOT_PAID",
    lines: [{ variantId, qty: 3, unit: "BALL", unitPriceRp: 1300000 }],
  });

  const firstSo = engine.mutatePlasticTradingV2(
    storage,
    "test-owner",
    "START_SO_SESSION",
    { dateKey: "2026-08-28", reason: "Authoritative SO regression" }
  );
  const firstSystem = db
    .prepare(
      "SELECT system_qty_base systemQtyBase FROM plastic_so_session_line WHERE so_id=? AND variant_id=?"
    )
    .get(firstSo.soId, variantId);
  assert.equal(firstSystem.systemQtyBase, -50);

  const allVariantIds = db
    .prepare("SELECT variant_id variantId FROM plastic_so_session_line WHERE so_id=?")
    .all(firstSo.soId);
  engine.mutatePlasticTradingV2(storage, "test-owner", "SAVE_SO_DRAFT", {
    soId: firstSo.soId,
    lines: allVariantIds.map((row) => ({
      variantId: row.variantId,
      physicalQtyBase: 0,
      note: "Regression zero count",
    })),
  });

  // Reproduce a legacy/stale raw snapshot. The OPNAME view must overlay it.
  db.prepare(
    "UPDATE plastic_so_session_line SET system_qty_base=0 WHERE so_id=? AND variant_id=?"
  ).run(firstSo.soId, variantId);
  engine.mutatePlasticTradingV2(storage, "test-owner", "REVIEW_SO_SESSION", {
    soId: firstSo.soId,
    lines: [],
  });
  // Reproduce an already-REVIEW session created before V2R.21 deployment.
  db.prepare(
    "UPDATE plastic_so_session_line SET system_qty_base=0 WHERE so_id=? AND variant_id=?"
  ).run(firstSo.soId, variantId);

  const reviewView = engine.getPlasticTradingViewV2(
    storage,
    "test-owner",
    "OPNAME",
    "2026-08"
  );
  const reviewLine = reviewView.activeLines.find((row) => row.variantId === variantId);
  assert.equal(reviewView.systemBasisReady, 1);
  assert.equal(reviewLine.storedSystemQtyBase, 0);
  assert.equal(reviewLine.systemQtyBase, -50);
  assert.equal(reviewLine.systemSnapshotDriftQtyBase, 50);

  const posted = engine.mutatePlasticTradingV2(
    storage,
    "test-owner",
    "POST_SO_ADJUSTMENT",
    { soId: firstSo.soId, reason: "Post authoritative physical checkpoint" }
  );
  assert.equal(posted.status, "POSTED");
  const postedLine = db
    .prepare(
      "SELECT system_qty_base systemQtyBase,physical_qty_base physicalQtyBase,variance_qty_base varianceQtyBase FROM plastic_stock_opname_line WHERE opname_id=? AND variant_id=?"
    )
    .get(posted.opnameId, variantId);
  assert.deepEqual(postedLine, {
    systemQtyBase: -50,
    physicalQtyBase: 0,
    varianceQtyBase: 50,
  });
  assert.equal(
    db.prepare(
      "SELECT qty_base qtyBase FROM plastic_inventory_balance WHERE variant_id=?"
    ).get(variantId).qtyBase,
    0,
    "-50 history + 50 SO adjustment must cache as zero, never false-positive 50"
  );

  const nextSo = engine.mutatePlasticTradingV2(
    storage,
    "test-owner",
    "START_SO_SESSION",
    { dateKey: "2026-08-29", reason: "Next checkpoint regression" }
  );
  const nextSystem = db
    .prepare(
      "SELECT system_qty_base systemQtyBase FROM plastic_so_session_line WHERE so_id=? AND variant_id=?"
    )
    .get(nextSo.soId, variantId);
  assert.equal(nextSystem.systemQtyBase, 0);

  console.log("PASS authoritative SO snapshot uses official documents");
  console.log("PASS existing REVIEW session overlays stale stored snapshot");
  console.log("PASS negative history is visible and posts to zero without false stock");
  console.log("PASS next SO starts from latest posted physical checkpoint");
}

run();
