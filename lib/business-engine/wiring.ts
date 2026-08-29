/* RKN_GLOBAL_BUSINESS_ORCHESTRATOR_V1 */

import type { RknBusinessDomainKey } from "./contracts";

export interface RknExistingEngineSurface {
  domain: RknBusinessDomainKey;
  source: string;
  symbols: readonly string[];
  mutationBoundary: boolean;
  shadowCallAllowed: boolean;
  notes: string;
}

/**
 * This registry points at the authoritative engines already present in RKN ERP.
 * It intentionally does not execute mutation functions yet.
 */
export const RKN_EXISTING_ENGINE_WIRING: readonly RknExistingEngineSurface[] = [
  {
    domain: "ORDER",
    source: "lib/globalBusinessCore.ts",
    symbols: [
      "ingestCanonicalOrderObservationV11",
      "buildBusinessEventKey",
      "buildOrderKey",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Canonical order ingestion exists; live invocation remains gated.",
  },
  {
    domain: "INVENTORY",
    source: "lib/inventoryCore.ts",
    symbols: [
      "applyInventoryAdjustment",
      "getInventoryBalance",
      "getRecentInventoryLedger",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Inventory mutation exists; shadow orchestrator may only plan the call.",
  },
  {
    domain: "COSTING_HPP",
    source: "cloudflare/ops/hpp.ts + lib/transactionCore.ts",
    symbols: [
      "createHppOps",
      "lookupHistoricalHpp",
      "getHppManagementState",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "HPP and historical costing surfaces already exist.",
  },
  {
    domain: "BORROW_TRANSFER",
    source: "existing inventory + transaction ledger boundaries",
    symbols: [
      "inventory_ledger",
      "transaction_ledger",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Borrow/transfer must extend ledger boundaries, never bypass them.",
  },
  {
    domain: "PAYROLL",
    source: "existing worker/payroll schema and role workspace",
    symbols: [
      "payroll_department",
      "worker",
      "worker_department_assignment",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Payroll live posting remains gated pending effective-rate contract.",
  },
  {
    domain: "FINANCE_SETTLEMENT",
    source: "existing transaction ledger + HPP history",
    symbols: [
      "transaction_ledger",
      "hpp_history",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Finance posting must follow ledger and historical HPP.",
  },
  {
    domain: "AUTOMATION",
    source: "existing automation engine",
    symbols: [
      "automation_job",
      "automation_run",
      "automation_idempotency_receipt",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Existing automation runner remains SHADOW.",
  },
  {
    domain: "REVIEW_RECON",
    source: "existing review and reconciliation engine",
    symbols: [
      "automation_review_queue",
      "reconciliation_state",
    ],
    mutationBoundary: false,
    shadowCallAllowed: false,
    notes: "Review/reconciliation is a mandatory safety boundary.",
  },
  {
    domain: "EMAIL_NOTIFICATION",
    source: "provider-neutral G3B email foundation",
    symbols: [
      "RKN_EMAIL_ENGINE",
      "RKN_EMAIL_TEMPLATES",
      "whatsapp_message_outbox",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Email outbox/provider persistence is not wired live yet.",
  },
  {
    domain: "IDEMPOTENCY",
    source: "existing event + automation idempotency boundaries",
    symbols: [
      "business_event",
      "automation_idempotency_receipt",
    ],
    mutationBoundary: false,
    shadowCallAllowed: false,
    notes: "Every future live mutation must present an idempotency key.",
  },
  {
    domain: "MARKETPLACE",
    source: "existing marketplace file/Shopee integration surfaces",
    symbols: [
      "parseMarketplaceInput",
      "parseMarketplaceFile",
      "createShopeeAuthUrl",
      "exchangeShopeeCode",
    ],
    mutationBoundary: true,
    shadowCallAllowed: false,
    notes: "Marketplace must feed the canonical ERP pipeline, never mutate stock directly.",
  },
];

export function getRknExistingEngineWiring(domain: RknBusinessDomainKey) {
  return RKN_EXISTING_ENGINE_WIRING.find((item) => item.domain === domain) ?? null;
}