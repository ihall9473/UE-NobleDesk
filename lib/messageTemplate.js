// Fills {name} and {first_name} (and any extra placeholders passed in,
// e.g. {years} for a policy anniversary) into a message template. Shared
// by manual sends/replies, saved templates, and the occasions cron/preview.
export function fillMessageTemplate(template, contact, extra = {}) {
  const firstName = (contact?.name || "").trim().split(/\s+/)[0] || "there";
  let result = (template || "")
    .replaceAll("{name}", contact?.name || "")
    .replaceAll("{first_name}", firstName);

  for (const [key, value] of Object.entries(extra)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }

  return result;
}
