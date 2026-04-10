const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/db');
const { sendMagicLink } = require('../services/email');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const magicLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  keyGenerator: (req) => req.body.email || req.ip,
  message: { error: 'Trop de tentatives. Réessayez dans une heure.' }
});

// POST /api/auth/magic-link
router.post('/magic-link', magicLinkLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const normalizedEmail = email.toLowerCase().trim();

    // Créer l'utilisateur s'il n'existe pas
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: normalizedEmail, role: 'visitor' }
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Ce compte est suspendu.' });
    }

    // Générer le token
    const rawToken = uuidv4();
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        magicToken: hashedToken,
        magicTokenExpires: new Date(Date.now() + 15 * 60 * 1000) // 15 min
      }
    });

    await sendMagicLink(normalizedEmail, rawToken);
    res.json({ message: 'Lien de connexion envoyé par email.' });
  } catch (err) {
    console.error('Erreur magic-link:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/verify?token=xxx
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token manquant' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        magicToken: hashedToken,
        magicTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Lien invalide ou expiré.' });
    }

    // Invalider le token
    await prisma.user.update({
      where: { id: user.id },
      data: { magicToken: null, magicTokenExpires: null, lastLogin: new Date() }
    });

    // Créer la session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
      }
    });

    res.cookie('session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, userId: user.id });
  } catch (err) {
    console.error('Erreur verify:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  res.clearCookie('session_id');
  res.json({ message: 'Déconnecté' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const { magicToken, magicTokenExpires, ...safeUser } = req.user;
  res.json(safeUser);
});

// PUT /api/auth/onboarding
router.put('/onboarding', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { onboardingDone: true }
  });
  res.json({ success: true });
});

module.exports = router;
