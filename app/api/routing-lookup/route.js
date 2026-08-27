import { NextResponse } from "next/server";

// Looks up a bank's name from its 9-digit ABA routing number, using the
// free public routingnumbers.info API (no key/billing needed). Best-effort -
// the bank name field always stays editable in the form either way.
export async function GET(req) {
  const rn = (req.nextUrl.searchParams.get("rn") || "").replace(/\D/g, "");
  if (rn.length !== 9) {
    return NextResponse.json({ error: "Routing number must be 9 digits" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.routingnumbers.info/api/data.json?rn=${rn}`);
    const data = await res.json();
    const bankName = data?.customer_name || null;
    if (!bankName) return NextResponse.json({ bankName: null });
    return NextResponse.json({ bankName });
  } catch {
    return NextResponse.json({ bankName: null });
  }
}
