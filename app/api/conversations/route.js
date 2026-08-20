import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*, messages(body, direction, created_at)")
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withLast = contacts
    .map((c) => {
      const msgs = (c.messages || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      return { ...c, lastMessage: msgs[0] || null, messages: undefined };
    })
    .filter((c) => c.lastMessage)
    .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));

  return NextResponse.json({ conversations: withLast });
}
