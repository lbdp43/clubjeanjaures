const express = require('express');
const prisma = require('../prisma/db');
const { createCalendar } = require('../services/ical');

const router = express.Router();

// GET /api/calendar/export — export .ics global
router.get('/export', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      include: {
        rsvps: {
          include: { user: { select: { email: true, member: { select: { companyName: true, jobTitle: true } } } } }
        }
      }
    });

    const cal = createCalendar(events);
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="club-jean-jaures.ics"');
    res.send(cal.toString());
  } catch (err) {
    console.error('Erreur calendar export:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/calendar/feed.ics — flux iCal (abonnement webcal://)
router.get('/feed.ics', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const events = await prisma.event.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' },
      include: {
        rsvps: {
          include: { user: { select: { email: true, member: { select: { companyName: true, jobTitle: true } } } } }
        }
      }
    });
    const cal = createCalendar(events);
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(cal.toString());
  } catch (err) {
    console.error('Erreur calendar feed:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
