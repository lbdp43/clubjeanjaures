const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const prisma = require('./prisma/db');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const eventRoutes = require('./routes/events');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');
const calendarRoutes = require('./routes/calendar');
const favoriteRoutes = require('./routes/favorites');
const uploadRoutes = require('./routes/uploads');
const pushRoutes = require('./routes/push');

// Validation des variables d'environnement
const requiredEnvVars = ['DATABASE_URL'];
const optionalEnvVars = ['APP_URL', 'BREVO_API_KEY', 'SESSION_SECRET', 'PORT'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`ERREUR: Variable d'environnement ${envVar} manquante`);
    process.exit(1);
  }
}

for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`AVERTISSEMENT: Variable ${envVar} non définie, utilisation de la valeur par défaut`);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Railway place l'app derrière un proxy : sans ceci, tous les utilisateurs
// partagent la même IP et les rate limiters bloquent tout le club.
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
    }
  }
}));
app.use(compression());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000 || res.statusCode >= 400) {
      logger.warn('Slow or error request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    }
  });
  next();
});

const allowedOrigins = [process.env.APP_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Pas d'origin = requête same-origin ou serveur-to-serveur
    if (!origin) return cb(null, true);
    // Origin dans la liste configurée
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Accepter tout sous-domaine Railway
    if (origin.endsWith('.up.railway.app')) return cb(null, true);
    cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/push', pushRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Public settings (no auth required)
app.get('/api/settings/public', async (req, res) => {
  try {
    let settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = { name: 'Club de Jean Jaurès', description: '', logoUrl: null, publicAgenda: true };
    }
    res.set('Cache-Control', 'no-cache');
    res.json({
      name: settings.name,
      description: settings.description,
      logoUrl: settings.logoUrl,
      publicAgenda: settings.publicAgenda ?? true
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Anciens liens /verify et /auth/verify → redirigent vers /api/auth/verify-redirect
app.get('/verify', (req, res) => {
  const token = req.query.token || '';
  res.redirect(`/api/auth/verify-redirect?token=${encodeURIComponent(token)}`);
});
app.get('/auth/verify', (req, res) => {
  const token = req.query.token || '';
  res.redirect(`/api/auth/verify-redirect?token=${encodeURIComponent(token)}`);
});

// Serve frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const indexHtml = path.join(clientDist, 'index.html');

app.use(express.static(clientDist, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Un fichier d'assets absent (ancienne version après déploiement) doit renvoyer 404,
// pas la page HTML : sinon le navigateur essaie d'exécuter du HTML comme du JS.
app.use('/assets', (req, res) => res.status(404).end());

// SPA fallback — serve index.html for all frontend routes
const serveIndex = (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      logger.error('index.html introuvable', { path: indexHtml, error: err.message });
      res.status(500).send('Build frontend introuvable. Vérifiez le build.');
    }
  });
};
app.get('*', serveIndex);

const server = app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
});

// Nettoyage des secteurs saisis à la main (espaces, valeurs vides) : sans ça,
// un filtre peut exister sans correspondre à personne. Puis réparation des
// secteurs abîmés par une ancienne version de ce nettoyage.
const { repairSectors } = require('./utils/repairSectors');
(async () => {
  try {
    await prisma.$executeRawUnsafe(
      "UPDATE members SET sector = NULLIF(regexp_replace(trim(sector), '\\s+', ' ', 'g'), '') " +
      "WHERE sector IS NOT NULL AND sector IS DISTINCT FROM NULLIF(regexp_replace(trim(sector), '\\s+', ' ', 'g'), '')"
    );
    const n = await repairSectors(prisma);
    if (n) logger.warn(`${n} secteur(s) réparé(s)`);
  } catch (err) {
    logger.warn('Nettoyage des secteurs impossible', { error: err.message });
  }
  try {
    const { backfillReminders, backfillAutoReminders } = require('./utils/backfillReminders');
    const n = await backfillReminders(prisma);
    if (n) logger.warn(`${n} relance(s) du 1er octobre ajoutée(s) au journal`);
    const auto = await backfillAutoReminders(prisma);
    if (auto.total) logger.warn(`${auto.total} rappel(s) automatique(s) passé(s) ajouté(s) au journal (${auto.batches} envoi(s))`);
  } catch (err) {
    logger.warn('Rattrapage du journal des relances impossible', { error: err.message });
  }
})();

// Vérification ponctuelle (temporaire) : numéros du groupe WhatsApp présents parmi les membres ?
// N'écrit que le nom de l'entreprise trouvée, jamais d'autre donnée.
(async () => {
  try {
    const wanted = { Ahmed: '666548515', Aymeric: '620913545', Clement: '681328118' };
    const members = await prisma.member.findMany({ select: { companyName: true, phone: true } });
    const last9 = (p) => String(p || '').replace(/\D/g, '').slice(-9);
    for (const [name, digits] of Object.entries(wanted)) {
      const hit = members.filter(m => last9(m.phone) === digits).map(m => m.companyName);
      logger.warn(`[pointage WhatsApp] ${name} : ${hit.length ? hit.join(', ') : 'aucun membre avec ce numéro'}`);
    }
    const withPhone = members.filter(m => last9(m.phone).length === 9).length;
    logger.warn(`[pointage WhatsApp] ${members.length} fiches membres, ${withPhone} avec un numéro`);
  } catch (err) {
    logger.warn('[pointage WhatsApp] impossible', { error: err.message });
  }
})();

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    prisma.$disconnect().then(() => process.exit(0));
  });
});
process.on('SIGINT', () => {
  server.close(() => {
    prisma.$disconnect().then(() => process.exit(0));
  });
});
