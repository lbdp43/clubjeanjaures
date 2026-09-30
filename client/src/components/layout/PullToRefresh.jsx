import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 64;
const MAX_PULL = 96;

// Tirer vers le bas en haut de page pour recharger les données (comme une app native).
// Émet l'événement global « cjj:refresh » écouté par useCachedFetch et l'auth.
export default function PullToRefresh({ children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const startX = useRef(0);
  const pulling = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!('ontouchstart' in window)) return;

    const onStart = (e) => {
      if (refreshingRef.current || window.scrollY > 0 || e.touches.length !== 1) return;
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      pulling.current = false;
    };
    const onMove = (e) => {
      if (startY.current === null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;
      // Geste horizontal (changement de page) : on laisse la main
      if (!pulling.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) { startY.current = null; return; }
      if (dy <= 0 || window.scrollY > 0) {
        if (pulling.current) { pulling.current = false; setPull(0); }
        return;
      }
      pulling.current = true;
      setPull(Math.min(dy * 0.45, MAX_PULL));
    };
    const onEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (!pulling.current) return;
      pulling.current = false;
      if (pull < THRESHOLD) { setPull(0); return; }
      refreshingRef.current = true;
      setRefreshing(true);
      setPull(THRESHOLD);
      window.dispatchEvent(new CustomEvent('cjj:refresh'));
      await new Promise(r => setTimeout(r, 700));
      refreshingRef.current = false;
      setRefreshing(false);
      setPull(0);
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [pull]);

  const ready = pull >= THRESHOLD;

  return (
    <>
      <div
        aria-hidden="true"
        className="lg:hidden fixed left-0 right-0 top-[57px] z-20 flex justify-center pointer-events-none"
        style={{ transform: `translateY(${pull - 48}px)`, opacity: Math.min(pull / THRESHOLD, 1), transition: pulling.current ? 'none' : 'transform 0.2s, opacity 0.2s' }}
      >
        <div className={`w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}>
          <svg
            className="w-5 h-5 text-blue"
            style={{ transform: refreshing ? 'none' : `rotate(${Math.min(pull / THRESHOLD, 1) * 180}deg)`, transition: 'transform 0.15s' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            {refreshing
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />}
          </svg>
        </div>
      </div>
      <div style={{ transform: pull ? `translateY(${pull * 0.6}px)` : 'none', transition: pulling.current ? 'none' : 'transform 0.2s' }}>
        {children}
      </div>
      {ready && !refreshing && <span className="sr-only">Relâchez pour actualiser</span>}
    </>
  );
}
