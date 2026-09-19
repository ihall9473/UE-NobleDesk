import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { resolveHolidayDate } from "@/lib/holidays";
import { inferStateFromPhone } from "@/lib/areaCodeToState";
import { isQuietHoursForState } from "@/lib/stateTimezones";
import { TEXTING_ENABLED } from "@/lib/features";

export async function GET() {
  if (!TEXTING_ENABLED) return NextResponse.json({ error: "Not available" }, { status: 404 });

  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const year = today.getFullYear();

  const { data: occasions } = await supabase
    .from("occasions")
    .select("*")
    .eq("owner_id", user.id)
    .eq("enabled", true);

  const matches = [];
  const skippedQuietHours = [];

  for (const occasion of occasions || []) {
    const resolved = resolveHolidayDate(occasion, year);
    const isToday = resolved && resolved.month === todayMonth && resolved.day === todayDay;

    let candidates = [];

    if (isToday) {
      const { data: clients } = await supabase
        .from("contacts")
        .select("id, name, phone, state")
        .eq("owner_id", user.id)
        .eq("type", "client");
      candidates = clients || [];
    } else if (occasion.kind === "birthday") {
      const { data: clients } = await supabase
        .from("contacts")
        .select("id, name, phone, state, client_details(date_of_birth)")
        .eq("owner_id", user.id)
        .eq("type", "client");

      // A client can have more than one policy - match if ANY of them has
      // a date of birth on file for today.
      candidates = (clients || []).filter((c) => {
        const policies = Array.isArray(c.client_details) ? c.client_details : c.client_details ? [c.client_details] : [];
        return policies.some((p) => {
          if (!p.date_of_birth) return false;
          const d = new Date(p.date_of_birth + "T00:00:00");
          return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay;
        });
      });
    } else if (occasion.kind === "policy_anniversary") {
      const { data: clients } = await supabase
        .from("contacts")
        .select("id, name, phone, state, client_details(application_submitted_date)")
        .eq("owner_id", user.id)
        .eq("type", "client");

      // Match if ANY of a client's policies was submitted on this day in a
      // prior year - each policy has its own anniversary.
      candidates = (clients || []).filter((c) => {
        const policies = Array.isArray(c.client_details) ? c.client_details : c.client_details ? [c.client_details] : [];
        return policies.some((p) => {
          if (!p.application_submitted_date) return false;
          const d = new Date(p.application_submitted_date + "T00:00:00");
          return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay && year > d.getFullYear();
        });
      });
    }

    for (const c of candidates) {
      const effectiveState = c.state || inferStateFromPhone(c.phone);
      const entry = { occasion: occasion.name, contact: c.name, phone: c.phone, state: effectiveState || "Unknown" };
      if (isQuietHoursForState(effectiveState)) {
        skippedQuietHours.push(entry);
      } else {
        matches.push(entry);
      }
    }
  }

  return NextResponse.json({ matches, skippedQuietHours, checkedOn: today.toISOString().slice(0, 10) });
}
