import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatTime, getEventBadgeClass, getEventTypeLabel, googleCalendarUrl, outlookCalendarUrl, mapsUrl } from '../utils/helpers';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [participating, setParticipating] = useState(false);
  const [rsvps, setRsvps] = useState([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    api.getEvent(id).then(data => {
      setEvent(data);
      setForm({
        title: data.title || '',
        type: data.type || 'matinale',
        date: data.date ? data.date.slice(0, 10) : '',
        timeStart: data.timeStart || '',
        timeEnd: data.timeEnd || '',
        location: data.location || '',
        description: data.description || '',
        speaker: data.speaker || ''
      });
    }).catch(() => {}).finally(() => setLoading(false));

    // After fetching event, fetch RSVPs
    api.getEventRsvps(id).then(data => {
      setRsvps(data);
      if (user) {
        setParticipating(data.some(r => r.user.id === user.id));
      }
    }).catch(() => {});
  }, [id]);

  const handleRsvp = async () => {
    if (!user) return;
    setRsvpLoading(true);
    try {
      const result = await api.toggleRsvp(event.id);
      setParticipating(result.participating);
      // Refresh RSVP list
      const data = await api.getEventRsvps(event.id);
      setRsvps(data);
    } catch (err) {}
    setRsvpLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const updated = await api.updateEvent(id, form);
      setEvent(updated);
      setEditing(false);
      setMsg('Modifications enregistrées.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(`Erreur : ${err.message}`);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await api.deleteEvent(id);
      navigate('/agenda');
    } catch (err) {
      setMsg(`Erreur : ${err.message}`);
    }
  };

  const buildShareText = () => {
    if (!event) return '';
    const dateStr = formatDate(event.date);
    const timeStr = formatTime(event.timeStart) + (event.timeEnd ? ` — ${formatTime(event.timeEnd)}` : '');
    const url = `${window.location.origin}/agenda/${event.id}`;
    return `Club Jean Jaures vous invite :\n${event.title}\n${dateStr} a ${timeStr}\n${event.location}\n\nPlus d'infos : ${url}`;
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Invitation : ${event.title} — Club Jean Jaures`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildShareText())}`;
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: buildShareText(),
          url: `${window.location.origin}/agenda/${event.id}`
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/agenda/${event.id}`);
      setShareMsg('Lien copie !');
      setTimeout(() => setShareMsg(''), 2000);
    } catch {}
  };

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

      {msg && (
        <p className={`text-sm ${msg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>
      )}

      {/* Mode édition admin */}
      {editing ? (
        <form onSubmit={handleSave} className="card p-3 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base sm:text-lg text-blue-dark">Modifier l'événement</h2>
            <button type="button" onClick={() => setEditing(false)} className="text-xs sm:text-sm text-text-muted hover:text-text-main">
              Annuler
            </button>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium mb-1">Titre *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field text-sm" required />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field text-sm">
                <option value="matinale">Matinale</option>
                <option value="afterwork">Afterwork</option>
                <option value="formation">Formation</option>
                <option value="conference">Conférence</option>
                <option value="special">Spécial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field text-sm" required />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Heure début *</label>
              <input type="time" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} className="input-field text-sm" required />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Heure fin</label>
              <input type="time" value={form.timeEnd} onChange={e => setForm({...form, timeEnd: e.target.value})} className="input-field text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium mb-1">Lieu / Adresse *</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input-field text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field text-sm resize-none" rows={3} />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Intervenant(s)</label>
            <input value={form.speaker} onChange={e => setForm({...form, speaker: e.target.value})} className="input-field text-sm" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button type="submit" className="btn-primary text-sm w-full sm:w-auto" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={handleDelete} className="btn-danger text-sm py-2 px-4 w-full sm:w-auto">
              Supprimer
            </button>
          </div>
        </form>
      ) : (
        /* Mode lecture */
        <div className="card p-3 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className={getEventBadgeClass(event.type)}>
              {getEventTypeLabel(event.type)}
            </span>
            {isAdmin && (
              <button onClick={() => setEditing(true)} className="text-xs sm:text-sm text-blue hover:underline flex items-center gap-1 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Modifier
              </button>
            )}
          </div>

          <h1 className="font-display text-xl sm:text-2xl text-blue-dark mt-3 mb-4">{event.title}</h1>

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

            <a
              href={mapsUrl(event.location)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:text-blue transition-colors group"
            >
              <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="group-hover:underline break-words min-w-0">{event.location}</span>
              <svg className="w-4 h-4 text-text-muted group-hover:text-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>

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

          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs sm:text-sm font-medium text-text-muted mb-3">Ajouter à mon agenda</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-blue text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Agenda
              </a>
              <a
                href={outlookCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-blue text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.588.234h-8.652v-12.14h8.652c.23 0 .425.076.588.23A.774.774 0 0124 7.387zM13.727 20.794H1.455c-.4 0-.741-.14-1.023-.418A1.371 1.371 0 010 19.38V5.873c0-.398.144-.738.432-1.02a1.399 1.399 0 011.023-.417h12.272v16.358zM9.818 9.164a3.427 3.427 0 00-1.553-1.14 3.424 3.424 0 00-1.351-.268c-.944 0-1.753.345-2.427 1.035-.674.69-1.01 1.556-1.01 2.6 0 1.07.33 1.95.99 2.637.66.688 1.484 1.032 2.47 1.032.928 0 1.702-.318 2.322-.953.62-.636.93-1.45.93-2.444 0-.15-.012-.35-.035-.6H6.578v1.2h2.128c-.1.41-.335.74-.703.993a2.054 2.054 0 01-1.157.334c-.656 0-1.19-.22-1.603-.664-.413-.443-.62-1.016-.62-1.72 0-.67.215-1.227.645-1.67.43-.443.968-.665 1.614-.665.533 0 .98.162 1.34.488l1.596-.145z"/>
                </svg>
                Outlook
              </a>
              <a
                href={`/api/events/${event.id}/ics`}
                download
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-blue text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Apple / Autre (.ics)
              </a>
            </div>
          </div>

          {/* Partager */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs sm:text-sm font-medium text-text-muted mb-3">Partager l'événement</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
              <button
                onClick={handleShareEmail}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-blue text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Email
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-blue text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.136-3.68a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" />
                </svg>
                {shareMsg || 'Copier le lien'}
              </button>
              {typeof navigator.share === 'function' && (
                <button
                  onClick={handleShareNative}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-blue text-sm px-4 py-2.5 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Autres...
                </button>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm font-medium text-text-muted">
                {rsvps.length} participant{rsvps.length !== 1 ? 's' : ''}
              </p>
              {user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (!participating) handleRsvp(); }}
                    disabled={rsvpLoading}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      participating
                        ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                        : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    {rsvpLoading ? '...' : '✓ Je participe'}
                  </button>
                  <button
                    onClick={() => { if (participating) handleRsvp(); }}
                    disabled={rsvpLoading}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      !participating
                        ? 'bg-red-50 text-red-500 ring-1 ring-red-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    {rsvpLoading ? '...' : '✗ Je ne peux pas'}
                  </button>
                </div>
              )}
            </div>
            {rsvps.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {rsvps.map(r => (
                  <div key={r.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                    {r.user.member?.photoUrl ? (
                      <img src={r.user.member.photoUrl} alt={r.user.member?.companyName || ''} loading="lazy" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-light flex items-center justify-center text-xs text-blue font-bold">
                        {(r.user.member?.companyName || r.user.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-text-main">{r.user.member?.companyName || r.user.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
