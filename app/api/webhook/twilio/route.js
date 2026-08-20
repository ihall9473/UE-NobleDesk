import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePhone } from "@/lib/twilio";
import webpush from "@/lib/webpush";

// Twilio calls this automatically whenever ANY of your team's numbers gets a text.
// "To" tells us which of your coworkers' numbers received it, so we know whose
// inbox the message belongs in. This uses the admin client because there's no
// logged-in user here - it's a server-to-server call from Twilio.
export async function POST(req) {
  const formData = await req.formData();
  const from = formData.get("From");
  const to = formData.get("To");
  const body = formData.get("Body");

  if (!from || !to || !body) {
    return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
  }

  const fromPhone = normalizePhone(from);
  const toPhone = normalizePhone(to);

  // Which coworker does this number belong to?
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("twilio_number", toPhone)
    .single();

  if (!profile) {
    // A text came in on a number that isn't assigned to anyone - nothing to do.
    return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
  }

  let { data: contact } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("owner_id", profile.id)
    .eq("phone", fromPhone)
    .single();

  // New lead texting in for the first time - add them automatically.
  if (!contact) {
    const { data: newContact } = await supabaseAdmin
      .from("contacts")
      .insert({ owner_id: profile.id, name: fromPhone, phone: fromPhone })
      .select()
      .single();
    contact = newContact;
  }

  await supabaseAdmin.from("messages").insert({
    contact_id: contact.id,
    owner_id: profile.id,
    direction: "inbound",
    body,
  });

  // Notify every device this coworker has installed the app on.
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("owner_id", profile.id);

  if (subscriptions?.length) {
    const payload = JSON.stringify({
      title: contact.name || fromPhone,
      body,
      url: `/conversations/${contact.id}`,
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
      } catch (err) {
        // Subscription is likely expired/revoked - remove it so we stop trying.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  }

  return new NextResponse("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
}
