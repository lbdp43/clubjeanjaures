import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import EventCard from '../components/agenda/EventCard';
import MemberCard from '../components/annuaire/MemberCard';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getEvents().catch(() => []),
      api.getFavorites().catch(() => []),
      api.getPosts({ page: '1' }).catch(() => ({ posts: [] }))
    ]).then(([evts, favs, postsData]) => {
      setEvents(evts.slice(0, 4));
      setFavorites(favs);
      setMyPosts(postsData.posts?.filter(p => p.authorId === user.id).slice(0, 5) || []);
      setLoading(false);
    });
  }, [user.id]);

  if (!user) return <Navigate to="/connexion" replace />;
  if (!user.onboardingDone) return <Navigate to="/onboarding" replace />;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="font-display text-2xl text-blue-dark">
          Bonjour, {user.member?.companyName || 'membre'}
        </h1>
        <p className="text-text-muted mt-1">Bienvenue sur votre tableau de bord.</p>
      </div>

      {/* Profil incomplet */}
      {!user.member && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-card p-4">
          <p className="text-sm">
            Votre profil n'est pas encore renseigné.{' '}
            <Link to="/profil" className="text-blue font-semibold hover:underline">Compléter mon profil</Link>
          </p>
        </div>
      )}

      {/* Prochains événements */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Prochains événements</h2>
          <Link to="/agenda" className="text-sm text-blue hover:underline">Voir tout</Link>
        </div>
        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <p className="text-text-muted text-sm">Aucun événement à venir.</p>
        )}
      </section>

      {/* Favoris */}
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

      {/* Mes publications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Mes publications</h2>
          <Link to="/fil" className="text-sm text-blue hover:underline">Fil d'actualité</Link>
        </div>
        {myPosts.length > 0 ? (
          <div className="space-y-3">
            {myPosts.map(p => (
              <div key={p.id} className="card p-4">
                <p className="text-sm">{p.content}</p>
                <div className="flex gap-3 mt-2 text-xs text-text-muted">
                  <span>♥ {p._count?.likes || 0}</span>
                  <span>💬 {p._count?.comments || 0}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">Aucune publication.</p>
        )}
      </section>
    </div>
  );
}
