import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Admins and managers can both do day-to-day team management.
async function requireStaff() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in", status: 401 };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "manager") {
    return { error: "Admins and managers only", status: 403 };
  }

  return { profile };
}

export async function GET() {
  const check = await requireStaff();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pull usage + response rate stats so the admin can see who's actually
  // using the app and how effective their outreach is.
  const [{ data: contacts }, { data: messages }] = await Promise.all([
    supabaseAdmin.from("contacts").select("owner_id"),
    supabaseAdmin.from("messages").select("owner_id, contact_id, direction"),
  ]);

  const contactTotals = {};
  (contacts || []).forEach((c) => {
    contactTotals[c.owner_id] = (contactTotals[c.owner_id] || 0) + 1;
  });

  // For each user: which contacts did they text (outbound), and which of
  // those texted back (inbound)? Response rate = replied / texted.
  const contactedByUser = {}; // owner_id -> Set(contact_id)
  const respondedByUser = {}; // owner_id -> Set(contact_id)
  const messageCounts = {};

  (messages || []).forEach((m) => {
    messageCounts[m.owner_id] = (messageCounts[m.owner_id] || 0) + 1;
    if (m.direction === "outbound") {
      contactedByUser[m.owner_id] = contactedByUser[m.owner_id] || new Set();
      contactedByUser[m.owner_id].add(m.contact_id);
    } else {
      respondedByUser[m.owner_id] = respondedByUser[m.owner_id] || new Set();
      respondedByUser[m.owner_id].add(m.contact_id);
    }
  });

  const team = profiles.map((p) => {
    const contacted = contactedByUser[p.id] || new Set();
    const responded = [...(respondedByUser[p.id] || [])].filter((id) => contacted.has(id));
    const responseRate = contacted.size > 0 ? Math.round((responded.length / contacted.size) * 100) : null;

    return {
      ...p,
      twilio_auth_token: undefined, // never send tokens to the browser
      hasTwilioConnected: !!p.twilio_account_sid,
      contactCount: contactTotals[p.id] || 0,
      messageCount: messageCounts[p.id] || 0,
      responseRate, // null = no outbound texts sent yet
    };
  });

  // Let the frontend know whether the current person is a true admin,
  // so it can show/hide the ability to grant admin/manager roles.
  return NextResponse.json({
    team,
    myRole: check.profile.role,
    inviteCode: process.env.APP_INVITE_CODE || "UpperEchelon",
  });
}

// Creates a brand-new coworker login (alternative to self-serve signup).
// They'll get an email to set their own password, then connect their own
// Twilio account and number themselves in Settings.
export async function POST(req) {
  const check = await requireStaff();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { name, email, role } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Only true admins can create another admin or manager. Managers can only add regular agents.
  const requestedRole = role === "admin" || role === "manager" ? role : "agent";
  if (requestedRole !== "agent" && check.profile.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can grant admin or manager access." },
      { status: 403 }
    );
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/set-password` }
  );
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

  const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
    id: created.user.id,
    name,
    role: requestedRole,
  });

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Change a coworker's role, and/or freeze/unfreeze their account.
// (Numbers/Twilio are self-managed now, in Settings.)
export async function PATCH(req) {
  const check = await requireStaff();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { userId, role, frozen } = await req.json();

  if (userId === check.profile.id) {
    return NextResponse.json(
      { error: "You can't change your own role or freeze your own account." },
      { status: 400 }
    );
  }

  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!target) return NextResponse.json({ error: "That person wasn't found." }, { status: 404 });

  const update = {};

  if (role !== undefined) {
    // Only true admins can change anyone's role.
    if (check.profile.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can change someone's role." },
        { status: 403 }
      );
    }
    update.role = role;
  }

  if (frozen !== undefined) {
    // Admins/managers can freeze someone if they're fired or need their
    // access paused - they can still log in and view data, just not
    // change anything. Managers can only freeze/unfreeze regular agents.
    // Nobody can freeze an admin from here.
    if (target.role === "admin") {
      return NextResponse.json({ error: "Admins can't be frozen from here." }, { status: 403 });
    }
    if (check.profile.role === "manager" && target.role !== "agent") {
      return NextResponse.json(
        { error: "Managers can only freeze or unfreeze agents." },
        { status: 403 }
      );
    }
    update.frozen = frozen;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
