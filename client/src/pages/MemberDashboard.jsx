import { Link, Navigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import EventCard from '../components/agenda/EventCard';
import MemberCard from '../components/annuaire/MemberCard';

export default function MemberDashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: events = [], loading: eventsLoading } = useCachedFetch(
    `dashboard-events:${userId}`,
    () => api.getEvents({ limit: 4 }),
    { enabled: !!userId }
  );
  const { data: favorites = [], loading: favsLoading } = useCachedFetch(
    `favorites:${userId}`,
    () => api.getFavorites(),
    { enabled: !!userId }
  );

  if (!user) return <Navigate to="/connexion" replace />;
  if (!user.onboardingDone) return <Navigate to="/onboarding" replace />;

  const loading = eventsLoading || favsLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-blue-dark">
          Bonjour, {user.member?.companyName || 'membre'}
        </h1>
        <p className="text-text-muted mt-1">Bienvenue sur votre tableau de bord.</p>
      </div>

      {!user.member && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-card p-4">
          <p className="text-sm">
            Votre profil n'est pas encore renseigné.{' '}
            <Link to="/profil" className="text-blue font-semibold hover:underline">Compléter mon profil</Link>
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card h-36 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Prochains événements</h2>
              <Link to="/agenda" className="text-sm text-blue hover:underline">Voir tout</Link>
            </div>
            {events.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {events.slice(0, 4).map(e => <EventCard key={e.id} event={e} />)}
              </div>
            ) : (
              <p className="text-text-muted text-sm">Aucun événement à venir.</p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Mes favoris</h2>
              <Link to="/annuaire" className="text-sm text-blue hover:underline">Annuaire</Link>
            </div>
            {favorites.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {favorites.map(f => (
                  <MemberCard key={f.id} member={{
                    id: f.memberId,
                    companyName: f.member?.member?.companyName || f.member?.email,
                    jobTitle: f.member?.member?.jobTitle || '',
                    logoUrl: f.member?.member?.logoUrl,
                    city: f.member?.member?.city
                  }} compact />
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">Aucun favori pour le moment.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
