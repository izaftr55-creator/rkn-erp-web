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

export function createInviteDetailOps(deps: {
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
  
  type RouteContext = {
    params: Promise<{
      inviteId: string;
    }>;
  };
  
  type InviteRow = {
    id: string;
    active: number;
    revoked_at: string | null;
  };
  
  async function PATCH(
    _request: Request,
    context: RouteContext
  ) {
    const access =
      await requireBusinessPermission(
        "payroll.manage_workers",
        BUSINESS_UNIT_ID,
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
  
    const { inviteId } =
      await context.params;
  
    if (!inviteId) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVITE_ID_REQUIRED",
        },
        { status: 400 }
      );
    }
  
    const invite = db.prepare(`
      SELECT
        id,
        active,
        revoked_at
      FROM worker_registration_invite
      WHERE id = ?
        AND business_unit_id = ?
      LIMIT 1
    `).get(
      inviteId,
      BUSINESS_UNIT_ID
    ) as InviteRow | undefined;
  
    if (!invite) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVITE_NOT_FOUND",
        },
        { status: 404 }
      );
    }
  
    if (invite.active !== 1) {
      return NextResponse.json({
        ok: true,
        inviteId,
        active: false,
        alreadyRevoked: true,
      });
    }
  
    db.transaction(() => {
      db.prepare(`
        UPDATE worker_registration_invite
        SET
          active = 0,
          revoked_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND business_unit_id = ?
      `).run(
        inviteId,
        BUSINESS_UNIT_ID
      );
  
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
          NULL,
          ?
        )
      `).run(
        randomUUID(),
        access.session.user.id,
        BUSINESS_UNIT_ID,
        "WORKER_REGISTRATION_INVITE_REVOKED",
        "WORKER_REGISTRATION_INVITE",
        inviteId,
        JSON.stringify({
          previousActive: true,
        })
      );
    })();
  
    return NextResponse.json({
      ok: true,
      inviteId,
      active: false,
      alreadyRevoked: false,
    });
  }

  return {
    PATCH,
  };
}
