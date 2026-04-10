const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Trouver un admin existant pour createdBy
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  const createdBy = admin?.id || null;

  const events = [
    { title: 'Matinale', type: 'matinale', date: '2026-01-16', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-01-29', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-02-13', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-02-26', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-03-13', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-03-26', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-04-10', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-04-23', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-05-22', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-06-04', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-06-19', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Événement d\'été', type: 'special', date: '2026-07-03', timeStart: '12:00', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-09-11', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-09-24', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-10-09', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-10-22', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-11-06', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Afterwork', type: 'afterwork', date: '2026-11-19', timeStart: '18:30', location: 'Saint-Étienne' },
    { title: 'Matinale', type: 'matinale', date: '2026-12-04', timeStart: '07:30', location: 'Saint-Étienne' },
    { title: 'Repas de Noël', type: 'special', date: '2026-12-17', timeStart: '19:00', location: 'Saint-Étienne' },
  ];

  let created = 0;
  for (const e of events) {
    // Vérifier si l'événement existe déjà (même titre + même date)
    const existing = await prisma.event.findFirst({
      where: { title: e.title, date: new Date(e.date) }
    });
    if (existing) {
      console.log(`  — ${e.date} — ${e.title} (déjà existant)`);
      continue;
    }
    await prisma.event.create({
      data: {
        title: e.title,
        type: e.type,
        date: new Date(e.date),
        timeStart: e.timeStart,
        location: e.location,
        createdBy
      }
    });
    console.log(`  ✓ ${e.date} — ${e.title} (${e.timeStart})`);
    created++;
  }

  console.log(`\n${created} événements créés (${events.length - created} déjà existants).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
