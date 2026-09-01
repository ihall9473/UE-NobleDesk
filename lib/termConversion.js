// term_conversion_deadline is a fixed, one-time date (unlike draft_date,
// this never recurs) - the last day a term policy can still be converted
// to permanent coverage. Missing it loses the client's option for good.
export function daysUntilConversion(deadline) {
  if (!deadline) return null;
  const parsed = new Date(deadline + "T00:00:00");
  if (isNaN(parsed.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((parsed - today) / 86400000);
}
