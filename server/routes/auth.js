const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/db');
const { sendMagicLink } = require('../services/email');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SALT_ROUNDS = 10;
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours

// Fonction utilitaire pour créer une session + cookie
async function createSession(res, userId) {
  const session = await prisma.session.create({
    data: { userId, expiresAt: new Date(Date.now() + SESSION_DURATION) }
  });

  res.cookie('session_id', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION
  });

  return session;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
});

const magicLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.email || req.ip,
  message: { error: 'Trop de tentatives. Réessayez dans une heure.' }
});

// ─── Inscription par email/mot de passe ───
// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.passwordHash) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    let user;
    if (existing) {
      // L'utilisateur existe déjà (créé par magic link ou invitation) — on ajoute le mot de passe
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, lastLogin: new Date() }
      });
    } else {
      user = await prisma.user.create({
        data: { email: normalizedEmail, passwordHash, role: 'visitor', lastLogin: new Date() }
      });
    }

    await createSession(res, user.id);
    res.status(201).json({ success: true, userId: user.id });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Connexion par email/mot de passe ───
// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Ce compte est suspendu.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    await createSession(res, user.id);
    res.json({ success: true, userId: user.id });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Magic Link ───
// POST /api/auth/magic-link
router.post('/magic-link', magicLinkLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: normalizedEmail, role: 'visitor' }
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Ce compte est suspendu.' });
    }

    const rawToken = uuidv4();
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        magicToken: hashedToken,
        magicTokenExpires: new Date(Date.now() + 15 * 60 * 1000)
      }
    });

    const sent = await sendMagicLink(normalizedEmail, rawToken);
    if (!sent) {
      return res.status(500).json({ error: "Impossible d'envoyer l'email. Le service email n'est pas configuré. Utilisez la connexion par mot de passe." });
    }
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

    await prisma.user.update({
      where: { id: user.id },
      data: { magicToken: null, magicTokenExpires: null, lastLogin: new Date() }
    });

    await createSession(res, user.id);
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
  const { magicToken, magicTokenExpires, passwordHash, ...safeUser } = req.user;
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
