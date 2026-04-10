import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      await refreshUser();
      navigate('/tableau-de-bord', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-5 sm:p-8 fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue rounded-full flex items-center justify-center text-white font-display font-bold text-xl sm:text-2xl mx-auto mb-4">
            JJ
          </div>
          <h1 className="font-display text-2xl text-blue-dark mb-2">Club Jean Jaurès</h1>
          <p className="text-text-muted">Connexion à votre espace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="votre@email.fr"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Votre mot de passe"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-sm text-text-muted">
            Pas encore inscrit ?{' '}
            <Link to="/inscription" className="text-blue hover:underline font-medium">Créer un compte</Link>
          </p>
          <Link to="/" className="text-sm text-text-muted hover:text-blue block">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
