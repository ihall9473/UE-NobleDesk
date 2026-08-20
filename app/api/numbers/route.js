import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { twilioClientFor } from "@/lib/twilio";

async function getSelfWithTwilio() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in", status: 401 };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const client = twilioClientFor(profile);
  if (!client) {
    return {
      error: "Connect your own Twilio account in Settings first.",
      status: 400,
    };
  }
  return { supabase, profile, client };
}

// Search for numbers to buy, by area code, using this person's own Twilio account.
export async function GET(req) {
  const check = await getSelfWithTwilio();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const areaCode = req.nextUrl.searchParams.get("areaCode");
  if (!areaCode) return NextResponse.json({ error: "Area code required" }, { status: 400 });

  try {
    const numbers = await check.client
      .availablePhoneNumbers("US")
      .local.list({ areaCode, smsEnabled: true, limit: 10 });

    return NextResponse.json({
      numbers: numbers.map((n) => ({ phoneNumber: n.phoneNumber, friendlyName: n.friendlyName })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Buy a number - charged to THIS person's own Twilio account balance,
// then automatically saved as their number in the app.
export async function POST(req) {
  const check = await getSelfWithTwilio();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { phoneNumber } = await req.json();
  if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  try {
    const purchased = await check.client.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/twilio`,
      smsMethod: "POST",
    });

    await check.supabase
      .from("profiles")
      .update({ twilio_number: purchased.phoneNumber })
      .eq("id", check.profile.id);

    return NextResponse.json({ phoneNumber: purchased.phoneNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
