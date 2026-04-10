const ical = require('ical-generator').default;

function createCalendar(events) {
  const calendar = ical({
    name: 'Club Jean Jaurès',
    timezone: 'Europe/Paris',
    prodId: { company: 'Club Jean Jaurès', product: 'Agenda' }
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

    calendar.createEvent({
      id: event.id,
      start,
      end,
      summary: event.title,
      description: event.description || '',
      location: event.location,
      organizer: { name: 'Club Jean Jaurès' }
    });
  }

  return calendar;
}

function createSingleEvent(event) {
  return createCalendar([event]);
}

module.exports = { createCalendar, createSingleEvent };
