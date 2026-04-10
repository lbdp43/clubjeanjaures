const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Initialisation des données...');

  // 1. Paramètres du club
  await prisma.clubSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Club de Jean Jaurès',
      description: "Club d'affaires basé à Saint-Étienne regroupant des professionnels de métiers différents. Échanges, entraide et développement commercial.",
      contactEmail: 'contact@clubjeanjaures.fr',
      address: 'Saint-Étienne'
    }
  });
  console.log('Paramètres du club créés.');

  // 2. Compte admin initial
  const adminEmail = 'admin@clubjeanjaures.fr';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      role: 'admin',
      status: 'active',
      onboardingDone: true
    }
  });

  await prisma.member.upsert({
    where: { id: admin.id },
    update: {},
    create: {
      id: admin.id,
      companyName: 'Club Jean Jaurès',
      jobTitle: 'Administration',
      phone: '04 77 00 00 00',
      address: 'Saint-Étienne',
      city: 'Saint-Étienne'
    }
  });
  console.log('Compte admin créé:', adminEmail);

  // 2b. Compte admin La Brasserie des Plantes
  const brasserie = await prisma.user.upsert({
    where: { email: 'labrasseriedesplantes@gmail.com' },
    update: { role: 'admin' },
    create: {
      email: 'labrasseriedesplantes@gmail.com',
      role: 'admin',
      status: 'active',
      onboardingDone: false
    }
  });
  console.log('Compte admin créé: labrasseriedesplantes@gmail.com');

  // 3. Les 20 événements 2026
  const events = [
    { title: 'Matinale — Janvier', type: 'matinale', date: '2026-01-16', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Janvier', type: 'afterwork', date: '2026-01-29', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Février', type: 'matinale', date: '2026-02-13', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Février', type: 'afterwork', date: '2026-02-26', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Mars', type: 'matinale', date: '2026-03-13', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Mars', type: 'afterwork', date: '2026-03-26', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Avril', type: 'matinale', date: '2026-04-10', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Avril', type: 'afterwork', date: '2026-04-23', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Mai', type: 'matinale', date: '2026-05-22', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Juin', type: 'afterwork', date: '2026-06-04', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Juin', type: 'matinale', date: '2026-06-19', timeStart: '07:30', timeEnd: '09:30' },
    { title: "Événement d'été", type: 'special', date: '2026-07-03', timeStart: '12:00', timeEnd: '15:00' },
    { title: 'Matinale — Septembre', type: 'matinale', date: '2026-09-11', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Septembre', type: 'afterwork', date: '2026-09-24', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Octobre', type: 'matinale', date: '2026-10-09', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Octobre', type: 'afterwork', date: '2026-10-22', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Novembre', type: 'matinale', date: '2026-11-06', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Afterwork — Novembre', type: 'afterwork', date: '2026-11-19', timeStart: '18:30', timeEnd: '21:00' },
    { title: 'Matinale — Décembre', type: 'matinale', date: '2026-12-04', timeStart: '07:30', timeEnd: '09:30' },
    { title: 'Repas de Noël', type: 'special', date: '2026-12-17', timeStart: '19:00', timeEnd: '23:00' }
  ];

  for (const evt of events) {
    const existing = await prisma.event.findFirst({
      where: { title: evt.title, date: new Date(evt.date) }
    });

    if (!existing) {
      await prisma.event.create({
        data: {
          title: evt.title,
          type: evt.type,
          date: new Date(evt.date),
          timeStart: evt.timeStart,
          timeEnd: evt.timeEnd,
          location: 'Saint-Étienne',
          description: `${evt.title} du Club de Jean Jaurès`,
          createdBy: admin.id
        }
      });
    }
  }
  console.log('20 événements 2026 créés.');

  console.log('Seed terminé avec succès !');
}

main()
  .catch(e => {
    console.error('Erreur seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
