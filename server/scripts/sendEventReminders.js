/**
 * Cron job: envoie des rappels par email aux membres qui n'ont pas répondu
 * à un événement à J-N jours (par défaut J-10 et J-5).
 *
 * Exécution recommandée : quotidienne à 9h (heure France).
 * Railway Cron schedule conseillé : "0 8 * * *" (8h UTC = 9h/10h Paris).
 *
 * Usage local : node server/scripts/sendEventReminders.js
 */
const prisma = require('../prisma/db');
const { sendEventReminder } = require('../services/email');
const logger = require('../utils/logger');

function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function run() {
  const settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });

  if (!settings || !settings.eventRemindersEnabled) {
    logger.info('[reminders] Rappels désactivés dans les paramètres — rien à faire');
    return { skipped: true };
  }

  const daysList = settings.reminderDaysBefore?.length ? settings.reminderDaysBefore : [10, 5];
  const customMessage = settings.reminderMessage || null;

  const today = startOfDayUTC(new Date());
  let totalSent = 0;
  let totalEvents = 0;

  for (const daysBefore of daysList) {
    const targetDate = addDays(today, daysBefore);
    const nextDay = addDays(targetDate, 1);

    const events = await prisma.event.findMany({
      where: {
        date: { gte: targetDate, lt: nextDay },
        remindersDisabled: false
      },
      include: {
        rsvps: { select: { userId: true } },
        reminderBatches: { where: { daysBefore } }
      }
    });

    for (const event of events) {
      if (event.reminderBatches.length > 0) {
        logger.info(`[reminders] Batch déjà envoyé pour event ${event.id} J-${daysBefore} — skip`);
        continue;
      }

      const respondedIds = new Set(event.rsvps.map(r => r.userId));

      const candidates = await prisma.user.findMany({
        where: {
          status: 'active',
          role: { not: 'visitor' },
          reminderOptOut: false,
          id: { notIn: [...respondedIds] }
        },
        select: { id: true, email: true }
      });

      if (candidates.length === 0) {
        await prisma.eventReminderBatch.create({
          data: { eventId: event.id, daysBefore, sentCount: 0 }
        });
        continue;
      }

      logger.info(`[reminders] Event "${event.title}" J-${daysBefore} — ${candidates.length} destinataire(s)`);

      let sent = 0;
      for (const u of candidates) {
        try {
          const result = await sendEventReminder(u.email, {
            event,
            daysBefore,
            customMessage,
            userId: u.id
          });
          if (result.ok) sent++;
          // throttle: 10 emails/seconde max (Brevo free-tier friendly)
          await new Promise(r => setTimeout(r, 120));
        } catch (err) {
          logger.error(`[reminders] Erreur envoi à ${u.email}`, { error: err.message });
        }
      }

      await prisma.eventReminderBatch.create({
        data: { eventId: event.id, daysBefore, sentCount: sent }
      });

      totalSent += sent;
      totalEvents += 1;
      logger.info(`[reminders] Event "${event.title}" J-${daysBefore} — ${sent}/${candidates.length} envoyés`);
    }
  }

  logger.info(`[reminders] Terminé : ${totalSent} email(s) envoyé(s) sur ${totalEvents} événement(s)`);
  return { totalSent, totalEvents };
}

if (require.main === module) {
  run()
    .then(result => {
      logger.info('[reminders] OK', result);
      process.exit(0);
    })
    .catch(err => {
      logger.error('[reminders] FAIL', { error: err.message, stack: err.stack });
      process.exit(1);
    });
}

module.exports = { run };
