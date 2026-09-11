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
  assert.match(reportUiSource, /CORRECT_POSTED_SO/);
  assert.match(reportUiSource, /PL-POLY-BIRU-20X30/);
  assert.match(reportUiSource, /PL-POLY-UNGU-17X30/);

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

  // Opening the app again must never silently overwrite a master value that an
  // authorised user has changed.
  db.prepare(
    "UPDATE plastic_product_variant SET units_per_pack=?,default_sell_price_pack_rp=? WHERE variant_id=?"
  ).run(77, 987654, "PL-POLY-HITAM-15X25");
  engine.initPlasticTradingV2(storage);
  assert.deepEqual(
    db.prepare(
      "SELECT units_per_pack unitsPerPack,default_sell_price_pack_rp packPriceRp FROM plastic_product_variant WHERE variant_id=?"
    ).get("PL-POLY-HITAM-15X25"),
    { unitsPerPack: 77, packPriceRp: 987654 },
    "reopening the app must not overwrite master UOM or price"
  );

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

  // A posted SO factual correction must update the checkpoint, refresh stale
  // system snapshots, rebuild only derived SO adjustments, and remain safe to
  // retry without creating duplicate ledger rows.
  const corrected = engine.mutatePlasticTradingV2(
    storage,
    "test-owner",
    "CORRECT_POSTED_SO",
    {
      soId: firstSo.soId,
      reason: "Audited factual count correction",
      lines: [
        {
          variantId,
          expectedPhysicalQtyBase: 0,
          physicalQtyBase: 100,
          note: "Confirmed physical count",
        },
      ],
    }
  );
  assert.equal(corrected.status, "POSTED");
  assert.equal(corrected.alreadyApplied, false);
  assert.equal(corrected.correctedPhysicalSku, 1);
  assert.ok(
    corrected.refreshedSystemSku >= 1,
    "historical official edit must refresh the stored SO system snapshot"
  );

  const correctedSessionLine = db
    .prepare(
      "SELECT system_qty_base systemQtyBase,physical_qty_base physicalQtyBase,note FROM plastic_so_session_line WHERE so_id=? AND variant_id=?"
    )
    .get(firstSo.soId, variantId);
  assert.deepEqual(correctedSessionLine, {
    systemQtyBase: -50,
    physicalQtyBase: 100,
    note: "Confirmed physical count",
  });

  const refreshedHistoricalLine = db
    .prepare(
      "SELECT system_qty_base systemQtyBase,physical_qty_base physicalQtyBase,variance_qty_base varianceQtyBase FROM plastic_stock_opname_line WHERE opname_id=? AND variant_id=?"
    )
    .get(posted.opnameId, valuationVariantId);
  assert.deepEqual(refreshedHistoricalLine, {
    systemQtyBase: 9,
    physicalQtyBase: 5,
    varianceQtyBase: -4,
  });

  const correctedLegacyLine = db
    .prepare(
      "SELECT system_qty_base systemQtyBase,physical_qty_base physicalQtyBase,variance_qty_base varianceQtyBase FROM plastic_stock_opname_line WHERE opname_id=? AND variant_id=?"
    )
    .get(posted.opnameId, variantId);
  assert.deepEqual(correctedLegacyLine, {
    systemQtyBase: -50,
    physicalQtyBase: 100,
    varianceQtyBase: 150,
  });

  const correctedMovement = db
    .prepare(
      "SELECT movement_type movementType,qty_base qtyBase FROM plastic_inventory_movement WHERE source_type='SO_SESSION' AND source_key=? AND variant_id=?"
    )
    .all(firstSo.soId, variantId);
  assert.deepEqual(correctedMovement, [
    { movementType: "ADJUSTMENT_IN", qtyBase: 150 },
  ]);
  assert.equal(
    db.prepare(
      "SELECT qty_base qtyBase FROM plastic_inventory_balance WHERE variant_id=?"
    ).get(variantId).qtyBase,
    100,
    "live stock must follow the corrected posted physical checkpoint"
  );

  const correctedOpnameView = engine.getPlasticTradingViewV2(
    storage,
    "test-owner",
    "OPNAME",
    "2026-08"
  );
  const correctedPostedViewLine = correctedOpnameView.postedLines.find(
    (row) => row.variantId === variantId
  );
  assert.equal(correctedOpnameView.latestPosted.soId, firstSo.soId);
  assert.equal(correctedPostedViewLine.systemQtyBase, -50);
  assert.equal(correctedPostedViewLine.physicalQtyBase, 100);

  const correctionAudit = db
    .prepare(
      "SELECT action,reason,details_json detailsJson FROM audit_log WHERE entity_id=? AND action='PLASTIC_SO_POSTED_CORRECTION' ORDER BY created_at DESC LIMIT 1"
    )
    .get(firstSo.soId);
  assert.equal(correctionAudit.action, "PLASTIC_SO_POSTED_CORRECTION");
  assert.equal(correctionAudit.reason, "Audited factual count correction");
  assert.equal(
    JSON.parse(correctionAudit.detailsJson).physicalCorrections[0]
      .afterPhysicalQtyBase,
    100
  );

  const correctionRetry = engine.mutatePlasticTradingV2(
    storage,
    "test-owner",
    "CORRECT_POSTED_SO",
    {
      soId: firstSo.soId,
      reason: "Safe retry",
      lines: [
        {
          variantId,
          expectedPhysicalQtyBase: 0,
          physicalQtyBase: 100,
        },
      ],
    }
  );
  assert.equal(correctionRetry.alreadyApplied, true);
  assert.equal(
    db.prepare(
      "SELECT COUNT(*) count FROM plastic_inventory_movement WHERE source_type='SO_SESSION' AND source_key=? AND variant_id=?"
    ).get(firstSo.soId, variantId).count,
    1,
    "idempotent retry must not duplicate the derived adjustment"
  );

  assert.throws(
    () =>
      engine.mutatePlasticTradingV2(
        storage,
        "test-owner",
        "CORRECT_POSTED_SO",
        {
          soId: firstSo.soId,
          reason: "Stale browser must fail",
          lines: [
            {
              variantId,
              expectedPhysicalQtyBase: 0,
              physicalQtyBase: 50,
            },
          ],
        }
      ),
    /PLASTIC_SO_CORRECTION_CONFLICT/
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
  assert.equal(nextSystem.systemQtyBase, 100);

  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_INBOUND", {
    dateKey: "2026-09-01",
    supplierName: "Supplier September",
    lines: [{ variantId, qty: 2, unit: "BALL", unitCostRp: 1 }],
  });
  const septemberInbound = db
    .prepare(
      "SELECT unit_cost_rp unitCostRp,line_total_rp lineTotalRp FROM plastic_inbound_line WHERE variant_id=? ORDER BY created_at DESC LIMIT 1"
    )
    .get(variantId);
  assert.equal(septemberInbound.unitCostRp, 23500);
  assert.equal(septemberInbound.lineTotalRp, 2350000);

  engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_SALE", {
    dateKey: "2026-09-02",
    customerName: "Customer September",
    paymentStatus: "NOT_PAID",
    // A forged browser price must be ignored in September; the server owns
    // the supplier = selling price rule.
    lines: [{ variantId, qty: 1, unit: "BALL", unitPriceRp: 1 }],
  });
  const septemberSale = db
    .prepare(
      "SELECT unit_price_rp unitPriceRp,unit_cogs_rp unitCogsRp,line_total_rp lineTotalRp,cogs_total_rp cogsTotalRp FROM plastic_sales_line WHERE variant_id=? ORDER BY created_at DESC LIMIT 1"
    )
    .get(variantId);
  assert.equal(septemberSale.unitCogsRp, 23500);
  assert.equal(septemberSale.unitPriceRp, 1175000);
  assert.equal(septemberSale.cogsTotalRp, septemberSale.lineTotalRp);

  // Edit must preserve one invoice, and a void must remain void after a fresh
  // app initialization. This prevents duplicate invoices and revived voids.
  const stockBeforeLifecycle = db.prepare(
    "SELECT qty_base qtyBase FROM plastic_inventory_balance WHERE variant_id=?"
  ).get(variantId).qtyBase;
  const draftSale = engine.mutatePlasticTradingV2(storage, "test-owner", "CREATE_SALE", {
    dateKey: "2026-09-03",
    customerName: "Lifecycle Customer",
    paymentStatus: "NOT_PAID",
    lines: [{ variantId, qty: 1, unit: "ROLL", unitPriceRp: 0 }],
  });
  const beforeEditCount = db.prepare(
    "SELECT COUNT(*) count FROM plastic_sales_invoice WHERE invoice_id=?"
  ).get(draftSale.invoiceId).count;
  const editedSale = engine.mutatePlasticTradingV2(storage, "test-owner", "UPDATE_SALE", {
    invoiceId: draftSale.invoiceId,
    dateKey: "2026-09-03",
    customerName: "Lifecycle Customer",
    discountRp: 0,
    note: "Corrected quantity",
    reason: "Correct item quantity",
    lines: [{ variantId, qty: 2, unit: "ROLL", unitPriceRp: 0 }],
  });
  assert.equal(editedSale.invoiceId, draftSale.invoiceId);
  assert.equal(editedSale.invoiceNo, draftSale.invoiceNo);
  assert.equal(
    db.prepare("SELECT COUNT(*) count FROM plastic_sales_invoice WHERE invoice_id=?").get(draftSale.invoiceId).count,
    beforeEditCount,
    "edit must update the original invoice rather than create a new invoice"
  );
  engine.mutatePlasticTradingV2(storage, "test-owner", "VOID_SALE", {
    invoiceId: draftSale.invoiceId,
    reason: "Test void persistence",
  });
  assert.equal(
    db.prepare("SELECT qty_base qtyBase FROM plastic_inventory_balance WHERE variant_id=?").get(variantId).qtyBase,
    stockBeforeLifecycle,
    "void must restore the exact stock consumed by the original invoice"
  );
  engine.initPlasticTradingV2(storage);
  assert.equal(
    db.prepare("SELECT status FROM plastic_sales_invoice WHERE invoice_id=?").get(draftSale.invoiceId).status,
    "VOID",
    "a void must never be revived by reopening the app"
  );
  const outboundAfterVoid = engine.getPlasticTradingViewV2(storage, "test-owner", "OUTBOUND", "2026-09");
  assert.ok(
    !outboundAfterVoid.rows.some((row) => row.invoiceId === draftSale.invoiceId),
    "a voided invoice must be excluded from active sales history"
  );

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
  console.log("PASS posted SO factual correction is audited, atomic, and idempotent");
  console.log("PASS September inbound automatically follows the selling price");
  console.log("PASS September sales record HPP equal to the selling price");
  console.log("PASS reopening the app does not overwrite master data");
  console.log("PASS sale edit preserves invoice identity and void stays void");
}

run();
