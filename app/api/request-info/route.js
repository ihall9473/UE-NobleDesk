import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePhone } from "@/lib/twilio";

export async function POST(req) {
  const { userId, name, phone, consent } = await req.json();

  if (!userId || !name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Please check the box to agree to be contacted." }, { status: 400 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from("contacts").upsert(
    {
      owner_id: userId,
      name: name.trim(),
      phone: normalizePhone(phone),
      type: "lead",
    },
    { onConflict: "owner_id,phone" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
