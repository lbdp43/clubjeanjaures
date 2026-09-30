const express = require('express');
const prisma = require('../prisma/db');
const { requireAuth } = require('../middleware/auth');
const { isPushEnabled, getPublicKey, sendPushToUsers } = require('../services/push');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/push/config — clé publique VAPID (null si les notifications sont désactivées côté serveur)
router.get('/config', (req, res) => {
  res.json({ enabled: isPushEnabled(), publicKey: getPublicKey() });
});

// GET /api/push/status — l'utilisateur a-t-il au moins un appareil abonné ?
router.get('/status', requireAuth, async (req, res) => {
  const count = await prisma.pushSubscription.count({ where: { userId: req.user.id } });
  res.json({ subscribed: count > 0, devices: count });
});

// POST /api/push/subscribe — enregistre l'abonnement de cet appareil
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const sub = req.body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ error: 'Abonnement invalide.' });
    }
    if (typeof sub.endpoint !== 'string' || sub.endpoint.length > 2000 || !/^https:\/\//.test(sub.endpoint)) {
      return res.status(400).json({ error: 'Abonnement invalide.' });
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: { userId: req.user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: String(req.get('user-agent') || '').slice(0, 200) },
      create: { userId: req.user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: String(req.get('user-agent') || '').slice(0, 200) }
    });
    res.json({ success: true });
  } catch (err) {
    logger.error('Erreur push subscribe', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/push/subscribe — désabonne cet appareil
router.delete('/subscribe', requireAuth, async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint requis.' });
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    logger.error('Erreur push unsubscribe', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/push/test — envoie une notification de test à l'utilisateur connecté
router.post('/test', requireAuth, async (req, res) => {
  try {
    const result = await sendPushToUsers([req.user.id], {
      title: 'Club Jean Jaurès',
      body: 'Les notifications sont activées sur cet appareil. À bientôt !',
      url: '/'
    });
    res.json(result);
  } catch (err) {
    logger.error('Erreur push test', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
