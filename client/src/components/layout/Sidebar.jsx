import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { user, isAdmin } = useAuth();

  const links = [
    { to: '/', label: 'Accueil' },
    { to: '/annuaire', label: 'Annuaire' },
    { to: '/agenda', label: 'Agenda' },
    ...(user ? [
      { to: '/fil', label: "Fil d'actualité" },
      { to: '/tableau-de-bord', label: 'Tableau de bord' },
      { to: '/profil', label: 'Mon profil' }
    ] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Administration' }] : [])
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-screen z-30">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue rounded-full flex items-center justify-center text-white font-display font-bold text-xl">
            JJ
          </div>
          <div>
            <h2 className="font-display text-blue-dark font-semibold">Club Jean Jaurès</h2>
            <p className="text-xs text-text-muted">Saint-Étienne</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/admin'}
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
    </aside>
  );
}
