import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { pushStatusCode, sendPush } from "@/app/lib/push";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;

  if (typeof endpoint !== "string" || endpoint.length === 0) {
    return NextResponse.json(
      { error: "Souscription de cet appareil introuvable." },
      { status: 400 }
    );
  }

  const subscription = await prisma.pushSubscription.findFirst({
    where: { endpoint, userId },
    select: { endpoint: true, p256dh: true, auth: true },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: "Activez d'abord les notifications sur cet appareil." },
      { status: 409 }
    );
  }

  try {
    await sendPush(subscription, {
      title: "Rapply",
      body: "Notification de test reçue.",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const statusCode = pushStatusCode(error);
    if (statusCode === 404 || statusCode === 410) {
      return NextResponse.json(
        { error: "Cette souscription a expiré. Activez à nouveau les notifications." },
        { status: 410 }
      );
    }

    console.error("Échec de la notification de test:", error);
    return NextResponse.json(
      { error: "Le service de notification n'a pas accepté l'envoi." },
      { status: 502 }
    );
  }
}
