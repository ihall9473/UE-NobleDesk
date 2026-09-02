import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { nextDraftInfo } from "@/lib/draftDate";
import { daysUntilConversion } from "@/lib/termConversion";
import { daysUntilAnniversary } from "@/lib/policyAnniversary";

const DRAFT_WARNING_DAYS = 5;
const CONVERSION_WARNING_DAYS = 60;
const ANNIVERSARY_WARNING_DAYS = 30;
const BENEFICIARY_REVIEW_DAYS = 365;
const NEGLECTED_DAYS = 180;
const LIFE_EVENT_WINDOW_DAYS = 30;

function daysAgo(isoTimestamp) {
  if (!isoTimestamp) return Infinity;
  return Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 86400000);
}

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const [{ data: clients, error }, { data: activity, error: activityErr }, { data: outbound, error: outboundErr }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("id, name, phone, created_at, client_details(*)")
        .eq("owner_id", user.id)
        .eq("type", "client")
        .is("deleted_at", null),
      supabase.from("activity_log").select("contact_id, kind, body, created_at").eq("owner_id", user.id),
      supabase.from("messages").select("contact_id, created_at").eq("owner_id", user.id).eq("direction", "outbound"),
    ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (activityErr) return NextResponse.json({ error: activityErr.message }, { status: 500 });
  if (outboundErr) return NextResponse.json({ error: outboundErr.message }, { status: 500 });

  // Most recent touch of any kind (note/call/meeting/text) per contact -
  // used for the neglected-policy check below.
  const lastTouchByContact = {};
  for (const row of [...(activity || []), ...(outbound || [])]) {
    if (!lastTouchByContact[row.contact_id] || row.created_at > lastTouchByContact[row.contact_id]) {
      lastTouchByContact[row.contact_id] = row.created_at;
    }
  }

  const withDetails = (clients || []).map((c) => ({
    ...c,
    client_details: Array.isArray(c.client_details) ? c.client_details[0] : c.client_details,
  }));

  const upcomingDrafts = withDetails
    .map((c) => ({ client: c, draft: nextDraftInfo(c.client_details?.draft_date) }))
    .filter(({ draft }) => draft && draft.daysUntil >= 0 && draft.daysUntil <= DRAFT_WARNING_DAYS)
    .sort((a, b) => a.draft.daysUntil - b.draft.daysUntil);

  const upcomingConversions = withDetails
    .map((c) => ({ client: c, daysUntil: daysUntilConversion(c.client_details?.term_conversion_deadline) }))
    .filter(({ daysUntil }) => daysUntil !== null && daysUntil >= 0 && daysUntil <= CONVERSION_WARNING_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const upcomingAnniversaries = withDetails
    .map((c) => ({ client: c, anniversary: daysUntilAnniversary(c.client_details?.application_submitted_date) }))
    .filter(
      ({ anniversary, client }) =>
        anniversary && anniversary.daysUntil <= ANNIVERSARY_WARNING_DAYS &&
        (client.client_details?.policy_status || "active") === "active"
    )
    .sort((a, b) => a.anniversary.daysUntil - b.anniversary.daysUntil);

  const atRiskPolicies = withDetails
    .filter((c) => ["lapsed", "chargeback"].includes(c.client_details?.policy_status))
    .sort((a, b) => a.name.localeCompare(b.name));

  const beneficiaryReviewNeeded = withDetails
    .filter((c) => (c.client_details?.policy_status || "active") === "active")
    .filter((c) => {
      const d = c.client_details || {};
      const hasNoBeneficiaries = !d.primary_beneficiaries || d.primary_beneficiaries.length === 0;
      const neverReviewed = !d.beneficiaries_reviewed_at;
      const staleReview = d.beneficiaries_reviewed_at && daysAgo(d.beneficiaries_reviewed_at) > BENEFICIARY_REVIEW_DAYS;
      return hasNoBeneficiaries || neverReviewed || staleReview;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const neglectedPolicies = withDetails
    .filter((c) => (c.client_details?.policy_status || "active") === "active")
    .map((c) => ({ client: c, daysSinceTouch: daysAgo(lastTouchByContact[c.id] || c.created_at) }))
    .filter(({ daysSinceTouch }) => daysSinceTouch >= NEGLECTED_DAYS)
    .sort((a, b) => b.daysSinceTouch - a.daysSinceTouch);

  const byId = Object.fromEntries(withDetails.map((c) => [c.id, c]));
  const lifeEvents = (activity || [])
    .filter((a) => a.kind === "life_event" && daysAgo(a.created_at) <= LIFE_EVENT_WINDOW_DAYS)
    .map((a) => ({ client: byId[a.contact_id], body: a.body, created_at: a.created_at }))
    .filter((e) => e.client)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const placedPolicies = withDetails.filter((c) => !!c.client_details?.carrier);
  const activePolicies = placedPolicies.filter((c) => (c.client_details?.policy_status || "active") === "active");
  const persistencyRate = placedPolicies.length > 0 ? (activePolicies.length / placedPolicies.length) * 100 : null;

  return NextResponse.json({
    upcomingDrafts: upcomingDrafts.map(({ client, draft }) => ({ client, daysUntil: draft.daysUntil })),
    upcomingConversions: upcomingConversions.map(({ client, daysUntil }) => ({ client, daysUntil })),
    upcomingAnniversaries: upcomingAnniversaries.map(({ client, anniversary }) => ({
      client,
      daysUntil: anniversary.daysUntil,
      years: anniversary.years,
    })),
    atRiskPolicies,
    beneficiaryReviewNeeded,
    neglectedPolicies: neglectedPolicies.map(({ client, daysSinceTouch }) => ({ client, daysSinceTouch })),
    lifeEvents,
    persistencyRate,
    placedPolicyCount: placedPolicies.length,
    activePolicyCount: activePolicies.length,
  });
}
