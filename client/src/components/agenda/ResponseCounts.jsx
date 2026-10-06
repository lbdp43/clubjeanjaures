// Les 3 réponses d'un événement : participent / ne participent pas / pas encore répondu (membres validés)
// serverStatus / localStatus : réponse de l'utilisateur côté serveur et affichée, pour ajuster sans attendre
export function adjustCounts(counts, serverStatus, localStatus) {
  if (!counts || serverStatus === localStatus) return counts;
  const c = { ...counts };
  const key = (s) => (s === 'going' ? 'going' : s === 'declined' ? 'declined' : 'pending');
  c[key(serverStatus)] = Math.max((c[key(serverStatus)] || 0) - 1, 0);
  c[key(localStatus)] = (c[key(localStatus)] || 0) + 1;
  return c;
}

export default function ResponseCounts({ counts, className = '' }) {
  if (!counts) return null;
  const items = [
    { n: counts.going, label: counts.going > 1 ? 'participent' : 'participe', dot: 'bg-green-500' },
    { n: counts.declined, label: counts.declined > 1 ? 'ne participent pas' : 'ne participe pas', dot: 'bg-red-400' },
    { n: counts.pending, label: counts.pending > 1 ? "n'ont pas répondu" : "n'a pas répondu", dot: 'bg-amber-400' }
  ];
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1 text-[11px] sm:text-xs text-text-muted ${className}`}>
      {items.map(i => (
        <span key={i.label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className={`w-2 h-2 rounded-full ${i.dot}`} aria-hidden="true" />
          <span className="font-semibold text-text-main">{i.n}</span> {i.label}
        </span>
      ))}
    </div>
  );
}
