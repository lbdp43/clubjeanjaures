const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const eventRoutes = require('./routes/events');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');
const calendarRoutes = require('./routes/calendar');
const favoriteRoutes = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
