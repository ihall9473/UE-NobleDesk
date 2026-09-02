import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const contactId = req.nextUrl.searchParams.get("contactId");

  let query = supabase
    .from("tasks")
    .select("*, contacts(name, phone, type)")
    .eq("owner_id", user.id);
  if (contactId) query = query.eq("contact_id", contactId);

  const { data, error } = await query.order("due_date", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data });
}

export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contactId, title, dueDate } = await req.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "A title is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      owner_id: user.id,
      contact_id: contactId || null,
      title: title.trim(),
      due_date: dueDate || null,
    })
    .select("*, contacts(name, phone, type)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id, title, dueDate, completed } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const update = {};
  if (title !== undefined) update.title = title.trim();
  if (dueDate !== undefined) update.due_date = dueDate || null;
  if (completed !== undefined) {
    update.completed = completed;
    update.completed_at = completed ? new Date().toISOString() : null;
  }

  const { error } = await supabase.from("tasks").update(update).eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
