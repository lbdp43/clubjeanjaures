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

// Membres « Pas dispo » et « Sans réponse » d'un événement, visibles par tous les membres connectés.
// Un admin peut relancer par mail les membres sans réponse qu'il sélectionne.
export default function EventResponses({ eventId, responses, isAdmin, canRemind, onReminded }) {
  const [openPending, setOpenPending] = useState(false);
  const [openDeclined, setOpenDeclined] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  if (!responses) return null;
  const { pending = [], declined = [] } = responses;

  const startSelecting = () => {
    setSelected(new Set(pending.map(u => u.id)));
    setResult(null);
    setSelecting(true);
    setOpenPending(true);
  };

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = pending.length > 0 && selected.size === pending.length;

  const send = async () => {
    if (!selected.size || sending) return;
    setSending(true);
    setResult(null);
    try {
      const r = await api.remindEvent(eventId, [...selected], message);
      haptic('success');
      setResult({ ok: true, text: `Mail envoyé à ${r.sent} membre${r.sent > 1 ? 's' : ''}${r.sent < r.total ? ` sur ${r.total}` : ''}.` });
      setSelecting(false);
      setMessage('');
      if (onReminded) onReminded();
    } catch (err) {
      setResult({ ok: false, text: err.message || 'Envoi impossible' });
    }
    setSending(false);
  };

  return (
    <>
      <Section title="Sans réponse" count={pending.length} tone="bg-amber-400" open={openPending} onToggle={() => setOpenPending(o => !o)}>
        {pending.length === 0 ? (
          <p className="text-xs text-text-muted">Tout le monde a répondu 🎉</p>
        ) : selecting ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
              <button
                type="button"
                onClick={() => setSelected(allSelected ? new Set() : new Set(pending.map(u => u.id)))}
                className="text-xs text-blue font-medium"
              >
                {allSelected ? 'Tout décocher' : 'Tout cocher'}
              </button>
            </div>
            <ul className="divide-y divide-gray-100 rounded-2xl bg-gray-50 overflow-hidden">
              {pending.map(u => (
                <li key={u.id}>
                  <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggle(u.id)}
                      className="w-5 h-5 rounded accent-blue flex-shrink-0"
                    />
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
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Message personnel ajouté au mail (facultatif)"
              className="input-field text-sm resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={send} disabled={!selected.size || sending} className="btn-primary text-sm flex-1 disabled:opacity-50">
                {sending ? 'Envoi en cours…' : `Envoyer le mail à ${selected.size} membre${selected.size > 1 ? 's' : ''}`}
              </button>
              <button type="button" onClick={() => setSelecting(false)} className="text-sm text-text-muted px-4 py-2">
                Annuler
              </button>
            </div>
            <p className="text-[11px] text-text-muted">
              Le mail leur demande s'ils sont dispo ou pas dispo, avec un lien direct vers l'événement.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pending.map(u => <MemberChip key={u.id} user={u} muted />)}
          </div>
        )}
      </Section>

      {isAdmin && canRemind && pending.length > 0 && !selecting && (
        <button
          type="button"
          onClick={startSelecting}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-dark bg-blue-light hover:bg-blue-light/70 rounded-full px-4 py-2.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Relancer les sans-réponse par mail
        </button>
      )}
      {result && (
        <p className={`mt-2 text-xs ${result.ok ? 'text-green-700' : 'text-red-600'}`}>{result.text}</p>
      )}

      <Section title="Pas dispo" count={declined.length} tone="bg-red-400" open={openDeclined} onToggle={() => setOpenDeclined(o => !o)}>
        {declined.length === 0 ? (
          <p className="text-xs text-text-muted">Personne pour l'instant.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {declined.map(u => <MemberChip key={u.id} user={u} muted />)}
          </div>
        )}
      </Section>
    </>
  );
}
