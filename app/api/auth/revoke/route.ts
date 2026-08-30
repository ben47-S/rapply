import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);

  // Incrémenter tokenVersion pour invalider immédiatement tous les JWT émis
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });

  const response = NextResponse.json({
    success: true,
    message: "Toutes les sessions actives ont été révoquées.",
  });

  const isHttps =
    req.nextUrl.protocol === "https" ||
    req.headers.get("x-forwarded-proto") === "https";

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
