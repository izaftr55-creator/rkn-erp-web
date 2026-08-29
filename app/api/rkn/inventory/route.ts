import { NextResponse } from "next/server";import type { AllocationDraftInput, InventoryAdjustmentInput } from "@/lib/inventoryCore";

import {
  requireBusinessPermission,
  requireBusinessReadPermission,
} from "@/lib/rknAccess";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";


/* RKN_INVENTORY_API_V10_4A_START */


function text(
  value: unknown,
  maxLength = 700
) {
  return String(
    value ?? ""
  )
    .trim()
    .slice(
      0,
      maxLength
    );
}


function numberValue(
  value: unknown,
  fallback = 0
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


function errorResponse(
  error: unknown,
  fallbackStatus = 400
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.startsWith(
      "INSUFFICIENT_STOCK"
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INSUFFICIENT_STOCK",
        detail:
          message,
      },
      {
        status: 409,
      }
    );
  }

  if (
    message ===
      "ALLOCATION_ALREADY_CONFIRMED" ||
    message ===
      "ALLOCATION_LEDGER_CONFLICT" ||
    message ===
      "MOVEMENT_KEY_CONFLICT"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          message,
      },
      {
        status: 409,
      }
    );
  }

  if (
    message ===
    "ALLOCATION_NOT_FOUND"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          message,
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        message ||
        "INVENTORY_REQUEST_FAILED",
    },
    {
      status:
        fallbackStatus,
    }
  );
}


function deniedResponse(
  access:
    | {
        ok: false;
        status: 401 | 403;
        error: string;
      }
) {
  return NextResponse.json(
    {
      ok: false,
      error:
        access.error,
    },
    {
      status:
        access.status,
    }
  );
}


export async function GET(
  request: Request
) {
  try {
    

    const url =
      new URL(
        request.url
      );

    const businessUnitId =
      text(
        url.searchParams.get(
          "businessUnitId"
        ),
        120
      );

    const warehouseId =
      text(
        url.searchParams.get(
          "warehouseId"
        ),
        120
      );

    const physicalSku =
      text(
        url.searchParams.get(
          "physicalSku"
        ),
        240
      ).toUpperCase();

    const lineKey =
      text(
        url.searchParams.get(
          "lineKey"
        ),
        700
      );

    const limit =
      Math.max(
        1,
        Math.min(
          500,
          Math.floor(
            numberValue(
              url.searchParams.get(
                "limit"
              ),
              100
            )
          )
        )
      );


    if (!businessUnitId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "BUSINESS_UNIT_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }


    const access =
      await requireBusinessReadPermission(
        "inventory.view",
        businessUnitId,
        [
          "VIEW",
          "MANAGE",
          "OWNER",
        ]
      );


    if (!access.ok) {
      return deniedResponse(
        access
      );
    }


    if (lineKey) {
      const result =
        await getErpCoreRpcStub().getAllocation({ actorUserId: access.session.user.id, permissionCode: "inventory.view", businessUnitId, allowedAccessLevels: ["VIEW", "MANAGE", "OWNER"] }, lineKey);

      if (
        result &&
        result.allocation
          .business_unit_id !==
          businessUnitId
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "ALLOCATION_SCOPE_MISMATCH",
          },
          {
            status: 403,
          }
        );
      }

      return NextResponse.json({
        ok: true,
        version:
          "RKN_INVENTORY_API_V10_4A",
        accessMode:
          access.accessMode,
        allocation:
          result,
      });
    }


    if (
      warehouseId &&
      physicalSku
    ) {
      return NextResponse.json({
        ok: true,
        version:
          "RKN_INVENTORY_API_V10_4A",
        accessMode:
          access.accessMode,
        balance:
          await getErpCoreRpcStub().getInventoryBalance({ actorUserId: access.session.user.id, permissionCode: "inventory.view", businessUnitId, allowedAccessLevels: ["VIEW", "MANAGE", "OWNER"] }, businessUnitId, warehouseId, physicalSku),
      });
    }


    const {
      balances,
      ledger,
      allocations,
      scopedStats,
    } =
      await getErpCoreRpcStub()
        .getInventoryRouteReadModel(
          {
            actorUserId:
              access.session.user.id,
            permissionCode:
              "inventory.view",
            businessUnitId,
            allowedAccessLevels: [
              "VIEW",
              "MANAGE",
              "OWNER",
            ],
          },
          businessUnitId,
          warehouseId,
          limit
        ) as any;


    


    


    


    return NextResponse.json({
      ok: true,

      version:
        "RKN_INVENTORY_API_V10_4A",

      accessMode:
        access.accessMode,

      businessUnitId,
      warehouseId,

      stats:
        scopedStats,

      balances,
      ledger,
      allocations,

      core:
        await getErpCoreRpcStub().getInventoryCoreStats({ actorUserId: access.session.user.id, permissionCode: "inventory.view", businessUnitId, allowedAccessLevels: ["VIEW", "MANAGE", "OWNER"] }),
    });

  } catch (error) {
    return errorResponse(
      error,
      500
    );
  }
}


export async function POST(
  request: Request
) {
  try {
    

    const body =
      (await request.json()) as Record<string, unknown>;

    const action =
      text(
        body?.action,
        80
      ).toUpperCase();

    const businessUnitId =
      text(
        body?.businessUnitId,
        120
      );


    if (!businessUnitId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "BUSINESS_UNIT_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }


    const access =
      await requireBusinessPermission(
        "inventory.manage",
        businessUnitId,
        [
          "MANAGE",
          "OWNER",
        ]
      );


    if (!access.ok) {
      return deniedResponse(
        access
      );
    }


    const actorUserId =
      access.session.user.id;


    if (
      action ===
      "UPSERT_ALLOCATION_DRAFT"
    ) {
      const input:
        AllocationDraftInput = {
          lineKey:
            text(
              body?.lineKey,
              700
            ),

          businessUnitId,

          warehouseId:
            text(
              body?.warehouseId,
              120
            ),

          actorUserId,

          platform:
            text(
              body?.platform,
              40
            ),

          storeId:
            text(
              body?.storeId,
              160
            ),

          orderId:
            text(
              body?.orderId,
              240
            ),

          orderDate:
            text(
              body?.orderDate,
              80
            ),

          sellSku:
            text(
              body?.sellSku,
              240
            ),

          orderedQty:
            numberValue(
              body?.orderedQty
            ),

          requiredQty:
            numberValue(
              body?.requiredQty
            ),

          items:
            Array.isArray(
              body?.items
            )
              ? body.items.map(
                  (
                    item: {
                      physicalSku?:
                        unknown;
                      qty?:
                        unknown;
                    }
                  ) => ({
                    physicalSku:
                      text(
                        item?.physicalSku,
                        240
                      ),

                    qty:
                      numberValue(
                        item?.qty
                      ),
                  })
                )
              : [],
        };


      const result =
        await getErpCoreRpcStub().upsertAllocationDraft({ actorUserId: access.session.user.id, permissionCode: "inventory.manage", businessUnitId, allowedAccessLevels: ["MANAGE", "OWNER"] }, input);


      return NextResponse.json({
        ok: true,
        version:
          "RKN_INVENTORY_API_V10_4A",
        action,
        result,
      });
    }


    if (
      action ===
      "CONFIRM_ALLOCATION"
    ) {
      const lineKey =
        text(
          body?.lineKey,
          700
        );

      const current =
        await getErpCoreRpcStub().getAllocation({ actorUserId: access.session.user.id, permissionCode: "inventory.manage", businessUnitId, allowedAccessLevels: ["MANAGE", "OWNER"] }, lineKey);


      if (!current) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "ALLOCATION_NOT_FOUND",
          },
          {
            status: 404,
          }
        );
      }


      if (
        current.allocation
          .business_unit_id !==
        businessUnitId
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "ALLOCATION_SCOPE_MISMATCH",
          },
          {
            status: 403,
          }
        );
      }


      const result =
        await getErpCoreRpcStub().confirmAllocation({ actorUserId: access.session.user.id, permissionCode: "inventory.manage", businessUnitId, allowedAccessLevels: ["MANAGE", "OWNER"] }, lineKey, actorUserId);


      return NextResponse.json({
        ok: true,
        version:
          "RKN_INVENTORY_API_V10_4A",
        action,
        result,
      });
    }


    if (
      action ===
        "OPENING" ||
      action ===
        "ADJUSTMENT" ||
      action ===
        "RETURN_IN" ||
      action ===
        "BORROW_OUT" ||
      action ===
        "BORROW_IN"
    ) {
      const input:
        InventoryAdjustmentInput = {
          movementKey:
            text(
              body?.movementKey,
              700
            ),

          businessUnitId,

          warehouseId:
            text(
              body?.warehouseId,
              120
            ),

          physicalSku:
            text(
              body?.physicalSku,
              240
            ),

          qtyDelta:
            numberValue(
              body?.qtyDelta
            ),

          movementType:
            action,

          actorUserId,

          sourceType:
            text(
              body?.sourceType,
              100
            ),

          sourceKey:
            text(
              body?.sourceKey,
              700
            ),

          note:
            text(
              body?.note,
              1000
            ),
        };


      const result =
        await getErpCoreRpcStub().applyInventoryAdjustment({ actorUserId: access.session.user.id, permissionCode: "inventory.manage", businessUnitId, allowedAccessLevels: ["MANAGE", "OWNER"] }, input);


      return NextResponse.json({
        ok: true,
        version:
          "RKN_INVENTORY_API_V10_4A",
        action,
        result,
      });
    }


    return NextResponse.json(
      {
        ok: false,

        error:
          "INVENTORY_ACTION_INVALID",

        allowedActions: [
          "UPSERT_ALLOCATION_DRAFT",
          "CONFIRM_ALLOCATION",
          "OPENING",
          "ADJUSTMENT",
          "RETURN_IN",
          "BORROW_OUT",
          "BORROW_IN",
        ],
      },
      {
        status: 400,
      }
    );

  } catch (error) {
    return errorResponse(
      error
    );
  }
}


/* RKN_INVENTORY_API_V10_4A_END */