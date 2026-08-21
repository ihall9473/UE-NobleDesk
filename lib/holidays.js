// Every calendar holiday and all the date math lives here in one place -
// nothing split out into separate files.

// --- Date calculation ---------------------------------------------------

// Computes the month/day of Easter Sunday for a given year, using the
// standard "Anonymous Gregorian" algorithm.
export function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// Computes the month/day for a "floating" holiday - one defined as, e.g.,
// "the 4th Thursday of November" (Thanksgiving) rather than a fixed date.
// weekday: 0=Sunday..6=Saturday. occurrence: 1-4 for "the Nth one", or -1
// for "the last one in the month".
export function getFloatingHolidayDate(year, month, weekday, occurrence) {
  if (occurrence === -1) {
    const lastDay = new Date(year, month, 0);
    const diff = (lastDay.getDay() - weekday + 7) % 7;
    const day = lastDay.getDate() - diff;
    return { month, day };
  }
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekdayOffset = (weekday - firstOfMonth.getDay() + 7) % 7;
  const day = 1 + firstWeekdayOffset + (occurrence - 1) * 7;
  return { month, day };
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const OCCURRENCE_LABELS = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", "-1": "last" };

// --- Every calendar holiday, in one list ---------------------------------
// kind: 'fixed' (set month/day), 'easter' (calculated), 'floating'
// (Nth weekday of a month), or 'birthday' (per-contact, no date here).
export const ALL_HOLIDAYS = [
  { name: "Birthday", kind: "birthday", enabled: true, message: "Happy birthday, {first_name}! Hope you have a great one. 🎉" },
  { name: "New Year's Day", kind: "fixed", month: 1, day: 1, enabled: true, message: "Happy New Year, {first_name}! Wishing you all the best in the year ahead." },
  { name: "Martin Luther King Jr. Day", kind: "floating", month: 1, weekday: 1, occurrence: 3, enabled: true, message: "Thinking of you on MLK Day, {first_name}." },
  { name: "Valentine's Day", kind: "fixed", month: 2, day: 14, enabled: true, message: "Happy Valentine's Day, {first_name}!" },
  { name: "Presidents Day", kind: "floating", month: 2, weekday: 1, occurrence: 3, enabled: true, message: "Happy Presidents Day, {first_name}!" },
  { name: "St. Patrick's Day", kind: "fixed", month: 3, day: 17, enabled: true, message: "Happy St. Patrick's Day, {first_name}!" },
  { name: "Easter", kind: "easter", enabled: true, message: "Happy Easter, {first_name}! Hope you have a great day." },
  { name: "Mother's Day", kind: "floating", month: 5, weekday: 0, occurrence: 2, enabled: true, message: "Happy Mother's Day, {first_name}!" },
  { name: "Memorial Day", kind: "floating", month: 5, weekday: 1, occurrence: -1, enabled: true, message: "Thinking of you this Memorial Day, {first_name}." },
  { name: "Juneteenth", kind: "fixed", month: 6, day: 19, enabled: true, message: "Happy Juneteenth, {first_name}!" },
  { name: "Father's Day", kind: "floating", month: 6, weekday: 0, occurrence: 3, enabled: true, message: "Happy Father's Day, {first_name}!" },
  { name: "Independence Day", kind: "fixed", month: 7, day: 4, enabled: true, message: "Happy 4th of July, {first_name}!" },
  { name: "Labor Day", kind: "floating", month: 9, weekday: 1, occurrence: 1, enabled: true, message: "Happy Labor Day, {first_name}!" },
  { name: "Columbus Day", kind: "floating", month: 10, weekday: 1, occurrence: 2, enabled: true, message: "Happy Columbus Day, {first_name}!" },
  { name: "Halloween", kind: "fixed", month: 10, day: 31, enabled: true, message: "Happy Halloween, {first_name}!" },
  { name: "Veterans Day", kind: "fixed", month: 11, day: 11, enabled: true, message: "Thank you and happy Veterans Day, {first_name}." },
  { name: "Thanksgiving", kind: "floating", month: 11, weekday: 4, occurrence: 4, enabled: true, message: "Happy Thanksgiving, {first_name}! Grateful for you." },
  { name: "Christmas Eve", kind: "fixed", month: 12, day: 24, enabled: true, message: "Merry Christmas Eve, {first_name}!" },
  { name: "Christmas", kind: "fixed", month: 12, day: 25, enabled: true, message: "Merry Christmas, {first_name}! Wishing you and your family a wonderful holiday." },
  { name: "New Year's Eve", kind: "fixed", month: 12, day: 31, enabled: true, message: "Happy New Year's Eve, {first_name}!" },
];

// Given a holiday entry and a year, returns its { month, day } for that
// year. Birthdays return null since they're per-contact, not a shared date.
export function resolveHolidayDate(holiday, year) {
  if (holiday.kind === "fixed") return { month: holiday.month, day: holiday.day };
  if (holiday.kind === "easter") return getEasterDate(year);
  if (holiday.kind === "floating") return getFloatingHolidayDate(year, holiday.month, holiday.weekday, holiday.occurrence);
  return null; // birthday
}
