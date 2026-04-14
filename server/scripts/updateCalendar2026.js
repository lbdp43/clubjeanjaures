/**
 * Met à jour le calendrier 2026 avec les infos validées en assemblée :
 *  - 22 mai 2026 : Matinale chez ISMET DEVRE (La Fouillouse)
 *  - 4 juin 2026 : Afterwork au Golf de Craintilleux
 *  - 19 juin 2026 : Matinale chez Gianella Immobilier (Saint-Galmier)
 *  - 2 juillet 2026 : Événement estival à 18h30 (déplacé du 3 juillet)
 *  - 11 septembre 2026 : Matinale chez BY MY CAR (Saint-Priest-en-Jarez)
 *  - 24 septembre 2026 : Afterwork Guinguette
 *
 * Usage : node server/scripts/updateCalendar2026.js
 * Script idempotent : peut être rejoué sans risque.
 */
const prisma = require('../prisma/db');

const updates = [
  {
    findDate: '2026-05-22',
    data: {
      title: 'Matinale chez ISMET DEVRE – L\'art de la pose',
      description: 'Matinale organisée chez ISMET DEVRE, autour du thème « L\'art de la pose ». On se retrouve sur place.',
      location: 'La Fouillouse'
    }
  },
  {
    findDate: '2026-06-04',
    data: {
      title: 'Afterwork au Golf de Craintilleux',
      description: 'Afterwork au Golf de Craintilleux. On se retrouve sur place.',
      location: 'Golf de Craintilleux'
    }
  },
  {
    findDate: '2026-06-19',
    data: {
      title: 'Matinale chez Gianella Immobilier',
      description: 'Matinale organisée chez Gianella Immobilier. On se retrouve sur place.',
      location: 'Saint-Galmier'
    }
  },
  {
    // Déplacement du 3 juillet → 2 juillet + changement horaire
    findDate: '2026-07-03',
    data: {
      title: 'Événement estival',
      description: [
        'Événement estival du Club — jeudi 2 juillet 2026 à partir de 18h30.',
        '',
        'Activités envisagées (à définir selon les disponibilités) :',
        '• Carré Pétanque OBUT',
        '• Karting',
        '• Initiation beach-volley',
        '• Animation de type guinguette'
      ].join('\n'),
      date: new Date('2026-07-02'),
      timeStart: '18:30'
    }
  },
  {
    findDate: '2026-09-11',
    data: {
      title: 'Matinale chez BY MY CAR',
      description: 'Matinale organisée chez BY MY CAR. On se retrouve sur place.',
      location: 'Saint-Priest-en-Jarez'
    }
  },
  {
    findDate: '2026-09-24',
    data: {
      title: 'Afterwork — Guinguette',
      description: 'Afterwork type guinguette. Détails à venir.'
    }
  }
];

async function main() {
  console.log('→ Mise à jour du calendrier 2026…\n');
  let updated = 0;
  let notFound = 0;

  for (const u of updates) {
    const target = new Date(u.findDate);
    const nextDay = new Date(target);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const existing = await prisma.event.findFirst({
      where: { date: { gte: target, lt: nextDay } }
    });

    if (!existing) {
      console.log(`  ⚠ ${u.findDate} — aucun événement trouvé à cette date, je le crée.`);
      await prisma.event.create({
        data: {
          title: u.data.title,
          description: u.data.description || null,
          date: u.data.date || target,
          timeStart: u.data.timeStart || '07:30',
          location: u.data.location || 'Saint-Étienne',
          type: u.data.type || 'special'
        }
      });
      updated++;
      continue;
    }

    await prisma.event.update({
      where: { id: existing.id },
      data: u.data
    });
    console.log(`  ✓ ${u.findDate} — « ${u.data.title} » mis à jour`);
    updated++;
  }

  console.log(`\n${updated} événement(s) mis à jour. ${notFound} introuvable(s).`);
}

main()
  .catch(e => { console.error('❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
