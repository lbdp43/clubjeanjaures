import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import { formatMonthLabel } from '../utils/helpers';
import EventCard from '../components/agenda/EventCard';
import SubscribePanel from '../components/agenda/SubscribePanel';
import Collapse from '../components/ui/Collapse';

const TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'matinale', label: 'Matinales' },
  { value: 'afterwork', label: 'Afterworks' },
  { value: 'formation', label: 'Formations' },
  { value: 'conference', label: 'Conférences' },
  { value: 'special', label: 'Spéciaux' }
];

export default function Agenda() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('upcoming');
  const [showSubscribe, setShowSubscribe] = useState(false);

  const { data: publicSettings } = useCachedFetch('settings', () => api.getPublicSettings());
  const isAgendaBlocked = !user && !!publicSettings && !publicSettings.publicAgenda;

  const params = {};
  if (tab === 'past') params.past = 'true';
  if (filter !== 'all') params.type = filter;

  const { data: displayed = [], loading, failed, refetch: fetchEvents } = useCachedFetch(
    `agenda:${user?.id || 'anon'}:${tab}:${filter}`,
    () => api.getEvents(params),
    { enabled: !isAgendaBlocked }
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="page-title">Agenda</h1>
        {!isAgendaBlocked && (
          <button
            onClick={() => setShowSubscribe(s => !s)}
            className="glass-pill inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            S'abonner
          </button>
        )}
      </div>

      {isAgendaBlocked ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-display text-lg text-white mb-2">Agenda réservé aux membres</h2>
          <p className="text-sm on-bg-muted">Connectez-vous pour accéder à l'agenda du club.</p>
        </div>
      ) : (
        <>
          <Collapse open={showSubscribe}>
            <div className="pb-1"><SubscribePanel onClose={() => setShowSubscribe(false)} /></div>
          </Collapse>

          {/* Onglets */}
          <div role="tablist" aria-label="Filtrer par période" className="segment">
            <button
              role="tab"
              aria-selected={tab === 'upcoming'}
              onClick={() => setTab('upcoming')}
              className={`segment-item ${tab === 'upcoming' ? 'segment-item-active' : ''}`}
            >
              À venir
            </button>
            <button
              role="tab"
              aria-selected={tab === 'past'}
              onClick={() => setTab('past')}
              className={`segment-item ${tab === 'past' ? 'segment-item-active' : ''}`}
            >
              Passés
            </button>
          </div>

          {/* Filtres */}
          <div className="chips-row">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setFilter(t.value)}
                aria-pressed={filter === t.value}
                className={`chip ${filter === t.value ? 'chip-active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {failed && (
            <div className="text-center py-4">
              <p className="on-bg-muted text-sm mb-2">Connexion en cours… l'agenda s'affichera dès que le réseau répond.</p>
              <button onClick={fetchEvents} className="text-sm on-bg-link">Réessayer maintenant</button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-36" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {groupByMonth(displayed).map(([month, events]) => (
                <section key={month}>
                  <h2 className="text-sm font-semibold text-white/85 uppercase tracking-wide mb-2 flex items-center gap-3">
                    <span>{month}</span>
                    <span className="flex-1 h-px bg-white/25" />
                    <span className="text-xs font-normal normal-case">{events.length} événement{events.length > 1 ? 's' : ''}</span>
                  </h2>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 min-w-0 stagger">
                    {events.map(event => (
                      <EventCard key={event.id} event={event} onRsvpChange={fetchEvents} />
                    ))}
                  </div>
                </section>
              ))}
              {displayed.length === 0 && !failed && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-white/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <p className="on-bg-muted text-sm">
                    {tab === 'past' ? 'Aucun événement passé.' : 'Aucun événement à venir pour le moment.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function groupByMonth(events) {
  const groups = new Map();
  for (const e of events) {
    const key = formatMonthLabel(e.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.entries()];
}
