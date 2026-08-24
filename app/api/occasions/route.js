import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { ALL_HOLIDAYS } from "@/lib/holidays";

// Seeded the first time someone visits the Occasions page with none set up
// yet - every holiday from lib/holidays.js, all turned on by default.

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let { data: occasions, error } = await supabase
    .from("occasions")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // First visit - seed every holiday from the master list.
  if (occasions.length === 0) {
    const seeded = ALL_HOLIDAYS.map((o) => ({
      owner_id: user.id,
      name: o.name,
      kind: o.kind,
      month: o.month ?? null,
      day: o.day ?? null,
      weekday: o.weekday ?? null,
      occurrence: o.occurrence ?? null,
      enabled: o.enabled,
      message: o.message,
    }));
    const { data: inserted, error: seedErr } = await supabase.from("occasions").insert(seeded).select();
    if (seedErr) return NextResponse.json({ error: seedErr.message }, { status: 500 });
    occasions = inserted;
  } else {
    // Backfill any built-in holidays added to the master list since this
    // person's checklist was first seeded (matched by kind for the two
    // per-contact ones, since those don't have a fixed name requirement;
    // by name for everything else).
    const existingKinds = new Set(occasions.map((o) => o.kind));
    const existingNames = new Set(occasions.map((o) => o.name));
    const missing = ALL_HOLIDAYS.filter((o) =>
      o.kind === "birthday" || o.kind === "policy_anniversary"
        ? !existingKinds.has(o.kind)
        : !existingNames.has(o.name)
    );
    if (missing.length > 0) {
      const toInsert = missing.map((o) => ({
        owner_id: user.id,
        name: o.name,
        kind: o.kind,
        month: o.month ?? null,
        day: o.day ?? null,
        weekday: o.weekday ?? null,
        occurrence: o.occurrence ?? null,
        enabled: o.enabled,
        message: o.message,
      }));
      const { data: added, error: addErr } = await supabase.from("occasions").insert(toInsert).select();
      if (!addErr && added) occasions = [...occasions, ...added];
    }
  }

  return NextResponse.json({ occasions });
}

export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { name, kind, month, day, weekday, occurrence, message } = await req.json();
  if (!name || !kind) {
    return NextResponse.json({ error: "Name and kind are required" }, { status: 400 });
  }
  if (kind === "fixed" && (!month || !day)) {
    return NextResponse.json({ error: "Month and day are required for a fixed-date occasion" }, { status: 400 });
  }
  if (kind === "floating" && (!month || weekday === undefined || !occurrence)) {
    return NextResponse.json({ error: "Month, weekday, and occurrence are required for a floating holiday" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("occasions")
    .insert({
      owner_id: user.id,
      name,
      kind,
      month: kind === "fixed" || kind === "floating" ? month : null,
      day: kind === "fixed" ? day : null,
      weekday: kind === "floating" ? weekday : null,
      occurrence: kind === "floating" ? occurrence : null,
      enabled: true,
      message: message || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ occasion: data });
}

export async function PATCH(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id, enabled, message, name, month, day, weekday, occurrence } = await req.json();
  const update = {};
  if (enabled !== undefined) update.enabled = enabled;
  if (message !== undefined) update.message = message;
  if (name !== undefined) update.name = name;
  if (month !== undefined) update.month = month;
  if (day !== undefined) update.day = day;
  if (weekday !== undefined) update.weekday = weekday;
  if (occurrence !== undefined) update.occurrence = occurrence;

  const { error } = await supabase.from("occasions").update(update).eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabase.from("occasions").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
