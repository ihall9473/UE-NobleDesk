// Renders any date-only value (from a plain "date" column - effective_date,
// application_submitted_date, draft_date, date_of_birth, etc.) as
// MM/DD/YYYY. Parses the "YYYY-MM-DD" string directly instead of going
// through the Date object, since new Date("YYYY-MM-DD") parses as UTC
// midnight and can shift a day off in negative-UTC-offset timezones.
export function formatDate(value) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, y, m, d] = match;
    return `${m}/${d}/${y}`;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// For real timestamps (created_at, etc.) where the local time-of-day
// matters and a genuine Date conversion (not a string split) is correct.
export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${mm}/${dd}/${d.getFullYear()}, ${time}`;
}
