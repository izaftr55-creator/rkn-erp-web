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

function loadEffectiveSellPrices() {
  const filename = path.join(projectRoot, "components", "PlasticTradingApp.tsx");
  const sourceText = fs.readFileSync(filename, "utf8");
  const sourceFile = ts.createSourceFile(
    filename,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX
  );
  let helperNode = null;

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "effectiveSellPrices"
      ) {
        helperNode = node;
      }
    }
  });

  assert.ok(helperNode, "effectiveSellPrices helper must exist");
  const helperSource = helperNode.getText(sourceFile);
  const output = ts.transpileModule(
    `type Row = Record<string, any>;\n${helperSource}\nmodule.exports = { effectiveSellPrices };`,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
      fileName: "effectiveSellPrices.ts",
    }
  ).outputText;
  const loaded = new Module("effectiveSellPrices.ts", module);
  loaded._compile(output, "effectiveSellPrices.ts");
  return loaded.exports.effectiveSellPrices;
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
  const reportUiSource = fs.readFileSync(
    path.join(projectRoot, "components", "PlasticTradingApp.tsx"),
    "utf8"
  );
  assert.match(reportUiSource, /Harga Jual Utama/);
  assert.doesNotMatch(reportUiSource, /Harga Jual \/ Unit/);
  assert.doesNotMatch(reportUiSource, /Potensi|potensi/);

  const effectiveSellPrices = loadEffectiveSellPrices();
  const thermalPrices = effectiveSellPrices({
    baseUnit: "LEMBAR",
    midUnit: "STACK",
    packUnit: "DUS",
    unitsPerMid: 500,
    unitsPerPack: 10000,
    defaultSellPriceBaseRp: 0,
    defaultSellPriceMidRp: 39000,
    defaultSellPricePackRp: 780000,
  });
  assert.equal(thermalPrices.basePriceRp, 78);
  assert.equal(thermalPrices.midPriceRp, 39000);
  assert.equal(thermalPrices.packPriceRp, 780000);
  assert.equal(thermalPrices.baseDerived, true);
  assert.equal(9 * thermalPrices.packPriceRp, 7020000);

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
  const valuationVariantId = "PL-POLY-KUNING-15X25";
  const goldwinVariantId = "PL-THERMAL-THERMAL-GOLDWIN";
  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_INBOUND", {
    dateKey: "2026-08-26",
    lines: [{ variantId, qty: 2, unit: "BALL", unitCostRp: 1175000 }],
  });
  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_INBOUND", {
    dateKey: "2026-08-20",
    supplierName: "Supplier Goldwin",
    lines: [
      {
        variantId: goldwinVariantId,
        qty: 15,
        unit: "DUS",
        unitCostRp: 0,
      },
    ],
  });
  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_SALE", {
    dateKey: "2026-08-24",
    customerName: "Goldwin Customer",
    paymentStatus: "PAID",
    lines: [
      {
        variantId: goldwinVariantId,
        qty: 2,
        unit: "DUS",
        unitPriceRp: 840000,
      },
    ],
  });
  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_INBOUND", {
    dateKey: "2026-08-26",
    supplierName: "Supplier Nilai Stok",
    lines: [
      {
        variantId: valuationVariantId,
        qty: 5,
        unit: "ROLL",
        unitCostRp: 18000,
      },
    ],
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
      physicalQtyBase: row.variantId === valuationVariantId ? 5 : 0,
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

  const postedReport = engine.getPlasticTradingViewV2(
    storage,
    "test-owner",
    "REPORTS",
    "2026-08"
  );
  const postedAuditLine = postedReport.auditLedger.find(
    (row) => row.variantId === variantId
  );
  assert.equal(postedReport.auditSo.status, "POSTED");
  assert.equal(postedAuditLine.systemLedgerQtyBase, -50);
  assert.equal(postedAuditLine.physicalQtyBase, 0);
  assert.equal(postedAuditLine.excludedSoAdjustmentQtyBase, 50);

  const goldwinReconciliation = engine.getPlasticTradingViewV2(
    storage,
    "test-owner",
    "RECONCILIATION",
    "2026-08"
  );
  const goldwinReconRow = goldwinReconciliation.rows.find(
    (row) => row.variantId === goldwinVariantId
  );
  assert.ok(goldwinReconRow, "Goldwin must remain visible in reconciliation");
  assert.equal(goldwinReconRow.soScope, 1);
  assert.equal(goldwinReconRow.physicalEntered, 1);
  assert.equal(goldwinReconRow.inboundQtyBase, 150000);
  assert.equal(goldwinReconRow.outboundQtyBase, 20000);
  assert.equal(goldwinReconRow.systemQtyBase, 130000);
  assert.equal(goldwinReconRow.physicalQtyBase, 0);
  assert.equal(goldwinReconRow.status, "SELISIH");
  assert.equal(goldwinReconciliation.summary.totalVariants, 42);
  assert.equal(goldwinReconciliation.summary.outsideSoVariants, 0);

  const goldwinInboundReport = postedReport.inbound.find(
    (row) => row.productName === "Thermal Goldwin"
  );
  const goldwinAuditLine = postedReport.auditLedger.find(
    (row) => row.variantId === goldwinVariantId
  );
  assert.ok(goldwinInboundReport, "Official Goldwin inbound must be reported");
  assert.equal(goldwinInboundReport.qty, 15);
  assert.equal(goldwinInboundReport.unit, "DUS");
  assert.equal(goldwinAuditLine.soScope, 1);
  assert.equal(goldwinAuditLine.physicalQtyBase, 0);
  assert.equal(goldwinAuditLine.systemLedgerQtyBase, 130000);

  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_INBOUND", {
    dateKey: "2026-08-27",
    supplierName: "Supplier Nilai Stok",
    lines: [
      {
        variantId: valuationVariantId,
        qty: 4,
        unit: "ROLL",
        unitCostRp: 18000,
      },
    ],
  });
  const stockAfterHistoricalEdit = engine.getPlasticTradingViewV2(
    storage,
    "test-owner",
    "INVENTORY",
    "2026-08"
  );
  const anchoredStockRow = stockAfterHistoricalEdit.rows.find(
    (row) => row.variantId === valuationVariantId
  );
  assert.equal(anchoredStockRow.qtyBase, 5);
  assert.equal(
    anchoredStockRow.stockSource,
    "POSTED_SO_PHYSICAL_PLUS_OFFICIAL_TRANSACTIONS"
  );
  assert.throws(
    () =>
      engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_SALE", {
        dateKey: "2026-08-29",
        customerName: "Oversell Must Fail",
        paymentStatus: "NOT_PAID",
        lines: [
          {
            variantId: valuationVariantId,
            qty: 3,
            unit: "ROLL",
            unitPriceRp: 18500,
          },
          {
            variantId: valuationVariantId,
            qty: 3,
            unit: "ROLL",
            unitPriceRp: 18500,
          },
        ],
      }),
    /PLASTIC_INSUFFICIENT_STOCK/
  );

  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_INBOUND", {
    dateKey: "2026-08-30",
    supplierName: "Supplier Setelah Cutoff",
    lines: [
      {
        variantId: valuationVariantId,
        qty: 2,
        unit: "ROLL",
        unitCostRp: 18000,
      },
    ],
  });
  const valuationReport = engine.getPlasticTradingViewV2(
    storage,
    "test-owner",
    "REPORTS",
    "2026-08"
  );
  const valuationRow = valuationReport.stock.find(
    (row) => row.variantId === valuationVariantId
  );
  const checkpointValuationRow = valuationReport.auditLedger.find(
    (row) => row.variantId === valuationVariantId
  );
  assert.equal(valuationRow.lastSupplierName, "Supplier Setelah Cutoff");
  assert.equal(valuationRow.qtyBase, 7);
  assert.equal(valuationRow.avgCostRp, 18000);
  assert.equal(valuationRow.stockValueRp, 129500);
  assert.equal(valuationRow.defaultSellPriceBaseRp, 18500);
  assert.equal(valuationRow.defaultSellPricePackRp, 1850000);
  assert.equal(checkpointValuationRow.lastSupplierName, "Supplier Nilai Stok");
  assert.equal(checkpointValuationRow.physicalQtyBase, 5);
  assert.equal(checkpointValuationRow.liveOnHandQtyBase, 7);
  assert.equal(checkpointValuationRow.defaultSellPriceBaseRp, 18500);
  assert.equal(
    checkpointValuationRow.physicalQtyBase *
      checkpointValuationRow.defaultSellPriceBaseRp,
    92500
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
  console.log("PASS posted report retains pre-adjustment variance and official settlement");
  console.log("PASS Goldwin physical-zero checkpoint remains visible for reconciliation");
  console.log("PASS posted physical SO anchors live stock against pre-cutoff document edits");
  console.log("PASS future sale guard checks posted SO stock and aggregates duplicate SKU lines");
  console.log("PASS supplier stock report cuts off physical quantity and supplier at 28/08");
  console.log("PASS selling price derives automatically across LEMBAR / STACK / DUS");
  console.log("PASS next SO starts from latest posted physical checkpoint");
}

run();
