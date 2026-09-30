import { api } from './api';

let deferredInstallPrompt = null;
const listeners = new Set();

function notify() { listeners.forEach(fn => fn()); }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    try { localStorage.setItem('cjj-installed', '1'); } catch {}
    window.dispatchEvent(new CustomEvent('cjj:installed'));
    notify();
  });
}

export function onInstallAvailabilityChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function canPromptInstall() {
  return !!deferredInstallPrompt;
}

export async function promptInstall() {
  if (!deferredInstallPrompt) return 'unavailable';
  const evt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  notify();
  evt.prompt();
  const { outcome } = await evt.userChoice;
  return outcome; // 'accepted' | 'dismissed'
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function getPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Demande la permission, abonne cet appareil et l'enregistre côté serveur.
export async function enablePush() {
  if (!pushSupported()) throw new Error('Les notifications ne sont pas prises en charge sur cet appareil.');
  const config = await api.getPushConfig();
  if (!config.enabled || !config.publicKey) throw new Error('Les notifications ne sont pas encore activées côté serveur.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission refusée. Vous pouvez la réactiver dans les réglages du navigateur.');

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey)
    });
  }
  await api.pushSubscribe(sub.toJSON());
  return sub;
}

export async function disablePush() {
  const sub = await getPushSubscription();
  if (!sub) return;
  try { await api.pushUnsubscribe(sub.endpoint); } catch {}
  await sub.unsubscribe();
}
