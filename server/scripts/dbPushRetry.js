/**
 * Synchronise le schéma Prisma au démarrage, avec plusieurs tentatives :
 * sur Railway, le réseau privé (postgres.railway.internal) peut mettre
 * quelques secondes à être joignable après le lancement du conteneur.
 */
const { spawnSync } = require('child_process');

const DELAYS_MS = [0, 3000, 5000, 8000, 12000, 15000];

function attempt(i) {
  const res = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    stdio: 'inherit',
    env: process.env
  });
  if (res.status === 0) return true;
  console.warn(`[start] prisma db push a échoué (tentative ${i + 1}/${DELAYS_MS.length})`);
  return false;
}

(async () => {
  for (let i = 0; i < DELAYS_MS.length; i++) {
    if (DELAYS_MS[i]) await new Promise(r => setTimeout(r, DELAYS_MS[i]));
    if (attempt(i)) {
      console.log('[start] schéma synchronisé');
      process.exit(0);
    }
  }
  console.error('[start] impossible de joindre la base après plusieurs tentatives');
  process.exit(1);
})();
