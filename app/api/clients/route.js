import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizePhone } from "@/lib/twilio";
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

  // Never send encrypted SSN/bank fields to the list view, not even encrypted -
  // just enough to show a masked hint if needed.
  const clients = data.map((c) => {
    const details = c.client_details || {};
    return {
      ...c,
      client_details: {
        ...details,
        ssn_encrypted: undefined,
        routing_number_encrypted: undefined,
        account_number_encrypted: undefined,
        hasSSN: !!details.ssn_encrypted,
        hasBankInfo: !!details.routing_number_encrypted,
      },
    };
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
      { onConflict: "owner_id,phone" }
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

  const contactRows = cleaned.map((r) => ({
    owner_id: ownerId,
    name: r.name.trim(),
    phone: normalizePhone(r.phone),
    type: "client",
    deleted_at: null, // re-importing someone who was previously removed brings them back
  }));

  const { data: contacts, error: contactErr } = await supabase
    .from("contacts")
    .upsert(contactRows, { onConflict: "owner_id,phone" })
    .select();
  if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 });

  const contactByPhone = new Map(contacts.map((c) => [c.phone, c]));
  const today = new Date().toISOString().slice(0, 10);
  const detailsRows = [];
  const notes = [];

  cleaned.forEach((r) => {
    const contact = contactByPhone.get(normalizePhone(r.phone));
    if (!contact) return;
    detailsRows.push(buildDetailsRow({ ...r, applicationSubmittedDate: today }, ownerId, contact.id));
    if (r.productName) {
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

  return NextResponse.json({ imported: detailsRows.length });
}
