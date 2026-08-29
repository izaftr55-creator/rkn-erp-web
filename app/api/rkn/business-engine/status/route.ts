/* RKN_GLOBAL_BUSINESS_ENGINE_V1 */

import { requireRknSystemAdmin } from "../../../../../lib/access/rknSystemAdmin";
import {
  RKN_GLOBAL_BUSINESS_ENGINE_VERSION,
  RKN_GLOBAL_SAFETY_POLICY,
} from "../../../../../lib/business-engine/contracts";
import { RKN_BUSINESS_DOMAIN_REGISTRY } from "../../../../../lib/business-engine/registry";
import { RKN_BUSINESS_EVENT_CATALOG } from "../../../../../lib/business-engine/events";
import {
  RKN_AUTOMATION_LIVE_RULE_COUNT,
  RKN_GLOBAL_AUTOMATION_RULES,
} from "../../../../../lib/business-engine/automation";
import { getRknOrderLiveGateStatus } from "../../../../../lib/business-engine/order-live";
import {
  RKN_EMAIL_ENGINE,
  RKN_EMAIL_TEMPLATES,
} from "../../../../../lib/business-engine/email";

export async function GET() {
  await requireRknSystemAdmin();

  return Response.json({
    ok: true,
    version: RKN_GLOBAL_BUSINESS_ENGINE_VERSION,
    mode: "SHADOW",
    liveEffectsEnabled: false,
    safety: RKN_GLOBAL_SAFETY_POLICY,
    domains: RKN_BUSINESS_DOMAIN_REGISTRY,
    events: RKN_BUSINESS_EVENT_CATALOG,
    automation: {
      liveRuleCount: RKN_AUTOMATION_LIVE_RULE_COUNT,
      rules: RKN_GLOBAL_AUTOMATION_RULES,
    },
    email: {
      engine: RKN_EMAIL_ENGINE,
      templates: RKN_EMAIL_TEMPLATES,
    },
    orderLiveGate: getRknOrderLiveGateStatus(),
  });
}