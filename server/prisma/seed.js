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

  await prisma.member.upsert({
    where: { id: brasserie.id },
    update: {},
    create: {
      id: brasserie.id,
      companyName: 'La Brasserie des Plantes',
      jobTitle: 'Direction',
      phone: '0684444044',
      address: '',
      city: 'Saint-Didier-en-Velay',
      website: 'https://www.labrasseriedesplantes.com',
      description: "Artisan-Liquoriste. Création d'apéritifs et spiritueux à base de plante et de fruit."
    }
  });
  console.log('Compte admin créé: labrasseriedesplantes@gmail.com');

  // 2c. Membres du club
  const membres = [
    {
      email: 'contact@rgce-habitat.fr',
      companyName: 'RGCE Habitat',
      jobTitle: 'Président',
      phone: '0666548515',
      website: 'https://rgce-habitat.fr/',
      description: 'Nous vous accompagnons sur vos projets de rénovation énergétique.',
      city: 'Saint-Étienne'
    },
    {
      email: 'n.sariak@meilleurtaux.com',
      companyName: 'Meilleurtaux',
      jobTitle: 'Conseiller Financier',
      phone: '0748100483',
      description: 'Courtage en prêts et assurances de prêt pour les particuliers et professionnels.',
      city: 'Saint-Étienne'
    },
    {
      email: 'lucileprost.adv@gmail.com',
      companyName: 'Lucile Prost',
      jobTitle: 'Assistante administrative',
      phone: '0668305746',
      description: 'Aide administrative et Pré-comptabilité. Gestion et suivi commercial. Gestion litige et recouvrement.',
      city: 'Saint-Étienne'
    },
    {
      email: 'loric.vigier@gmail.com',
      companyName: 'Vigelec',
      jobTitle: 'Électricité courant fort et courant faible',
      phone: '0633093622',
      description: 'Vous suit dans vos projets neuf ou rénovation, pro ou particuliers. Courant fort et courant faibles.',
      address: '8 rue des roseaux',
      city: 'Sorbiers'
    },
    {
      email: 'florian.neto@fenyx-conseil.fr',
      companyName: 'Fenyx Conseil',
      jobTitle: 'Expert-Comptable',
      phone: '0770253226',
      website: 'https://www.fenyx-conseil.fr/',
      description: 'Expert-Comptable',
      city: 'Saint-Étienne'
    },
    {
      email: 'contact@lagencedudiagnostic.fr',
      companyName: "L'Agence du Diagnostic",
      jobTitle: 'Gérant',
      phone: '0616641550',
      website: 'https://www.lagencedudiagnostic.fr/',
      description: "Nous sommes spécialisés dans les diagnostics de biens immobiliers en cours de transaction, de location, de construction ou de rénovation. Les diagnostics concernés sont : exposition au plomb, amiante, gaz, DPE, électricité, termites, loi Carrez, état des risques, audit énergétique. Nous nous déplaçons en Rhône-Alpes.",
      address: '181 Boulevard Jean Jaurès',
      city: 'St-Just-St-Rambert'
    },
    {
      email: 'bonnetcic@glail.com',
      companyName: 'CIC',
      jobTitle: "Chargé d'affaires professionnels",
      phone: '0617474886',
      website: 'https://www.cic.fr',
      description: 'Accompagner les professionnels',
      city: 'Saint-Étienne La Terrasse'
    },
    {
      email: 'louis.napierala@groupe-ciec.com',
      companyName: 'Groupe CIEC',
      jobTitle: 'Conseiller en Gestion de Patrimoine',
      phone: '0783815490',
      website: 'https://ciec.group/',
      description: "Votre Conseiller en Gestion de Patrimoine, vous accompagnant sur l'épargne, la valorisation de capital, la prévoyance, l'assurance emprunteur, la diminution de votre imposition, la préparation de votre retraite, la transmission, à travers des solutions financières et immobilières. Bénéficiez d'un bilan patrimonial offert.",
      city: 'Auvergne-Rhône-Alpes'
    },
    {
      email: 'atoutbois42@gmail.com',
      companyName: 'Atout Bois 42',
      jobTitle: 'Président',
      phone: '0669409723',
      website: 'https://atoutbois-42.com',
      description: 'Aménagement extérieur en bois.',
      city: 'Montbrison'
    },
    {
      email: 'laetitia.richard@notaires.fr',
      companyName: 'Notaire',
      jobTitle: 'Notaire',
      phone: '0628300548',
      description: 'Notaire avec un accompagnement personnalisé et adapté.',
      city: 'Vaulx-en-Velin'
    },
    {
      email: 'verredevert@gmail.com',
      companyName: 'Verre De Vert',
      jobTitle: 'Président',
      phone: '0648096599',
      description: 'Fabrication et vente de liqueurs de menthe.',
      city: 'Andrézieux-Bouthéon'
    }
  ];

  for (const m of membres) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        role: 'member',
        status: 'active',
        onboardingDone: true
      }
    });

    await prisma.member.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        companyName: m.companyName,
        jobTitle: m.jobTitle,
        phone: m.phone,
        address: m.address || '',
        city: m.city || '',
        website: m.website || null,
        description: m.description || null
      }
    });

    console.log(`Membre créé: ${m.companyName} (${m.email})`);
  }

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
