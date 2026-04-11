import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between lg:px-8">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue rounded-full flex items-center justify-center text-white font-display font-bold text-lg">
          JJ
        </div>
        <span className="hidden sm:block font-display text-blue-dark text-lg font-semibold">
          Club Jean Jaurès
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {user ? (
          <>
            <Link to="/profil" className="text-sm text-text-muted hover:text-blue transition-colors truncate max-w-[120px] sm:max-w-[200px]">
              {user.member?.companyName || user.email}
            </Link>
            <button onClick={logout} aria-label="Déconnexion" className="text-sm text-text-muted hover:text-red-500 transition-colors whitespace-nowrap">
              Déconnexion
            </button>
          </>
        ) : (
          <Link to="/connexion" className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
            Se connecter
          </Link>
        )}
      </div>
    </header>
  );
}
