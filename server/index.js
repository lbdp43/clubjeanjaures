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

// ─── Magic link verification — server-side (bypasses SPA routing) ───
const MAGIC_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours
app.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.redirect('/?error=token_missing');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        magicToken: hashedToken,
        magicTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.redirect('/connexion?error=token_invalid');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { magicToken: null, magicTokenExpires: null, lastLogin: new Date() }
    });

    const session = await prisma.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + MAGIC_SESSION_DURATION) }
    });

    res.cookie('session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAGIC_SESSION_DURATION
    });

    res.redirect('/');
  } catch (err) {
    logger.error('Erreur verification magic link', { error: err.message, stack: err.stack });
    res.redirect('/connexion?error=server_error');
  }
});

// Also handle /auth/verify for any old emails
app.get('/auth/verify', (req, res) => {
  const token = req.query.token || '';
  res.redirect(`/verify?token=${encodeURIComponent(token)}`);
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
