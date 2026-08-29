import type {
  RknConnectorDescriptor,
  RknConnectorKey,
} from "./contracts";

/**
 * RKN_GLOBAL_PATCH_V1
 *
 * Foundation registry only.
 * Credentials and live effects are deliberately false until provider-specific
 * verification and controlled activation are completed.
 */
export const RKN_CONNECTOR_REGISTRY: Record<
  RknConnectorKey,
  RknConnectorDescriptor
> = {
  EMAIL: {
    key: "EMAIL",
    label: "Business Email",
    mode: "DISABLED",
    health: "CONFIG_REQUIRED",
    capabilities: [
      "PASSWORD_RESET",
      "TEMPORARY_PASSWORD",
      "ACCOUNT_APPROVAL",
      "SYSTEM_ALERT",
    ],
    credentialConfigured: false,
    liveEffectsEnabled: false,
    note:
      "Transport/provider belum diaktifkan. Foundation siap untuk provider bisnis.",
  },

  SHOPEE: {
    key: "SHOPEE",
    label: "Shopee Open Platform",
    mode: "DISABLED",
    health: "CONFIG_REQUIRED",
    capabilities: [
      "OAUTH",
      "WEBHOOK",
      "ORDER",
      "PRODUCT",
      "RETURN_REFUND",
      "FINANCE",
    ],
    credentialConfigured: false,
    liveEffectsEnabled: false,
    note:
      "Route legacy masih disabled. Aktivasi hanya setelah kontrak API resmi terverifikasi.",
  },

  TIKTOK: {
    key: "TIKTOK",
    label: "TikTok Shop Open Platform",
    mode: "DISABLED",
    health: "FOUNDATION",
    capabilities: [
      "OAUTH",
      "WEBHOOK",
      "ORDER",
      "PRODUCT",
      "RETURN_REFUND",
      "FINANCE",
    ],
    credentialConfigured: false,
    liveEffectsEnabled: false,
    note:
      "Connector provider belum dibuat. Canonical connector contract sudah tersedia.",
  },
};

export function getRknConnectorRegistry() {
  return Object.values(RKN_CONNECTOR_REGISTRY);
}