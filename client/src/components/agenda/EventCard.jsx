import { Link } from 'react-router-dom';
import { formatDate, formatTime, getEventBadgeClass, getEventTypeLabel } from '../../utils/helpers';

export default function EventCard({ event }) {
  const dateObj = new Date(event.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();

  return (
    <Link to={`/agenda/${event.id}`} className="card hover:shadow-md transition-shadow block">
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-shrink-0 w-12 sm:w-14 text-center">
          <div className="text-xl sm:text-2xl font-bold text-blue">{day}</div>
          <div className="text-xs text-text-muted uppercase">{month}</div>
        </div>
        <div className="flex-1 min-w-0">
          <span className={getEventBadgeClass(event.type)}>
            {getEventTypeLabel(event.type)}
          </span>
          <h3 className="font-semibold mt-1 truncate text-sm sm:text-base">{event.title}</h3>
          <p className="text-xs sm:text-sm text-text-muted">
            {formatTime(event.timeStart)}
            {event.timeEnd && ` — ${formatTime(event.timeEnd)}`}
          </p>
          <p className="text-xs text-text-muted mt-0.5 truncate">{event.location}</p>
        </div>
      </div>
    </Link>
  );
}
