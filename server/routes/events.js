const express = require('express');
const prisma = require('../prisma/db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { createSingleEvent } = require('../services/ical');
const xss = require('xss');

const router = express.Router();

// GET /api/events
router.get('/', async (req, res) => {
  try {
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
      take: limit
    });

    res.json(events);
  } catch (err) {
    console.error('Erreur events:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Événement introuvable' });
    res.json(event);
  } catch (err) {
    console.error('Erreur event detail:', err);
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
    console.error('Erreur ics:', err);
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
    console.error('Erreur create event:', err);
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
    console.error('Erreur batch events:', err);
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
    console.error('Erreur update event:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/events/:id (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur delete event:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
