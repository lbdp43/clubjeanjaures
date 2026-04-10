import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.sendMagicLink(email);
      setSent(true);
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
          <div className="w-16 h-16 bg-blue rounded-full flex items-center justify-center text-white font-display font-bold text-2xl mx-auto mb-4">
            JJ
          </div>
          <h1 className="font-display text-2xl text-blue-dark mb-2">Club Jean Jaurès</h1>
          <p className="text-text-muted">Connexion à votre espace</p>
        </div>

        {sent ? (
          <div className="text-center slide-up">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Vérifiez vos emails</h2>
            <p className="text-text-muted mb-4">
              Un lien de connexion a été envoyé à <strong>{email}</strong>.
              Il expire dans 15 minutes.
            </p>
            <button onClick={() => setSent(false)} className="text-blue hover:underline text-sm">
              Utiliser une autre adresse
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Recevoir le lien de connexion'}
            </button>

            <div className="text-center">
              <Link to="/" className="text-sm text-text-muted hover:text-blue">
                Retour à l'accueil
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
