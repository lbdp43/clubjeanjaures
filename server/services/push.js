const webpush = require('web-push');
const prisma = require('../prisma/db');
const logger = require('../utils/logger');

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_FROM || 'contact@clubjeanjaures.fr'}`;

const enabled = !!(PUBLIC_KEY && PRIVATE_KEY);
if (enabled) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
} else {
  logger.warn('Notifications push désactivées : VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquantes');
}

function isPushEnabled() {
  return enabled;
}

function getPublicKey() {
  return PUBLIC_KEY || null;
}

// Envoie une notification à une liste d'utilisateurs. Les abonnements expirés (410/404) sont supprimés.
async function sendPushToUsers(userIds, payload) {
  if (!enabled || !userIds?.length) return { sent: 0, removed: 0 };
  const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        { TTL: 60 * 60 * 24, urgency: 'normal' }
      );
      sent++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        removed++;
      } else {
        logger.warn('Push échoué', { endpoint: s.endpoint.slice(0, 60), status: err.statusCode, error: err.message });
      }
    }
  }));
  return { sent, removed };
}

async function sendPushToAllMembers(payload) {
  if (!enabled) return { sent: 0, removed: 0 };
  const users = await prisma.user.findMany({
    where: { status: 'active', role: { not: 'visitor' } },
    select: { id: true }
  });
  return sendPushToUsers(users.map(u => u.id), payload);
}

module.exports = { isPushEnabled, getPublicKey, sendPushToUsers, sendPushToAllMembers };
