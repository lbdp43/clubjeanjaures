import { useEffect, useState } from 'react';

const SESSION_KEY = 'cjj-splash-shown';
const DURATION_MS = 1650;

function readSettings() {
  try {
    const raw = localStorage.getItem('cjj-cache:settings');
    return raw ? JSON.parse(raw).v : null;
  } catch {
    return null;
  }
}

// Animation d'ouverture : jouée une fois par lancement de l'app (pas à chaque page ni rafraîchissement d'onglet)
export default function Splash() {
  const [phase, setPhase] = useState(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return 'done';
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'done';
    } catch {}
    return 'in';
  });
  const settings = readSettings();

  useEffect(() => {
    if (phase === 'in') {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
      const t = setTimeout(() => setPhase('out'), DURATION_MS - 450);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => setPhase('done'), 450);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={`splash ${phase === 'out' ? 'splash-out' : ''}`} aria-hidden="true">
      <div className="splash-ring splash-ring-1" />
      <div className="splash-ring splash-ring-2" />
      <div className="splash-logo">
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="font-display font-bold text-blue-dark text-4xl">JJ</span>
        )}
        <span className="splash-shine" />
      </div>
      <p className="splash-title font-display">{settings?.name || 'Club de Jean Jaurès'}</p>
      <p className="splash-sub">Saint-Étienne</p>
    </div>
  );
}
