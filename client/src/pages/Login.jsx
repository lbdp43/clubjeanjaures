import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [mode, setMode] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handlePasswordLogin = async (e) => {
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
      <div className="card max-w-md w-full p-5 sm:p-8 fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue rounded-full flex items-center justify-center text-white font-display font-bold text-xl sm:text-2xl mx-auto mb-4">
            JJ
          </div>
          <h1 className="font-display text-2xl text-blue-dark mb-2">Club Jean Jaurès</h1>
          <p className="text-text-muted">Connexion à votre espace</p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('password'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === 'password' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
            }`}
          >
            Mot de passe
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

        {/* Mot de passe */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email-pw" className="block text-sm font-medium mb-2">Adresse email</label>
              <input id="email-pw" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="votre@email.fr" required autoFocus />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Mot de passe</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Votre mot de passe" required minLength={6} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        )}

        {/* Magic link */}
        {mode === 'magic' && !magicSent && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email-magic" className="block text-sm font-medium mb-2">Adresse email</label>
              <input id="email-magic" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="votre@email.fr" required autoFocus />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Envoi...' : 'Recevoir le lien de connexion'}
            </button>
            <p className="text-xs text-text-muted text-center">
              Un lien de connexion unique vous sera envoyé par email. Pas besoin de mot de passe.
            </p>
          </form>
        )}

        {mode === 'magic' && magicSent && (
          <div className="text-center slide-up">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Vérifiez vos emails</h2>
            <p className="text-text-muted mb-4">
              Un lien de connexion a été envoyé à <strong>{email}</strong>. Il expire dans 15 minutes.
            </p>
            <button onClick={() => setMagicSent(false)} className="text-blue hover:underline text-sm">
              Utiliser une autre adresse
            </button>
          </div>
        )}

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
