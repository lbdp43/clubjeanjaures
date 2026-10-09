import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
import { personName } from '../../utils/helpers';
import { haptic } from '../../utils/haptics';

const nameOf = (u) => u.member?.companyName || u.email;

const OPTIONS = [
  { value: 'going', label: 'Inscrit', on: 'bg-green-600 text-white' },
  { value: 'declined', label: 'Pas dispo', on: 'bg-red-500 text-white' },
  { value: null, label: 'Sans réponse', on: 'bg-gray-500 text-white' }
];

// Admin : inscrire, marquer « pas dispo » ou remettre « sans réponse » n'importe quel membre pour un événement
export default function AdminRsvpManager({ eventId, onChange }) {
  const [people, setPeople] = useState(null); // [{ ...user, status }]
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setError('');
    try {
      const r = await api.getEventResponses(eventId);
      setPeople([
        ...(r.going || []).map(u => ({ ...u, status: 'going' })),
        ...(r.declined || []).map(u => ({ ...u, status: 'declined' })),
        ...(r.pending || []).map(u => ({ ...u, status: null }))
      ].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fr', { sensitivity: 'base' })));
    } catch (err) {
      setError(err.message || 'Chargement impossible');
    }
  };

  useEffect(() => { load(); }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c = { going: 0, declined: 0, none: 0 };
    (people || []).forEach(p => { c[p.status || 'none']++; });
    return c;
  }, [people]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people || [];
    return (people || []).filter(p => `${nameOf(p)} ${p.email}`.toLowerCase().includes(q));
  }, [people, query]);

  const setStatus = async (person, status) => {
    if (busy || person.status === status) return;
    const before = person.status;
    haptic(status === 'going' ? 'success' : 'light');
    setBusy(person.id);
    setPeople(prev => prev.map(p => (p.id === person.id ? { ...p, status } : p)));
    try {
      await api.adminSetRsvp(eventId, person.id, status);
      if (onChange) onChange();
    } catch (err) {
      setPeople(prev => prev.map(p => (p.id === person.id ? { ...p, status: before } : p)));
      setError(`${nameOf(person)} : ${err.message || 'modification impossible'}`);
    }
    setBusy(null);
  };

  if (!people && !error) {
    return <div className="flex justify-center py-6"><div className="animate-spin w-6 h-6 border-4 border-blue border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />{counts.going} inscrit{counts.going > 1 ? 's' : ''}</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1.5" />{counts.declined} pas dispo</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />{counts.none} sans réponse</span>
      </div>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher un membre…"
        className="input-field text-sm"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <ul className="rounded-2xl bg-gray-50 divide-y divide-gray-100 overflow-hidden">
        {shown.map(p => (
          <li key={p.id} className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-text-main truncate">
                {nameOf(p)}
                {p.status === 'going' && p.guests > 0 && (
                  <span className="ml-1.5 text-[11px] font-semibold text-blue">+{p.guests} invité{p.guests > 1 ? 's' : ''}{p.guestNames ? ` (${p.guestNames})` : ''}</span>
                )}
              </span>
              <span className="block text-[11px] text-text-muted truncate">{[personName(p.member), p.email].filter(Boolean).join(' · ')}</span>
            </span>
            <div className={`flex rounded-full bg-white ring-1 ring-gray-200 p-0.5 flex-shrink-0 ${busy === p.id ? 'opacity-60' : ''}`} role="radiogroup" aria-label={`Réponse de ${nameOf(p)}`}>
              {OPTIONS.map(o => {
                const active = p.status === o.value;
                return (
                  <button
                    key={o.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!!busy}
                    onClick={() => setStatus(p, o.value)}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${active ? o.on : 'text-text-muted hover:bg-gray-100'}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
        {shown.length === 0 && <li className="px-3 py-4 text-xs text-text-muted text-center">Aucun membre trouvé.</li>}
      </ul>
      <p className="text-[11px] text-text-muted">
        Les changements sont enregistrés immédiatement. Le membre n'est pas prévenu.
      </p>
    </div>
  );
}
