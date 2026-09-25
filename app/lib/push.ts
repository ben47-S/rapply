import prisma from "@/app/lib/prisma";
import webpush from "web-push";

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
};

webpush.setVapidDetails(
  "mailto:ton@email.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export function pushStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object" && "statusCode" in error) {
    return (error as { statusCode?: number }).statusCode;
  }
  return undefined;
}

export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (error) {
    const statusCode = pushStatusCode(error);
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription
        .delete({ where: { endpoint: subscription.endpoint } })
        .catch(() => {});
    }
    throw error;
  }
}

export async function sendPushToMany(
  subscriptions: PushSubscriptionRecord[],
  payload: PushPayload
): Promise<number> {
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await sendPush(subscription, payload);
      sent++;
    } catch (error) {
      if (pushStatusCode(error) !== 404 && pushStatusCode(error) !== 410) {
        console.error("Échec envoi push:", error);
      }
    }
  }
  return sent;
}
