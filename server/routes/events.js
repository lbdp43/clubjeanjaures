const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireAdmin, requireMember } = require('../middleware/roles');
const { createSingleEvent } = require('../services/ical');
const { sendPushToAllMembers, sendPushToUsers } = require('../services/push');
const { sendRsvpRequest, memberEmails } = require('../services/email');
const xss = require('xss');
const logger = require('../utils/logger');

const router = express.Router();

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
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
        _count: { select: { rsvps: { where: { status: 'going' } } } },
        rsvps: {
          where: { status: 'going' },
          orderBy: { createdAt: 'asc' },
          select: {
            userId: true,
            user: { select: { email: true, member: { select: { companyName: true, photoUrl: true, logoUrl: true } } } }
          }
        }
      }
    });

    // Réponse de l'utilisateur connecté (inscrit / pas dispo / rien) pour chaque événement
    if (req.user && events.length) {
      const mine = await prisma.rsvp.findMany({
        where: { userId: req.user.id, eventId: { in: events.map(e => e.id) } },
        select: { eventId: true, status: true }
      });
      const byEvent = new Map(mine.map(r => [r.eventId, r.status]));
      for (const e of events) e.myStatus = byEvent.get(e.id) || null;
    }

    // Membres validés : les 3 compteurs (participent / ne participent pas / pas encore répondu)
    if (req.user && ['member', 'moderator', 'admin'].includes(req.user.role) && events.length) {
      const memberFilter = { status: 'active', role: { not: 'visitor' } };
      const [totalMembers, grouped] = await Promise.all([
        prisma.user.count({ where: memberFilter }),
        prisma.rsvp.groupBy({
          by: ['eventId', 'status'],
          where: { eventId: { in: events.map(e => e.id) }, user: memberFilter },
          _count: { _all: true }
        })
      ]);
      for (const e of events) {
        const going = grouped.find(g => g.eventId === e.id && g.status === 'going')?._count._all || 0;
        const declined = grouped.find(g => g.eventId === e.id && g.status === 'declined')?._count._all || 0;
        e.responseCounts = { going, declined, pending: Math.max(totalMembers - going - declined, 0) };
      }
    }

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
        _count: { select: { rsvps: { where: { status: 'going' } } } },
        rsvps: { where: { status: 'going' }, select: { userId: true } }
      }
    });
    if (!event) return res.status(404).json({ error: 'Événement introuvable' });
    if (req.user) {
      const mine = await prisma.rsvp.findUnique({
        where: { userId_eventId: { userId: req.user.id, eventId: event.id } },
        select: { status: true }
      });
      event.myStatus = mine?.status || null;
    }
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

// POST /api/events/:id/rsvp — répondre : { status: 'going' | 'declined' | null }
// Sans corps (ancienne version de l'appli encore en cache) : bascule inscrit / désinscrit.
router.post('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const hasStatus = req.body && Object.prototype.hasOwnProperty.call(req.body, 'status');
    let status = hasStatus ? req.body.status : undefined;
    if (hasStatus && status !== null && status !== 'going' && status !== 'declined') {
      return res.status(400).json({ error: 'Réponse invalide' });
    }

    const existing = await prisma.rsvp.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    if (!hasStatus) status = existing?.status === 'going' ? 'declined' : 'going';

    if (status === null) {
      if (existing) await prisma.rsvp.delete({ where: { id: existing.id } });
    } else if (existing) {
      if (existing.status !== status) await prisma.rsvp.update({ where: { id: existing.id }, data: { status } });
    } else {
      await prisma.rsvp.create({ data: { userId, eventId, status } });
    }
    res.json({ participating: status === 'going', status });
  } catch (err) {
    logger.error('Erreur RSVP:', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Membres concernés par les événements (mêmes critères que les rappels automatiques)
const memberWhere = { status: 'active', role: { not: 'visitor' } };
const memberSelect = { id: true, email: true, member: { select: { companyName: true, photoUrl: true, jobTitle: true } } };

async function pendingMembers(eventId) {
  const responded = await prisma.rsvp.findMany({ where: { eventId }, select: { userId: true } });
  return prisma.user.findMany({
    where: { ...memberWhere, id: { notIn: responded.map(r => r.userId) } },
    select: memberSelect
  });
}

const byName = (a, b) => (a.member?.companyName || a.email).localeCompare(b.member?.companyName || b.email, 'fr', { sensitivity: 'base' });

// Réponses d'un événement, membre par membre : inscrits (going), pas dispo (declined), sans réponse (pending)
async function eventAudience(eventId) {
  const [rsvps, pending] = await Promise.all([
    prisma.rsvp.findMany({
      where: { eventId, user: { status: 'active' } },
      orderBy: { createdAt: 'asc' },
      select: { status: true, user: { select: memberSelect } }
    }),
    pendingMembers(eventId)
  ]);
  return {
    going: rsvps.filter(r => r.status === 'going').map(r => r.user),
    declined: rsvps.filter(r => r.status === 'declined').map(r => r.user),
    pending
  };
}

// GET /api/events/:id/responses — inscrits, pas dispo et sans réponse (membres validés uniquement, pas les visiteurs)
router.get('/:id/responses', requireAuth, requireMember, async (req, res) => {
  try {
    const eventId = req.params.id;
    let { going, declined, pending } = await eventAudience(eventId);

    // Admin : nombre de relances reçues par chacun pour cet événement, et date de la dernière
    if (req.user.role === 'admin') {
      const logs = await prisma.eventReminderLog.groupBy({
        by: ['userId'],
        where: { eventId },
        _count: { _all: true },
        _max: { sentAt: true }
      });
      const byUser = new Map(logs.map(l => [l.userId, { count: l._count._all, last: l._max.sentAt }]));
      const withReminders = u => ({ ...u, reminders: byUser.get(u.id) || { count: 0, last: null } });
      going = going.map(withReminders);
      declined = declined.map(withReminders);
      pending = pending.map(withReminders);
    }

    res.set('Cache-Control', 'no-cache');
    res.json({ going: going.sort(byName), declined: declined.sort(byName), pending: pending.sort(byName) });
  } catch (err) {
    logger.error('Erreur responses', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/events/:id/responses/:userId (admin) — inscrire / désinscrire un membre à sa place
// { status: 'going' | 'declined' | null }
router.put('/:id/responses/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id: eventId, userId } = req.params;
    const status = req.body?.status ?? null;
    if (status !== null && status !== 'going' && status !== 'declined') {
      return res.status(400).json({ error: 'Réponse invalide' });
    }
    const [event, user] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId }, select: { id: true, title: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, status: true } })
    ]);
    if (!event) return res.status(404).json({ error: 'Événement introuvable' });
    if (!user || user.status !== 'active') return res.status(404).json({ error: 'Membre introuvable' });

    const existing = await prisma.rsvp.findUnique({ where: { userId_eventId: { userId, eventId } } });
    if (status === null) {
      if (existing) await prisma.rsvp.delete({ where: { id: existing.id } });
    } else if (existing) {
      if (existing.status !== status) await prisma.rsvp.update({ where: { id: existing.id }, data: { status } });
    } else {
      await prisma.rsvp.create({ data: { userId, eventId, status } });
    }
    logger.info(`[admin] ${req.user.email} : ${user.email} → ${status || 'sans réponse'} pour « ${event.title} »`);
    res.json({ userId, status });
  } catch (err) {
    logger.error('Erreur réponse admin', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/events/:id/remind (admin) — relancer par mail les membres sélectionnés (tout le monde ou une sélection).
// Le contenu du mail s'adapte à la réponse de chacun : sans réponse, pas dispo ou inscrit.
const remindLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Trop de relances, réessayez dans quelques minutes' } });

const PUSH_BODY = {
  pending: 'Tu n\'as pas encore répondu : dis-nous si tu es dispo ou pas dispo.',
  declined: 'Tu avais indiqué ne pas être dispo. Si ça change, tu peux encore t\'inscrire.',
  going: 'Petit rappel : tu es inscrit·e, à bientôt !'
};

router.post('/:id/remind', requireAuth, requireAdmin, remindLimiter, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Événement introuvable' });

    const wanted = Array.isArray(req.body?.userIds) ? new Set(req.body.userIds.map(String)) : null;
    if (!wanted || wanted.size === 0) return res.status(400).json({ error: 'Aucun destinataire sélectionné' });

    const audience = await eventAudience(event.id);
    const targets = ['pending', 'declined', 'going'].flatMap(status =>
      audience[status].filter(u => wanted.has(u.id)).map(u => ({ ...u, rsvpStatus: status }))
    );
    if (targets.length === 0) return res.status(400).json({ error: 'Aucun destinataire valide' });

    const message = typeof req.body.message === 'string' ? xss(req.body.message.trim()).slice(0, 1000) : '';
    // Adresses secondaires : chargées ici seulement (jamais renvoyées dans les listes visibles par les membres)
    const extra = await prisma.user.findMany({ where: { id: { in: targets.map(u => u.id) } }, select: { id: true, secondaryEmails: true } });
    const secondaryById = new Map(extra.map(u => [u.id, u.secondaryEmails]));
    let sent = 0;
    let lastError = null;
    for (const u of targets) {
      const to = memberEmails({ email: u.email, secondaryEmails: secondaryById.get(u.id) });
      const r = await sendRsvpRequest(to, { event, message, status: u.rsvpStatus });
      if (r.ok) {
        sent++;
        await prisma.eventReminderLog.create({ data: { eventId: event.id, userId: u.id, kind: 'manual' } })
          .catch(err => logger.warn('Journal de relance non enregistré', { error: err.message }));
      } else lastError = r.error;
      await new Promise(r2 => setTimeout(r2, 120)); // 10 mails/s max
    }

    // Même relance en notification sur les téléphones abonnés, message adapté à chaque réponse
    try {
      const dateStr = new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
      for (const status of ['pending', 'declined', 'going']) {
        const ids = targets.filter(u => u.rsvpStatus === status).map(u => u.id);
        if (!ids.length) continue;
        await sendPushToUsers(ids, {
          title: `${event.title} — ${dateStr}`,
          body: PUSH_BODY[status],
          url: `/agenda/${event.id}`,
          tag: `rsvp-${event.id}`
        });
      }
    } catch (err) {
      logger.warn('Push relance échouée', { error: err.message });
    }

    logger.info(`[relance] ${event.title} : ${sent}/${targets.length} mails envoyés par ${req.user.email}`);
    if (sent === 0) return res.status(502).json({ error: lastError || 'Aucun mail n\'a pu être envoyé' });
    res.json({ sent, total: targets.length });
  } catch (err) {
    logger.error('Erreur relance', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/events/:id/rsvps — get participants list
router.get('/:id/rsvps', async (req, res) => {
  try {
    const rsvps = await prisma.rsvp.findMany({
      where: { eventId: req.params.id, status: 'going' },
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

    // Nouvel événement : prévenir les appareils abonnés (sans bloquer la réponse)
    const dateStr = new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    prisma.clubSettings.findUnique({ where: { id: 1 } }).then(settings => {
      if (settings && settings.pushNewEventEnabled === false) return;
      return sendPushToAllMembers({
        title: `Nouvel événement : ${event.title}`,
        body: `${dateStr} à ${event.timeStart}${event.location ? ' · ' + event.location : ''}`,
        url: `/agenda/${event.id}`,
        tag: `event-${event.id}`
      });
    }).catch(err => logger.warn('Push nouvel événement impossible', { error: err.message }));
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
