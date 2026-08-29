import type { DoSqliteCompat } from "../do-sqlite-compat";

export type RknOperationSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
};

type AccessLevel =
  | "VIEW"
  | "MANAGE"
  | "OWNER";

type AccessFn = (
  permissionCode: string,
  businessUnitId: string,
  allowedAccessLevels: AccessLevel[]
) => Promise<any> | any;

export function createHppOps(deps: {
  db: DoSqliteCompat;
  sessionUser?: RknOperationSessionUser | null;
  requireBusinessPermission?: AccessFn;
  requireBusinessReadPermission?: AccessFn;
}) {
  const db = deps.db;

  const __rknInjectedSession =
    deps.sessionUser
      ? {
          user:
            deps.sessionUser,
        }
      : null;

  const NextResponse =
    Response;

  type NextRequest =
    Request;

  const getAuth =
    () => ({
      api: {
        getSession: async (
          _input?: unknown
        ) =>
          __rknInjectedSession,
      },
    });

  const auth =
    getAuth();

  const requireBusinessPermission =
    deps.requireBusinessPermission ??
    (async () => ({
      ok: false,
      status: 403,
      error: "PERMISSION_DENIED",
    }));

  const requireBusinessReadPermission =
    deps.requireBusinessReadPermission ??
    (async () => ({
      ok: false,
      status: 403,
      error: "PERMISSION_DENIED",
    }));

  type RoleRow = {
    role_code: string;
  };
  
  type HppComponent = {
    name: string;
    amount: number;
  };
  
  function ensureSchema() {}
  
  async function requireSystemAdmin(
    request: Request
  ) {
    const session =
      await getAuth().api.getSession({
        headers: request.headers,
      });
  
    if (!session) {
      return null;
    }
  
    const roles =
      db.prepare(`
        SELECT
          r.code AS role_code
        FROM user_role ur
        JOIN role r
          ON r.id = ur.role_id
        WHERE ur.user_id = ?
      `).all(
        session.user.id
      ) as RoleRow[];
  
    const isAdmin =
      roles.some(
        (row) =>
          row.role_code ===
          "SYSTEM_ADMIN"
      );
  
    if (!isAdmin) {
      return null;
    }
  
    return session;
  }
  
  function safeMoney(
    value: unknown
  ) {
    const number =
      Number(value);
  
    if (
      !Number.isFinite(number) ||
      number < 0
    ) {
      return 0;
    }
  
    return Math.round(
      number * 100
    ) / 100;
  }
  
  function cleanText(
    value: unknown,
    max = 500
  ) {
    return String(
      value ?? ""
    )
      .trim()
      .slice(0, max);
  }
  
  function buildCostKey(
    productId: string,
    sku: string
  ) {
    if (sku) {
      return `SKU:${sku}`;
    }
  
    if (productId) {
      return `PRODUCT:${productId}`;
    }
  
    return "";
  }
  
  async function GET(
    request: Request
  ) {
    const session =
      await requireSystemAdmin(
        request
      );
  
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAUTHORIZED",
        },
        {
          status: 403,
        }
      );
    }
  
    ensureSchema();
  
    const url =
      new URL(request.url);
  
    const costKey =
      cleanText(
        url.searchParams.get(
          "costKey"
        ),
        240
      );
  
    const rows =
      db.prepare(`
        SELECT
          cost_key,
          product_id,
          sku,
          product_name,
          method,
          manual_hpp,
          calculated_hpp,
          effective_hpp,
          components_json,
          effective_from,
          source_note,
          updated_by,
          updated_at
        FROM hpp_master
        ORDER BY
          product_name COLLATE NOCASE,
          sku COLLATE NOCASE
      `).all();
  
    let history: unknown[] = [];
  
    if (costKey) {
      history =
        db.prepare(`
          SELECT
            id,
            cost_key,
            product_id,
            sku,
            product_name,
            method,
            manual_hpp,
            calculated_hpp,
            effective_hpp,
            components_json,
            effective_from,
            source_note,
            changed_by,
            changed_at
          FROM hpp_history
          WHERE cost_key = ?
          ORDER BY
            changed_at DESC,
            id DESC
          LIMIT 50
        `).all(costKey);
    }
  
    return NextResponse.json(
      {
        ok: true,
        rows,
        history,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
  
  async function POST(
    request: Request
  ) {
    const session =
      await requireSystemAdmin(
        request
      );
  
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAUTHORIZED",
        },
        {
          status: 403,
        }
      );
    }
  
    ensureSchema();
  
    const body =
      (await request.json().catch(() => null)) as
        Record<string, unknown> | null;
  
    if (
      !body ||
      typeof body !== "object"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PAYLOAD_INVALID",
        },
        {
          status: 400,
        }
      );
    }
  
    const productId =
      cleanText(
        body.productId,
        120
      );
  
    const sku =
      cleanText(
        body.sku,
        120
      );
  
    const productName =
      cleanText(
        body.productName,
        240
      );
  
    const method =
      body.method === "AUTO"
        ? "AUTO"
        : "MANUAL";
  
    const manualHpp =
      safeMoney(
        body.manualHpp
      );
  
    const rawComponents =
      Array.isArray(
        body.components
      )
        ? body.components
        : [];
  
    const components:
      HppComponent[] =
      rawComponents
        .slice(0, 30)
        .map(
          (
            item: Record<
              string,
              unknown
            >
          ) => ({
            name:
              cleanText(
                item?.name,
                120
              ),
            amount:
              safeMoney(
                item?.amount
              ),
          })
        )
        .filter(
          (item: HppComponent) =>
            item.name
        );
  
    const calculatedHpp =
      Math.round(
        components.reduce(
          (sum, item) =>
            sum +
            item.amount,
          0
        ) * 100
      ) / 100;
  
    const effectiveHpp =
      method === "MANUAL"
        ? manualHpp
        : calculatedHpp;
  
    const effectiveFrom =
      cleanText(
        body.effectiveFrom,
        20
      );
  
    const sourceNote =
      cleanText(
        body.sourceNote,
        1000
      );
  
    const costKey =
      buildCostKey(
        productId,
        sku
      );
  
    if (!costKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PRODUCT_OR_SKU_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }
  
    if (!productName) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PRODUCT_NAME_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }
  
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        effectiveFrom
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "EFFECTIVE_DATE_INVALID",
        },
        {
          status: 400,
        }
      );
    }
  
    const now =
      new Date().toISOString();
  
    const actor =
      cleanText(
        session.user.name ||
        session.user.email ||
        session.user.id,
        160
      );
  
    const componentsJson =
      JSON.stringify(
        components
      );
  
    const transaction =
      db.transaction(() => {
        db.prepare(`
          INSERT INTO hpp_master (
            cost_key,
            product_id,
            sku,
            product_name,
            method,
            manual_hpp,
            calculated_hpp,
            effective_hpp,
            components_json,
            effective_from,
            source_note,
            updated_by,
            updated_at
          )
          VALUES (
            @costKey,
            @productId,
            @sku,
            @productName,
            @method,
            @manualHpp,
            @calculatedHpp,
            @effectiveHpp,
            @componentsJson,
            @effectiveFrom,
            @sourceNote,
            @actor,
            @now
          )
          ON CONFLICT(cost_key)
          DO UPDATE SET
            product_id =
              excluded.product_id,
            sku =
              excluded.sku,
            product_name =
              excluded.product_name,
            method =
              excluded.method,
            manual_hpp =
              excluded.manual_hpp,
            calculated_hpp =
              excluded.calculated_hpp,
            effective_hpp =
              excluded.effective_hpp,
            components_json =
              excluded.components_json,
            effective_from =
              excluded.effective_from,
            source_note =
              excluded.source_note,
            updated_by =
              excluded.updated_by,
            updated_at =
              excluded.updated_at
        `).run({
          costKey,
          productId,
          sku,
          productName,
          method,
          manualHpp,
          calculatedHpp,
          effectiveHpp,
          componentsJson,
          effectiveFrom,
          sourceNote,
          actor,
          now,
        });
  
        db.prepare(`
          INSERT INTO hpp_history (
            cost_key,
            product_id,
            sku,
            product_name,
            method,
            manual_hpp,
            calculated_hpp,
            effective_hpp,
            components_json,
            effective_from,
            source_note,
            changed_by,
            changed_at
          )
          VALUES (
            @costKey,
            @productId,
            @sku,
            @productName,
            @method,
            @manualHpp,
            @calculatedHpp,
            @effectiveHpp,
            @componentsJson,
            @effectiveFrom,
            @sourceNote,
            @actor,
            @now
          )
        `).run({
          costKey,
          productId,
          sku,
          productName,
          method,
          manualHpp,
          calculatedHpp,
          effectiveHpp,
          componentsJson,
          effectiveFrom,
          sourceNote,
          actor,
          now,
        });
      });
  
    transaction();
  
    return NextResponse.json({
      ok: true,
      costKey,
      method,
      calculatedHpp,
      effectiveHpp,
    });
  }

  return {
    GET,
    POST,
  };
}
