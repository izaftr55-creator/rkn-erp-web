import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";
import { sendAccountApprovedEmail } from "@/lib/zohoMailer";
import { notifySaleCreated, notifyInboundReceived, sendWaPersonalMessage } from "@/lib/whatsappNotifier";

export const dynamic = "force-dynamic";

const status = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e ?? "");
  if (m.includes("DENIED") || m.includes("INACTIVE")) return 403;
  if (
    m.includes("REQUIRED") ||
    m.includes("INVALID") ||
    m.includes("NOT_FOUND") ||
    m.includes("INSUFFICIENT") ||
    m.includes("CLOSED") ||
    m.includes("EXCEEDS") ||
    m.includes("UNSUPPORTED")
  )
    return 400;
  return 500;
};

export async function GET(request: Request) {
  const s = await getAuth().api.getSession({ headers: request.headers });
  if (!s)
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  const u = new URL(request.url);
  const view = (u.searchParams.get("view") || "DASHBOARD").toUpperCase();
  const period = u.searchParams.get("period") || undefined;

  if (view === "ACCESS" || view === "USERS") {
    try {
      const { env } = getCloudflareContext();
      const db = (env as any).AUTH_DB;
      const directory = await getErpCoreRpcStub().getAdminAccessDirectory(s.user.id);

      let pendingRequests: any[] = [];
      let historyRequests: any[] = [];
      let users: any[] = [];

      if (db) {
        const pendingResult = await db
          .prepare(`
            SELECT
              id,
              user_id as userId,
              full_name as fullName,
              email,
              username,
              whatsapp,
              requested_role as requestedRole,
              status,
              submitted_at as submittedAt
            FROM rkn_signup_request
            WHERE status = 'PENDING'
            ORDER BY submitted_at DESC
          `)
          .all();
        pendingRequests = Array.isArray(pendingResult?.results)
          ? pendingResult.results
          : [];

        const historyResult = await db
          .prepare(`
            SELECT
              id,
              user_id as userId,
              full_name as fullName,
              email,
              username,
              whatsapp,
              requested_role as requestedRole,
              status,
              submitted_at as submittedAt,
              reviewed_at as reviewedAt,
              review_note as reviewNote
            FROM rkn_signup_request
            WHERE status IN ('APPROVED', 'REJECTED')
            ORDER BY reviewed_at DESC, submitted_at DESC
            LIMIT 50
          `)
          .all();
        historyRequests = Array.isArray(historyResult?.results)
          ? historyResult.results
          : [];

        const authUsersResult = await db
          .prepare(`
            SELECT
              id as userId,
              name as fullName,
              email,
              username,
              createdAt
            FROM "user"
            ORDER BY name, email
          `)
          .all();
        const rawUsers = Array.isArray(authUsersResult?.results)
          ? authUsersResult.results
          : [];

        const profileMap = new Map<string, any>();
        if (Array.isArray(directory?.users)) {
          for (const userItem of directory.users) {
            profileMap.set(String(userItem.userId), userItem);
          }
        }

        users = rawUsers.map((userItem: any) => {
          const prof = profileMap.get(String(userItem.userId));
          return {
            userId: userItem.userId,
            fullName: prof?.fullName || userItem.fullName || "User",
            email: userItem.email,
            username: userItem.username,
            roleCode: prof?.primaryRoleCode || "STAFF",
            active: prof?.active !== undefined ? prof.active : 1,
            accessLevel: prof?.accessLevel || "VIEW",
            createdAt: userItem.createdAt,
          };
        });
      }

      return NextResponse.json({
        ok: true,
        data: {
          view: "ACCESS",
          periodKey: period || "2026-08",
          actor: directory?.actor || { id: s.user.id, name: s.user.name },
          pendingRequests,
          historyRequests,
          users,
        },
      });
    } catch (e) {
      console.error("ACCESS_VIEW_ERROR:", e);
      return NextResponse.json(
        {
          ok: false,
          error: e instanceof Error ? e.message : "ACCESS_READ_FAILED",
        },
        { status: 500 }
      );
    }
  }

  try {
    return NextResponse.json({
      ok: true,
      data: await getErpCoreRpcStub().getPlasticTradingView(
        s.user.id,
        view,
        period
      ),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "PLASTIC_READ_FAILED",
      },
      { status: status(e) }
    );
  }
}

export async function POST(request: Request) {
  const s = await getAuth().api.getSession({ headers: request.headers });
  if (!s)
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const cmd = String(b.command ?? "");
  const payload: any =
    b.payload && typeof b.payload === "object" ? b.payload : {};

  if (cmd === "APPROVE_SIGNUP_USER") {
    try {
      const { env } = getCloudflareContext();
      const db = (env as any).AUTH_DB;
      const requestId = String(payload.requestId ?? "").trim();
      const roleCode = String(payload.roleCode ?? "ADMIN")
        .trim()
        .toUpperCase();
      const accessLevel = String(
        payload.accessLevel ??
          (roleCode === "OWNER"
            ? "OWNER"
            : roleCode === "ADMIN"
            ? "MANAGE"
            : "VIEW")
      )
        .trim()
        .toUpperCase();
      const reviewNote = String(
        payload.reviewNote ?? "Disetujui dari Panel Akses Plastic Trading"
      ).slice(0, 300);

      const signup = await db
        .prepare(`
          SELECT id, user_id, full_name, email, status
          FROM rkn_signup_request
          WHERE id = ?
          LIMIT 1
        `)
        .bind(requestId)
        .first();

      if (!signup || String(signup.status ?? "") !== "PENDING") {
        return NextResponse.json(
          { ok: false, error: "SIGNUP_REQUEST_NOT_FOUND_OR_PROCESSED" },
          { status: 400 }
        );
      }

      await getErpCoreRpcStub().provisionPendingErpUserAccess(
        s.user.id,
        String(signup.user_id),
        String(signup.full_name),
        roleCode,
        "BU-PLASTIC",
        accessLevel as any
      );

      await db
        .prepare(`
          UPDATE rkn_signup_request
          SET
            status = 'APPROVED',
            reviewed_by_user_id = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            review_note = ?
          WHERE
            id = ?
            AND status = 'PENDING'
        `)
        .bind(s.user.id, reviewNote, requestId)
        .run();

      if (signup.email) {
        sendAccountApprovedEmail({
          to: String(signup.email),
          fullName: String(signup.full_name || "User"),
          roleCode,
          accessLevel,
        }).catch((err) =>
          console.error("ZOHO_APPROVE_USER_EMAIL_ERR:", err)
        );
      }

      return NextResponse.json({
        ok: true,
        data: { approved: true, userId: signup.user_id },
      });
    } catch (e) {
      console.error("APPROVE_USER_ERROR:", e);
      return NextResponse.json(
        {
          ok: false,
          error: e instanceof Error ? e.message : "APPROVE_FAILED",
        },
        { status: 500 }
      );
    }
  }

  if (cmd === "REJECT_SIGNUP_USER") {
    try {
      const { env } = getCloudflareContext();
      const db = (env as any).AUTH_DB;
      const requestId = String(payload.requestId ?? "").trim();
      const reason = String(payload.reason ?? "Ditolak").slice(0, 300);

      await db
        .prepare(`
          UPDATE rkn_signup_request
          SET
            status = 'REJECTED',
            reviewed_by_user_id = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            review_note = ?
          WHERE
            id = ?
            AND status = 'PENDING'
        `)
        .bind(s.user.id, reason, requestId)
        .run();

      return NextResponse.json({
        ok: true,
        data: { rejected: true },
      });
    } catch (e) {
      console.error("REJECT_USER_ERROR:", e);
      return NextResponse.json(
        {
          ok: false,
          error: e instanceof Error ? e.message : "REJECT_FAILED",
        },
        { status: 500 }
      );
    }
  }

  if (cmd === "UPDATE_USER_ROLE") {
    try {
      const targetUserId = String(payload.targetUserId ?? "").trim();
      const roleCode = String(payload.roleCode ?? "ADMIN")
        .trim()
        .toUpperCase();
      const accessLevel = String(
        payload.accessLevel ??
          (roleCode === "OWNER"
            ? "OWNER"
            : roleCode === "ADMIN"
            ? "MANAGE"
            : "VIEW")
      )
        .trim()
        .toUpperCase();

      await getErpCoreRpcStub().provisionPendingErpUserAccess(
        s.user.id,
        targetUserId,
        "",
        roleCode,
        "BU-PLASTIC",
        accessLevel as any
      );

      return NextResponse.json({
        ok: true,
        data: { updated: true },
      });
    } catch (e) {
      console.error("UPDATE_USER_ROLE_ERROR:", e);
      return NextResponse.json(
        {
          ok: false,
          error: e instanceof Error ? e.message : "UPDATE_ROLE_FAILED",
        },
        { status: 500 }
      );
    }
  }

  if (cmd === "SEND_WA_RECEIPT") {
    try {
      const { phone, invoiceNo, customerName, dateKey, grandTotalRp, outstandingRp, itemsSummary } = payload;
      
      const formattedTotal = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(grandTotalRp || 0));
      const formattedSisa = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(outstandingRp || 0));
      
      const text = [
        `Halo *${customerName}*, berikut nota belanja Anda:`,
        ``,
        `*RKN PLASTIC TRADING*`,
        `Nota: ${invoiceNo}`,
        `Tanggal: ${dateKey}`,
        ``,
        `*Barang:*`,
        itemsSummary || "-",
        ``,
        `*Total Belanja:* ${formattedTotal}`,
        `*Sisa Tagihan:* ${formattedSisa}`,
        ``,
        `Terima kasih telah berbelanja di RKN! 😊`
      ].join("\n");

      const success = await sendWaPersonalMessage(phone, text);
      
      if (!success) {
        throw new Error("Gagal mengirim WA. Pastikan bot menyala dan nomor tujuan valid (harus ada kode negara, misal 628).");
      }

      return NextResponse.json({ ok: true, data: { sent: true } });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "SEND_WA_FAILED" },
        { status: 500 }
      );
    }
  }

  try {
    const res = await getErpCoreRpcStub().mutatePlasticTrading(
      s.user.id,
      cmd,
      b.payload
    );

    /* ── WhatsApp Group Notifications (fire-and-forget, non-blocking) ── */
    if (cmd === "CREATE_SALE" && res?.invoiceNo) {
      const items: string = Array.isArray((b.payload as any)?.lines)
        ? (b.payload as any).lines
            .slice(0, 3)
            .map((l: any) => `${l.variantId || "item"} x${l.qtyBase}`)
            .join(", ")
        : "";
      notifySaleCreated({
        invoiceNo: res.invoiceNo as string,
        customerName: String((b.payload as any)?.customerName ?? (b.payload as any)?.customerId ?? "-"),
        grandTotalRp: Number(res.grandTotalRp ?? 0),
        status: String(res.status ?? "PAID"),
        itemsSummary: items || undefined,
        actorName: s.user.name || s.user.username || undefined,
      }).catch(() => {});
    }

    if (cmd === "POST_INBOUND" && res?.inboundId) {
      const items: string = Array.isArray((b.payload as any)?.lines)
        ? (b.payload as any).lines
            .slice(0, 3)
            .map((l: any) => `${l.variantId || "item"} x${l.qtyBase}`)
            .join(", ")
        : "";
      notifyInboundReceived({
        inboundNo: String(res.inboundNo ?? res.inboundId ?? "-"),
        supplierName: String((b.payload as any)?.supplierName ?? "-"),
        dateKey: String((b.payload as any)?.dateKey ?? new Date().toISOString().slice(0, 10)),
        itemsSummary: items || undefined,
        actorName: s.user.name || s.user.username || undefined,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, data: res });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error ? e.message : "PLASTIC_MUTATION_FAILED",
      },
      { status: status(e) }
    );
  }
}