// Parses a pasted/uploaded CSV or TSV of clients + policy data for bulk
// import (e.g. bringing over an existing book of business from another
// system). A header row is required so columns can appear in any order -
// only name and phone are mandatory, everything else is optional and gets
// filled in on the Clients page afterward (beneficiaries, address, etc.
// never come from this import).

const FIELD_ALIASES = {
  name: ["name", "clientname", "fullname", "insuredname", "client"],
  phone: ["phone", "clientcontact", "phonenumber", "mobile", "cell", "cellphone"],
  email: ["email", "clientemail"],
  dob: ["dob", "dateofbirth", "clientdob", "birthdate"],
  carrier: ["carrier"],
  policyNumber: ["policynumber", "policyno", "policynum", "policy"],
  product: ["product", "plan", "policyproduct", "productname"],
  coverageAmount: ["coverageamount", "coverage", "faceamount", "deathbenefit"],
  monthlyPremium: ["monthlypremium", "premiummonthly", "premium", "monthly"],
  yearlyPremium: ["yearlypremium", "annualpremium", "yearly", "annual"],
  draftDate: ["draftdate", "draft"],
};

function normalizeKey(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildHeaderMap(headerCells) {
  const map = {}; // column index -> canonical field name
  headerCells.forEach((cell, i) => {
    const norm = normalizeKey(cell);
    const field = Object.keys(FIELD_ALIASES).find((f) => FIELD_ALIASES[f].includes(norm));
    if (field) map[i] = field;
  });
  return map;
}

// Splits one line on the given delimiter, respecting double-quoted cells
// so a comma inside a quoted value doesn't split the row.
function splitLine(line, delimiter) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

// client_details.policy_product only tracks the broad category (Whole
// Life / Term / IUL) - the specific product name (e.g. "Eagle Select 1")
// isn't a column, so it's inferred into a bucket here and the original
// text is kept separately for an activity note.
export function inferPolicyProduct(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes("term")) return "Term";
  if (t.includes("iul") || t.includes("indexed universal")) return "IUL";
  return "Whole Life";
}

// Turns a date typed/exported in pretty much any common format (e.g. "Mar
// 23, 1955") into YYYY-MM-DD for the <input type="date"> fields and the
// underlying `date` columns. Falls back to the raw text if it can't be
// parsed - Postgres will reject it clearly rather than silently storing
// something wrong.
export function normalizeDate(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function stripCurrency(value) {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  return cleaned || null;
}

// Parses the pasted/uploaded text into row objects ready to send to
// POST /api/clients { rows }. Returns { rows, skipped } - skipped counts
// lines with no name or phone (e.g. a stray blank line or a totals row).
export function parseClientImport(text) {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, "")).filter((l) => l.trim() !== "");
  if (lines.length < 2) return { rows: [], skipped: 0 };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headerMap = buildHeaderMap(splitLine(lines[0], delimiter));

  let skipped = 0;
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    const raw = {};
    cells.forEach((value, idx) => {
      const field = headerMap[idx];
      if (field && value) raw[field] = value;
    });

    if (!raw.name || !raw.phone) {
      skipped++;
      continue;
    }

    const monthlyPremium =
      stripCurrency(raw.monthlyPremium) ||
      (raw.yearlyPremium ? (parseFloat(stripCurrency(raw.yearlyPremium)) / 12).toFixed(2) : null);

    rows.push({
      name: raw.name,
      phone: raw.phone,
      email: raw.email || null,
      dateOfBirth: normalizeDate(raw.dob),
      carrier: raw.carrier || null,
      policyNumber: raw.policyNumber || null,
      policyProduct: inferPolicyProduct(raw.product),
      productName: raw.product || null, // not a client_details column - used only for the imported-policy note
      coverageAmount: stripCurrency(raw.coverageAmount),
      monthlyPremium,
      draftDate: raw.draftDate || null,
    });
  }

  return { rows, skipped };
}
