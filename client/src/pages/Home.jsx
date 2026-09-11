import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import EventCard from '../components/agenda/EventCard';
import MemberCard from '../components/annuaire/MemberCard';

export default function Home() {
  const { user } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);
  const scope = user?.id || 'anon';

  const { data: settings } = useCachedFetch('settings', () => api.getPublicSettings());
  const { data: members = [], loading: membersLoading, error: membersError } = useCachedFetch(
    `home-members:${scope}`,
    () => api.getPublicMembers({ limit: 6 })
  );

  const showEvents = user || !settings || settings.publicAgenda !== false;
  const { data: events = [], loading: eventsLoading } = useCachedFetch(
    `home-events:${scope}`,
    () => api.getEvents({ limit: 6 }),
    { enabled: !!showEvents }
  );

  const handleInvite = () => {
    const url = `${window.location.origin}/inscription`;
    if (navigator.share) {
      navigator.share({
        title: 'Rejoins le Club Jean Jaurès',
        text: 'Je t\'invite à rejoindre le Club Jean Jaurès, club d\'affaires de Saint-Étienne !',
        url
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
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
        {!user ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/inscription" className="btn-primary">
              Rejoindre le club
            </Link>
            <Link to="/connexion" className="btn-secondary">
              Se connecter
            </Link>
          </div>
        ) : (
          <button
            onClick={handleInvite}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors ${
              linkCopied
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-blue text-white hover:bg-blue-dark'
            }`}
          >
            {linkCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Lien copié !
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Inviter un membre
              </>
            )}
          </button>
        )}
      </section>

      {membersError && (
        <p className="text-center text-red-500 text-sm py-4">
          Impossible de charger les données. Vérifiez votre connexion.
        </p>
      )}

      {/* Prochains événements */}
      {showEvents ? (
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-display text-xl sm:text-2xl text-blue-dark">Prochains événements</h2>
            <Link to="/agenda" className="text-blue text-sm hover:underline">Voir tout</Link>
          </div>
          {eventsLoading ? (
            <SkeletonGrid count={3} height="h-36" />
          ) : events.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-text-muted">Aucun événement à venir.</p>
          )}
        </section>
      ) : (
        <section className="text-center py-8">
          <p className="text-text-muted text-sm">
            L'agenda est réservé aux membres.{' '}
            <Link to="/connexion" className="text-blue hover:underline">Connectez-vous</Link> pour voir les événements.
          </p>
        </section>
      )}

      {/* Annuaire */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl text-blue-dark">Nos membres</h2>
          <Link to="/annuaire" className="text-blue text-sm hover:underline">Voir l'annuaire</Link>
        </div>
        {membersLoading ? (
          <SkeletonGrid count={3} height="h-64" />
        ) : members.length > 0 ? (
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

function SkeletonGrid({ count, height }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`card ${height} animate-pulse bg-gray-100`} />
      ))}
    </div>
  );
}
