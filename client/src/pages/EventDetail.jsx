import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatDate, formatTime, getEventBadgeClass, getEventTypeLabel } from '../utils/helpers';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvent(id).then(setEvent).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return <p className="text-center text-text-muted py-12">Événement introuvable.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <Link to="/agenda" className="text-blue text-sm hover:underline">&larr; Retour à l'agenda</Link>

      <div className="card p-6">
        <span className={getEventBadgeClass(event.type)}>
          {getEventTypeLabel(event.type)}
        </span>

        <h1 className="font-display text-2xl text-blue-dark mt-3 mb-4">{event.title}</h1>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {formatTime(event.timeStart)}
              {event.timeEnd && ` — ${formatTime(event.timeEnd)}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{event.location}</span>
          </div>

          {event.speaker && (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
              <span>Intervenant : {event.speaker}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-text-main">{event.description}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <a
            href={`/api/events/${event.id}/ics`}
            download
            className="btn-primary text-sm py-2 px-4"
          >
            Exporter (.ics)
          </a>
        </div>
      </div>
    </div>
  );
}
