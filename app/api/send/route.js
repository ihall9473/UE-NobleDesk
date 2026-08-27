import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { twilioClientFor } from "@/lib/twilio";
import { fillMessageTemplate } from "@/lib/messageTemplate";

export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const twilioClient = twilioClientFor(profile);
  if (!twilioClient) {
    return NextResponse.json(
      { error: "Connect your own Twilio account in Settings first." },
      { status: 400 }
    );
  }
  if (!profile?.twilio_number) {
    return NextResponse.json(
      { error: "You don't have a texting number yet. Buy one in Settings." },
      { status: 400 }
    );
  }

  const { contactIds, message } = await req.json();
  if (!message || !contactIds || contactIds.length === 0) {
    return NextResponse.json({ error: "Missing message or recipients" }, { status: 400 });
  }

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .in("id", contactIds)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const contact of contacts) {
    if (contact.sms_consent === false) {
      results.push({ contact: contact.name, ok: false, error: "Didn't consent to texts - call them instead" });
      continue;
    }
    try {
      const fromNumber = contact.twilio_number || profile.twilio_number;
      const body = fillMessageTemplate(message, contact);
      await twilioClient.messages.create({
        from: fromNumber,
        to: contact.phone,
        body,
      });
      await supabase.from("messages").insert({
        contact_id: contact.id,
        owner_id: user.id,
        direction: "outbound",
        body,
      });
      if (!contact.twilio_number) {
        await supabase.from("contacts").update({ twilio_number: fromNumber }).eq("id", contact.id);
      }
      results.push({ contact: contact.name, ok: true });
    } catch (err) {
      results.push({ contact: contact.name, ok: false, error: err.message });
    }
  }

  return NextResponse.json({ results });
}
