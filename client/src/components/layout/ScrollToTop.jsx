import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Sans ça, on arrive au milieu de la page suivante après avoir scrollé la précédente
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
