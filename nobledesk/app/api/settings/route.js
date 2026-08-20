import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Don't send the auth token back to the browser once saved - only whether it's set.
  return NextResponse.json({
    profile: { ...profile, twilio_auth_token: undefined, hasAuthToken: !!profile.twilio_auth_token },
  });
}

export async function PATCH(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { twilioAccountSid, twilioAuthToken } = await req.json();

  const update = {};
  if (twilioAccountSid !== undefined) update.twilio_account_sid = twilioAccountSid;
  if (twilioAuthToken !== undefined && twilioAuthToken !== "") update.twilio_auth_token = twilioAuthToken;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
