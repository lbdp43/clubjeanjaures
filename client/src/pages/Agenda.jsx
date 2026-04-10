import { useState, useEffect } from 'react';
import { api } from '../utils/api';
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
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const displayed = tab === 'past' ? pastEvents : events;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-blue-dark">Agenda</h1>
        <div className="flex gap-2">
          <a
            href="/api/calendar/export"
            className="text-sm text-blue hover:underline"
            download
          >
            Export .ics
          </a>
          <button
            onClick={() => {
              const url = `${window.location.origin}/api/calendar/feed.ics`.replace('https://', 'webcal://').replace('http://', 'webcal://');
              window.open(url);
            }}
            className="text-sm text-blue hover:underline"
          >
            S'abonner
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === 'upcoming' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
          }`}
        >
          À venir
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === 'past' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
          }`}
        >
          Passés
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
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
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
          {displayed.length === 0 && (
            <p className="text-text-muted col-span-full text-center py-8">
              {tab === 'past' ? 'Aucun événement passé.' : 'Aucun événement à venir.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
