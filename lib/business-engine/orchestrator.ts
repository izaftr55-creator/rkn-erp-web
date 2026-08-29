/* RKN_GLOBAL_BUSINESS_ORCHESTRATOR_V1 */

import type { RknBusinessDomainKey } from "./contracts";
import { RKN_GLOBAL_SAFETY_POLICY } from "./contracts";
import { getRknBusinessDomain } from "./registry";
import { getRknBusinessEvent } from "./events";
import { RKN_GLOBAL_AUTOMATION_RULES } from "./automation";
import { getRknExistingEngineWiring } from "./wiring";

export type RknShadowStepMode =
  | "OBSERVE"
  | "VALIDATE"
  | "PLAN_ONLY"
  | "REVIEW"
  | "BLOCKED_LIVE_EFFECT";

export interface RknShadowPlanInput {
  eventKey: string;
  source?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface RknShadowPlanStep {
  order: number;
  domain: RknBusinessDomainKey;
  mode: RknShadowStepMode;
  action: string;
  existingSurface: string | null;
  reason: string;
}

export interface RknShadowPlan {
  mode: "SHADOW";
  liveEffectsEnabled: false;
  eventKey: string;
  source: string | null;
  idempotencyKeyPresent: boolean;
  eventKnown: boolean;
  primaryDomain: RknBusinessDomainKey | null;
  steps: RknShadowPlanStep[];
  automationRules: string[];
  blockedLiveEffects: string[];
}

const DOMAIN_DOWNSTREAM: Readonly<
  Partial<Record<RknBusinessDomainKey, readonly RknBusinessDomainKey[]>>
> = {
  MARKETPLACE: ["ORDER", "REVIEW_RECON"],
  ORDER: ["INVENTORY", "COSTING_HPP", "REVIEW_RECON"],
  INVENTORY: ["COSTING_HPP", "FINANCE_SETTLEMENT", "REVIEW_RECON"],
  COSTING_HPP: ["FINANCE_SETTLEMENT", "REVIEW_RECON"],
  BORROW_TRANSFER: ["INVENTORY", "FINANCE_SETTLEMENT", "REVIEW_RECON"],
  PAYROLL: ["COSTING_HPP", "FINANCE_SETTLEMENT", "REVIEW_RECON"],
  FINANCE_SETTLEMENT: ["REVIEW_RECON"],
  AUTOMATION: ["REVIEW_RECON", "EMAIL_NOTIFICATION"],
  REVIEW_RECON: ["EMAIL_NOTIFICATION"],
  EMAIL_NOTIFICATION: [],
  IDEMPOTENCY: [],
};

function uniqueDomains(
  values: readonly RknBusinessDomainKey[],
): RknBusinessDomainKey[] {
  return [...new Set(values)];
}

function expandDomains(
  primary: RknBusinessDomainKey,
): RknBusinessDomainKey[] {
  const downstream = DOMAIN_DOWNSTREAM[primary] ?? [];
  return uniqueDomains([
    primary,
    "IDEMPOTENCY",
    ...downstream,
    "AUTOMATION",
  ]);
}

/**
 * Builds a deterministic execution plan only.
 * It does not invoke order, inventory, HPP, payroll, finance,
 * marketplace, email, or automation mutation functions.
 */
export function buildRknShadowBusinessPlan(
  input: RknShadowPlanInput,
): RknShadowPlan {
  const event = getRknBusinessEvent(input.eventKey);
  const primaryDomain = event?.domain ?? null;

  if (!primaryDomain) {
    return {
      mode: "SHADOW",
      liveEffectsEnabled: false,
      eventKey: input.eventKey,
      source: input.source ?? null,
      idempotencyKeyPresent: Boolean(input.idempotencyKey),
      eventKnown: false,
      primaryDomain: null,
      steps: [
        {
          order: 1,
          domain: "REVIEW_RECON",
          mode: "REVIEW",
          action: "UNKNOWN_EVENT_TO_REVIEW",
          existingSurface: "automation_review_queue",
          reason: "Unknown events never receive business effects.",
        },
      ],
      automationRules: [],
      blockedLiveEffects: [
        "BUSINESS_WRITE",
        "INVENTORY_WRITE",
        "FINANCE_WRITE",
        "PAYROLL_WRITE",
        "EMAIL_SEND",
        "MARKETPLACE_EFFECT",
      ],
    };
  }

  const domains = expandDomains(primaryDomain);
  const steps: RknShadowPlanStep[] = [];
  let order = 1;

  steps.push({
    order: order++,
    domain: "IDEMPOTENCY",
    mode: input.idempotencyKey ? "VALIDATE" : "REVIEW",
    action: input.idempotencyKey
      ? "CHECK_IDEMPOTENCY_KEY"
      : "MISSING_IDEMPOTENCY_KEY",
    existingSurface: "automation_idempotency_receipt / business_event",
    reason: input.idempotencyKey
      ? "A future live effect must apply once."
      : "Live mutation remains blocked without an idempotency key.",
  });

  for (const domainKey of domains) {
    if (domainKey === "IDEMPOTENCY") {
      continue;
    }

    const domain = getRknBusinessDomain(domainKey);
    const wiring = getRknExistingEngineWiring(domainKey);

    steps.push({
      order: order++,
      domain: domainKey,
      mode:
        domainKey === "REVIEW_RECON"
          ? "REVIEW"
          : "PLAN_ONLY",
      action:
        domainKey === "REVIEW_RECON"
          ? "RECONCILE_OR_QUEUE_REVIEW"
          : "PLAN_EXISTING_ENGINE_CALL",
      existingSurface: wiring
        ? `${wiring.source} :: ${wiring.symbols.join(", ")}`
        : null,
      reason:
        domain?.liveEffectsEnabled === false
          ? "Existing engine is registered but live effects are disabled."
          : "Domain is not eligible for live execution.",
    });
  }

  const matchedRules = RKN_GLOBAL_AUTOMATION_RULES.filter(
    (rule) => rule.triggerEvent === input.eventKey,
  );

  for (const rule of matchedRules) {
    steps.push({
      order: order++,
      domain:
        rule.action === "QUEUE_EMAIL"
          ? "EMAIL_NOTIFICATION"
          : rule.action === "RECONCILE" || rule.action === "QUEUE_REVIEW"
            ? "REVIEW_RECON"
            : "AUTOMATION",
      mode:
        rule.action === "QUEUE_REVIEW"
          ? "REVIEW"
          : "PLAN_ONLY",
      action: `AUTOMATION_${rule.action}`,
      existingSurface:
        rule.action === "QUEUE_EMAIL"
          ? "RKN_EMAIL_ENGINE"
          : "automation_job / automation_review_queue",
      reason: "Automation rule is SHADOW and cannot produce live effects.",
    });
  }

  steps.push({
    order: order++,
    domain: primaryDomain,
    mode: "BLOCKED_LIVE_EFFECT",
    action: "LIVE_EFFECT_GATE",
    existingSurface: null,
    reason: RKN_GLOBAL_SAFETY_POLICY.businessWritesAllowed
      ? "Unexpected live state."
      : "Global safety policy blocks all business mutation in SHADOW.",
  });

  return {
    mode: "SHADOW",
    liveEffectsEnabled: false,
    eventKey: input.eventKey,
    source: input.source ?? null,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    eventKnown: true,
    primaryDomain,
    steps,
    automationRules: matchedRules.map((rule) => rule.key),
    blockedLiveEffects: [
      "BUSINESS_WRITE",
      "INVENTORY_WRITE",
      "FINANCE_WRITE",
      "PAYROLL_WRITE",
      "EMAIL_SEND",
      "MARKETPLACE_EFFECT",
    ],
  };
}