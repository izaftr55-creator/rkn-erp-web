import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getErpCoreRpcStub } from "@/lib/erpCoreRpc";
import { sendAccountApprovedEmail } from "@/lib/zohoMailer";

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
  try {
    return NextResponse.json({
      ok: true,
      data: await getErpCoreRpcStub().getPlasticTradingView(
        s.user.id,
        u.searchParams.get("view") || "DASHBOARD",
        u.searchParams.get("period") || undefined
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
  try {
    const cmd = String(b.command ?? "");
    const res = await getErpCoreRpcStub().mutatePlasticTrading(
      s.user.id,
      cmd,
      b.payload
    );

    if (cmd === "APPROVE_SIGNUP_USER" && (res as any)?.email) {
      sendAccountApprovedEmail({
        to: String((res as any).email),
        fullName: String((res as any).fullName || "User"),
        roleCode: String((res as any).roleCode || "ADMIN"),
        accessLevel: String((res as any).accessLevel || "OPERATE"),
      }).catch((err) =>
        console.error("ZOHO_PLASTIC_APPROVE_EMAIL_ERR:", err)
      );
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