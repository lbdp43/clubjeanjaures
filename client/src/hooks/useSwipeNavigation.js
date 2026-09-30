import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const MIN_DISTANCE = 70;
const MAX_CROSS = 80;
const MAX_DURATION = 800;

// Balayer horizontalement pour changer d'onglet ; sur une fiche, balayer vers la droite revient en arrière.
export function useSwipeNavigation(ref) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const tabs = useMemo(() => [
    '/', '/annuaire', '/agenda',
    ...(user ? ['/profil'] : []),
    ...(isAdmin ? ['/admin'] : [])
  ], [user, isAdmin]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('ontouchstart' in window)) return;

    let start = null;
    let axis = null;

    const onStart = (e) => {
      if (e.touches.length !== 1) { start = null; return; }
      if (e.target.closest('.chips-row, input, textarea, select, [data-no-swipe]')) { start = null; return; }
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, at: Date.now() };
      axis = null;
    };

    const onMove = (e) => {
      if (!start) return;
      const t = e.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (!axis && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
        axis = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y';
      }
      if (axis === 'x') {
        el.style.transition = 'none';
        el.style.transform = `translateX(${dx * 0.22}px)`;
      }
    };

    const onEnd = (e) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dt = Date.now() - start.at;
      const horizontal = axis === 'x';
      start = null;
      axis = null;
      el.style.transition = 'transform 0.2s ease-out';
      el.style.transform = '';
      if (!horizontal || Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > MAX_CROSS || dt > MAX_DURATION) return;

      const path = location.pathname;
      const seg = path === '/' ? '/' : '/' + path.split('/')[1];
      const idx = tabs.indexOf(seg);
      const isDetail = path.split('/').filter(Boolean).length > 1 && !path.startsWith('/admin');

      if (dx > 0) {
        if (isDetail) navigate(-1);
        else if (idx > 0) navigate(tabs[idx - 1]);
      } else if (!isDetail && idx >= 0 && idx < tabs.length - 1) {
        navigate(tabs[idx + 1]);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      el.style.transform = '';
    };
  }, [ref, tabs, location.pathname, navigate]);
}
