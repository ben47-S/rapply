import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  getClientIp,
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/app/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const check = checkLoginRateLimit(ip);
  if (!check.allowed) {
    const minutes = Math.ceil((check.retryAfterSeconds ?? 60) / 60);
    return NextResponse.json(
      {
        error: `Trop de tentatives de connexion échouées. Veuillez réessayer dans ${minutes} minute(s).`,
      },
      {
        status: 429,
        headers: check.retryAfterSeconds
          ? { "Retry-After": check.retryAfterSeconds.toString() }
          : undefined,
      }
    );
  }

  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    recordFailedLogin(ip);
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    recordFailedLogin(ip);
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  recordSuccessfulLogin(ip);

  const token = jwt.sign(
    { userId: user.id, tokenVersion: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  const response = NextResponse.json({ success: true });
  const isHttps =
    req.nextUrl.protocol === "https" ||
    req.headers.get("x-forwarded-proto") === "https";
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });

  return response;
}