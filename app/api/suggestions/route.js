import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Anyone logged in can submit a suggestion from the little box in the
// corner of the app.
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { message } = await req.json();
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Enter a suggestion first." }, { status: 400 });
  }

  const { error } = await supabase
    .from("suggestions")
    .insert({ owner_id: user.id, message: message.trim() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Only admins/managers can read the full list back, with who submitted each one.
export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: profile, error: profileErr } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  if (profile?.role !== "admin" && profile?.role !== "manager") {
    return NextResponse.json({ error: "Admins and managers only" }, { status: 403 });
  }

  const { data: suggestions, error } = await supabaseAdmin
    .from("suggestions")
    .select("*, profiles(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suggestions });
}
