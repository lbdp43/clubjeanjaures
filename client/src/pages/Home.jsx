import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import EventCard from '../components/agenda/EventCard';
import MemberCard from '../components/annuaire/MemberCard';

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getEvents().then(setEvents).catch(() => setError(true));
    api.getPublicMembers().then(setMembers).catch(() => setError(true));
    api.getSettings().then(setSettings).catch(() => setError(true));
  }, []);

  return (
    <div className="space-y-8 sm:space-y-12 fade-in">
      {/* Hero */}
      <section className="text-center py-8 sm:py-12 lg:py-20">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue rounded-full flex items-center justify-center text-white font-display font-bold text-2xl sm:text-3xl mx-auto mb-4 sm:mb-6">
          JJ
        </div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl text-blue-dark mb-3 sm:mb-4">
          {settings?.name || 'Club de Jean Jaurès'}
        </h1>
        <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
          {settings?.description || "Club d'affaires de Saint-Étienne — Échanges, entraide et développement entre professionnels de métiers différents."}
        </p>
        {!user && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/inscription" className="btn-primary">
              Rejoindre le club
            </Link>
            <Link to="/connexion" className="btn-secondary">
              Se connecter
            </Link>
          </div>
        )}
      </section>

      {error && (
        <p className="text-center text-red-500 text-sm py-4">
          Impossible de charger les données. Vérifiez votre connexion.
        </p>
      )}

      {/* Prochains événements */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl text-blue-dark">Prochains événements</h2>
          <Link to="/agenda" className="text-blue text-sm hover:underline">Voir tout</Link>
        </div>
        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-text-muted">Aucun événement à venir.</p>
        )}
      </section>

      {/* Annuaire */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl text-blue-dark">Nos membres</h2>
          <Link to="/annuaire" className="text-blue text-sm hover:underline">Voir l'annuaire</Link>
        </div>
        {members.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.slice(0, 6).map(member => (
              <MemberCard key={member.id} member={member} compact />
            ))}
          </div>
        ) : (
          <p className="text-text-muted">Aucun membre pour le moment.</p>
        )}
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-blue rounded-card p-6 sm:p-8 lg:p-12 text-center text-white">
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl mb-4">
            Envie de rejoindre le club ?
          </h2>
          <p className="text-blue-light mb-6 max-w-lg mx-auto">
            Inscription gratuite et ouverte à tous les professionnels de Saint-Étienne et sa région.
          </p>
          <Link to="/inscription" className="inline-block bg-white text-blue px-8 py-3 rounded-full font-semibold hover:bg-sand transition-colors">
            S'inscrire maintenant
          </Link>
        </section>
      )}
    </div>
  );
}
