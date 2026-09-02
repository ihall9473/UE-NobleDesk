import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { TEXTING_ENABLED } from "@/lib/features";

// Returns the manually-logged activity for a contact merged with their SMS
// history (when texting is on) into one chronological timeline, tagged so
// the frontend can render each kind differently.
export async function GET(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const contactId = req.nextUrl.searchParams.get("contactId");
  if (!contactId) return NextResponse.json({ error: "contactId is required" }, { status: 400 });

  const { data: activity, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("owner_id", user.id)
    .eq("contact_id", contactId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let entries = activity.map((a) => ({
    id: a.id,
    kind: a.kind,
    body: a.body,
    created_at: a.created_at,
  }));

  if (TEXTING_ENABLED) {
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("id, direction, body, created_at")
      .eq("owner_id", user.id)
      .eq("contact_id", contactId);
    if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

    entries = entries.concat(
      (messages || []).map((m) => ({
        id: m.id,
        kind: m.direction === "outbound" ? "text_out" : "text_in",
        body: m.body,
        created_at: m.created_at,
      }))
    );
  }

  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json({ activity: entries });
}

export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contactId, kind, body } = await req.json();
  if (!contactId || !body || !body.trim()) {
    return NextResponse.json({ error: "contactId and body are required" }, { status: 400 });
  }
  const validKinds = ["note", "call", "meeting", "life_event"];
  const safeKind = validKinds.includes(kind) ? kind : "note";

  const { data, error } = await supabase
    .from("activity_log")
    .insert({ owner_id: user.id, contact_id: contactId, kind: safeKind, body: body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activity: data });
}

export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase.from("activity_log").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
