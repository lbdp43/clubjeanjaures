import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Inscription() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await api.register(email, password);
      await refreshUser();
      navigate('/onboarding', { replace: true });
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
          <h1 className="font-display text-xl sm:text-2xl text-blue-dark mb-2">Rejoindre le club</h1>
          <p className="text-text-muted">
            Créez votre compte pour accéder à l'annuaire, l'agenda et le fil d'actualité.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="email-reg" className="block text-sm font-medium mb-2">
              Adresse email professionnelle
            </label>
            <input
              id="email-reg"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="votre@entreprise.fr"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password-reg" className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              id="password-reg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirm-pw" className="block text-sm font-medium mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Retapez le mot de passe"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Création...' : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-text-muted">
            Déjà membre ?{' '}
            <Link to="/connexion" className="text-blue hover:underline font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
