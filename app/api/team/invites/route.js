import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Everyone can generate an 'agent' invite (for their own downline); only a
// true admin can generate an 'admin' or 'manager' invite - same rule as
// the existing Admin -> Add Coworker flow.
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: me, error: meError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (meError) return NextResponse.json({ error: meError.message }, { status: 500 });

  const { role, lastName } = await req.json();
  const requestedRole = role === "admin" || role === "manager" ? role : "agent";
  if (requestedRole !== "agent" && me.role !== "admin") {
    return NextResponse.json({ error: "Only admins can send admin or manager invites." }, { status: 403 });
  }
  if (!lastName || !lastName.trim()) {
    return NextResponse.json({ error: "The invitee's last name is required." }, { status: 400 });
  }

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({ inviter_id: user.id, role: requestedRole, last_name: lastName.trim() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generating an invite is the "I've sent one" moment now - reveals the My
  // Team tab from here on, same as copying the old link used to.
  await supabase.from("profiles").update({ has_invited: true }).eq("id", user.id);

  return NextResponse.json({ invite });
}

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: invites, error } = await supabase
    .from("invites")
    .select("*, used_by_profile:used_by(name)")
    .eq("inviter_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invites });
}
