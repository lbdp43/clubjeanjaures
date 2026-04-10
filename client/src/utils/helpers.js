export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

export function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatTime(time) {
  if (!time) return '';
  return time.replace(':', 'h');
}

export function getEventBadgeClass(type) {
  const classes = {
    matinale: 'badge-matinale',
    afterwork: 'badge-afterwork',
    formation: 'badge-formation',
    conference: 'badge-conference',
    special: 'badge-special'
  };
  return classes[type] || 'badge';
}

export function getEventTypeLabel(type) {
  const labels = {
    matinale: 'Matinale',
    afterwork: 'Afterwork',
    formation: 'Formation',
    conference: 'Conférence',
    special: 'Spécial'
  };
  return labels[type] || type;
}

export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
  return formatShortDate(dateStr);
}

export function whatsappLink(phone) {
  const cleaned = phone.replace(/[\s.-]/g, '').replace(/^0/, '33');
  return `https://wa.me/${cleaned}`;
}
