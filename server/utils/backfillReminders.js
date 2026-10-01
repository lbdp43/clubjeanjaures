// Relance envoyée le 1er octobre 2026 à 09:12:12 UTC, quelques minutes avant la mise en ligne
// du journal des relances : elle n'a pas été comptée. L'ancienne version n'envoyait qu'aux membres
// sans réponse à cet instant, on reconstitue donc ces destinataires. Idempotent.
const EVENT_ID = '5d62bf9b-0420-4750-9d51-242d9deea58b';
const SENT_AT = new Date('2026-10-01T09:12:12.000Z');

async function backfillReminders(prisma) {
  const event = await prisma.event.findUnique({ where: { id: EVENT_ID }, select: { id: true } });
  if (!event) return 0;
  const already = await prisma.eventReminderLog.count({ where: { eventId: EVENT_ID, sentAt: SENT_AT } });
  if (already) return 0;

  // Réponses déjà données avant l'envoi : ces membres n'étaient pas relancés
  const answered = await prisma.rsvp.findMany({
    where: { eventId: EVENT_ID, createdAt: { lte: SENT_AT } },
    select: { userId: true }
  });
  const recipients = await prisma.user.findMany({
    where: {
      status: 'active',
      role: { not: 'visitor' },
      createdAt: { lte: SENT_AT },
      id: { notIn: answered.map(r => r.userId) }
    },
    select: { id: true }
  });
  if (!recipients.length) return 0;

  await prisma.eventReminderLog.createMany({
    data: recipients.map(u => ({ eventId: EVENT_ID, userId: u.id, kind: 'manual', sentAt: SENT_AT }))
  });
  return recipients.length;
}

// Rappels automatiques J-N envoyés avant la mise en ligne du journal : seul le nombre d'envois
// était gardé (event_reminder_batches). L'ancienne version écrivait à tous les membres actifs,
// non désabonnés, sans réponse à ce moment-là : on reconstitue ces destinataires, une fois par envoi.
async function backfillAutoReminders(prisma) {
  const batches = await prisma.eventReminderBatch.findMany({
    where: { sentCount: { gt: 0 }, sentAt: { lt: new Date('2026-10-01T09:16:00.000Z') } }
  });
  let total = 0;
  for (const b of batches) {
    const already = await prisma.eventReminderLog.count({ where: { eventId: b.eventId, kind: 'auto', sentAt: b.sentAt } });
    if (already) continue;
    const answered = await prisma.rsvp.findMany({
      where: { eventId: b.eventId, createdAt: { lte: b.sentAt } },
      select: { userId: true }
    });
    const recipients = await prisma.user.findMany({
      where: {
        status: 'active',
        role: { not: 'visitor' },
        reminderOptOut: false,
        createdAt: { lte: b.sentAt },
        id: { notIn: answered.map(r => r.userId) }
      },
      select: { id: true }
    });
    if (!recipients.length) continue;
    await prisma.eventReminderLog.createMany({
      data: recipients.map(u => ({ eventId: b.eventId, userId: u.id, kind: 'auto', sentAt: b.sentAt }))
    });
    total += recipients.length;
  }
  return { total, batches: batches.length };
}

module.exports = { backfillReminders, backfillAutoReminders };
