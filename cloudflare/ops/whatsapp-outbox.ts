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

export function createWhatsappOutboxOps(deps: {
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
  
  type OutboxRow = {
    id: string;
    registrationId: string | null;
    workerId: string | null;
    eventType: string;
    recipientWhatsapp: string;
    recipientName: string | null;
    status: string;
    attemptCount: number;
    lastError: string | null;
    createdAt: string;
    updatedAt: string;
    sentAt: string | null;
    deliveredAt: string | null;
    readAt: string | null;
    payloadJson: string;
  };
  
  type Payload = {
    fullName?: string;
    reason?: string;
    workerCode?: string;
  };
  
  function maskWhatsapp(
    value: string
  ) {
    const digits =
      value.replace(/\D/g, "");
  
    if (digits.length <= 4) {
      return "••••";
    }
  
    const prefix =
      digits.startsWith("62")
        ? "+62"
        : digits.slice(0, 2);
  
    const suffix =
      digits.slice(-4);
  
    return `${prefix}••••••${suffix}`;
  }
  
  function parsePayload(
    value: string
  ): Payload {
    try {
      const parsed =
        JSON.parse(value);
  
      if (
        parsed &&
        typeof parsed === "object"
      ) {
        return parsed as Payload;
      }
    }
    catch {
      // Keep malformed historical payload safe.
    }
  
    return {};
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
  
    const counts = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(
          CASE
            WHEN status = 'QUEUED'
            THEN 1 ELSE 0
          END
        ) AS queued,
        SUM(
          CASE
            WHEN status = 'SENDING'
            THEN 1 ELSE 0
          END
        ) AS sending,
        SUM(
          CASE
            WHEN status = 'SENT'
            THEN 1 ELSE 0
          END
        ) AS sent,
        SUM(
          CASE
            WHEN status = 'DELIVERED'
            THEN 1 ELSE 0
          END
        ) AS delivered,
        SUM(
          CASE
            WHEN status = 'READ'
            THEN 1 ELSE 0
          END
        ) AS readCount,
        SUM(
          CASE
            WHEN status = 'FAILED'
            THEN 1 ELSE 0
          END
        ) AS failed
      FROM whatsapp_message_outbox
      WHERE business_unit_id = ?
    `).get(
      BUSINESS_UNIT_ID
    ) as {
      total: number;
      queued: number | null;
      sending: number | null;
      sent: number | null;
      delivered: number | null;
      readCount: number | null;
      failed: number | null;
    };
  
    const rows = db.prepare(`
      SELECT
        id,
        registration_id AS registrationId,
        worker_id AS workerId,
        event_type AS eventType,
        recipient_whatsapp AS recipientWhatsapp,
        recipient_name AS recipientName,
        status,
        attempt_count AS attemptCount,
        last_error AS lastError,
        created_at AS createdAt,
        updated_at AS updatedAt,
        sent_at AS sentAt,
        delivered_at AS deliveredAt,
        read_at AS readAt,
        payload_json AS payloadJson
      FROM whatsapp_message_outbox
      WHERE business_unit_id = ?
      ORDER BY
        created_at DESC,
        rowid DESC
      LIMIT 50
    `).all(
      BUSINESS_UNIT_ID
    ) as OutboxRow[];
  
    const messages =
      rows.map((row) => {
        const payload =
          parsePayload(
            row.payloadJson
          );
  
        return {
          id: row.id,
          registrationId:
            row.registrationId,
          workerId:
            row.workerId,
          eventType:
            row.eventType,
          recipientName:
            row.recipientName,
          recipientWhatsappMasked:
            maskWhatsapp(
              row.recipientWhatsapp
            ),
          status:
            row.status,
          attemptCount:
            row.attemptCount,
          lastError:
            row.lastError,
          reason:
            typeof payload.reason ===
            "string"
              ? payload.reason
              : null,
          workerCode:
            typeof payload.workerCode ===
            "string"
              ? payload.workerCode
              : null,
          createdAt:
            row.createdAt,
          updatedAt:
            row.updatedAt,
          sentAt:
            row.sentAt,
          deliveredAt:
            row.deliveredAt,
          readAt:
            row.readAt,
        };
      });
  
    return NextResponse.json({
      ok: true,
      businessUnitId:
        BUSINESS_UNIT_ID,
      accessMode:
        access.accessMode,
      counts: {
        total:
          counts.total,
        queued:
          counts.queued ?? 0,
        sending:
          counts.sending ?? 0,
        sent:
          counts.sent ?? 0,
        delivered:
          counts.delivered ?? 0,
        read:
          counts.readCount ?? 0,
        failed:
          counts.failed ?? 0,
      },
      messages,
    });
  }

  return {
    GET,
  };
}
