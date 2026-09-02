import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("drip_sequences")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sequences: data });
}

// `steps` is an ordered array of { delayDays, message }. delayDays counts
// from the previous step (0 = send immediately on enrollment).
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { name, steps } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "A name is required" }, { status: 400 });
  if (!Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: "At least one step is required" }, { status: 400 });
  }
  const cleanSteps = steps.map((s) => ({
    delayDays: Math.max(0, Number(s.delayDays) || 0),
    message: String(s.message || "").trim(),
  }));
  if (cleanSteps.some((s) => !s.message)) {
    return NextResponse.json({ error: "Every step needs a message" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("drip_sequences")
    .insert({ owner_id: user.id, name: name.trim(), steps: cleanSteps })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sequence: data });
}

export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase.from("drip_sequences").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
