import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("drip_enrollments")
    .select("*, contacts(name, phone), drip_sequences(name, steps)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enrollments: data });
}

// Enrolls one or more contacts in a sequence, starting from step 0 - the
// cron sends today's first step and advances next_send_date from there.
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { sequenceId, contactIds } = await req.json();
  if (!sequenceId || !Array.isArray(contactIds) || contactIds.length === 0) {
    return NextResponse.json({ error: "sequenceId and contactIds are required" }, { status: 400 });
  }

  const { data: sequence, error: seqError } = await supabase
    .from("drip_sequences")
    .select("id")
    .eq("id", sequenceId)
    .eq("owner_id", user.id)
    .single();
  if (seqError || !sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  const rows = contactIds.map((contactId) => ({
    owner_id: user.id,
    sequence_id: sequenceId,
    contact_id: contactId,
    current_step: 0,
    next_send_date: new Date().toISOString().slice(0, 10),
    active: true,
  }));

  // Re-enrolling someone who was previously unenrolled (or completed) just
  // restarts them at step 0, rather than erroring on the unique constraint.
  const { error } = await supabase
    .from("drip_enrollments")
    .upsert(rows, { onConflict: "sequence_id,contact_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, enrolled: rows.length });
}

// Unenroll (pause) - marks inactive rather than deleting, so the history
// of what was already sent stays intact.
export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("drip_enrollments")
    .update({ active: false })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
