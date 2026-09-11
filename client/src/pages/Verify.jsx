import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    // Le token est à usage unique : ne jamais le vérifier deux fois (StrictMode)
    if (started.current) return;
    started.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setError('Token manquant.');
      setLoading(false);
      return;
    }

    api.verifyToken(token)
      .then(async () => {
        await refreshUser();
        navigate('/', { replace: true });
      })
      .catch(err => {
        setError(err.message || 'Lien invalide ou expiré.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-muted">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Lien expiré</h2>
        <p className="text-text-muted mb-4">{error}</p>
        <Link to="/connexion" className="btn-primary inline-block">Retour à la connexion</Link>
      </div>
    </div>
  );
}
