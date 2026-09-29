import { registerSW } from 'virtual:pwa-register';

const RELOAD_FLAG = 'cjj-chunk-reload';

// Une page chargée à la demande dont le fichier n'existe plus (nouvelle version déployée)
export function isChunkLoadError(err) {
  const msg = String(err?.message || err || '');
  return /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|Failed to fetch/i.test(msg);
}

// Recharge une seule fois pour récupérer la version à jour, sans boucle infinie
export function reloadOnceForChunkError() {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {}
  window.location.reload();
  return true;
}

export function clearChunkReloadFlag() {
  try { sessionStorage.removeItem(RELOAD_FLAG); } catch {}
}

let updateServiceWorker = null;

export function setupServiceWorker() {
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('pwa:need-refresh'));
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => {});
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    }
  });
}

export function applyUpdate() {
  if (updateServiceWorker) updateServiceWorker(true);
  else window.location.reload();
}
