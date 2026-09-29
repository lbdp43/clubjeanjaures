import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { api } from '../../utils/api';
import { imgUrl } from '../../utils/helpers';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const { data: settings } = useCachedFetch('settings', () => api.getPublicSettings());

  const links = [
    { to: '/', label: 'Accueil' },
    { to: '/annuaire', label: 'Annuaire' },
    { to: '/agenda', label: 'Agenda' },
    ...(user ? [
      { to: '/tableau-de-bord', label: 'Tableau de bord' },
      { to: '/profil', label: 'Mon profil' }
    ] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Administration' }] : [])
  ];

  const displayName = user?.member?.companyName || user?.email;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-screen z-30">
      <Link to="/" className="p-6 border-b border-gray-100 flex items-center gap-3">
        {settings?.logoUrl ? (
          <img src={imgUrl(settings.logoUrl, 200)} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 bg-blue rounded-full flex items-center justify-center text-white font-display font-bold text-xl">
            JJ
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-blue-dark font-semibold truncate">{settings?.name || 'Club Jean Jaurès'}</h2>
          <p className="text-xs text-text-muted">Saint-Étienne</p>
        </div>
      </Link>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-light text-blue-dark'
                  : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        {user ? (
          <div className="flex items-center gap-3">
            {user.member?.photoUrl ? (
              <img src={imgUrl(user.member.photoUrl, 200)} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-blue-light text-blue text-sm font-bold flex items-center justify-center">
                {displayName?.[0]?.toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <button onClick={logout} className="text-xs text-text-muted hover:text-red-500">Se déconnecter</button>
            </div>
          </div>
        ) : (
          <Link to="/connexion" className="btn-primary text-sm py-2 w-full block text-center">Se connecter</Link>
        )}
      </div>
    </aside>
  );
}
