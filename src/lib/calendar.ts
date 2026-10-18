/**
 * Downloads a single-event .ics file.
 *
 * <p>Session times are Pakistan local time (PKT, UTC+5, no daylight saving), so they are converted
 * to UTC here rather than leaning on a TZID the learner's calendar app may not know.
 */
export function downloadIcs(event: {
  uid: string;
  title: string;
  description?: string;
  date: string; // 'YYYY-MM-DD'
  start: string; // 'HH:MM' PKT
  end: string; // 'HH:MM' PKT
}) {
  const stamp = (time: string) =>
    new Date(`${event.date}T${time}:00+05:00`).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TopTutor//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${event.uid}@toptutor.pk`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escape(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.uid}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
