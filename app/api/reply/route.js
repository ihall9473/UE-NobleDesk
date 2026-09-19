import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { mailchimpConfigFor, sendSms } from "@/lib/mailchimp";
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

  const mailchimp = mailchimpConfigFor(profile);
  if (!mailchimp) {
    return NextResponse.json(
      { error: "Connect your Mailchimp account and texting number in Settings first." },
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
    const fromNumber = contact.mailchimp_number || mailchimp.from;
    const body = fillMessageTemplate(message, contact);
    // Replying within an existing thread - they've already been messaging
    // this number, so no fresh one-time consent prompt is needed.
    await sendSms({ apiKey: mailchimp.apiKey, from: fromNumber, to: contact.phone, text: body, consent: "recurring-no-confirm" });
    await supabase.from("messages").insert({
      contact_id: contactId,
      owner_id: user.id,
      direction: "outbound",
      body,
    });
    if (!contact.mailchimp_number) {
      await supabase.from("contacts").update({ mailchimp_number: fromNumber }).eq("id", contactId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
