import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizePhone } from "@/lib/phone";
import { buildDetailsRow } from "@/lib/clientDetails";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("contacts")
    .select("*, client_details(*)")
    .eq("owner_id", user.id)
    .eq("type", "client")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A client can have more than one policy, so client_details comes back as
  // an array (still `policies`, so nothing downstream has to guess). Never
  // send encrypted SSN/bank fields to the list view, not even encrypted -
  // just enough to show a masked hint if needed.
  const clients = data.map((c) => {
    const policies = (Array.isArray(c.client_details) ? c.client_details : c.client_details ? [c.client_details] : [])
      .map((details) => ({
        ...details,
        ssn_encrypted: undefined,
        routing_number_encrypted: undefined,
        account_number_encrypted: undefined,
        hasSSN: !!details.ssn_encrypted,
        hasBankInfo: !!details.routing_number_encrypted,
      }));
    const { client_details, ...rest } = c;
    return { ...rest, policies };
  });

  return NextResponse.json({ clients });
}

// Creates a new client: a contact row (type='client') plus its details row.
// Also accepts { rows: [...] } to bulk-import several clients + policy
// details at once (e.g. from the Import Clients CSV form).
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();

  if (body.rows) return bulkImport(supabase, user.id, body.rows);

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .upsert(
      {
        owner_id: user.id,
        name: body.name.trim(),
        phone: normalizePhone(body.phone),
        type: "client",
        state: body.contactState || null,
        deleted_at: null, // re-adding someone who was previously removed brings them back
      },
      { onConflict: "owner_id,phone,name" }
    )
    .select()
    .single();

  if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 });

  const detailsRow = buildDetailsRow(
    {
      ...body,
      // Auto-stamp with today's date on creation unless the form already
      // sent one - editable afterward from the client's detail page.
      applicationSubmittedDate: body.applicationSubmittedDate || new Date().toISOString().slice(0, 10),
    },
    user.id,
    contact.id
  );

  const { error: detailsErr } = await supabase.from("client_details").upsert(detailsRow);
  if (detailsErr) return NextResponse.json({ error: detailsErr.message }, { status: 500 });

  return NextResponse.json({ contact });
}

async function bulkImport(supabase, ownerId, rows) {
  const cleaned = rows.filter((r) => r.name && r.phone);
  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No valid rows found - each needs at least a name and phone number" }, { status: 400 });
  }

  // One row per contact, even though a client can appear on multiple CSV
  // rows (one per policy) - Postgres's upsert can't update the same target
  // row twice within a single statement, so duplicates have to be collapsed
  // before they ever reach the database.
  const contactRowsByKey = new Map();
  cleaned.forEach((r) => {
    const key = `${normalizePhone(r.phone)}|${r.name.trim().toLowerCase()}`;
    if (!contactRowsByKey.has(key)) {
      contactRowsByKey.set(key, {
        owner_id: ownerId,
        name: r.name.trim(),
        phone: normalizePhone(r.phone),
        type: "client",
        deleted_at: null, // re-importing someone who was previously removed brings them back
      });
    }
  });
  const contactRows = [...contactRowsByKey.values()];

  const { data: contacts, error: contactErr } = await supabase
    .from("contacts")
    .upsert(contactRows, { onConflict: "owner_id,phone,name" })
    .select();
  if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 });

  // A phone number alone no longer identifies one contact (household
  // members can share a line), so match rows back to their contact by
  // phone + name together.
  const contactByPhoneName = new Map(contacts.map((c) => [`${c.phone}|${c.name.toLowerCase()}`, c]));

  const contactIds = contacts.map((c) => c.id);
  const { data: existingPolicies, error: existingErr } = await supabase
    .from("client_details")
    .select("id, contact_id, policy_number")
    .in("contact_id", contactIds);
  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

  // Re-importing the same sheet later (e.g. after adding new deals)
  // shouldn't duplicate a policy already on file - match on contact +
  // policy number and update that row in place instead of inserting again.
  // A row with no policy number always creates a new policy, since there's
  // nothing reliable to match it against.
  const existingByContactAndPolicy = new Map(
    (existingPolicies || [])
      .filter((p) => p.policy_number)
      .map((p) => [`${p.contact_id}|${p.policy_number}`, p.id])
  );

  const today = new Date().toISOString().slice(0, 10);
  const detailsRows = [];
  const notes = [];

  cleaned.forEach((r) => {
    const contact = contactByPhoneName.get(`${normalizePhone(r.phone)}|${r.name.trim().toLowerCase()}`);
    if (!contact) return;
    const existingId = r.policyNumber
      ? existingByContactAndPolicy.get(`${contact.id}|${r.policyNumber}`)
      : undefined;
    detailsRows.push(buildDetailsRow({ ...r, applicationSubmittedDate: today }, ownerId, contact.id, existingId));
    if (r.productName && !existingId) {
      notes.push({
        owner_id: ownerId,
        contact_id: contact.id,
        kind: "note",
        body: `Imported policy: ${r.productName}${r.policyNumber ? ` (#${r.policyNumber})` : ""}`,
      });
    }
  });

  const { error: detailsErr } = await supabase.from("client_details").upsert(detailsRows);
  if (detailsErr) return NextResponse.json({ error: detailsErr.message }, { status: 500 });

  if (notes.length > 0) await supabase.from("activity_log").insert(notes);

  return NextResponse.json({ imported: detailsRows.length, clients: contactRows.length });
}
