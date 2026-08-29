import { NextResponse } from "next/server";

import { requireRknSystemAdmin } from "@/lib/access/rknSystemAdmin";
import {
  getRknConnectorRegistry,
} from "@/lib/integrations/registry";
import {
  RKN_CANONICAL_PIPELINE,
} from "@/lib/integrations/contracts";

export const dynamic = "force-dynamic";

/**
 * RKN_GLOBAL_PATCH_V1
 *
 * Read-only integration foundation status.
 * Never returns secrets and never calls external providers.
 */
export async function GET() {
  await requireRknSystemAdmin();

  return NextResponse.json({
    ok: true,
    version: "RKN_GLOBAL_PATCH_V1",
    effectsMode: "DISABLED",
    pipeline: RKN_CANONICAL_PIPELINE,
    connectors: getRknConnectorRegistry(),
  });
}