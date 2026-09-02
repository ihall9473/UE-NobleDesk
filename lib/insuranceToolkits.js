// Each agent's Insurance Toolkits FEX Lite widget is a personal token
// embedded in a URL (e.g. "Your Link": app.insurancetoolkits.com/fex/lite/
// ?token=XYZ, or the iframe src in "Your Widget HTML Code":
// insurancetoolkits.com/fex/lite-form/?token=XYZ). We only ever store the
// token itself and build our own iframe src from it, rather than storing
// or rendering whatever raw HTML someone pastes in - so accept either the
// bare token or a full link/embed snippet and pull the token out of it.
export function extractInsuranceToolkitsToken(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/token=([^&"'\s]+)/);
  if (match) return decodeURIComponent(match[1]);

  // No "token=" found - assume they pasted the bare token itself. Reject
  // anything with whitespace, since that means they pasted something else
  // (e.g. an unrelated sentence) and we couldn't find a real token in it.
  return /\s/.test(trimmed) ? null : trimmed;
}

export function insuranceToolkitsQuoterUrl(token) {
  return `https://insurancetoolkits.com/fex/lite-form/?token=${encodeURIComponent(token)}`;
}
