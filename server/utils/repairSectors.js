const logger = require('./logger');

// Réparation des secteurs abîmés par un ancien nettoyage qui remplaçait chaque
// suite de « s » par un espace (« Artisan liquoriste » → « Arti an liquori te »).
// Chaque espace du secteur a pu être « s », « ss » ou un vrai espace : on teste
// les combinaisons et on garde celle qui forme le plus de mots connus.

const BASE_VOCAB = `
artisanat automobile btp construction commerce communication marketing comptabilité finance conseil culture loisirs
droit juridique éducation formation environnement immobilier industrie informatique digital médical santé
restauration hôtellerie services entreprises personne sport bien-être transport logistique autre
et de des du la le les en à au aux pour sur dans par ou un une
service conseils gestion immobilière assurance assurances banque professionnel professionnels professionnelle
professionnelles entreprise administrative administratif comptable courtier courtière courtage artisan artisans
artisanal artisanale restaurant restaurants expert experts expertise financier financière financiers patrimoine
rénovation rénovations énergétique électricité électricien plomberie plombier chauffage bois commercial commerciale
vente ventes particuliers prêt prêts crédit crédits liqueur liqueurs liquoriste brasserie brasseur bière bières
spiritueux vin vins agence diagnostic diagnostics coach coaching beauté coiffure coiffeur photographe photographie
graphiste design designer architecte architecture paysagiste jardin jardins nettoyage sécurité voiture voitures
garage location événementiel traiteur boulangerie pâtisserie fleuriste décoration décorateur menuiserie menuisier
maçonnerie maçon peinture peintre carrelage couverture toiture isolation solaire énergie recyclage imprimerie
impression signalétique publicité presse médias audiovisuel vidéo musique tourisme hôtel assureur mutuelle
prévoyance retraite épargne investissement société sociétés syndic copropriété bâtiment travaux aménagement
extérieur intérieur cuisine cuisines salle bains notaire notariat avocat avocats huissier juriste consultant
consultante consulting stratégie ressources humaines recrutement paie assistante assistant secrétariat
administration domicile aide aides personnes âgées enfants garde ménage bricolage dépannage informaticien
développeur développement web site sites internet réseaux sociaux réseau télécom téléphonie sécurité alarme
vidéosurveillance serrurerie serrurier vitrerie vitrier miroiterie stores fermetures portes fenêtres
chauffagiste climatisation pompe pompes chaleur électroménager mobilier meubles literie textile mode vêtements
bijouterie bijoux horlogerie optique opticien pharmacie médecin infirmier infirmière kinésithérapeute ostéopathe
dentiste vétérinaire psychologue sophrologue naturopathe diététicien nutrition esthétique esthéticienne massage
spa fitness salle sportif sportive équitation vélo moto auto carrosserie carrossier mécanique mécanicien pneus
contrôle technique dépanneur remorquage taxi vtc chauffeur livraison livraisons coursier déménagement
déménageur stockage entrepôt emballage import export négoce grossiste distribution distributeur fournisseur
fournitures bureau papeterie librairie presse tabac bar cave caviste épicerie fine alimentation produits
locaux terroir fromagerie boucherie charcuterie poissonnerie primeur maraîcher agriculteur agricole viticulteur
vigneron distillerie distillateur chocolatier confiseur glacier crêperie pizzeria snack food truck événements
mariage mariages animation animateur dj spectacle théâtre cinéma école cours soutien scolaire langues
traduction traducteur interprète rédaction rédacteur journaliste éditeur édition imprimeur agent agents
commerciaux courtiers mandataire mandataires conseiller conseillère conseillers gestionnaire gestionnaires
`.split(/\s+/).filter(Boolean);

function normalizeWord(w) {
  return w.toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
}

function buildVocab(members) {
  const vocab = new Set(BASE_VOCAB.map(normalizeWord));
  for (const m of members) {
    for (const field of [m.jobTitle, m.description, m.lookingFor, m.canOffer, m.companyName, m.city]) {
      if (typeof field !== 'string') continue;
      for (const w of field.split(/[\s,;.:/()'’"-]+/)) {
        const n = normalizeWord(w);
        if (n.length >= 3) vocab.add(n);
      }
    }
  }
  return vocab;
}

function score(candidate, vocab) {
  const words = candidate.trim().split(/\s+/).filter(Boolean);
  let s = 0;
  for (const w of words) {
    const n = normalizeWord(w);
    if (!n) continue;
    if (vocab.has(n)) s += 2;
    else if (n.length <= 3) s -= 2;
    else s -= 1;
  }
  return s;
}

function candidates(value) {
  const parts = value.split(' ');
  if (parts.length > 9) return [value];
  const out = [];
  const gaps = parts.length - 1;
  const total = Math.pow(3, gaps);
  for (let mask = 0; mask < total; mask++) {
    let str = parts[0];
    let m = mask;
    for (let i = 1; i <= gaps; i++) {
      const choice = m % 3;
      m = Math.floor(m / 3);
      str += (choice === 0 ? ' ' : choice === 1 ? 's' : 'ss') + parts[i];
    }
    out.push(str);
  }
  return out;
}

function repairSector(raw, vocab) {
  if (typeof raw !== 'string' || !raw.includes(' ')) return null;
  const original = raw;
  const originalScore = score(original, vocab);
  let best = original;
  let bestScore = originalScore;
  for (const c of candidates(original)) {
    const sc = score(c, vocab);
    if (sc > bestScore) { best = c; bestScore = sc; }
  }
  const cleaned = best.trim().replace(/\s+/g, ' ');
  if (bestScore > originalScore && cleaned !== original.trim()) {
    return original.startsWith(' ') && /^[a-zà-ÿ]/.test(cleaned)
      ? cleaned[0].toUpperCase() + cleaned.slice(1)
      : cleaned;
  }
  return null;
}

async function repairSectors(prisma) {
  const members = await prisma.member.findMany({
    select: { id: true, sector: true, jobTitle: true, description: true, lookingFor: true, canOffer: true, companyName: true, city: true }
  });
  const vocab = buildVocab(members);
  let repaired = 0;
  for (const m of members) {
    if (!m.sector) continue;
    const fixed = repairSector(m.sector, vocab);
    if (fixed) {
      await prisma.member.update({ where: { id: m.id }, data: { sector: fixed } });
      logger.warn('Secteur réparé', { avant: m.sector, apres: fixed });
      repaired++;
    }
  }
  return repaired;
}

module.exports = { repairSectors, repairSector, buildVocab };
