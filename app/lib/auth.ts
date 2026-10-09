import { NextRequest, NextResponse } from "next/server";

export function getUserId(req: NextRequest): string {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new Error("UNAUTHENTICATED");
  }

  return userId;
}

// Garde partagée par les deux routes de cron (/api/push/send, /api/push/digest).
// Refuse aussi bien un secret absent que mal renseigné : un CRON_SECRET vide
// rendrait `Bearer ` valide, donc on ferme la porte plutôt que de la laisser
// entrouverte. Le scheduler interne (instrumentation.ts) n'appelle jamais ces
// routes, donc cette garde ne peut pas bloquer les notifications automatiques.
export function requireCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error(
      "[cron] CRON_SECRET absent — les routes de cron refusent tous les appels. " +
        "Les notifications automatiques passent par le scheduler interne et restent fonctionnelles."
    );
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return null;
}