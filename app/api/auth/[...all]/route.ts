import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  /*
   * RKN_CONTROLLED_SIGNUP_GATE_V1
   *
   * Better Auth's raw signup endpoint must never become the
   * public ERP registration surface. All RKN registrations go
   * through /api/rkn/signup.
   */
  const pathname =
    new URL(request.url).pathname;

  if (
    pathname === "/api/auth/sign-up/email" ||
    pathname.startsWith(
      "/api/auth/sign-up/"
    )
  ) {
    return Response.json(
      {
        error: "NOT_FOUND",
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return getAuth().handler(request);
}