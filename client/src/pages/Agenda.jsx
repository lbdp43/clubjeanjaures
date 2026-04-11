import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import EventCard from '../components/agenda/EventCard';

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
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicSettings, setPublicSettings] = useState(undefined); // undefined = loading, null = error

  useEffect(() => {
    api.getPublicSettings()
      .then(setPublicSettings)
      .catch(() => setPublicSettings(null));
  }, []);

  const isAgendaBlocked = !user && publicSettings !== undefined && publicSettings !== null && !publicSettings.publicAgenda;

  const fetchEvents = useCallback(() => {
    const params = {};
    if (tab === 'past') params.past = 'true';
    if (filter !== 'all') params.type = filter;

    setLoading(true);
    api.getEvents(params)
      .then(data => {
        if (tab === 'past') setPastEvents(data);
        else setEvents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, tab]);

  useEffect(() => {
    if (!isAgendaBlocked) fetchEvents();
    else setLoading(false);
  }, [filter, tab, isAgendaBlocked, fetchEvents]);

  const displayed = tab === 'past' ? pastEvents : events;

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-xl sm:text-2xl text-blue-dark">Agenda</h1>
        {!isAgendaBlocked && (
          <button
            onClick={() => setShowSubscribe(s => !s)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-blue-light text-blue-dark px-3 py-1.5 rounded-full font-medium hover:bg-blue/10 transition-colors"
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
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-display text-lg text-blue-dark mb-2">Agenda reservé aux membres</h2>
          <p className="text-sm text-text-muted">Connectez-vous pour accéder à l'agenda du club.</p>
        </div>
      ) : (
        <>
          {/* Panneau abonnement */}
          {showSubscribe && (
            <div className="card p-3 sm:p-5 space-y-2 sm:space-y-4 slide-up">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Ajouter à mon agenda</h3>
                <button onClick={() => setShowSubscribe(false)} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
              </div>
              <p className="text-xs sm:text-sm text-text-muted">
                Synchronisez tous les événements du club avec votre agenda. Les nouveaux événements seront ajoutés automatiquement.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={`https://calendar.google.com/calendar/r?cid=webcal://${window.location.host}/api/calendar/feed.ics`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white border border-gray-200 hover:border-blue px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Google Agenda</p>
                    <p className="text-xs text-text-muted">S'abonner automatiquement</p>
                  </div>
                </a>
                <a
                  href={`webcal://${window.location.host}/api/calendar/feed.ics`}
                  className="inline-flex items-center gap-3 bg-white border border-gray-200 hover:border-blue px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Apple Calendar / Outlook</p>
                    <p className="text-xs text-text-muted truncate">Ouvre l'app calendrier du téléphone</p>
                  </div>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/calendar/feed.ics`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-3 bg-white border border-gray-200 hover:border-blue px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors text-left"
                >
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{copied ? 'Lien copié !' : 'Copier le lien iCal'}</p>
                    <p className="text-xs text-text-muted truncate">Pour coller dans n'importe quelle app agenda</p>
                  </div>
                </button>
                <a
                  href="/api/calendar/export"
                  download
                  className="inline-flex items-center gap-3 bg-white border border-gray-200 hover:border-blue px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Télécharger le fichier .ics</p>
                    <p className="text-xs text-text-muted truncate">Tous les événements en un seul fichier</p>
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* Onglets */}
          <div role="tablist" aria-label="Filtrer par période" className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              role="tab"
              aria-selected={tab === 'upcoming'}
              onClick={() => setTab('upcoming')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm font-medium transition-colors ${
                tab === 'upcoming' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
              }`}
            >
              À venir
            </button>
            <button
              role="tab"
              aria-selected={tab === 'past'}
              onClick={() => setTab('past')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm font-medium transition-colors ${
                tab === 'past' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
              }`}
            >
              Passés
            </button>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setFilter(t.value)}
                aria-pressed={filter === t.value}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  filter === t.value
                    ? 'bg-blue text-white'
                    : 'bg-white text-text-muted border border-gray-200 hover:border-blue'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {displayed.map(event => (
                <EventCard key={event.id} event={event} onRsvpChange={fetchEvents} />
              ))}
              {displayed.length === 0 && (
                <p className="text-text-muted col-span-full text-center py-8 text-sm">
                  {tab === 'past' ? 'Aucun événement passé.' : 'Aucun événement à venir.'}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
