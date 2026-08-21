// Maps each state to its primary IANA timezone. A handful of states span
// more than one zone (FL panhandle, western TX, eastern OR, etc.) - this
// picks the zone covering the majority of that state's population, since a
// single per-contact zone needs one answer. Good enough for "don't text
// before 8am/after 8pm" purposes; not meant to be perfectly precise for
// every county.
export const STATE_TIMEZONES = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  DC: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  ID: "America/Denver",
  IL: "America/Chicago",
  IN: "America/New_York",
  IA: "America/Chicago",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/New_York",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  MT: "America/Denver",
  NE: "America/Chicago",
  NV: "America/Los_Angeles",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NY: "America/New_York",
  NC: "America/New_York",
  ND: "America/Chicago",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VT: "America/New_York",
  VA: "America/New_York",
  WA: "America/Los_Angeles",
  WV: "America/New_York",
  WI: "America/Chicago",
  WY: "America/Denver",
};

// Groups states by their timezone - handy for a "grouped by timezone"
// display anywhere in the app.
export function groupStatesByTimezone() {
  const groups = {};
  for (const [state, tz] of Object.entries(STATE_TIMEZONES)) {
    if (!groups[tz]) groups[tz] = [];
    groups[tz].push(state);
  }
  return groups;
}

// Returns the current local hour (0-23) for a given state, or null if the
// state isn't recognized. Used to enforce "no automated texts before 8am or
// after 8pm" in that state's own local time.
export function currentLocalHourForState(state) {
  const tz = STATE_TIMEZONES[state];
  if (!tz) return null;
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  return parseInt(hourStr, 10) % 24;
}

// The actual quiet-hours rule: true if it's currently NOT okay to send an
// automated text to someone in this state (i.e. before 8am or at/after 8pm
// local time). Unknown state = treated as safe to send (no state on file to
// check against).
export function isQuietHoursForState(state) {
  const hour = currentLocalHourForState(state);
  if (hour === null) return false;
  return hour < 8 || hour >= 20;
}
