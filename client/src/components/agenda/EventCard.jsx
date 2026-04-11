import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { formatTime, getEventBadgeClass, getEventTypeLabel, mapsUrl } from '../../utils/helpers';

function EventCard({ event, onRsvpChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [localParticipating, setLocalParticipating] = useState(false);
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    setLocalParticipating(user && event.rsvps?.some(r => r.userId === user.id));
    setLocalCount(event._count?.rsvps || 0);
  }, [event, user]);

  const handleRsvp = async (e) => {
    e.stopPropagation();
    if (!user || rsvpLoading) return;

    const was = localParticipating;
    setLocalParticipating(!was);
    setLocalCount(c => was ? c - 1 : c + 1);

    setRsvpLoading(true);
    try {
      await api.toggleRsvp(event.id);
      if (onRsvpChange) onRsvpChange();
    } catch {
      setLocalParticipating(was);
      setLocalCount(c => was ? c + 1 : c - 1);
    } finally {
      setRsvpLoading(false);
    }
  };

  const dateObj = new Date(event.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();

  const shortDesc = event.description
    ? event.description.length > 80
      ? event.description.slice(0, 80) + '…'
      : event.description
    : null;

  return (
    <div
      role="article"
      onClick={() => navigate(`/agenda/${event.id}`)}
      aria-label={event.title}
      className="card p-3 sm:p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-shrink-0 w-12 sm:w-14 text-center pt-0.5">
          <div className="text-lg sm:text-2xl font-bold text-blue leading-tight">{day}</div>
          <div className="text-[10px] sm:text-xs text-text-muted uppercase">{month}</div>
        </div>
        <div className="flex-1 min-w-0">
          <span className={getEventBadgeClass(event.type)}>
            {getEventTypeLabel(event.type)}
          </span>
          <h3 className="font-semibold mt-1 text-sm sm:text-base leading-snug">{event.title}</h3>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            {formatTime(event.timeStart)}
            {event.timeEnd && ` — ${formatTime(event.timeEnd)}`}
          </p>

          {shortDesc && (
            <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{shortDesc}</p>
          )}

          {event.location && (
            <a
              href={mapsUrl(event.location)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue hover:underline mt-1.5"
            >
              <svg aria-hidden="true" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="truncate">{event.location}</span>
            </a>
          )}

          {/* Participants + RSVP */}
          <div className="flex items-center gap-3 mt-2">
            {localCount > 0 && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <svg className="w-3.5 h-3.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.16V17a6.003 6.003 0 017.212-5.876M15 19.128a9.38 9.38 0 002.625.372" />
                </svg>
                {localCount} participant{localCount !== 1 ? 's' : ''}
              </span>
            )}
            {user && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); if (!localParticipating) handleRsvp(e); }}
                  disabled={rsvpLoading}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    localParticipating
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-light text-blue-dark hover:bg-blue/10'
                  } ${rsvpLoading ? 'opacity-50' : ''}`}
                >
                  {localParticipating ? 'Je participe ✓' : 'Participer'}
                </button>
                {localParticipating && (
                  <button
                    onClick={handleRsvp}
                    disabled={rsvpLoading}
                    className="text-xs px-2 py-1 rounded-full text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EventCard);
