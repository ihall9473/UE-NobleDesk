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
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .upsert(
      { owner_id: user.id, name: body.name.trim(), phone: normalizePhone(body.phone), type: "client" },
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
