import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// List every number this agent owns, plus which one is currently active
// (used for new outbound texts).
export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("twilio_number").eq("id", user.id).single();
  const { data: numbers, error } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ numbers, active: profile?.twilio_number || null });
}

// Rename (label) one of your numbers - e.g. "A2P Campaign" vs "Personal".
export async function PATCH(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { phoneNumber, label } = await req.json();
  if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  const { error } = await supabase
    .from("phone_numbers")
    .update({ label: label || null })
    .eq("owner_id", user.id)
    .eq("phone_number", phoneNumber);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
