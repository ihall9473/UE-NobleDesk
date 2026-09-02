import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { twilioClientFor } from "@/lib/twilio";
import { isQuietHoursForState } from "@/lib/stateTimezones";
import { inferStateFromPhone } from "@/lib/areaCodeToState";
import { fillMessageTemplate } from "@/lib/messageTemplate";
import { TEXTING_ENABLED } from "@/lib/features";

// Runs once a day (see vercel.json). Vercel automatically sends this secret
// as a Bearer token when it triggers the cron.
function isAuthorized(req) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!TEXTING_ENABLED) return NextResponse.json({ ok: true, sent: 0, skippedQuietHours: 0 });

  const todayISO = new Date().toISOString().slice(0, 10);

  const { data: due } = await supabaseAdmin
    .from("drip_enrollments")
    .select("*, contacts(*), drip_sequences(steps)")
    .eq("active", true)
    .lte("next_send_date", todayISO);

  let totalSent = 0;
  let totalSkippedQuietHours = 0;
  const profileCache = {};

  for (const enrollment of due || []) {
    const contact = enrollment.contacts;
    const steps = enrollment.drip_sequences?.steps || [];
    const step = steps[enrollment.current_step];

    // Sequence exhausted or was deleted out from under this enrollment -
    // stop it rather than looping forever.
    if (!contact || !step) {
      await supabaseAdmin.from("drip_enrollments").update({ active: false }).eq("id", enrollment.id);
      continue;
    }

    // Consent was withdrawn since enrolling - stop texting them.
    if (contact.sms_consent === false) {
      await supabaseAdmin.from("drip_enrollments").update({ active: false }).eq("id", enrollment.id);
      continue;
    }

    // Quiet hours: skip today entirely, try again tomorrow (next_send_date
    // stays put, same as the occasions cron).
    const effectiveState = contact.state || inferStateFromPhone(contact.phone);
    if (isQuietHoursForState(effectiveState)) {
      totalSkippedQuietHours++;
      continue;
    }

    if (!profileCache[enrollment.owner_id]) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", enrollment.owner_id)
        .single();
      profileCache[enrollment.owner_id] = profile;
    }
    const profile = profileCache[enrollment.owner_id];
    const twilioClient = twilioClientFor(profile);
    if (!twilioClient || !profile?.twilio_number) continue;

    const body = fillMessageTemplate(step.message, contact);
    if (!body.trim()) continue;

    try {
      await twilioClient.messages.create({
        from: contact.twilio_number || profile.twilio_number,
        to: contact.phone,
        body,
      });
      await supabaseAdmin.from("messages").insert({
        contact_id: contact.id,
        owner_id: enrollment.owner_id,
        direction: "outbound",
        body,
      });

      const nextStep = enrollment.current_step + 1;
      const nextStepDef = steps[nextStep];
      await supabaseAdmin
        .from("drip_enrollments")
        .update({
          current_step: nextStep,
          next_send_date: nextStepDef ? addDays(todayISO, nextStepDef.delayDays) : enrollment.next_send_date,
          active: !!nextStepDef,
        })
        .eq("id", enrollment.id);

      totalSent++;
    } catch (err) {
      // Keep going even if one send fails - it'll retry on the same
      // next_send_date tomorrow since we haven't advanced the step.
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, skippedQuietHours: totalSkippedQuietHours });
}
