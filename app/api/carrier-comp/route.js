import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("carrier_comp_rates")
    .select("carrier_id, comp_percentage")
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rates = {};
  for (const row of data) {
    rates[row.carrier_id] = row.comp_percentage;
  }
  return NextResponse.json({ rates });
}

export async function PUT(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { carrierId, compPercentage } = await req.json();
  if (!carrierId) return NextResponse.json({ error: "Missing carrierId" }, { status: 400 });

  const pct = Number(compPercentage);
  if (isNaN(pct) || pct < 0 || pct > 100) {
    return NextResponse.json({ error: "Comp percentage must be between 0 and 100." }, { status: 400 });
  }

  const { error } = await supabase
    .from("carrier_comp_rates")
    .upsert(
      {
        owner_id: user.id,
        carrier_id: carrierId,
        comp_percentage: pct,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,carrier_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
