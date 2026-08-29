import { NextResponse } from "next/server";

const payload = {
  error: "Marketplace Open API dinonaktifkan.",
  mode: "ZERO_CREDENTIAL",
  message: "Gunakan Import MP + Mass Update. RKN ERP tidak menyimpan login, cookie, OTP, atau token marketplace."
};

export async function GET() {
  return NextResponse.json(payload, { status: 410 });
}

export async function POST() {
  return NextResponse.json(payload, { status: 410 });
}
