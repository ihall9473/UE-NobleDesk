import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Switch which of the agent's already-owned numbers is used for new
// outbound texts. Doesn't touch conversations already tied to a number -
// those keep using whichever number they've always used.
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { phoneNumber } = await req.json();
  if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  const { data: owned } = await supabase
    .from("phone_numbers")
    .select("phone_number")
    .eq("owner_id", user.id)
    .eq("phone_number", phoneNumber)
    .single();

  if (!owned) {
    return NextResponse.json({ error: "That number isn't linked to your account yet." }, { status: 404 });
  }

  const { error } = await supabase.from("profiles").update({ twilio_number: phoneNumber }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, active: phoneNumber });
}
