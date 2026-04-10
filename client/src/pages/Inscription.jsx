import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Inscription() {
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
          <h1 className="font-display text-2xl text-blue-dark mb-2">Rejoindre le club</h1>
          <p className="text-text-muted">
            Inscrivez-vous au Club Jean Jaurès pour accéder à l'annuaire, l'agenda et le fil d'actualité.
          </p>
        </div>

        {sent ? (
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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Votre adresse email professionnelle
              </label>
              <input
                id="email"
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
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>

            <p className="text-center text-sm text-text-muted">
              Déjà membre ?{' '}
              <Link to="/connexion" className="text-blue hover:underline">Se connecter</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
