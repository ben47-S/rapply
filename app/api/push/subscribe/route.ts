import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

// POST /api/push/subscribe  (derrière proxy.ts → x-user-id dispo)
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();
  const endpoint: string | undefined = body?.endpoint;
  const p256dh: string | undefined = body?.keys?.p256dh;
  const auth: string | undefined = body?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId, p256dh, auth },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe  (désabonnement)
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint requis" }, { status: 400 });
  }

  await prisma.pushSubscription
    .deleteMany({ where: { endpoint, userId } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
