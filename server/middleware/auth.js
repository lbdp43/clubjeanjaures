const prisma = require('../prisma/db');

async function requireAuth(req, res, next) {
  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) {
    res.clearCookie('session_id');
    return res.status(401).json({ error: 'Session expirée' });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { member: true }
  });

  if (!user || user.status === 'suspended') {
    return res.status(403).json({ error: 'Compte suspendu ou introuvable' });
  }

  req.user = user;
  next();
}

async function optionalAuth(req, res, next) {
  const sessionId = req.cookies?.session_id;
  if (!sessionId) return next();

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) return next();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { member: true }
  });

  if (user && user.status === 'active') {
    req.user = user;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
