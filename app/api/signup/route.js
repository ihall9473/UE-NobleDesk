import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Public - lets the signup page show who's inviting you and what role
// you're being granted before creating the account. Never reveals the
// last name itself (that's the confirmation code the invitee has to type).
export async function GET(req) {
  const inviteId = new URL(req.url).searchParams.get("invite");
  if (!inviteId) return NextResponse.json({ invite: null });

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("role, used_at, inviter_id")
    .eq("id", inviteId)
    .maybeSingle();
  if (!invite) return NextResponse.json({ invite: null });

  const { data: inviter } = await supabaseAdmin.from("profiles").select("name").eq("id", invite.inviter_id).maybeSingle();

  return NextResponse.json({
    invite: {
      role: invite.role,
      used: !!invite.used_at,
      inviterName: inviter?.name || null,
    },
  });
}

export async function POST(req) {
  const { name, email, password, inviteId, lastName } = await req.json();

  if (!name || !email || !password || !inviteId || !lastName) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("invites")
    .select("*")
    .eq("id", inviteId)
    .maybeSingle();
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });
  if (!invite) return NextResponse.json({ error: "This invite link isn't valid." }, { status: 404 });
  if (invite.used_at) return NextResponse.json({ error: "This invite has already been used." }, { status: 400 });
  if (lastName.trim().toLowerCase() !== invite.last_name.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "That doesn't match the last name on this invite - double check with whoever sent it." },
      { status: 403 }
    );
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

  const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
    id: created.user.id,
    name,
    role: invite.role,
    invited_by: invite.inviter_id,
  });
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  await supabaseAdmin.from("invites").update({ used_at: new Date().toISOString(), used_by: created.user.id }).eq("id", inviteId);

  return NextResponse.json({ ok: true });
}
