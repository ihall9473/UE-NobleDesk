// Returns { start, end } as 'YYYY-MM-DD' strings for a given preset, or
// null for "all time" (no filtering). Comparing dates as plain strings
// avoids timezone headaches since application_submitted_date is stored
// as a plain date, not a timestamp.

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Monday of the week containing `date` (week runs Monday-Sunday).
function mondayOf(date) {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

export const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "thisWeek", label: "This Week (Mon–Sun)" },
  { value: "lastWeek", label: "Last Week (Mon–Sun)" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "past30", label: "Past 30 Days" },
  { value: "past90", label: "Past 90 Days" },
  { value: "ytd", label: "Year to Date" },
  { value: "customDate", label: "Custom Date" },
  { value: "customRange", label: "Custom Date Range" },
];

export function getDateRange(preset, customDate, customStart, customEnd) {
  const today = new Date();

  switch (preset) {
    case "today": {
      const iso = toISODate(today);
      return { start: iso, end: iso };
    }
    case "thisWeek": {
      const monday = mondayOf(today);
      return { start: toISODate(monday), end: toISODate(addDays(monday, 6)) };
    }
    case "lastWeek": {
      const thisMonday = mondayOf(today);
      const lastMonday = addDays(thisMonday, -7);
      return { start: toISODate(lastMonday), end: toISODate(addDays(lastMonday, 6)) };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: toISODate(start), end: toISODate(end) };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toISODate(start), end: toISODate(end) };
    }
    case "past30": {
      return { start: toISODate(addDays(today, -29)), end: toISODate(today) };
    }
    case "past90": {
      return { start: toISODate(addDays(today, -89)), end: toISODate(today) };
    }
    case "ytd": {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start: toISODate(start), end: toISODate(today) };
    }
    case "customDate": {
      return customDate ? { start: customDate, end: customDate } : null;
    }
    case "customRange": {
      return customStart && customEnd ? { start: customStart, end: customEnd } : null;
    }
    default:
      return null; // "all"
  }
}
