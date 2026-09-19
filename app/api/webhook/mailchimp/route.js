import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePhone } from "@/lib/phone";
import webpush from "@/lib/webpush";

// Mailchimp Transactional posts a single form field, "mandrill_events", holding
// a JSON array of events (it can batch more than one per request) - set this
// URL as the inbound webhook on your Mailchimp Transactional SMS program.
//
// NOTE: Mailchimp's public docs for SMS-specific event field names are thin
// (their inbound webhook docs mostly cover email). This reads several
// plausible field names defensively; if a real webhook comes through with
// different names, check `event` here to see the raw shape and adjust.
async function parseEvents(req) {
  const contentType = req.headers.get("content-type") || "";
  let raw;
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    raw = body?.mandrill_events ?? body;
  } else {
    const formData = await req.formData();
    raw = formData.get("mandrill_events");
  }
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

function extractSmsFields(event) {
  const msg = event.msg || event;
  const from = msg.from_number || msg.from || msg.from_phone || msg.sender;
  const to = msg.to_number || msg.to || msg.to_phone || msg.destination_number;
  const text = msg.text || msg.body || msg.content;
  return { from, to, text };
}

export async function POST(req) {
  const events = await parseEvents(req);

  for (const event of events) {
    // Only care about inbound SMS - outbound delivery/status events (sent,
    // delivered, failed, etc.) for messages we sent ourselves aren't
    // conversations to record.
    const isInboundSms =
      (event.channel === "sms" || event.type === "sms") &&
      (event.event === "inbound" || event.event === "sms_inbound" || event.event === "sms_received");
    if (!isInboundSms) continue;

    const { from, to, text } = extractSmsFields(event);
    if (!from || !to || !text) continue;

    const fromPhone = normalizePhone(from);
    const toPhone = normalizePhone(to);

    // Which coworker does this number belong to? Check the full roster of
    // their numbers, not just whichever one is currently "active".
    const { data: numberRow } = await supabaseAdmin
      .from("phone_numbers")
      .select("owner_id")
      .eq("phone_number", toPhone)
      .single();

    const ownerId = numberRow?.owner_id;
    if (!ownerId) continue; // a text came in on a number that isn't assigned to anyone

    const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", ownerId).single();

    let { data: contact } = await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("phone", fromPhone)
      .single();

    // New lead texting in for the first time - add them automatically,
    // tagged with whichever of the agent's numbers they texted.
    if (!contact) {
      const { data: newContact } = await supabaseAdmin
        .from("contacts")
        .insert({ owner_id: ownerId, name: fromPhone, phone: fromPhone, mailchimp_number: toPhone })
        .select()
        .single();
      contact = newContact;
    } else if (!contact.mailchimp_number) {
      await supabaseAdmin.from("contacts").update({ mailchimp_number: toPhone }).eq("id", contact.id);
      contact.mailchimp_number = toPhone;
    }

    await supabaseAdmin.from("messages").insert({
      contact_id: contact.id,
      owner_id: profile.id,
      direction: "inbound",
      body: text,
    });

    // Notify every device this coworker has installed the app on.
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("owner_id", profile.id);

    if (subscriptions?.length) {
      const payload = JSON.stringify({
        title: contact.name || fromPhone,
        body: text,
        url: `/conversations/${contact.id}`,
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        } catch (err) {
          // Subscription is likely expired/revoked - remove it so we stop trying.
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
