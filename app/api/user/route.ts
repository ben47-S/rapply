import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { CURRENCIES } from "@/app/lib/currencies";

// GET /api/user
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });
  return NextResponse.json({ currency: user?.currency ?? "XOF" });
}

// PUT /api/user
export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json().catch(() => ({}));
  const currency = body?.currency;

  if (typeof currency !== "string" || !CURRENCIES.includes(currency as any)) {
    return NextResponse.json({ error: "Devise invalide" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { currency },
    select: { currency: true },
  });
  return NextResponse.json(updated);
}
