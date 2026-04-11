const ical = require('ical-generator').default;

function createCalendar(events) {
  const calendar = ical({
    name: 'Club Jean Jaurès',
    timezone: 'Europe/Paris',
    prodId: { company: 'Club Jean Jaurès', product: 'Agenda' },
    ttl: 3600 // Demande aux clients de rafraîchir toutes les heures
  });

  for (const event of events) {
    const [startH, startM] = event.timeStart.split(':').map(Number);
    const start = new Date(event.date);
    start.setHours(startH, startM, 0);

    let end;
    if (event.timeEnd) {
      const [endH, endM] = event.timeEnd.split(':').map(Number);
      end = new Date(event.date);
      end.setHours(endH, endM, 0);
    } else {
      end = new Date(start);
      end.setHours(start.getHours() + 2);
    }

    // Construire la description avec les participants
    let description = event.description || '';
    if (event.rsvps && event.rsvps.length > 0) {
      const participantLines = event.rsvps.map(r => {
        const name = r.user.member?.companyName || r.user.email;
        const job = r.user.member?.jobTitle;
        return job ? `• ${name} — ${job}` : `• ${name}`;
      });
      description += `\n\n👥 ${event.rsvps.length} participant${event.rsvps.length > 1 ? 's' : ''} :\n${participantLines.join('\n')}`;
    }

    calendar.createEvent({
      id: event.id,
      start,
      end,
      summary: event.title,
      description: description.trim(),
      location: event.location
    });
  }

  return calendar;
}

function createSingleEvent(event) {
  return createCalendar([event]);
}

module.exports = { createCalendar, createSingleEvent };
