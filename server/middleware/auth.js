const prisma = require('../prisma/db');

async function loadSession(sessionId) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { member: true }
  });
  return { ...session, user };
}

async function requireAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const session = await loadSession(sessionId);
    if (!session) {
      res.clearCookie('session_id');
      return res.status(401).json({ error: 'Session expirée' });
    }

    const user = session.user;
    if (!user || user.status === 'suspended') {
      return res.status(403).json({ error: 'Compte suspendu ou introuvable' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function optionalAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) return next();

    const session = await loadSession(sessionId);
    if (session?.user && session.user.status === 'active') {
      req.user = session.user;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, optionalAuth };
