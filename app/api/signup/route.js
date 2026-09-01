import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Public - lets the signup page show "Invited by ___" before creating the
// account. Only ever returns a name, nothing else.
export async function GET(req) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ referrer: null });

  const { data } = await supabaseAdmin.from("profiles").select("name").eq("id", ref).maybeSingle();
  return NextResponse.json({ referrer: data?.name || null });
}

export async function POST(req) {
  const { name, email, password, inviteCode, ref } = await req.json();

  if (!name || !email || !password || !inviteCode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (inviteCode !== (process.env.APP_INVITE_CODE || "UpperEchelon")) {
    return NextResponse.json({ error: "That invite code isn't valid." }, { status: 403 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Came in through someone's personal "Invite Downline" link? Record them
  // as the upline, but only if that account actually exists.
  let invitedBy = null;
  if (ref) {
    const { data: referrer } = await supabaseAdmin.from("profiles").select("id").eq("id", ref).maybeSingle();
    if (referrer) invitedBy = referrer.id;
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
    role: "agent",
    invited_by: invitedBy,
  });

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
