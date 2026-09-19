const SEND_SMS_URL = "https://mandrillapp.com/api/1.1/messages/send-sms";

// Mailchimp Transactional (formerly Mandrill) auth is just an API key
// passed inside the JSON body, not a header - unlike Twilio there's no
// separate account SID, and no client SDK to instantiate.
export function mailchimpConfigFor(profile) {
  if (!profile?.mailchimp_api_key || !profile?.mailchimp_number) return null;
  return { apiKey: profile.mailchimp_api_key, from: profile.mailchimp_number };
}

// Sends one individual text - never a batch/blast API call, since every
// message needs to be its own text even when sending to many people at
// once (see app/api/send/route.js, which loops this per recipient).
// `consent` follows Mailchimp's three consent types: "onetime" for a single
// informational text, "recurring" for an ongoing conversation once someone
// has opted in (used for replies within a thread), or "recurring-no-confirm"
// when confirmation was already sent elsewhere.
export async function sendSms({ apiKey, from, to, text, consent = "recurring-no-confirm" }) {
  const res = await fetch(SEND_SMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: apiKey,
      message: { sms: { text, to, from, consent, track_clicks: false } },
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `Mailchimp request failed (${res.status})`;
    throw new Error(message);
  }

  // Mandrill-style APIs return an array with one result per recipient.
  const result = Array.isArray(data) ? data[0] : data;
  if (result && (result.reject_reason || result.status === "rejected" || result.status === "invalid")) {
    throw new Error(result.reject_reason || `Mailchimp rejected this message (${result.status})`);
  }

  return result;
}
