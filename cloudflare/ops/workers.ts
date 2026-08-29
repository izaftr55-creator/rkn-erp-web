import { randomUUID } from "node:crypto";
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

export function createWorkersOps(deps: {
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

  const WORKER_BUSINESS_UNITS = new Set([
    "BU-SABLON",
    "BU-RKN",
  ]);
  
  function resolveBusinessUnitId(
    request: Request
  ) {
    const url = new URL(request.url);
    const requested =
      url.searchParams.get("businessUnitId")
        ?.trim() || "BU-SABLON";
  
    if (!WORKER_BUSINESS_UNITS.has(requested)) {
      return null;
    }
  
    return requested;
  }
  
  const WORKER_TYPES = new Set([
    "BORONGAN",
    "HARIAN",
    "BULANAN",
    "OTHER",
  ]);
  
  const PAYMENT_METHODS = new Set([
    "CASH",
    "BANK_TRANSFER",
    "EWALLET",
    "OTHER",
  ]);
  
  const RKN_DEPARTMENT_CODES = new Set([
    "CUTTING",
    "SEWING",
    "FINISHING",
    "PACKING",
  ]);
  
  type CreateWorkerBody = {
    fullName?: unknown;
    nickname?: unknown;
    workerType?: unknown;
    whatsapp?: unknown;
    paymentMethod?: unknown;
    startDate?: unknown;
    notes?: unknown;
  departmentCodes?: unknown;
  primaryDepartmentCode?: unknown;
  };
  
  type WorkerSequenceRow = {
    prefix: string;
    last_number: number;
  };
  
  type DepartmentRow = {
    id: string;
    code: string;
  };
  
  function cleanOptionalText(
    value: unknown
  ) {
    if (typeof value !== "string") {
      return null;
    }
  
    const cleaned = value.trim();
  
    return cleaned || null;
  }
  
  function cleanRequiredText(
    value: unknown
  ) {
    if (typeof value !== "string") {
      return "";
    }
  
    return value.trim();
  }
  
  function validDateOrNull(
    value: unknown
  ) {
    const text = cleanOptionalText(value);
  
    if (!text) {
      return null;
    }
  
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return undefined;
    }
  
    return text;
  }
  
  function parseRknDepartmentCodes(
    value: unknown
  ):
    | {
        ok: true;
        codes: string[];
      }
    | {
        ok: false;
        error:
          | "DEPARTMENT_CODES_REQUIRED"
          | "INVALID_DEPARTMENT_CODE";
      } {
    if (
      !Array.isArray(value) ||
      value.length === 0
    ) {
      return {
        ok: false,
        error: "DEPARTMENT_CODES_REQUIRED",
      };
    }
  
    const codes: string[] = [];
  
    for (const item of value) {
      if (typeof item !== "string") {
        return {
          ok: false,
          error: "INVALID_DEPARTMENT_CODE",
        };
      }
  
      const code =
        item.trim().toUpperCase();
  
      if (
        !RKN_DEPARTMENT_CODES.has(code)
      ) {
        return {
          ok: false,
          error: "INVALID_DEPARTMENT_CODE",
        };
      }
  
      if (!codes.includes(code)) {
        codes.push(code);
      }
    }
  
    if (codes.length === 0) {
      return {
        ok: false,
        error: "DEPARTMENT_CODES_REQUIRED",
      };
    }
  
    return {
      ok: true,
      codes,
    };
  }
  
  async function GET(
    request: Request
  ) {
    const businessUnitId =
      resolveBusinessUnitId(request);
  
    if (!businessUnitId) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_BUSINESS_UNIT",
        },
        { status: 400 }
      );
    }
    const access =
      await requireBusinessReadPermission(
        "payroll.view",
        businessUnitId,
        ["VIEW", "MANAGE", "OWNER"]
      );
  
    if (!access.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: access.error,
        },
        {
          status: access.status,
        }
      );
    }
  
    const workers = db.prepare(`
      SELECT
        id,
        worker_code AS workerCode,
        business_unit_id AS businessUnitId,
        full_name AS fullName,
        nickname,
        worker_type AS workerType,
        whatsapp,
        payment_method AS paymentMethod,
        start_date AS startDate,
        end_date AS endDate,
        active,
        notes,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM worker
      WHERE business_unit_id = ?
      ORDER BY
        active DESC,
        full_name COLLATE NOCASE ASC,
        worker_code ASC
    `).all(
      businessUnitId
    );
  
    return NextResponse.json({
      ok: true,
      businessUnitId: businessUnitId,
  accessMode: access.accessMode,
  workers,
    });
  }
  
  async function POST(
    request: Request
  ) {
    const businessUnitId =
      resolveBusinessUnitId(request);
  
    if (!businessUnitId) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_BUSINESS_UNIT",
        },
        { status: 400 }
      );
    }
    const access =
      await requireBusinessPermission(
        "payroll.manage_workers",
        businessUnitId,
        [
          "MANAGE",
          "OWNER",
        ]
      );
  
    if (!access.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: access.error,
        },
        {
          status: access.status,
        }
      );
    }
  
    let body: CreateWorkerBody;
  
    try {
      body =
        await request.json() as CreateWorkerBody;
    }
    catch {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_JSON",
        },
        {
          status: 400,
        }
      );
    }
  
    const fullName =
      cleanRequiredText(body.fullName);
  
    const nickname =
      cleanOptionalText(body.nickname);
  
    const whatsapp =
      cleanOptionalText(body.whatsapp);
  
    const notes =
      cleanOptionalText(body.notes);
  
    const workerType =
      cleanRequiredText(
        body.workerType ?? "BORONGAN"
      ).toUpperCase();
  
    const paymentMethod =
      cleanRequiredText(
        body.paymentMethod ?? "CASH"
      ).toUpperCase();
  
    const startDate =
      validDateOrNull(body.startDate);
  
    if (fullName.length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: "FULL_NAME_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }
  
    if (fullName.length > 120) {
      return NextResponse.json(
        {
          ok: false,
          error: "FULL_NAME_TOO_LONG",
        },
        {
          status: 400,
        }
      );
    }
  
    if (!WORKER_TYPES.has(workerType)) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_WORKER_TYPE",
        },
        {
          status: 400,
        }
      );
    }
  
    if (
      !PAYMENT_METHODS.has(paymentMethod)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_PAYMENT_METHOD",
        },
        {
          status: 400,
        }
      );
    }
  
    if (startDate === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_START_DATE",
        },
        {
          status: 400,
        }
      );
    }
  
    let departmentCodes: string[] = [];
  let primaryDepartmentCode: string | null = null;
  
  if (businessUnitId === "BU-RKN") {
    const departmentResult =
      parseRknDepartmentCodes(
        body.departmentCodes
      );
  
    if (!departmentResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: departmentResult.error,
        },
        {
          status: 400,
        }
      );
    }
  
    departmentCodes =
      departmentResult.codes;
  
    const requestedPrimary =
      cleanOptionalText(
        body.primaryDepartmentCode
      )?.toUpperCase() ?? null;
  
    if (departmentCodes.length === 1) {
      primaryDepartmentCode =
        departmentCodes[0];
  
      if (
        requestedPrimary &&
        requestedPrimary !==
          primaryDepartmentCode
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PRIMARY_DEPARTMENT_NOT_ASSIGNED",
          },
          {
            status: 400,
          }
        );
      }
    }
    else {
      if (!requestedPrimary) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PRIMARY_DEPARTMENT_REQUIRED",
          },
          {
            status: 400,
          }
        );
      }
  
      if (
        !departmentCodes.includes(
          requestedPrimary
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PRIMARY_DEPARTMENT_NOT_ASSIGNED",
          },
          {
            status: 400,
          }
        );
      }
  
      primaryDepartmentCode =
        requestedPrimary;
    }
  }
  
  const createWorker = db.transaction(() => {
      const sequence = db.prepare(`
        SELECT
          prefix,
          last_number
        FROM worker_code_sequence
        WHERE business_unit_id = ?
        LIMIT 1
      `).get(
        businessUnitId
      ) as WorkerSequenceRow | undefined;
  
      if (!sequence) {
        throw new Error(
          "WORKER_SEQUENCE_NOT_FOUND"
        );
      }
  
      const nextNumber =
        sequence.last_number + 1;
  
      const workerCode =
        `${sequence.prefix}-${String(
          nextNumber
        ).padStart(4, "0")}`;
  
      const workerId =
        randomUUID();
  
      db.prepare(`
        UPDATE worker_code_sequence
        SET
          last_number = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE business_unit_id = ?
      `).run(
        nextNumber,
        businessUnitId
      );
  
      db.prepare(`
        INSERT INTO worker (
          id,
          worker_code,
          business_unit_id,
          full_name,
          nickname,
          worker_type,
          whatsapp,
          payment_method,
          start_date,
          active,
          notes
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          1,
          ?
        )
      `).run(
        workerId,
        workerCode,
        businessUnitId,
        fullName,
        nickname,
        workerType,
        whatsapp,
        paymentMethod,
        startDate,
        notes
      );
  
      if (businessUnitId === "BU-RKN") {
    const placeholders =
      departmentCodes
        .map(() => "?")
        .join(",");
  
    const departments = db.prepare(`
      SELECT
        id,
        code
      FROM payroll_department
      WHERE business_unit_id = ?
        AND active = 1
        AND code IN (${placeholders})
    `).all(
      businessUnitId,
      ...departmentCodes
    ) as DepartmentRow[];
  
    if (
      departments.length !==
      departmentCodes.length
    ) {
      throw new Error(
        "PAYROLL_DEPARTMENT_NOT_FOUND"
      );
    }
  
    const insertAssignment =
      db.prepare(`
        INSERT INTO worker_department_assignment (
          id,
          worker_id,
          department_id,
          start_date,
          end_date,
          active,
          is_primary,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          NULL,
          1,
          ?,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `);
  
    for (const department of departments) {
      insertAssignment.run(
        randomUUID(),
        workerId,
        department.id,
        startDate,
        department.code ===
          primaryDepartmentCode
          ? 1
          : 0
      );
    }
  }
  db.prepare(`
        INSERT INTO audit_log (
          id,
          actor_user_id,
          business_unit_id,
          action,
          entity_type,
          entity_id,
          reason,
          details_json
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `).run(
        randomUUID(),
        access.session.user.id,
        businessUnitId,
        "WORKER_CREATED",
        "WORKER",
        workerId,
        null,
        JSON.stringify({
          workerCode,
          fullName,
          nickname,
          workerType,
          whatsapp,
          paymentMethod,
          startDate,
          notes,
      departmentCodes,
      primaryDepartmentCode,
        })
      );
  
      return db.prepare(`
        SELECT
          id,
          worker_code AS workerCode,
          business_unit_id AS businessUnitId,
          full_name AS fullName,
          nickname,
          worker_type AS workerType,
          whatsapp,
          payment_method AS paymentMethod,
          start_date AS startDate,
          end_date AS endDate,
          active,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM worker
        WHERE id = ?
        LIMIT 1
      `).get(
        workerId
      );
    });
  
    try {
      const worker =
        createWorker();
  
      return NextResponse.json(
        {
          ok: true,
          worker,
        },
        {
          status: 201,
        }
      );
    }
    catch (error) {
      console.error(
        "WORKER_CREATE_FAILED",
        error
      );
  
      return NextResponse.json(
        {
          ok: false,
          error: "WORKER_CREATE_FAILED",
        },
        {
          status: 500,
        }
      );
    }
  }

  return {
    GET,
    POST,
  };
}
