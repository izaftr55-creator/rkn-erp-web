/* RKN_GLOBAL_BUSINESS_ENGINE_V1 */

export const RKN_GLOBAL_BUSINESS_ENGINE_VERSION =
  "RKN_GLOBAL_BUSINESS_ENGINE_V1_20260822";

export type RknBusinessDomainKey =
  | "ORDER"
  | "INVENTORY"
  | "COSTING_HPP"
  | "BORROW_TRANSFER"
  | "PAYROLL"
  | "FINANCE_SETTLEMENT"
  | "AUTOMATION"
  | "REVIEW_RECON"
  | "EMAIL_NOTIFICATION"
  | "IDEMPOTENCY"
  | "MARKETPLACE";

export type RknEngineMode = "SHADOW" | "LIVE";

export type RknDomainReadiness =
  | "EXTEND_EXISTING"
  | "FOUNDATION_ONLY"
  | "REVIEW";

export interface RknBusinessDomainDefinition {
  key: RknBusinessDomainKey;
  label: string;
  mode: RknEngineMode;
  readiness: RknDomainReadiness;
  liveEffectsEnabled: boolean;
  writesAllowed: boolean;
  existingSurfaces: readonly string[];
  responsibilities: readonly string[];
}

export type RknBusinessEventSeverity =
  | "INFO"
  | "REVIEW"
  | "WARNING"
  | "CRITICAL";

export interface RknBusinessEventDefinition {
  key: string;
  domain: RknBusinessDomainKey;
  severity: RknBusinessEventSeverity;
  emailEligible: boolean;
  description: string;
}

export type RknAutomationAction =
  | "QUEUE_EMAIL"
  | "QUEUE_REVIEW"
  | "RECONCILE"
  | "NOOP_SHADOW";

export interface RknAutomationRuleDefinition {
  key: string;
  triggerEvent: string;
  action: RknAutomationAction;
  shadowEnabled: boolean;
  liveEnabled: boolean;
  notes: string;
}

export interface RknEmailTemplateDefinition {
  key: string;
  eventKey: string;
  audience:
    | "SYSTEM_ADMIN"
    | "OWNER"
    | "OPS"
    | "PAYROLL"
    | "FINANCE"
    | "USER";
  subject: string;
  purpose: string;
}

export const RKN_GLOBAL_PIPELINE = [
  "RAW_EVENT",
  "NORMALIZE",
  "IDENTIFY",
  "VALIDATE",
  "APPLY_ONCE",
  "LEDGER",
  "RECONCILE",
  "READ_MODEL",
] as const;

export const RKN_GLOBAL_SAFETY_POLICY = {
  mode: "SHADOW" as const,
  businessWritesAllowed: false,
  providerSendAllowed: false,
  marketplaceEffectsAllowed: false,
  inventoryEffectsAllowed: false,
  financeEffectsAllowed: false,
  payrollEffectsAllowed: false,
  requireIdempotencyBeforeLive: true,
  requireLedgerBeforeLive: true,
  requireReconciliationBeforeLive: true,
  ambiguousInputPolicy: "REVIEW_NOT_MUTATE" as const,
  pipeline: RKN_GLOBAL_PIPELINE,
};

/* RKN_ORDER_LIVE_GATE_V1 */
export const RKN_CONTROLLED_DOMAIN_ACTIVATION = {
  ORDER: {
    mode: "LIVE" as const,
    writesAllowed: true,
    liveEffectsEnabled: true,
    requiresIdempotency: true,
    requiresBusinessEvent: true,
    requiresLedger: true,
    requiresReconciliation: true,
    downstreamInventoryEffectsAllowed: false,
    downstreamHppEffectsAllowed: false,
    downstreamFinanceEffectsAllowed: false,
    downstreamPayrollEffectsAllowed: false,
    emailSendAllowed: false,
    marketplaceEffectsAllowed: false,
  },
  INVENTORY: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  COSTING_HPP: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  BORROW_TRANSFER: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  PAYROLL: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  FINANCE_SETTLEMENT: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  AUTOMATION: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  REVIEW_RECON: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  EMAIL_NOTIFICATION: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  IDEMPOTENCY: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
  MARKETPLACE: {
    mode: "SHADOW" as const,
    writesAllowed: false,
    liveEffectsEnabled: false,
  },
} as const;
