import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { twilioClientFor } from "@/lib/twilio";

// Link a number this person already owns in their own Twilio account -
// points its SMS webhook at NobleDesk and saves it to their profile.
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const client = twilioClientFor(profile);
  if (!client) {
    return NextResponse.json(
      { error: "Connect your own Twilio account in Settings first." },
      { status: 400 }
    );
  }

  const { phoneNumber } = await req.json();
  if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  try {
    const owned = await client.incomingPhoneNumbers.list({ phoneNumber, limit: 1 });
    if (!owned.length) {
      return NextResponse.json(
        { error: "That number isn't in your connected Twilio account. Double-check it, or buy a new one above." },
        { status: 404 }
      );
    }

    await client.incomingPhoneNumbers(owned[0].sid).update({
      smsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/twilio`,
      smsMethod: "POST",
    });

    await supabase.from("profiles").update({ twilio_number: owned[0].phoneNumber }).eq("id", user.id);

    return NextResponse.json({ phoneNumber: owned[0].phoneNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
