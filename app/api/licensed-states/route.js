import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("licensed_states")
    .select("state")
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ states: data.map((r) => r.state) });
}

// Toggles a single state licensed/unlicensed - clicking a state on the map.
export async function PUT(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { state, licensed } = await req.json();
  if (!state) return NextResponse.json({ error: "Missing state" }, { status: 400 });

  if (licensed) {
    const { error } = await supabase
      .from("licensed_states")
      .upsert({ owner_id: user.id, state }, { onConflict: "owner_id,state" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("licensed_states")
      .delete()
      .eq("owner_id", user.id)
      .eq("state", state);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
