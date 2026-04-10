import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Inscription() {
  const [mode, setMode] = useState('password'); // 'password' | 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
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

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.sendMagicLink(email);
      setMagicSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 fade-in">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-blue-dark mb-2">Rejoindre le club</h1>
          <p className="text-text-muted">
            Créez votre compte pour accéder à l'annuaire, l'agenda et le fil d'actualité.
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('password'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === 'password' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
            }`}
          >
            Email / Mot de passe
          </button>
          <button
            onClick={() => { setMode('magic'); setError(''); setMagicSent(false); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === 'magic' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
            }`}
          >
            Lien par email
          </button>
        </div>

        {/* Inscription par mot de passe */}
        {mode === 'password' && (
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
        )}

        {/* Inscription par magic link */}
        {mode === 'magic' && !magicSent && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email-magic" className="block text-sm font-medium mb-2">
                Adresse email professionnelle
              </label>
              <input
                id="email-magic"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre@entreprise.fr"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Envoi...' : 'Recevoir un lien de connexion'}
            </button>

            <p className="text-xs text-text-muted text-center">
              Pas besoin de mot de passe : un lien unique vous sera envoyé par email.
            </p>
          </form>
        )}

        {/* Magic link envoyé */}
        {mode === 'magic' && magicSent && (
          <div className="text-center slide-up">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">C'est parti !</h2>
            <p className="text-text-muted">
              Un lien de connexion a été envoyé à <strong>{email}</strong>.
              Cliquez dessus pour finaliser votre inscription.
            </p>
          </div>
        )}

        {/* Lien vers connexion */}
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
