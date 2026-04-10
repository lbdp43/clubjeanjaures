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

// Formater une date+heure en format iCal (YYYYMMDDTHHmmSS)
function toCalDateStr(dateStr, time) {
  const d = new Date(dateStr);
  const [h, m] = (time || '00:00').split(':');
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

export function googleCalendarUrl(event) {
  const start = toCalDateStr(event.date, event.timeStart);
  const end = event.timeEnd
    ? toCalDateStr(event.date, event.timeEnd)
    : toCalDateStr(event.date, addHours(event.timeStart, 2));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    location: event.location || '',
    details: event.description || '',
    ctz: 'Europe/Paris'
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookCalendarUrl(event) {
  const start = toISOLocal(event.date, event.timeStart);
  const end = event.timeEnd
    ? toISOLocal(event.date, event.timeEnd)
    : toISOLocal(event.date, addHours(event.timeStart, 2));
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: start,
    enddt: end,
    location: event.location || '',
    body: event.description || ''
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}

function toISOLocal(dateStr, time) {
  const d = new Date(dateStr);
  const [h, m] = (time || '00:00').split(':');
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d.toISOString();
}

function addHours(time, hours) {
  const [h, m] = time.split(':').map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
