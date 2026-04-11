import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-20 fade-in">
      <h1 className="text-6xl font-display font-bold text-blue mb-4">404</h1>
      <p className="text-text-muted mb-6">Page introuvable</p>
      <Link to="/" className="btn-primary inline-block">Retour à l'accueil</Link>
    </div>
  );
}
