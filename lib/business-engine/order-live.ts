/* RKN_ORDER_LIVE_GATE_V1 */

import { ingestCanonicalOrderObservationV11 } from "../globalBusinessCore";
import { RKN_CONTROLLED_DOMAIN_ACTIVATION } from "./contracts";
import { getRknBusinessDomain } from "./registry";

export function getRknOrderLiveGateStatus() {
  const domain = getRknBusinessDomain("ORDER");
  const activation = RKN_CONTROLLED_DOMAIN_ACTIVATION.ORDER;

  return {
    domain: "ORDER" as const,
    mode: activation.mode,
    writesAllowed: activation.writesAllowed,
    liveEffectsEnabled: activation.liveEffectsEnabled,
    requiresIdempotency: activation.requiresIdempotency,
    requiresBusinessEvent: activation.requiresBusinessEvent,
    requiresLedger: activation.requiresLedger,
    requiresReconciliation: activation.requiresReconciliation,
    downstream: {
      inventory: activation.downstreamInventoryEffectsAllowed,
      hpp: activation.downstreamHppEffectsAllowed,
      finance: activation.downstreamFinanceEffectsAllowed,
      payroll: activation.downstreamPayrollEffectsAllowed,
      email: activation.emailSendAllowed,
      marketplace: activation.marketplaceEffectsAllowed,
    },
    registryConsistent:
      domain?.mode === "LIVE" &&
      domain.liveEffectsEnabled === true &&
      domain.writesAllowed === true,
  };
}

/**
 * Controlled internal Order mutation boundary.
 *
 * The authoritative order engine already owns its idempotency/business-event
 * behavior. This adapter does not add Inventory, HPP, Finance, Payroll,
 * Email, or Marketplace side effects.
 *
 * No public route is created in G4B.
 */
export async function executeRknOrderLive(
  ...args: Parameters<typeof ingestCanonicalOrderObservationV11>
): Promise<Awaited<ReturnType<typeof ingestCanonicalOrderObservationV11>>> {
  const gate = getRknOrderLiveGateStatus();

  if (
    gate.mode !== "LIVE" ||
    gate.writesAllowed !== true ||
    gate.liveEffectsEnabled !== true ||
    gate.registryConsistent !== true
  ) {
    throw new Error("RKN_ORDER_LIVE_GATE_DISABLED");
  }

  if (
    gate.downstream.inventory ||
    gate.downstream.hpp ||
    gate.downstream.finance ||
    gate.downstream.payroll ||
    gate.downstream.email ||
    gate.downstream.marketplace
  ) {
    throw new Error("RKN_ORDER_LIVE_DOWNSTREAM_EFFECT_GATE_FAILED");
  }

  return await ingestCanonicalOrderObservationV11(...args);
}