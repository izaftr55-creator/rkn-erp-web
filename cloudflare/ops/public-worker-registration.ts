import {
  createHash,
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

export function createPublicWorkerRegistrationOps(deps: {
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

  type RouteContext = {
    params: Promise<{
      token: string;
    }>;
  };
  
  type InviteRow = {
    id: string;
    business_unit_id: string;
    active: number;
    expires_at: string | null;
    max_uses: number | null;
    use_count: number;
  };
  
  type RegistrationBody = {
    fullName?: unknown;
    nickname?: unknown;
    whatsapp?: unknown;
    address?: unknown;
    notes?: unknown;
  };
  
  function hashToken(token: string) {
    return createHash("sha256")
      .update(token)
      .digest("hex");
  }
  
  function cleanOptionalText(
    value: unknown,
    maxLength: number
  ) {
    if (typeof value !== "string") {
      return null;
    }
  
    const cleaned = value.trim();
  
    if (!cleaned) {
      return null;
    }
  
    return cleaned.slice(0, maxLength);
  }
  
  function cleanRequiredText(
    value: unknown
  ) {
    if (typeof value !== "string") {
      return "";
    }
  
    return value.trim();
  }
  
  function normalizeWhatsapp(
    value: unknown
  ) {
    const raw = cleanRequiredText(value);
  
    if (!raw) {
      return "";
    }
  
    const cleaned = raw
      .replace(/[^\d+]/g, "")
      .replace(/(?!^)\+/g, "");
  
    if (
      cleaned.length < 8 ||
      cleaned.length > 20 ||
      !/^\+?\d+$/.test(cleaned)
    ) {
      return "";
    }
  
    return cleaned;
  }
  
  function inviteUsable(
    invite: InviteRow
  ) {
    if (invite.active !== 1) {
      return false;
    }
  
    if (
      invite.expires_at &&
      new Date(invite.expires_at).getTime() <= Date.now()
    ) {
      return false;
    }
  
    if (
      invite.max_uses !== null &&
      invite.use_count >= invite.max_uses
    ) {
      return false;
    }
  
    return true;
  }
  
  function findInviteByToken(
    token: string
  ) {
    if (
      !token ||
      token.length < 20 ||
      token.length > 200
    ) {
      return undefined;
    }
  
    return db.prepare(`
      SELECT
        id,
        business_unit_id,
        active,
        expires_at,
        max_uses,
        use_count
      FROM worker_registration_invite
      WHERE token_hash = ?
        AND business_unit_id = ?
      LIMIT 1
    `).get(
      hashToken(token),
      "BU-SABLON"
    ) as InviteRow | undefined;
  }
  
  async function GET(
    _request: Request,
    context: RouteContext
  ) {
    const { token } = await context.params;
  
    const invite =
      findInviteByToken(token);
  
    if (
      !invite ||
      !inviteUsable(invite)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_OR_EXPIRED_INVITE",
        },
        { status: 404 }
      );
    }
  
    return NextResponse.json({
      ok: true,
      registrationOpen: true,
      businessUnit: "SABLON",
    });
  }
  
  async function POST(
    request: Request,
    context: RouteContext
  ) {
    const { token } = await context.params;
  
    let body: RegistrationBody;
  
    try {
      body =
        await request.json() as RegistrationBody;
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
  
    const fullName =
      cleanRequiredText(body.fullName);
  
    const nickname =
      cleanOptionalText(
        body.nickname,
        80
      );
  
    const whatsapp =
      normalizeWhatsapp(body.whatsapp);
  
    const address =
      cleanOptionalText(
        body.address,
        500
      );
  
    const notes =
      cleanOptionalText(
        body.notes,
        1000
      );
  
    if (fullName.length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: "FULL_NAME_REQUIRED",
        },
        { status: 400 }
      );
    }
  
    if (fullName.length > 120) {
      return NextResponse.json(
        {
          ok: false,
          error: "FULL_NAME_TOO_LONG",
        },
        { status: 400 }
      );
    }
  
    if (!whatsapp) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_WHATSAPP",
        },
        { status: 400 }
      );
    }
  
    const submitRegistration =
      db.transaction(() => {
        const invite =
          findInviteByToken(token);
  
        if (
          !invite ||
          !inviteUsable(invite)
        ) {
          return {
            ok: false as const,
            error:
              "INVALID_OR_EXPIRED_INVITE" as const,
          };
        }
  
        const duplicate = db.prepare(`
          SELECT id
          FROM worker_registration
          WHERE business_unit_id = ?
            AND whatsapp = ?
            AND status IN ('PENDING', 'APPROVED')
          LIMIT 1
        `).get(
          invite.business_unit_id,
          whatsapp
        );
  
        if (duplicate) {
          return {
            ok: false as const,
            error:
              "REGISTRATION_ALREADY_EXISTS" as const,
          };
        }
  
        const registrationId =
          randomUUID();
  
        db.prepare(`
          INSERT INTO worker_registration (
            id,
            invite_id,
            business_unit_id,
            full_name,
            nickname,
            whatsapp,
            address,
            notes,
            status,
            submitted_at,
            created_at,
            updated_at
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
            'PENDING',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `).run(
          registrationId,
          invite.id,
          invite.business_unit_id,
          fullName,
          nickname,
          whatsapp,
          address,
          notes
        );
  
        db.prepare(`
          UPDATE worker_registration_invite
          SET
            use_count = use_count + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(invite.id);
  
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
            NULL,
            ?,
            ?,
            ?,
            ?,
            NULL,
            ?
          )
        `).run(
          randomUUID(),
          invite.business_unit_id,
          "WORKER_REGISTRATION_SUBMITTED",
          "WORKER_REGISTRATION",
          registrationId,
          JSON.stringify({
            inviteId: invite.id,
            fullName,
            whatsapp,
          })
        );
  
        return {
          ok: true as const,
          registrationId,
        };
      });
  
    const result =
      submitRegistration();
  
    if (!result.ok) {
      const status =
        result.error ===
          "REGISTRATION_ALREADY_EXISTS"
          ? 409
          : 404;
  
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
        },
        { status }
      );
    }
  
    return NextResponse.json(
      {
        ok: true,
        status: "PENDING",
        registrationId:
          result.registrationId,
        message:
          "PENDAFTARAN BERHASIL DIKIRIM DAN MENUNGGU VERIFIKASI",
      },
      { status: 201 }
    );
  }

  return {
    GET,
    POST,
  };
}
