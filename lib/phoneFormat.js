// Formats a phone number as the user types it, e.g. "5551234567" -> "555-123-4567".
// Purely a display helper - the server still normalizes to E.164 separately.
export function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
