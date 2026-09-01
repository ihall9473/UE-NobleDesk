import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseCurrency } from "@/lib/formatCurrency";

// Sums up "Families Protected" (one per policy on file), "Submitted
// Business" (total annualized premium), and "Total Monthly Premium"
// across whichever owner_ids are passed in.
function productionTotals(clientDetails, ownerIds) {
  const ids = new Set(ownerIds);
  const rows = clientDetails.filter((c) => ids.has(c.owner_id));
  const totalMonthlyPremium = rows.reduce((sum, c) => sum + parseCurrency(c.monthly_premium), 0);
  return {
    familiesProtected: rows.length,
    submittedBusiness: totalMonthlyPremium * 12,
    totalMonthlyPremium,
  };
}

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // Regular RLS only lets someone see their own profile row, so this needs
  // the admin client - but only name/role/created_at ever leave this route.
  const { data: all, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, role, invited_by, created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byId = Object.fromEntries(all.map((p) => [p.id, p]));
  const me = byId[user.id];
  const upline = me?.invited_by ? byId[me.invited_by] : null;

  const childrenOf = {};
  for (const p of all) {
    if (p.invited_by) (childrenOf[p.invited_by] ||= []).push(p);
  }

  function buildTree(id) {
    return (childrenOf[id] || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        created_at: p.created_at,
        children: buildTree(p.id),
      }));
  }

  const downline = buildTree(user.id);

  // Every id under me, at any depth - for rolling up production totals
  // across the whole downline, not just direct invites.
  function flatten(nodes) {
    return nodes.flatMap((n) => [n.id, ...flatten(n.children)]);
  }
  const downlineIds = flatten(downline);

  const { data: clientDetails, error: cdError } = await supabaseAdmin
    .from("client_details")
    .select("owner_id, monthly_premium")
    .in("owner_id", [user.id, ...downlineIds]);
  if (cdError) return NextResponse.json({ error: cdError.message }, { status: 500 });

  return NextResponse.json({
    me: me ? { id: me.id, name: me.name, role: me.role } : { id: user.id, name: "", role: "agent" },
    upline: upline ? { id: upline.id, name: upline.name, role: upline.role } : null,
    downline,
    inviteCode: process.env.APP_INVITE_CODE || "UpperEchelon",
    myProduction: productionTotals(clientDetails, [user.id]),
    downlineProduction: productionTotals(clientDetails, downlineIds),
  });
}
