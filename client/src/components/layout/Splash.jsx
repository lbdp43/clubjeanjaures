import { useEffect, useState } from 'react';

const SESSION_KEY = 'cjj-splash-shown';
const DURATION_MS = 2200;
const OUT_MS = 520;

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
      const t = setTimeout(() => setPhase('out'), DURATION_MS - OUT_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => setPhase('done'), OUT_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === 'done') return null;

  const title = settings?.name || 'Club de Jean Jaurès';

  return (
    <div className={`splash ${phase === 'out' ? 'splash-out' : ''}`} aria-hidden="true">
      {/* Halos qui dérivent + bokeh */}
      <div className="splash-halo splash-halo-a" />
      <div className="splash-halo splash-halo-b" />
      {[...Array(7)].map((_, i) => <span key={i} className={`splash-bokeh splash-bokeh-${i + 1}`} />)}

      <div className="splash-stage">
        {/* Anneaux d'onde */}
        <div className="splash-ring splash-ring-1" />
        <div className="splash-ring splash-ring-2" />
        <div className="splash-ring splash-ring-3" />

        {/* Disque de verre : lueur, anneau lumineux tournant, logo, reflet */}
        <div className="splash-glow" />
        <div className="splash-orbit" />
        <div className="splash-logo">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="font-display font-bold text-blue-dark text-[44px] leading-none">JJ</span>
          )}
          <span className="splash-shine" />
        </div>
      </div>

      <p className="splash-title font-display">
        {title.split('').map((ch, i) => (
          <span key={i} className="splash-char" style={{ animationDelay: `${0.75 + i * 0.028}s` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
      <p className="splash-sub">Saint-Étienne</p>
      <div className="splash-progress"><span /></div>
    </div>
  );
}
