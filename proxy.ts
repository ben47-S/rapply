import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/app/lib/prisma";

export async function proxy(req: NextRequest) {
  // Protection CSRF pour les requêtes mutantes sur /api/*
  if (req.nextUrl.pathname.startsWith("/api") && !isValidSameOrigin(req)) {
    return NextResponse.json(
      { error: "Requête cross-origin non autorisée (CSRF)" },
      { status: 403 }
    );
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return redirectOrReject(req);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      tokenVersion?: number;
    };

    // Vérification de la révocation de session (tokenVersion)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tokenVersion: true },
    });

    if (!user || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      return redirectOrReject(req);
    }

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

function isValidSameOrigin(req: NextRequest): boolean {
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return true;
  }
  const origin = req.headers.get("origin");
  if (!origin) {
    const referer = req.headers.get("referer");
    if (!referer) return true;
    try {
      const refererUrl = new URL(referer);
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }
  try {
    const originUrl = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return originUrl.host === host;
  } catch {
    return false;
  }
}

function redirectOrReject(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith("/api");
  const response = isApi
    ? NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    : NextResponse.redirect(new URL("/login", req.url));

  response.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!login|api/auth/login|api/push/send|api/push/digest|sw\\.js|manifest\\.json|icon-.*\\.png|_next/static|_next/image|favicon\\.ico).*)",
  ],
};

