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
    <aside className="hidden lg:flex flex-col w-64 glass-bar border-r fixed h-screen z-30 text-white">
      <Link to="/" className="p-6 border-b border-white/10 flex items-center gap-3">
        {settings?.logoUrl ? (
          <img src={imgUrl(settings.logoUrl, 200)} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30" />
        ) : (
          <div className="w-12 h-12 bg-white text-blue-dark rounded-full flex items-center justify-center font-display font-bold text-xl shadow">
            JJ
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-display font-semibold truncate">{settings?.name || 'Club Jean Jaurès'}</h2>
          <p className="text-xs text-white/60">Saint-Étienne</p>
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
                  ? 'bg-white text-blue-dark shadow'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {user ? (
          <div className="flex items-center gap-3">
            {user.member?.photoUrl ? (
              <img src={imgUrl(user.member.photoUrl, 200)} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-white/20 text-white text-sm font-bold flex items-center justify-center">
                {displayName?.[0]?.toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <button onClick={logout} className="text-xs text-white/60 hover:text-white">Se déconnecter</button>
            </div>
          </div>
        ) : (
          <Link to="/connexion" className="block text-center bg-white text-blue-dark text-sm font-semibold py-2 rounded-full hover:bg-blue-light transition-colors">Se connecter</Link>
        )}
      </div>
    </aside>
  );
}
