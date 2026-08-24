import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/set-password") ||
    pathname.startsWith("/api/signup") ||
    pathname.startsWith("/api/webhook") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // The Admin page and the "frozen account" restriction both need this
  // person's role/frozen status - only fetch it when actually needed, so
  // ordinary page loads don't pay for an extra query.
  const isMutating = req.method !== "GET" && req.method !== "HEAD";
  if (pathname.startsWith("/admin") || isMutating) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, frozen")
      .eq("id", user.id)
      .single();

    if (pathname.startsWith("/admin") && profile?.role !== "admin" && profile?.role !== "manager") {
      const url = req.nextUrl.clone();
      url.pathname = "/leads";
      return NextResponse.redirect(url);
    }

    if (isMutating && profile?.frozen) {
      return NextResponse.json(
        { error: "Your account has been frozen. You can view existing data, but can't make changes. Contact your admin." },
        { status: 403 }
      );
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
