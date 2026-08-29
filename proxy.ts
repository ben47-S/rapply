import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return redirectOrReject(req);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // On clone les headers et on injecte le userId dedans
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return redirectOrReject(req);
  }
}

function redirectOrReject(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    "/((?!login|api/auth/login|api/push/send|api/push/digest|sw\\.js|manifest\\.json|icon-192\\.png|icon-512\\.png|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
