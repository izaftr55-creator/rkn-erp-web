/**
 * RKN_GLOBAL_PATCH_V1
 *
 * Shared connector contract for Email, Shopee, and TikTok.
 * No provider SDK and no secret is required at foundation stage.
 */

export type RknConnectorKey =
  | "EMAIL"
  | "SHOPEE"
  | "TIKTOK";

export type RknConnectorMode =
  | "DISABLED"
  | "SHADOW"
  | "LIVE";

export type RknConnectorHealth =
  | "FOUNDATION"
  | "CONFIG_REQUIRED"
  | "READY"
  | "DEGRADED"
  | "ERROR";

export type RknCanonicalPipelineStage =
  | "RAW_EVENT"
  | "NORMALIZE"
  | "IDENTIFY"
  | "VALIDATE"
  | "APPLY_ONCE"
  | "LEDGER"
  | "RECONCILE"
  | "READ_MODEL";

export type RknConnectorDescriptor = {
  key: RknConnectorKey;
  label: string;
  mode: RknConnectorMode;
  health: RknConnectorHealth;
  capabilities: string[];
  credentialConfigured: boolean;
  liveEffectsEnabled: boolean;
  note: string;
};

export type RknRawIntegrationEvent = {
  provider: RknConnectorKey;
  eventKey: string;
  eventType: string;
  occurredAt: string;
  receivedAt: string;
  sourceRef?: string;
  businessUnitId?: string;
  storeId?: string;
  payload: unknown;
};

export const RKN_CANONICAL_PIPELINE: RknCanonicalPipelineStage[] = [
  "RAW_EVENT",
  "NORMALIZE",
  "IDENTIFY",
  "VALIDATE",
  "APPLY_ONCE",
  "LEDGER",
  "RECONCILE",
  "READ_MODEL",
];