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
  if (!twilioClient || !profile?.twilio_number) {
    return NextResponse.json(
      { error: "Connect your Twilio account and get a number in Settings first." },
      { status: 400 }
    );
  }

  const { contactId, message } = await req.json();

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("owner_id", user.id)
    .single();

  if (cErr || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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
      contact_id: contactId,
      owner_id: user.id,
      direction: "outbound",
      body,
    });
    if (!contact.twilio_number) {
      await supabase.from("contacts").update({ twilio_number: fromNumber }).eq("id", contactId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
