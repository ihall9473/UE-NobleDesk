import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { twilioClientFor } from "@/lib/twilio";
import { resolveHolidayDate } from "@/lib/holidays";
import { inferStateFromPhone } from "@/lib/areaCodeToState";
import { isQuietHoursForState } from "@/lib/stateTimezones";
import { fillMessageTemplate } from "@/lib/messageTemplate";
import { TEXTING_ENABLED } from "@/lib/features";

// Runs once a day (see vercel.json). Vercel automatically sends this secret
// as a Bearer token when it triggers the cron.
function isAuthorized(req) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!TEXTING_ENABLED) return NextResponse.json({ ok: true, sent: 0, skippedQuietHours: 0 });

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const todayISO = today.toISOString().slice(0, 10);
  const year = today.getFullYear();

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .not("twilio_account_sid", "is", null)
    .not("twilio_number", "is", null);

  let totalSent = 0;
  let totalSkippedQuietHours = 0;

  for (const profile of profiles || []) {
    const twilioClient = twilioClientFor(profile);
    if (!twilioClient) continue;

    const { data: occasions } = await supabaseAdmin
      .from("occasions")
      .select("*")
      .eq("owner_id", profile.id)
      .eq("enabled", true);

    for (const occasion of occasions || []) {
      const resolved = resolveHolidayDate(occasion, year);
      const isToday = resolved && resolved.month === todayMonth && resolved.day === todayDay;

      let matchingContacts = [];

      if (isToday) {
        const { data: clients } = await supabaseAdmin
          .from("contacts")
          .select("*")
          .eq("owner_id", profile.id)
          .eq("type", "client");
        matchingContacts = clients || [];
      } else if (occasion.kind === "birthday") {
        const { data: clients } = await supabaseAdmin
          .from("contacts")
          .select("*, client_details(date_of_birth)")
          .eq("owner_id", profile.id)
          .eq("type", "client");

        matchingContacts = (clients || []).filter((c) => {
          const details = Array.isArray(c.client_details) ? c.client_details[0] : c.client_details;
          const dob = details?.date_of_birth;
          if (!dob) return false;
          const d = new Date(dob + "T00:00:00");
          return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay;
        });
      } else if (occasion.kind === "policy_anniversary") {
        const { data: clients } = await supabaseAdmin
          .from("contacts")
          .select("*, client_details(application_submitted_date)")
          .eq("owner_id", profile.id)
          .eq("type", "client");

        matchingContacts = (clients || [])
          .map((c) => {
            const details = Array.isArray(c.client_details) ? c.client_details[0] : c.client_details;
            return { contact: c, submitted: details?.application_submitted_date };
          })
          .filter(({ submitted }) => {
            if (!submitted) return false;
            const d = new Date(submitted + "T00:00:00");
            // Skip the day the policy was actually submitted - only fire on
            // real anniversaries, starting one year later.
            return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay && year > d.getFullYear();
          })
          .map(({ contact, submitted }) => ({
            ...contact,
            _years: year - new Date(submitted + "T00:00:00").getFullYear(),
          }));
      }

      for (const contact of matchingContacts) {
        // Quiet hours: never send an automated text before 8am or after
        // 8pm in the contact's own local time. If they're in a quiet
        // window right now, skip them entirely for today - no retry,
        // since this cron only runs once a day.
        const effectiveState = contact.state || inferStateFromPhone(contact.phone);
        if (isQuietHoursForState(effectiveState)) {
          totalSkippedQuietHours++;
          continue;
        }

        // Skip if this exact occasion already went to this contact today.
        const { data: existing } = await supabaseAdmin
          .from("occasion_sends")
          .select("id")
          .eq("occasion_id", occasion.id)
          .eq("contact_id", contact.id)
          .eq("sent_date", todayISO)
          .maybeSingle();
        if (existing) continue;

        const body = fillMessageTemplate(occasion.message, contact, contact._years ? { years: contact._years } : {});
        if (!body.trim()) continue;

        try {
          await twilioClient.messages.create({
            from: profile.twilio_number,
            to: contact.phone,
            body,
          });
          await supabaseAdmin.from("messages").insert({
            contact_id: contact.id,
            owner_id: profile.id,
            direction: "outbound",
            body,
          });
          await supabaseAdmin.from("occasion_sends").insert({
            owner_id: profile.id,
            occasion_id: occasion.id,
            contact_id: contact.id,
            sent_date: todayISO,
          });
          totalSent++;
        } catch (err) {
          // Keep going even if one send fails.
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, skippedQuietHours: totalSkippedQuietHours });
}
