import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Tiny and fast on purpose - the NavBar calls this on every page load to
// decide whether to show the My Team tab, so it only touches the
// caller's own profile row (already allowed by RLS).
export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, has_invited")
    .eq("id", user.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ role: profile.role, hasInvited: profile.has_invited });
}

// Called once, the first time someone copies their personal invite link -
// permanently reveals the My Team tab for their account from then on.
export async function POST() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { error } = await supabase.from("profiles").update({ has_invited: true }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
