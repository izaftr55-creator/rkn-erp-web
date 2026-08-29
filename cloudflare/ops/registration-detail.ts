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

export function createRegistrationDetailOps(deps: {
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
  
  type RouteContext = {
    params: Promise<{
      registrationId: string;
    }>;
  };
  
  type ReviewBody = {
    action?: unknown;
    workerType?: unknown;
    paymentMethod?: unknown;
    reason?: unknown;
  };
  
  type RegistrationRow = {
    id: string;
    business_unit_id: string;
    full_name: string;
    nickname: string | null;
    whatsapp: string;
    address: string | null;
    notes: string | null;
    status: string;
  };
  
  type SequenceRow = {
    prefix: string;
    last_number: number;
  };
  
  function cleanText(value: unknown) {
    if (typeof value !== "string") {
      return "";
    }
  
    return value.trim();
  }
  
  async function PATCH(
    request: Request,
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
        { status: access.status }
      );
    }
  
    const { registrationId } =
      await context.params;
  
    if (!registrationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "REGISTRATION_ID_REQUIRED",
        },
        { status: 400 }
      );
    }
  
    let body: ReviewBody;
  
    try {
      body =
        await request.json() as ReviewBody;
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
  
    const action =
      cleanText(body.action).toUpperCase();
  
    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_REVIEW_ACTION",
        },
        { status: 400 }
      );
    }
  
    const reason =
      cleanText(body.reason);
  
    let workerType = "";
    let paymentMethod = "";
  
    if (action === "APPROVE") {
      workerType =
        cleanText(body.workerType).toUpperCase();
  
      paymentMethod =
        cleanText(body.paymentMethod).toUpperCase();
  
      if (!WORKER_TYPES.has(workerType)) {
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_WORKER_TYPE",
          },
          { status: 400 }
        );
      }
  
      if (!PAYMENT_METHODS.has(paymentMethod)) {
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_PAYMENT_METHOD",
          },
          { status: 400 }
        );
      }
    }
  
    if (
      action === "REJECT" &&
      reason.length < 3
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "REJECTION_REASON_REQUIRED",
        },
        { status: 400 }
      );
    }
  
    const reviewRegistration =
      db.transaction(() => {
        const registration = db.prepare(`
          SELECT
            id,
            business_unit_id,
            full_name,
            nickname,
            whatsapp,
            address,
            notes,
            status
          FROM worker_registration
          WHERE id = ?
            AND business_unit_id = ?
          LIMIT 1
        `).get(
          registrationId,
          BUSINESS_UNIT_ID
        ) as RegistrationRow | undefined;
  
        if (!registration) {
          return {
            ok: false as const,
            error: "REGISTRATION_NOT_FOUND" as const,
          };
        }
  
        if (registration.status !== "PENDING") {
          return {
            ok: false as const,
            error: "REGISTRATION_ALREADY_REVIEWED" as const,
          };
        }
  
        if (action === "REJECT") {
          db.prepare(`
            UPDATE worker_registration
            SET
              status = 'REJECTED',
              reviewed_by_user_id = ?,
              reviewed_at = CURRENT_TIMESTAMP,
              review_reason = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND status = 'PENDING'
          `).run(
            access.session.user.id,
            reason,
            registration.id
          );
  
          // WHATSAPP OUTBOX REJECT V1
          db.prepare(`
            INSERT INTO whatsapp_message_outbox (
              id,
              business_unit_id,
              registration_id,
              worker_id,
              event_type,
              recipient_whatsapp,
              recipient_name,
              template_name,
              payload_json,
              dedupe_key
            )
            VALUES (
              ?,
              ?,
              ?,
              NULL,
              'WORKER_REJECTED',
              ?,
              ?,
              ?,
              ?,
              ?
            )
          `).run(
            randomUUID(),
            BUSINESS_UNIT_ID,
            registration.id,
            registration.whatsapp,
            registration.full_name,
            "rkn_worker_registration_rejected_v1",
            JSON.stringify({
              registrationId: registration.id,
              fullName: registration.full_name,
              reason,
            }),
            `WORKER_REGISTRATION:${registration.id}:REJECTED`
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            randomUUID(),
            access.session.user.id,
            BUSINESS_UNIT_ID,
            "WORKER_REGISTRATION_REJECTED",
            "WORKER_REGISTRATION",
            registration.id,
            reason,
            JSON.stringify({
              fullName: registration.full_name,
              whatsapp: registration.whatsapp,
            })
          );
  
          return {
            ok: true as const,
            action: "REJECT" as const,
          };
        }
  
        const sequence = db.prepare(`
          SELECT
            prefix,
            last_number
          FROM worker_code_sequence
          WHERE business_unit_id = ?
          LIMIT 1
        `).get(
          BUSINESS_UNIT_ID
        ) as SequenceRow | undefined;
  
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
          BUSINESS_UNIT_ID
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
            notes,
            address
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
            NULL,
            1,
            ?,
            ?
          )
        `).run(
          workerId,
          workerCode,
          BUSINESS_UNIT_ID,
          registration.full_name,
          registration.nickname,
          workerType,
          registration.whatsapp,
          paymentMethod,
          registration.notes,
          registration.address
        );
  
        const update = db.prepare(`
          UPDATE worker_registration
          SET
            status = 'APPROVED',
            reviewed_by_user_id = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            review_reason = NULL,
            worker_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND status = 'PENDING'
        `).run(
          access.session.user.id,
          workerId,
          registration.id
        );
  
        if (update.changes !== 1) {
          throw new Error(
            "REGISTRATION_APPROVAL_UPDATE_FAILED"
          );
        }
  
        // WHATSAPP OUTBOX APPROVE V1
        db.prepare(`
          INSERT INTO whatsapp_message_outbox (
            id,
            business_unit_id,
            registration_id,
            worker_id,
            event_type,
            recipient_whatsapp,
            recipient_name,
            template_name,
            payload_json,
            dedupe_key
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            'WORKER_APPROVED',
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `).run(
          randomUUID(),
          BUSINESS_UNIT_ID,
          registration.id,
          workerId,
          registration.whatsapp,
          registration.full_name,
          "rkn_worker_registration_approved_v1",
          JSON.stringify({
            registrationId: registration.id,
            workerId,
            workerCode,
            fullName: registration.full_name,
          }),
          `WORKER_REGISTRATION:${registration.id}:APPROVED`
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
          VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
        `).run(
          randomUUID(),
          access.session.user.id,
          BUSINESS_UNIT_ID,
          "WORKER_REGISTRATION_APPROVED",
          "WORKER_REGISTRATION",
          registration.id,
          JSON.stringify({
            workerId,
            workerCode,
            fullName: registration.full_name,
            whatsapp: registration.whatsapp,
            workerType,
            paymentMethod,
            startDate: null,
          })
        );
  
        return {
          ok: true as const,
          action: "APPROVE" as const,
          worker: {
            id: workerId,
            workerCode,
            fullName: registration.full_name,
            nickname: registration.nickname,
            whatsapp: registration.whatsapp,
            address: registration.address,
            workerType,
            paymentMethod,
            startDate: null,
            active: 1,
          },
        };
      });
  
    try {
      const result =
        reviewRegistration();
  
      if (!result.ok) {
        const status =
          result.error ===
            "REGISTRATION_NOT_FOUND"
            ? 404
            : 409;
  
        return NextResponse.json(
          {
            ok: false,
            error: result.error,
          },
          { status }
        );
      }
  
      return NextResponse.json({
        ok: true,
        action: result.action,
        ...(result.action === "APPROVE"
          ? { worker: result.worker }
          : {}),
      });
    }
    catch (error) {
      console.error(
        "WORKER_REGISTRATION_REVIEW_FAILED",
        error
      );
  
      return NextResponse.json(
        {
          ok: false,
          error: "REGISTRATION_REVIEW_FAILED",
        },
        { status: 500 }
      );
    }
  }

  return {
    PATCH,
  };
}
