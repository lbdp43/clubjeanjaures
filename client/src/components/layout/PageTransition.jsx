import { useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const TAB_ORDER = ['/', '/annuaire', '/agenda', '/tableau-de-bord', '/profil', '/admin'];

function tabIndex(pathname) {
  const seg = pathname === '/' ? '/' : '/' + pathname.split('/')[1];
  return TAB_ORDER.indexOf(seg);
}
function depth(pathname) {
  return pathname.split('/').filter(Boolean).length;
}

// Sens de l'animation : on avance → la page arrive de la droite, on recule → de la gauche
function direction(from, to, navType) {
  if (from === to) return 'none';
  if (navType === 'POP') return 'left';
  const d = depth(to) - depth(from);
  if (d > 0) return 'right';
  if (d < 0) return 'left';
  const a = tabIndex(from);
  const b = tabIndex(to);
  if (a >= 0 && b >= 0 && a !== b) return b > a ? 'right' : 'left';
  return 'fade';
}

export default function PageTransition({ children }) {
  const location = useLocation();
  const navType = useNavigationType();
  const last = useRef({ path: location.pathname, dir: 'none' });

  if (last.current.path !== location.pathname) {
    last.current = { path: location.pathname, dir: direction(last.current.path, location.pathname, navType) };
  }

  return (
    <div key={location.pathname} className={`page-${last.current.dir}`}>
      {children}
    </div>
  );
}
