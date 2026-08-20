import Twilio from "twilio";

// Builds a Twilio client using ONE PERSON's own account credentials, so
// their texts (and the bill for them) are entirely theirs - never a
// shared company account.
export function twilioClientFor(profile) {
  if (!profile?.twilio_account_sid || !profile?.twilio_auth_token) {
    return null;
  }
  return Twilio(profile.twilio_account_sid, profile.twilio_auth_token);
}

// Normalizes a phone number to E.164 format (+1XXXXXXXXXX) for US numbers.
export function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+")) return raw;
  return `+${digits}`;
}
