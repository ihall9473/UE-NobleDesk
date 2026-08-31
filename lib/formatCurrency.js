// Formats a stored coverage/premium value (which may already have a $,
// commas, or nothing at all) as "$X,XXX.XX" - always two decimals, always
// comma-grouped, no matter how it was originally typed in.
export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "";
  const num = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return "";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
