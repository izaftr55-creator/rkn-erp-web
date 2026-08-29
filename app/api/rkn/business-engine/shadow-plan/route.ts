/* RKN_GLOBAL_BUSINESS_ORCHESTRATOR_V1 */

import { requireRknSystemAdmin } from "../../../../../lib/access/rknSystemAdmin";
import { buildRknShadowBusinessPlan } from "../../../../../lib/business-engine/orchestrator";

export async function POST(request: Request) {
  await requireRknSystemAdmin();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      {
        status: 400,
      },
    );
  }

  const input =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};

  const eventKey =
    typeof input.eventKey === "string"
      ? input.eventKey.trim()
      : "";

  if (!eventKey) {
    return Response.json(
      {
        ok: false,
        error: "EVENT_KEY_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  const plan = buildRknShadowBusinessPlan({
    eventKey,
    source:
      typeof input.source === "string"
        ? input.source
        : null,
    idempotencyKey:
      typeof input.idempotencyKey === "string"
        ? input.idempotencyKey
        : null,
  });

  return Response.json({
    ok: true,
    effectsApplied: false,
    plan,
  });
}