import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { formatDate, formatTime, getEventBadgeClass, getEventTypeLabel, mapsUrl, imgUrl } from '../../utils/helpers';

function participantName(r) {
  return r.user?.member?.companyName || r.user?.email?.split('@')[0] || 'Membre';
}

function ParticipantAvatar({ rsvp, size = 'w-7 h-7' }) {
  const m = rsvp.user?.member;
  const src = m?.photoUrl || m?.logoUrl;
  if (src) {
    return <img src={imgUrl(src, 200)} alt="" loading="lazy" className={`${size} rounded-full object-cover ring-2 ring-white bg-white`} />;
  }
  return (
    <span className={`${size} rounded-full bg-blue-light text-blue text-[10px] font-bold flex items-center justify-center ring-2 ring-white`}>
      {participantName(rsvp)[0]?.toUpperCase()}
    </span>
  );
}

function Participants({ rsvps, count }) {
  const [open, setOpen] = useState(false);
  if (!rsvps?.length) {
    return <p className="text-xs text-text-muted mt-2.5">Aucun participant pour l'instant — soyez le premier !</p>;
  }
  const names = rsvps.map(participantName);
  const shown = names.slice(0, 3).join(', ');
  const rest = count - Math.min(3, names.length);

  return (
    <div className="mt-2.5">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center gap-2 text-left w-full max-w-full overflow-hidden group"
        aria-expanded={open}
        aria-label={`${count} participant${count > 1 ? 's' : ''} : ${names.join(', ')}`}
      >
        <span className="flex -space-x-2 flex-shrink-0">
          {rsvps.slice(0, 5).map(r => <ParticipantAvatar key={r.userId} rsvp={r} />)}
        </span>
        <span className="text-xs text-text-muted min-w-0 truncate group-hover:text-text-main">
          <span className="font-medium text-text-main">{count} participant{count > 1 ? 's' : ''}</span>
          {' · '}{shown}{rest > 0 ? ` et ${rest} autre${rest > 1 ? 's' : ''}` : ''}
        </span>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <ul className="mt-2 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {rsvps.map(r => (
            <li key={r.userId} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full pl-0.5 pr-2.5 py-0.5 text-xs">
              <ParticipantAvatar rsvp={r} size="w-5 h-5" />
              <span className="truncate max-w-[160px]">{participantName(r)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventCard({ event, onRsvpChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [localParticipating, setLocalParticipating] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [shared, setShared] = useState(false);

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

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/agenda/${event.id}`;
    const dateStr = formatDate(event.date);
    const timeStr = formatTime(event.timeStart) + (event.timeEnd ? ` — ${formatTime(event.timeEnd)}` : '');
    const text = `Club Jean Jaures vous invite :\n${event.title}\n${dateStr} a ${timeStr}\n${event.location || ''}\n\nPlus d'infos : ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url });
        return;
      } catch {}
    }
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  const dateObj = new Date(event.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();

  // Liste affichée en tenant compte de la réponse en cours (avant le rafraîchissement)
  const serverHasMe = !!user && (event.rsvps || []).some(r => r.userId === user.id);
  let displayedRsvps = event.rsvps || [];
  if (user && localParticipating && !serverHasMe) {
    displayedRsvps = [{ userId: user.id, user: { email: user.email, member: user.member } }, ...displayedRsvps];
  } else if (user && !localParticipating && serverHasMe) {
    displayedRsvps = displayedRsvps.filter(r => r.userId !== user.id);
  }

  const shortDesc = event.description
    ? event.description.length > 80
      ? event.description.slice(0, 80) + '…'
      : event.description
    : null;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/agenda/${event.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/agenda/${event.id}`); } }}
      aria-label={event.title}
      className="card p-3 sm:p-4 min-w-0 overflow-hidden hover:shadow-md hover:border-blue/30 transition-all cursor-pointer active:scale-[0.99]"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-shrink-0 w-14 h-16 rounded-xl bg-blue-light flex flex-col items-center justify-center leading-none">
          <div className="text-2xl font-bold text-blue">{day}</div>
          <div className="text-[10px] font-semibold text-blue-dark/70 uppercase mt-1 tracking-wide">{month}</div>
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

          {/* Participants + RSVP + Partager */}
          <div className="flex items-center flex-wrap gap-2 mt-3">
            {user && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); if (!localParticipating) handleRsvp(e); }}
                  disabled={rsvpLoading}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    localParticipating
                      ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                  } ${rsvpLoading ? 'opacity-50' : ''}`}
                >
                  ✓ Je participe
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (localParticipating) handleRsvp(e); }}
                  disabled={rsvpLoading}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    !localParticipating
                      ? 'bg-red-50 text-red-500 ring-1 ring-red-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
                  } ${rsvpLoading ? 'opacity-50' : ''}`}
                >
                  ✗ Pas dispo
                </button>
              </div>
            )}
            <button
              onClick={handleShare}
              className="text-xs w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-light hover:text-blue transition-colors flex items-center justify-center"
              aria-label="Partager l'événement"
              title={shared ? 'Lien copié !' : "Partager l'événement"}
            >
              {shared ? (
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              )}
            </button>
          </div>

          <Participants rsvps={displayedRsvps} count={localCount} />
        </div>
      </div>
    </div>
  );
}

export default memo(EventCard);
