import { useState } from 'react';
import { api } from '../../utils/api';
import { imgUrl } from '../../utils/helpers';
import { haptic } from '../../utils/haptics';
import Collapse from '../ui/Collapse';

const nameOf = (u) => u.member?.companyName || u.email;

// Relances reçues pour cet événement (renseigné seulement pour les admins)
function reminderLabel(r) {
  if (!r) return null;
  if (!r.count) return 'Jamais relancé';
  const last = r.last ? new Date(r.last).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;
  return `${r.count} relance${r.count > 1 ? 's' : ''}${last ? ` · dernière le ${last}` : ''}`;
}

function ReminderBadge({ reminders }) {
  if (!reminders) return null;
  const n = reminders.count;
  return (
    <span
      title={reminderLabel(reminders)}
      className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${n ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-500'}`}
    >
      {n ? `${n} relance${n > 1 ? 's' : ''}` : '0 relance'}
    </span>
  );
}

function MemberChip({ user, muted }) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${muted ? 'bg-gray-50 opacity-80' : 'bg-gray-50'}`}>
      {user.member?.photoUrl ? (
        <img src={imgUrl(user.member.photoUrl, 200)} alt="" loading="lazy" className={`w-6 h-6 rounded-full object-cover ${muted ? 'grayscale' : ''}`} />
      ) : (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
          {nameOf(user)[0]?.toUpperCase()}
        </div>
      )}
      <span className="text-xs text-text-main">{nameOf(user)}</span>
      <ReminderBadge reminders={user.reminders} />
    </div>
  );
}

function Section({ title, count, tone, open, onToggle, children }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-3 text-left">
        <span className="text-xs sm:text-sm font-medium text-text-muted flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tone}`} />
          {title} <span className="text-text-main font-semibold">{count}</span>
        </span>
        <span className="w-7 h-7 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center text-blue-dark">
          <svg className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      <Collapse open={open}>
        <div className="pt-3">{children}</div>
      </Collapse>
    </div>
  );
}

const GROUPS = [
  { key: 'pending', label: 'Sans réponse', dot: 'bg-amber-400' },
  { key: 'declined', label: 'Pas dispo', dot: 'bg-red-400' },
  { key: 'going', label: 'Inscrits', dot: 'bg-green-500' }
];

const EMAIL_HINT = {
  pending: 'on leur demande s\'ils sont dispo ou pas dispo',
  declined: 'on leur rappelle qu\'ils peuvent encore s\'inscrire',
  going: 'on leur rappelle l\'événement et les infos pratiques'
};

// Panneau admin : choisir à qui envoyer la relance (tout le monde, un groupe ou une sélection à la main)
function RemindPanel({ eventId, responses, onClose, onSent }) {
  const [selected, setSelected] = useState(() => new Set(responses.pending.map(u => u.id)));
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const everyone = GROUPS.flatMap(g => responses[g.key] || []);
  const ids = (key) => (responses[key] || []).map(u => u.id);
  const groupState = (key) => {
    const list = ids(key);
    const n = list.filter(id => selected.has(id)).length;
    return n === 0 ? 'none' : n === list.length ? 'all' : 'some';
  };

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleGroup = (key) => setSelected(prev => {
    const next = new Set(prev);
    const list = ids(key);
    if (groupState(key) === 'all') list.forEach(id => next.delete(id));
    else list.forEach(id => next.add(id));
    return next;
  });

  const presets = [
    { label: 'Tout le monde', apply: () => setSelected(new Set(everyone.map(u => u.id))) },
    { label: 'Sans réponse', apply: () => setSelected(new Set(ids('pending'))) },
    { label: 'Personne', apply: () => setSelected(new Set()) }
  ];

  const send = async () => {
    if (!selected.size || sending) return;
    setSending(true);
    setError('');
    try {
      const r = await api.remindEvent(eventId, [...selected], message);
      haptic('success');
      onSent(`Mail envoyé à ${r.sent} membre${r.sent > 1 ? 's' : ''}${r.sent < r.total ? ` sur ${r.total}` : ''}.`);
    } catch (err) {
      setError(err.message || 'Envoi impossible');
    }
    setSending(false);
  };

  const chosenGroups = GROUPS.filter(g => groupState(g.key) !== 'none');

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-blue-dark">Envoyer une relance par mail</p>
        <button type="button" onClick={onClose} className="text-xs text-text-muted">Fermer</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map(p => (
          <button key={p.label} type="button" onClick={p.apply}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-light text-blue-dark hover:bg-blue-light/70 transition-colors">
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-gray-50 overflow-hidden divide-y divide-gray-100">
        {GROUPS.map(g => {
          const list = responses[g.key] || [];
          if (!list.length) return null;
          const state = groupState(g.key);
          return (
            <div key={g.key}>
              <label className="flex items-center gap-3 px-3 py-2 bg-gray-100/80 cursor-pointer">
                <input type="checkbox" checked={state === 'all'} ref={el => { if (el) el.indeterminate = state === 'some'; }}
                  onChange={() => toggleGroup(g.key)} className="w-5 h-5 rounded accent-blue flex-shrink-0" />
                <span className={`w-2 h-2 rounded-full ${g.dot}`} />
                <span className="text-xs font-semibold text-text-main flex-1">{g.label}</span>
                <span className="text-xs text-text-muted">{list.filter(u => selected.has(u.id)).length}/{list.length}</span>
              </label>
              <ul className="divide-y divide-gray-100">
                {list.map(u => (
                  <li key={u.id}>
                    <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)}
                        className="w-5 h-5 rounded accent-blue flex-shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-text-main truncate">{nameOf(u)}</span>
                        <span className="block text-[11px] text-text-muted truncate">{u.email}</span>
                      </span>
                      {u.reminders && (
                        <span className={`text-[11px] text-right flex-shrink-0 max-w-[40%] ${u.reminders.count ? 'text-amber-700' : 'text-text-muted'}`}>
                          {reminderLabel(u.reminders)}
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} maxLength={1000}
        placeholder="Message personnel ajouté au mail (facultatif)" className="input-field text-sm resize-none" />

      {chosenGroups.length > 0 && (
        <ul className="text-[11px] text-text-muted space-y-0.5">
          {chosenGroups.map(g => <li key={g.key}>• {g.label} : {EMAIL_HINT[g.key]}.</li>)}
        </ul>
      )}

      <button type="button" onClick={send} disabled={!selected.size || sending} className="btn-primary text-sm w-full disabled:opacity-50">
        {sending ? 'Envoi en cours…' : selected.size ? `Envoyer le mail à ${selected.size} membre${selected.size > 1 ? 's' : ''}` : 'Sélectionnez au moins un membre'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Membres « Sans réponse » et « Pas dispo » d'un événement, visibles par tous les membres.
// Un admin peut envoyer une relance par mail à tout le monde ou à une sélection.
export default function EventResponses({ eventId, responses, isAdmin, canRemind, onReminded }) {
  const [openPending, setOpenPending] = useState(false);
  const [openDeclined, setOpenDeclined] = useState(false);
  const [panel, setPanel] = useState(false);
  const [result, setResult] = useState('');

  if (!responses) return null;
  const { pending = [], declined = [] } = responses;
  const total = pending.length + declined.length + (responses.going?.length || 0);

  return (
    <>
      <Section title="Sans réponse" count={pending.length} tone="bg-amber-400" open={openPending} onToggle={() => setOpenPending(o => !o)}>
        {pending.length === 0 ? (
          <p className="text-xs text-text-muted">Tout le monde a répondu 🎉</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pending.map(u => <MemberChip key={u.id} user={u} muted />)}
          </div>
        )}
      </Section>

      <Section title="Pas dispo" count={declined.length} tone="bg-red-400" open={openDeclined} onToggle={() => setOpenDeclined(o => !o)}>
        {declined.length === 0 ? (
          <p className="text-xs text-text-muted">Personne pour l'instant.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {declined.map(u => <MemberChip key={u.id} user={u} muted />)}
          </div>
        )}
      </Section>

      {isAdmin && canRemind && total > 0 && (
        panel ? (
          <RemindPanel
            eventId={eventId}
            responses={{ going: [], ...responses }}
            onClose={() => setPanel(false)}
            onSent={(text) => { setResult(text); setPanel(false); if (onReminded) onReminded(); }}
          />
        ) : (
          <button
            type="button"
            onClick={() => { setResult(''); setPanel(true); }}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-dark bg-blue-light hover:bg-blue-light/70 rounded-full px-4 py-2.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Envoyer une relance par mail
          </button>
        )
      )}
      {result && <p className="mt-2 text-xs text-green-700">{result}</p>}
    </>
  );
}
