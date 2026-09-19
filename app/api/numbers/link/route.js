import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizePhone } from "@/lib/phone";

// Registers a sending number this person already provisioned in their own
// Mailchimp Transactional account (Mailchimp doesn't expose a self-serve
// "search and buy a number" API the way Twilio did, so this is a manual
// paste-in instead of a live purchase/ownership check).
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { phoneNumber, label } = await req.json();
  if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  const normalized = normalizePhone(phoneNumber);

  const { data: existing } = await supabase
    .from("phone_numbers")
    .select("label")
    .eq("phone_number", normalized)
    .single();

  const { error: upsertErr } = await supabase.from("phone_numbers").upsert(
    { owner_id: user.id, phone_number: normalized, label: label || existing?.label || null },
    { onConflict: "phone_number" }
  );
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  const { error } = await supabase.from("profiles").update({ mailchimp_number: normalized }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ phoneNumber: normalized });
}
