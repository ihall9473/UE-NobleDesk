import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizePhone } from "@/lib/twilio";
import { buildDetailsRow } from "@/lib/clientDetails";
import { decrypt } from "@/lib/encryption";

export async function GET(req, { params }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contactId } = params;

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*, client_details(*)")
    .eq("id", contactId)
    .eq("owner_id", user.id)
    .single();

  if (error || !contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const details = contact.client_details || {};
  // Decrypt only here, on the single-record view someone deliberately opened -
  // never on the list view.
  const decrypted = {
    ...details,
    ssn: decrypt(details.ssn_encrypted) || "",
    routingNumber: decrypt(details.routing_number_encrypted) || "",
    accountNumber: decrypt(details.account_number_encrypted) || "",
  };
  delete decrypted.ssn_encrypted;
  delete decrypted.routing_number_encrypted;
  delete decrypted.account_number_encrypted;

  return NextResponse.json({ contact: { ...contact, client_details: decrypted } });
}

export async function PATCH(req, { params }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contactId } = params;
  const body = await req.json();

  // Restoring a soft-deleted client (undo) - nothing else to do since
  // client_details was never touched.
  if (body.restore) {
    const { error } = await supabase
      .from("contacts")
      .update({ deleted_at: null })
      .eq("id", contactId)
      .eq("owner_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Update the basic contact fields (name/phone) if provided.
  if (body.name || body.phone) {
    const update = {};
    if (body.name) update.name = body.name.trim();
    if (body.phone) update.phone = normalizePhone(body.phone);
    const { error } = await supabase
      .from("contacts")
      .update(update)
      .eq("id", contactId)
      .eq("owner_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const detailsRow = buildDetailsRow(body, user.id, contactId);
  const { error: detailsErr } = await supabase.from("client_details").upsert(detailsRow);
  if (detailsErr) return NextResponse.json({ error: detailsErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Soft-deletes (marks deleted_at) instead of actually deleting, so the
// frontend can offer an "Undo" right after - their policy/SSN/bank details
// in client_details are left completely untouched either way.
export async function DELETE(req, { params }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contactId } = params;
  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", contactId)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
