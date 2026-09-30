// Retours haptiques légers (Android / Chrome). iOS n'expose pas navigator.vibrate aux apps web.
const PATTERNS = {
  selection: [8],
  light: [12],
  medium: [18],
  success: [10, 40, 16],
  warning: [22, 50, 22]
};

let enabled = null;
function isEnabled() {
  if (enabled !== null) return enabled;
  try {
    enabled = typeof navigator !== 'undefined'
      && typeof navigator.vibrate === 'function'
      && 'ontouchstart' in window
      && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    enabled = false;
  }
  return enabled;
}

export function haptic(type = 'light') {
  if (!isEnabled()) return;
  try { navigator.vibrate(PATTERNS[type] || PATTERNS.light); } catch {}
}
