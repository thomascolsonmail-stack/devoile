import webpush from "web-push";
import { prisma } from "./db";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:contact@example.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return;

  // Historique in-app (onglet Notifs), indépendant de la réussite de l'envoi push.
  await prisma.notificationLog.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: payload.title,
      body: payload.body,
      url: payload.url ?? null
    }))
  });

  if (!publicKey || !privateKey) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Erreur envoi push :", err);
        }
      }
    })
  );
}