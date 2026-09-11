const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { createSingleEvent } = require('../services/ical');
const xss = require('xss');
const logger = require('../utils/logger');

const router = express.Router();

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, réessayez plus tard' }
});

// GET /api/events
router.get('/', readLimiter, optionalAuth, async (req, res) => {
  try {
    // Check if non-members can see the agenda
    if (!req.user) {
      const settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });
      if (settings && !settings.publicAgenda) {
        return res.status(403).json({ error: 'L\'agenda n\'est accessible qu\'aux membres' });
      }
    }

    const { past, type } = req.query;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const where = {};
    if (past === 'true') {
      where.date = { lt: now };
    } else {
      where.date = { gte: now };
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: past === 'true' ? 'desc' : 'asc' },
      take: limit,
      include: {
        _count: { select: { rsvps: true } },
        rsvps: { select: { userId: true } }
      }
    });

    res.set('Cache-Control', 'no-cache');
    res.json(events);
  } catch (err) {
    logger.error('Erreur events', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/events/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { rsvps: true } },
        rsvps: { select: { userId: true } }
      }
    });
    if (!event) return res.status(404).json({ error: 'Événement introuvable' });
    res.set('Cache-Control', 'no-cache');
    res.json(event);
  } catch (err) {
    logger.error('Erreur event detail', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/events/:id/ics
router.get('/:id/ics', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Événement introuvable' });

    const cal = createSingleEvent(event);
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${event.title}.ics"`);
    res.send(cal.toString());
  } catch (err) {
    logger.error('Erreur ics', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/events/:id/rsvp — toggle participation
router.post('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const existing = await prisma.rsvp.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    if (existing) {
      await prisma.rsvp.delete({ where: { id: existing.id } });
      return res.json({ participating: false });
    }

    await prisma.rsvp.create({ data: { userId, eventId } });
    res.json({ participating: true });
  } catch (err) {
    logger.error('Erreur RSVP:', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/events/:id/rsvps — get participants list
router.get('/:id/rsvps', async (req, res) => {
  try {
    const rsvps = await prisma.rsvp.findMany({
      where: { eventId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            member: { select: { companyName: true, photoUrl: true, jobTitle: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(rsvps);
  } catch (err) {
    logger.error('Erreur get rsvps:', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/events (admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, type, date, timeStart, timeEnd, location, description, speaker } = req.body;
    if (!title || !type || !date || !timeStart || !location) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const event = await prisma.event.create({
      data: {
        title: xss(title),
        type,
        date: new Date(date),
        timeStart,
        timeEnd: timeEnd || null,
        location: xss(location),
        description: description ? xss(description) : null,
        speaker: speaker ? xss(speaker) : null,
        createdBy: req.user.id
      }
    });

    res.status(201).json(event);
  } catch (err) {
    logger.error('Erreur create event', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/events/batch (admin)
router.post('/batch', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Liste d\'événements invalide' });
    }
    if (events.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 événements par lot' });
    }

    const { v4: uuidv4 } = require('uuid');
    const recurrenceGroup = uuidv4();

    const created = await prisma.event.createMany({
      data: events.map(e => ({
        title: xss(e.title),
        type: e.type,
        date: new Date(e.date),
        timeStart: e.timeStart,
        timeEnd: e.timeEnd || null,
        location: xss(e.location),
        description: e.description ? xss(e.description) : null,
        speaker: e.speaker ? xss(e.speaker) : null,
        createdBy: req.user.id,
        recurrenceGroup
      }))
    });

    res.status(201).json({ count: created.count, recurrenceGroup });
  } catch (err) {
    logger.error('Erreur batch events', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/events/:id (admin)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = {};
    const fields = ['title', 'type', 'timeStart', 'timeEnd', 'location', 'description', 'speaker'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        data[field] = typeof req.body[field] === 'string' ? xss(req.body[field]) : req.body[field];
      }
    }
    if (req.body.date) data.date = new Date(req.body.date);

    const event = await prisma.event.update({ where: { id: req.params.id }, data });
    res.json(event);
  } catch (err) {
    logger.error('Erreur update event', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/events/:id (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    logger.error('Erreur delete event', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
