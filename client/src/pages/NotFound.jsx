import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-20 fade-in">
      <h1 className="text-6xl font-display font-bold text-white mb-4">404</h1>
      <p className="on-bg-muted mb-6">Page introuvable</p>
      <Link to="/" className="inline-block bg-white text-blue-dark px-6 py-3 rounded-full font-semibold shadow-lg">Retour à l'accueil</Link>
    </div>
  );
}
