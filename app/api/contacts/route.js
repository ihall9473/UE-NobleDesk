import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizePhone } from "@/lib/twilio";

export async function GET(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type"); // "lead", "client", or omitted for all

  let query = supabase.from("contacts").select("*").eq("owner_id", user.id).is("deleted_at", null);
  if (type === "lead" || type === "client") query = query.eq("type", type);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}

export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const defaultType = body.type === "client" ? "client" : "lead";
  const rows = body.rows ? body.rows : [{ name: body.name, phone: body.phone, type: body.type, state: body.state }];

  const cleaned = rows
    .filter((r) => r.name && r.phone)
    .map((r) => ({
      owner_id: user.id,
      name: r.name.trim(),
      phone: normalizePhone(r.phone),
      type: r.type === "client" ? "client" : r.type === "lead" ? "lead" : defaultType,
      state: r.state || null,
      deleted_at: null, // re-adding someone who was previously removed brings them back
    }));

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No valid contacts provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .upsert(cleaned, { onConflict: "owner_id,phone" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}

// Change a contact's type and/or state - e.g. moving a lead to client once they convert -
// or restore one that was soft-deleted (undo). Accepts either a single `id` or a list of
// `ids` to update several at once.
export async function PATCH(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id, ids, type, state, restore } = await req.json();
  const targetIds = ids && ids.length > 0 ? ids : id ? [id] : [];
  if (targetIds.length === 0) {
    return NextResponse.json({ error: "id or ids is required" }, { status: 400 });
  }

  const update = {};
  if (type !== undefined) {
    if (type !== "lead" && type !== "client") {
      return NextResponse.json({ error: "Type must be 'lead' or 'client'" }, { status: 400 });
    }
    update.type = type;
  }
  if (state !== undefined) update.state = state || null;
  if (restore) update.deleted_at = null;

  const { error } = await supabase
    .from("contacts")
    .update(update)
    .in("id", targetIds)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Soft-deletes (marks deleted_at) rather than actually deleting, so the
// frontend can offer an "Undo" right after. Accepts either a single `id`
// or a list of `ids` to remove several at once.
export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id, ids } = await req.json();
  const targetIds = ids && ids.length > 0 ? ids : id ? [id] : [];
  if (targetIds.length === 0) {
    return NextResponse.json({ error: "id or ids is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", targetIds)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
