import { useEffect, useState } from 'react';
import { applyUpdate } from '../../utils/pwa';

export default function UpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener('pwa:need-refresh', show);
    return () => window.removeEventListener('pwa:need-refresh', show);
  }, []);

  if (!visible) return null;

  return (
    <div role="status" className="fixed left-3 right-3 bottom-[76px] lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 slide-up">
      <div className="bg-blue-dark text-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <p className="text-sm flex-1">Une nouvelle version de l'application est disponible.</p>
        <button
          onClick={() => { setUpdating(true); applyUpdate(); }}
          disabled={updating}
          className="text-sm font-semibold bg-white text-blue-dark px-3 py-1.5 rounded-full hover:bg-blue-light transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {updating ? '...' : 'Mettre à jour'}
        </button>
      </div>
    </div>
  );
}
