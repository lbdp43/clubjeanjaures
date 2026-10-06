import { useEffect, useState } from 'react';
import { haptic } from '../../utils/haptics';

const MAX = 5;

// Case « Je viens avec un invité » (+ nombre, + noms facultatifs en version complète).
// onSave(guests, guestNames) est appelé à chaque changement validé.
export default function GuestPicker({ guests = 0, guestNames = '', onSave, compact = false, disabled = false }) {
  const [names, setNames] = useState(guestNames || '');
  useEffect(() => { setNames(guestNames || ''); }, [guestNames]);

  const set = (n) => {
    const v = Math.min(Math.max(n, 0), MAX);
    if (v === guests) return;
    haptic('selection');
    onSave(v, v ? names : '');
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div className={compact ? 'mt-2' : 'mt-3'} onClick={stop}>
      <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-text-main">
          <input
            type="checkbox"
            checked={guests > 0}
            disabled={disabled}
            onChange={(e) => set(e.target.checked ? 1 : 0)}
            className="w-4 h-4 rounded accent-blue"
          />
          Je viens avec un invité
        </label>
        {guests > 0 && (
          <div className="inline-flex items-center rounded-full bg-white ring-1 ring-gray-200 text-xs">
            <button type="button" aria-label="Un invité de moins" disabled={disabled} onClick={() => set(guests - 1)}
              className="w-7 h-7 rounded-full text-blue-dark font-bold hover:bg-gray-100 disabled:opacity-40">−</button>
            <span className="px-1.5 font-semibold text-text-main whitespace-nowrap">{guests} invité{guests > 1 ? 's' : ''}</span>
            <button type="button" aria-label="Un invité de plus" disabled={disabled || guests >= MAX} onClick={() => set(guests + 1)}
              className="w-7 h-7 rounded-full text-blue-dark font-bold hover:bg-gray-100 disabled:opacity-40">+</button>
          </div>
        )}
      </div>
      {!compact && guests > 0 && (
        <input
          type="text"
          value={names}
          maxLength={200}
          disabled={disabled}
          onChange={(e) => setNames(e.target.value)}
          onBlur={() => { if ((names || '') !== (guestNames || '')) onSave(guests, names); }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          placeholder={guests > 1 ? 'Noms des invités (facultatif)' : "Nom de l'invité (facultatif)"}
          className="input-field text-sm mt-2"
        />
      )}
    </div>
  );
}
