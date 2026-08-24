import { NextResponse } from "next/server";

// A second, separate code that unlocks the Admin page - on top of the
// existing admin/manager role check. Remembered per-browser for 12 hours
// via a cookie so people don't have to re-enter it constantly.
export async function POST(req) {
  const { code } = await req.json();

  if (!code || code !== (process.env.ADMIN_ACCESS_CODE || "UpperEchelonAdmin")) {
    return NextResponse.json({ error: "That code isn't right." }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_unlocked", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
