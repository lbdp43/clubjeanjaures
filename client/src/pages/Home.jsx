import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import { formatDate, formatTime, formatDaysUntil, getEventBadgeClass, getEventTypeLabel } from '../utils/helpers';
import EventCard from '../components/agenda/EventCard';
import MemberCard from '../components/annuaire/MemberCard';
import InstallCard from '../components/layout/InstallCard';
import { haptic } from '../utils/haptics';

export default function Home() {
  const { user } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);
  const scope = user?.id || 'anon';

  const { data: settings } = useCachedFetch('settings', () => api.getPublicSettings());
  const { data: members = [], loading: membersLoading, failed: membersFailed } = useCachedFetch(
    `home-members:${scope}`,
    () => api.getPublicMembers({ limit: 6 })
  );

  const showEvents = user || !settings || settings.publicAgenda !== false;
  const { data: events = [], loading: eventsLoading, refetch: refetchEvents } = useCachedFetch(
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

  const nextEvent = user ? events[0] : null;
  const otherEvents = user ? events.slice(1, 5) : events.slice(0, 6);

  return (
    <div className="space-y-8 sm:space-y-12">
      {user ? (
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl text-white truncate">
                Bonjour{user.member?.companyName ? `, ${user.member.companyName}` : ''}
              </h1>
              <p className="on-bg-muted text-sm mt-1">Voici ce qui vous attend au club.</p>
            </div>
            <button
              onClick={handleInvite}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-full font-medium transition-colors ${
                linkCopied ? 'bg-green-100 text-green-700' : 'glass-pill hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              {linkCopied ? 'Lien copié !' : 'Inviter'}
            </button>
          </div>

          {eventsLoading && !nextEvent ? (
            <div className="skeleton h-40" aria-hidden="true" />
          ) : nextEvent ? (
            <NextEventCard event={nextEvent} user={user} onChange={refetchEvents} />
          ) : (
            <div className="card-glass p-5 text-center text-sm">Aucun événement à venir pour le moment.</div>
          )}

          {!user.member && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-card p-4 text-sm">
              Votre profil n'est pas encore renseigné.{' '}
              <Link to="/profil" className="text-blue font-semibold hover:underline">Compléter mon profil</Link>
            </div>
          )}

          <InstallCard />
        </section>
      ) : (
        <section className="text-center py-6 sm:py-12 lg:py-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-blue-dark font-display font-bold text-2xl sm:text-3xl mx-auto mb-4 sm:mb-6 shadow-lg shadow-blue-dark/40 ring-4 ring-white/20 overflow-hidden">
            {settings?.logoUrl ? <img src={settings.logoUrl} alt="" className="w-full h-full object-cover" /> : 'JJ'}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl text-white mb-3 sm:mb-4">
            {settings?.name || 'Club de Jean Jaurès'}
          </h1>
          <p className="text-base sm:text-lg on-bg-muted max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            {settings?.description || "Club d'affaires de Saint-Étienne — Échanges, entraide et développement entre professionnels de métiers différents."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/inscription" className="bg-white text-blue-dark px-6 py-3 rounded-full font-semibold shadow-lg shadow-blue-dark/30 hover:bg-blue-light transition-colors">Rejoindre le club</Link>
            <Link to="/connexion" className="border-2 border-white/70 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">Se connecter</Link>
          </div>
          <div className="max-w-md mx-auto mt-6 text-left">
            <InstallCard />
          </div>
        </section>
      )}

      {membersFailed && (
        <p className="text-center on-bg-muted text-sm py-2">
          Connexion en cours… les données s'afficheront dès que le réseau répond.
        </p>
      )}

      {/* Prochains événements */}
      {showEvents ? (
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-display text-xl sm:text-2xl text-white">{user ? 'Et ensuite' : 'Prochains événements'}</h2>
            <Link to="/agenda" className="on-bg-link text-sm">Voir tout l'agenda</Link>
          </div>
          {eventsLoading && events.length === 0 ? (
            <SkeletonGrid count={3} height="h-36" />
          ) : otherEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 min-w-0 stagger">
              {otherEvents.map(event => (
                <EventCard key={event.id} event={event} onRsvpChange={refetchEvents} />
              ))}
            </div>
          ) : !nextEvent ? (
            <p className="on-bg-muted">Aucun événement à venir.</p>
          ) : (
            <p className="on-bg-muted text-sm">Pas d'autre événement programmé pour l'instant.</p>
          )}
        </section>
      ) : (
        <section className="text-center py-8">
          <p className="on-bg-muted text-sm">
            L'agenda est réservé aux membres.{' '}
            <Link to="/connexion" className="on-bg-link">Connectez-vous</Link> pour voir les événements.
          </p>
        </section>
      )}

      {/* Annuaire */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl text-white">Nos membres</h2>
          <Link to="/annuaire" className="on-bg-link text-sm">Voir l'annuaire</Link>
        </div>
        {membersLoading ? (
          <SkeletonGrid count={3} height="h-24" />
        ) : members.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-w-0 stagger">
            {members.slice(0, 6).map(member => (
              <MemberCard key={member.id} member={member} compact />
            ))}
          </div>
        ) : (
          <p className="on-bg-muted">Aucun membre pour le moment.</p>
        )}
      </section>

      {/* CTA */}
      {!user && (
        <section className="card-glass p-6 sm:p-8 lg:p-12 text-center">
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl mb-4">
            Envie de rejoindre le club ?
          </h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Inscription gratuite et ouverte à tous les professionnels de Saint-Étienne et sa région.
          </p>
          <Link to="/inscription" className="inline-block bg-white text-blue-dark px-8 py-3 rounded-full font-semibold hover:bg-blue-light transition-colors shadow-lg shadow-blue-dark/30">
            S'inscrire maintenant
          </Link>
        </section>
      )}
    </div>
  );
}

function NextEventCard({ event, user, onChange }) {
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(null);
  const participating = local ?? (event.rsvps?.some(r => r.userId === user.id) || false);
  const count = (event._count?.rsvps || 0) + (local === null ? 0 : (local ? 1 : 0) - (event.rsvps?.some(r => r.userId === user.id) ? 1 : 0));

  const toggle = async (target) => {
    if (busy || participating === target) return;
    haptic(target ? 'success' : 'light');
    setBusy(true);
    setLocal(target);
    try {
      await api.toggleRsvp(event.id);
      if (onChange) await onChange();
      setLocal(null);
    } catch {
      setLocal(null);
    }
    setBusy(false);
  };

  return (
    <div className="card p-4 sm:p-5 border-blue/20 bg-gradient-to-br from-white to-blue-light/40">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-blue">Prochain événement · {formatDaysUntil(event.date)}</span>
        <span className={getEventBadgeClass(event.type)}>{getEventTypeLabel(event.type)}</span>
      </div>
      <Link to={`/agenda/${event.id}`} className="block group">
        <h2 className="font-display text-xl sm:text-2xl text-blue-dark group-hover:underline leading-tight">{event.title}</h2>
        <p className="text-sm text-text-muted mt-1.5">
          {formatDate(event.date)} · {formatTime(event.timeStart)}{event.timeEnd ? ` — ${formatTime(event.timeEnd)}` : ''}
        </p>
        {event.location && <p className="text-sm text-text-muted">{event.location}</p>}
      </Link>

      <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-blue/10">
        <button
          onClick={() => toggle(true)}
          disabled={busy}
          className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
            participating ? 'bg-green-600 text-white' : 'bg-white text-green-700 ring-1 ring-green-300 hover:bg-green-50'
          }`}
        >
          ✓ Je participe
        </button>
        <button
          onClick={() => toggle(false)}
          disabled={busy}
          className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
            !participating ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-white text-text-muted ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-500'
          }`}
        >
          ✗ Pas dispo
        </button>
        <span className="text-xs text-text-muted ml-auto">
          {count} participant{count !== 1 ? 's' : ''}
        </span>
      </div>
      {participating && (
        <p className="text-xs text-green-700 mt-2">Vous êtes inscrit·e. À bientôt !</p>
      )}
    </div>
  );
}

function SkeletonGrid({ count, height }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${height}`} />
      ))}
    </div>
  );
}
