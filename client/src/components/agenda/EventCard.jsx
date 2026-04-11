import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTime, getEventBadgeClass, getEventTypeLabel, mapsUrl } from '../../utils/helpers';

function EventCard({ event }) {
  const navigate = useNavigate();
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
              <svg aria-hidden="true" className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(EventCard);
