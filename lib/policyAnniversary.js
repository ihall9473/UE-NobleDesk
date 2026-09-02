// A policy's anniversary recurs every year on the month/day it was
// submitted (mirrors the "policy_anniversary" occasion logic), but here we
// just need days-until-next-anniversary for the Alerts page - not whether
// today is an exact match.
export function daysUntilAnniversary(applicationSubmittedDate) {
  if (!applicationSubmittedDate) return null;
  const submitted = new Date(applicationSubmittedDate + "T00:00:00");
  if (isNaN(submitted.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = new Date(today.getFullYear(), submitted.getMonth(), submitted.getDate());
  if (next < today) {
    next = new Date(today.getFullYear() + 1, submitted.getMonth(), submitted.getDate());
  }

  const yearsAt = next.getFullYear() - submitted.getFullYear();
  if (yearsAt < 1) return null; // hasn't reached its first anniversary yet

  const daysUntil = Math.round((next - today) / 86400000);
  return { daysUntil, years: yearsAt };
}
