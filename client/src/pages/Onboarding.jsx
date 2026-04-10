import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const slides = [
  {
    title: 'Bienvenue au Club',
    desc: 'Le Club Jean Jaurès réunit des professionnels de Saint-Étienne pour échanger, s\'entraider et développer leur activité.',
    color: 'bg-blue-light'
  },
  {
    title: 'Annuaire des membres',
    desc: 'Consultez les fiches des membres, trouvez des compétences, contactez-les directement par téléphone, email ou WhatsApp.',
    color: 'bg-sand'
  },
  {
    title: 'Agenda partagé',
    desc: 'Retrouvez toutes les matinales, afterworks et événements du club. Exportez-les vers votre agenda.',
    color: 'bg-blue-light'
  },
  {
    title: 'Échanges et demandes',
    desc: 'Publiez sur le fil d\'actualité, postez vos demandes et besoins. La communauté est là pour vous aider.',
    color: 'bg-sand'
  }
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleFinish = async () => {
    await api.completeOnboarding();
    await refreshUser();
    navigate('/profil', { replace: true });
  };

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full fade-in" key={current}>
        <div className={`${slide.color} rounded-card p-12 mb-8 text-center`}>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-3xl font-display text-blue font-bold">{current + 1}</span>
          </div>
        </div>

        <h2 className="text-2xl font-display text-blue-dark text-center mb-3">{slide.title}</h2>
        <p className="text-text-muted text-center mb-8">{slide.desc}</p>

        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-blue' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {current > 0 && (
            <button onClick={() => setCurrent(c => c - 1)} className="btn-secondary flex-1">
              Précédent
            </button>
          )}
          {isLast ? (
            <button onClick={handleFinish} className="btn-primary flex-1">
              Commencer
            </button>
          ) : (
            <button onClick={() => setCurrent(c => c + 1)} className="btn-primary flex-1">
              Suivant
            </button>
          )}
        </div>

        {!isLast && (
          <button onClick={handleFinish} className="block mx-auto mt-4 text-sm text-text-muted hover:text-blue">
            Passer l'introduction
          </button>
        )}
      </div>
    </div>
  );
}
