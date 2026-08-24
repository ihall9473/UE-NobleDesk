// draft_date is stored as a one-time date (e.g. "2024-03-15"), but premium
// drafts actually recur monthly on that same day-of-month. This finds the
// next upcoming draft so agents can get ahead of an NSF/lapse before it
// happens, instead of finding out after the fact.
export function nextDraftInfo(draftDate) {
  if (!draftDate) return null;
  const parsed = new Date(draftDate + "T00:00:00");
  if (isNaN(parsed.getTime())) return null;

  const day = parsed.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = new Date(today.getFullYear(), today.getMonth(), day);
  if (next < today) {
    next = new Date(today.getFullYear(), today.getMonth() + 1, day);
  }

  const daysUntil = Math.round((next - today) / 86400000);
  return { nextDate: next, daysUntil };
}
