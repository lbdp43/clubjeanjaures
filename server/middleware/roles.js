function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }
    next();
  };
}

function requireMember(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (!['member', 'moderator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Réservé aux membres' });
  }
  next();
}

function requireModerator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (!['moderator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Réservé aux modérateurs' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé aux administrateurs' });
  }
  next();
}

module.exports = { requireRole, requireMember, requireModerator, requireAdmin };
