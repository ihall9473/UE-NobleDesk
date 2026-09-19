// Normalizes a phone number to E.164 format (+1XXXXXXXXXX) for US numbers.
// Provider-neutral - used everywhere a phone number gets stored, not just
// for texting.
export function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+")) return raw;
  return `+${digits}`;
}
