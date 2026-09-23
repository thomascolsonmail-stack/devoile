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

async function deliver(subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[], payload: PushPayload) {
  if (!publicKey || !privateKey) return;

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

/**
 * Notifications "obligatoires" : ajout à un groupe, rappel admin. Envoyées à
 * tout abonnement actif, indépendamment de la préférence de chat.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  await deliver(subscriptions, payload);
}

/**
 * Notifications de chat : respectent la préférence par appareil
 * (chatNotifications), togglable dans l'app via NotificationToggle.
 */
export async function sendChatPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return;
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds }, chatNotifications: true }
  });
  await deliver(subscriptions, payload);
}