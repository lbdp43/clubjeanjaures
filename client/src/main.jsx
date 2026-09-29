import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { setupServiceWorker, isChunkLoadError, reloadOnceForChunkError, clearChunkReloadFlag } from './utils/pwa';
import './styles/index.css';

// Polices chargées après le premier rendu : le CSS distant ne bloque plus l'affichage
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap';
document.head.appendChild(fontLink);

setupServiceWorker();
// L'app a démarré correctement : on réautorise un rechargement automatique futur
setTimeout(clearChunkReloadFlag, 5000);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reloading: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, reloading: isChunkLoadError(error) };
  }
  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
    if (isChunkLoadError(error)) {
      const reloaded = reloadOnceForChunkError();
      if (!reloaded) this.setState({ reloading: false });
    }
  }
  render() {
    if (this.state.hasError) {
      if (this.state.reloading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-cream p-4">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-text-muted">Mise à jour de l'application...</p>
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-2">Une erreur est survenue</h1>
            <p className="text-gray-600 mb-4">Veuillez rafraîchir la page.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
