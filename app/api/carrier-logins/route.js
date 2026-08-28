import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("carrier_logins")
    .select("*")
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logins = {};
  for (const row of data) {
    logins[row.carrier_id] = {
      username: row.username || "",
      password: row.password_encrypted ? decrypt(row.password_encrypted) : "",
    };
  }
  return NextResponse.json({ logins });
}

export async function PUT(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { carrierId, username, password } = await req.json();
  if (!carrierId) return NextResponse.json({ error: "Missing carrierId" }, { status: 400 });

  const { error } = await supabase
    .from("carrier_logins")
    .upsert(
      {
        owner_id: user.id,
        carrier_id: carrierId,
        username: username || "",
        password_encrypted: password ? encrypt(password) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,carrier_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
