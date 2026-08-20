import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const { name, email, password, inviteCode } = await req.json();

  if (!name || !email || !password || !inviteCode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (inviteCode !== process.env.APP_INVITE_CODE) {
    return NextResponse.json({ error: "That invite code isn't valid." }, { status: 403 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
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
    role: "member",
  });

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
