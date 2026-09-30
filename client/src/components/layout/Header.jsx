import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { api } from '../../utils/api';
import { imgUrl } from '../../utils/helpers';

export default function Header() {
  const { user, logout } = useAuth();
  const { data: settings } = useCachedFetch('settings', () => api.getPublicSettings());
  const displayName = user?.member?.companyName || user?.email;

  return (
    <div className="sticky top-0 z-30 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-1 lg:px-6 lg:pt-3">
    <header className="glass-bar floating-top rounded-full px-2 py-1.5 pl-3 flex items-center justify-between gap-3 text-white">
      <Link to="/" className="flex items-center gap-2.5 min-w-0 lg:invisible" aria-label="Accueil">
        {settings?.logoUrl ? (
          <img src={imgUrl(settings.logoUrl, 200)} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30" />
        ) : (
          <div className="w-9 h-9 bg-white text-blue-dark rounded-full flex items-center justify-center font-display font-bold shadow">
            JJ
          </div>
        )}
        <span className="font-display font-semibold truncate">
          {settings?.name || 'Club Jean Jaurès'}
        </span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-shrink-0">
        {user ? (
          <>
            <Link
              to="/profil"
              className="flex items-center gap-2 text-sm text-white/85 hover:text-white transition-colors min-w-0 pl-1 pr-1 py-1 rounded-full hover:bg-white/10"
            >
              {user.member?.photoUrl ? (
                <img src={imgUrl(user.member.photoUrl, 200)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white/40" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
                  {displayName?.[0]?.toUpperCase()}
                </span>
              )}
              <span className="hidden sm:block truncate max-w-[180px]">{displayName}</span>
            </Link>
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </>
        ) : (
          <Link to="/connexion" className="bg-white text-blue-dark text-sm font-semibold py-2 px-4 rounded-full whitespace-nowrap hover:bg-blue-light transition-colors shadow">
            Se connecter
          </Link>
        )}
      </div>
    </header>
    </div>
  );
}
