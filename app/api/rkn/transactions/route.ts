import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";import type { TransactionCoreInput } from "@/lib/transactionCore";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";
export const dynamic = "force-dynamic";
async function requireSession(
  request: Request
) {
  return getAuth().api.getSession({
    headers: request.headers,
  });
}
function text(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}
function num(
  value: unknown
): number {
  const n =
    Number(value);
  return Number.isFinite(n)
    ? n
    : 0;
}
function asObject(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }
  return {};
}
function normalizeInput(
  value: unknown
): TransactionCoreInput {
  const row =
    asObject(value);
  return {
    lineKey:
      text(
        row.lineKey ||
        row.LINE_KEY
      ),
    source:
      text(
        row.source ||
        row.SOURCE ||
        "RKN"
      ),
    platform:
      text(
        row.platform ||
        row.PLATFORM
      ),
    storeId:
      text(
        row.storeId ||
        row.STORE_ID
      ),
    orderId:
      text(
        row.orderId ||
        row.ORDER_ID
      ),
    orderDate:
      text(
        row.orderDate ||
        row.ORDER_DATE
      ),
    orderStatus:
      text(
        row.orderStatus ||
        row.ORDER_STATUS
      ),
    canonicalSku:
      text(
        row.canonicalSku ||
        row.CANONICAL_SKU
      ),
    qty:
      num(
        row.qty ??
        row.QTY
      ),
  };
}
export async function GET(
  request: Request
) {
  const session =
    await requireSession(
      request
    );
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "UNAUTHORIZED",
      },
      {
        status: 401,
      }
    );
  }
  const url =
    new URL(
      request.url
    );
  const limit =
    Number(
      url.searchParams.get(
        "limit"
      ) || 100
    );
  return NextResponse.json(
    {
      ok: true,
      version:
        "RKN_TRANSACTION_CORE_V16_0",
      stats:
        await getErpCoreRpcStub().getTransactionCoreStats({ actorUserId: session.user.id, permissionCode: "finance.view", businessUnitId: null }),
      rows:
        await getErpCoreRpcStub().getRecentTransactions({ actorUserId: session.user.id, permissionCode: "finance.view", businessUnitId: null }, limit),
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}
export async function POST(
  request: Request
) {
  const session =
    await requireSession(
      request
    );
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "UNAUTHORIZED",
      },
      {
        status: 401,
      }
    );
  }
  const body =
    await request
      .json()
      .catch(
        () => ({})
      );
  const bodyObject =
    asObject(body);
  const rawRows =
    Array.isArray(
      bodyObject.rows
    )
      ? bodyObject.rows
      : [];
  if (
    rawRows.length === 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ROWS_REQUIRED",
      },
      {
        status: 400,
      }
    );
  }
  if (
    rawRows.length > 5000
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ROWS_LIMIT_EXCEEDED",
      },
      {
        status: 400,
      }
    );
  }
  try {
    const inputs =
      rawRows.map(
        normalizeInput
      );
    const rows =
      await getErpCoreRpcStub().upsertTransactionLines({ actorUserId: session.user.id, permissionCode: "finance.post", businessUnitId: null }, inputs);
    return NextResponse.json({
      ok: true,
      version:
        "RKN_TRANSACTION_CORE_V16_0",
      processed:
        rows.length,
      costFound:
        rows.filter(
          (row: { cost_status?: unknown }) =>
            row.cost_status ===
            "FOUND"
        ).length,
      costPending:
        rows.filter(
          (row: { cost_status?: unknown }) =>
            row.cost_status !==
            "FOUND"
        ).length,
      rows,
    });
  } catch (error) {
    console.error(
      "[RKN_TRANSACTION_CORE]",
      error
    );
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "TRANSACTION_CORE_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}
