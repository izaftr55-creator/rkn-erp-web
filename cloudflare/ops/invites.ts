import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
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

export function createInvitesOps(deps: {
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
  
  type InviteRow = {
    id: string;
    active: number;
    expiresAt: string | null;
    maxUses: number | null;
    useCount: number;
    notes: string | null;
    createdAt: string;
    revokedAt: string | null;
  };
  
  type CreateInviteBody = {
    notes?: unknown;
    maxUses?: unknown;
    expiresAt?: unknown;
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
  
  function parseMaxUses(
    value: unknown
  ): number | null | undefined {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }
  
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 1000
    ) {
      return undefined;
    }
  
    return value;
  }
  
  function parseExpiresAt(
    value: unknown
  ): string | null | undefined {
    const text = cleanOptionalText(value);
  
    if (!text) {
      return null;
    }
  
    const date = new Date(text);
  
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
  
    if (date.getTime() <= Date.now()) {
      return undefined;
    }
  
    return date.toISOString();
  }
  
  function hashToken(token: string) {
    return createHash("sha256")
      .update(token)
      .digest("hex");
  }
  
  async function GET() {
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
  
    const invites = db.prepare(`
      SELECT
        id,
        active,
        expires_at AS expiresAt,
        max_uses AS maxUses,
        use_count AS useCount,
        notes,
        created_at AS createdAt,
        revoked_at AS revokedAt
      FROM worker_registration_invite
      WHERE business_unit_id = ?
      ORDER BY created_at DESC
    `).all(
      BUSINESS_UNIT_ID
    ) as InviteRow[];
  
    return NextResponse.json({
      ok: true,
      businessUnitId: BUSINESS_UNIT_ID,
      accessMode: access.accessMode,
      invites,
    });
  }
  
  async function POST(
    request: Request
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
  
    let body: CreateInviteBody;
  
    try {
      body =
        await request.json() as CreateInviteBody;
    }
    catch {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_JSON",
        },
        { status: 400 }
      );
    }
  
    const notes =
      cleanOptionalText(body.notes);
  
    const maxUses =
      parseMaxUses(body.maxUses);
  
    const expiresAt =
      parseExpiresAt(body.expiresAt);
  
    if (maxUses === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_MAX_USES",
        },
        { status: 400 }
      );
    }
  
    if (expiresAt === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_EXPIRES_AT",
        },
        { status: 400 }
      );
    }
  
    const token =
      btoa(
        String.fromCharCode(
          ...randomBytes(32)
        )
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
  
    const tokenHash =
      hashToken(token);
  
    const inviteId =
      randomUUID();
  
    db.transaction(() => {
      db.prepare(`
        INSERT INTO worker_registration_invite (
          id,
          business_unit_id,
          token_hash,
          active,
          expires_at,
          max_uses,
          use_count,
          created_by_user_id,
          notes,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          1,
          ?,
          ?,
          0,
          ?,
          ?,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `).run(
        inviteId,
        BUSINESS_UNIT_ID,
        tokenHash,
        expiresAt,
        maxUses,
        access.session.user.id,
        notes
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
        "WORKER_REGISTRATION_INVITE_CREATED",
        "WORKER_REGISTRATION_INVITE",
        inviteId,
        JSON.stringify({
          maxUses,
          expiresAt,
          notes,
        })
      );
    })();
  
    return NextResponse.json(
      {
        ok: true,
        invite: {
          id: inviteId,
          token,
          path:
            `/join/sablon/${token}`,
          maxUses,
          expiresAt,
          notes,
        },
      },
      {
        status: 201,
      }
    );
  }

  return {
    GET,
    POST,
  };
}
