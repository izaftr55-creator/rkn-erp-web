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

export function createRegistrationsOps(deps: {
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

  const BUSINESS_UNIT_ID = "BU-SABLON";
  
  type RegistrationRow = {
    id: string;
    inviteId: string;
    fullName: string;
    nickname: string | null;
    whatsapp: string;
    address: string | null;
    notes: string | null;
    status: string;
    submittedAt: string;
    reviewedByUserId: string | null;
    reviewedAt: string | null;
    reviewReason: string | null;
    workerId: string | null;
  };
  
  async function GET(
    request: Request
  ) {
    const access =
      await requireBusinessReadPermission(
        "payroll.view",
        BUSINESS_UNIT_ID,
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
  
    const url = new URL(request.url);
    const requestedStatus =
      url.searchParams
        .get("status")
        ?.trim()
        .toUpperCase() || "PENDING";
  
    const allowedStatuses = new Set([
      "PENDING",
      "APPROVED",
      "REJECTED",
      "ALL",
    ]);
  
    if (!allowedStatuses.has(requestedStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }
  
    const baseSelect = `
      SELECT
        wr.id,
        wr.invite_id AS inviteId,
        wr.full_name AS fullName,
        wr.nickname,
        wr.whatsapp,
        wr.address,
        wr.notes,
        wr.status,
        wr.submitted_at AS submittedAt,
        wr.reviewed_by_user_id AS reviewedByUserId,
        wr.reviewed_at AS reviewedAt,
        wr.review_reason AS reviewReason,
        wr.worker_id AS workerId
      FROM worker_registration wr
      WHERE wr.business_unit_id = ?
    `;
  
    let registrations: RegistrationRow[];
  
    if (requestedStatus === "ALL") {
      registrations = db.prepare(
        baseSelect +
        ` ORDER BY wr.submitted_at DESC`
      ).all(
        BUSINESS_UNIT_ID
      ) as RegistrationRow[];
    }
    else {
      registrations = db.prepare(
        baseSelect +
        `
          AND wr.status = ?
          ORDER BY wr.submitted_at DESC
        `
      ).all(
        BUSINESS_UNIT_ID,
        requestedStatus
      ) as RegistrationRow[];
    }
  
    const counts = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
      FROM worker_registration
      WHERE business_unit_id = ?
    `).get(
      BUSINESS_UNIT_ID
    ) as {
      pending: number | null;
      approved: number | null;
      rejected: number | null;
    };
  
    return NextResponse.json({
      ok: true,
      businessUnitId: BUSINESS_UNIT_ID,
      accessMode: access.accessMode,
      filter: requestedStatus,
      counts: {
        pending: counts.pending ?? 0,
        approved: counts.approved ?? 0,
        rejected: counts.rejected ?? 0,
      },
      registrations,
    });
  }

  return {
    GET,
  };
}
