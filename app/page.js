import Crest from "@/app/components/Crest";
import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

const TEXTING_FEATURES = [
  {
    title: "Leads & Clients, kept separate",
    body:
      "Leads stay simple - just a name and number. Once someone becomes a client, move them over and fill in their full policy details: carrier, product, coverage, premium, beneficiaries, and more.",
  },
  {
    title: "One-on-one texting, never a blast",
    body:
      "Every message goes out as its own individual text from your own number - never a group thread. Filter and sort recipients by lead/client, state, or time zone before you send.",
  },
  {
    title: "Bulk actions when you need them",
    body:
      "Select multiple leads at once to remove them or move them to Clients. Select-all works per state or time zone group when you're sending a text, too.",
  },
  {
    title: "Automatic occasion texts",
    body:
      "Set up birthday and holiday messages once, and NobleDesk sends them automatically - with the client's name filled in - while respecting quiet hours in their own time zone.",
  },
  {
    title: "Every conversation, tracked",
    body:
      "Replies land in Conversations automatically, tagged by lead or client, so nothing gets lost in a text thread on your personal phone.",
  },
  {
    title: "Your own Twilio number and billing",
    body:
      "Connect your own Twilio account in Settings - your number, your billing, your data. NobleDesk never buys a number or sends a text on your behalf without you.",
  },
];

const CRM_FEATURES = [
  {
    title: "Leads & Clients, kept separate",
    body:
      "Leads stay simple - just a name and number. Once someone becomes a client, move them over and fill in their full policy details: carrier, product, coverage, premium, beneficiaries, and more.",
  },
  {
    title: "Bulk actions when you need them",
    body: "Select multiple leads at once to remove them or move them to Clients.",
  },
  {
    title: "A full Carriers directory",
    body: "Phone numbers, login info, and agent commissions for every carrier you write with, in one place.",
  },
  {
    title: "Know your upline and downline",
    body:
      "Invite people into your own downline with a personal link, see who invited you, and see everyone you've brought in on the My Team page.",
  },
];

const TEXTING_QUICK_LINKS = [
  { href: "/leads", label: "Leads" },
  { href: "/clients", label: "Clients" },
  { href: "/compose", label: "Send a Text" },
  { href: "/conversations", label: "Conversations" },
  { href: "/occasions", label: "Occasions" },
  { href: "/settings", label: "Settings" },
];

const CRM_QUICK_LINKS = [
  { href: "/leads", label: "Leads" },
  { href: "/clients", label: "Clients" },
  { href: "/clients/sheet", label: "Client Sheet" },
  { href: "/carriers", label: "Carriers" },
  { href: "/team", label: "My Team" },
];

export default function HomePage() {
  const FEATURES = TEXTING_ENABLED ? TEXTING_FEATURES : CRM_FEATURES;
  const QUICK_LINKS = TEXTING_ENABLED ? TEXTING_QUICK_LINKS : CRM_QUICK_LINKS;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Crest size={56} glow />
        </div>
        <p
          style={{
            color: "#c9a227",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          The Upper Echelon
        </p>
        <h1 className="full-width-underline" style={{ display: "inline-block", fontSize: "clamp(38px, 7vw, 72px)" }}>
          Welcome to{" "}
          <span className="login-wordmark" style={{ fontStyle: "italic" }}>
            {APP_NAME}
          </span>
        </h1>
        <p className="subtitle" style={{ maxWidth: 560, margin: "0 auto" }}>
          {TEXTING_ENABLED
            ? "Your all-in-one texting command center for insurance leads and clients - built so you can focus on the conversation, not the busywork around it."
            : "Your all-in-one command center for insurance leads and clients - built so you can focus on the relationship, not the busywork around it."}
        </p>
      </div>

      <div className="card">
        <h3>Get around quickly</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #d9b94a, #c9a227)",
                color: "#0e0e0f",
                fontWeight: 700,
                fontSize: 14,
                padding: "10px 18px",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: 32 }}>What {APP_NAME} does</h3>
      {FEATURES.map((f) => (
        <div className="card" key={f.title}>
          <h3 style={{ marginBottom: 6 }}>{f.title}</h3>
          <p className="subtitle" style={{ marginBottom: 0 }}>{f.body}</p>
        </div>
      ))}

      <div className="card">
        <h3>New here? Start with these steps</h3>
        {TEXTING_ENABLED ? (
          <ol className="subtitle" style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Connect your Twilio account and buy your texting number in <a href="/settings">Settings</a>.
            </li>
            <li style={{ marginBottom: 8 }}>
              Add your first leads on the <a href="/leads">Leads</a> page - one at a time, or paste in a whole list.
            </li>
            <li style={{ marginBottom: 8 }}>
              Send your first text from <a href="/compose">Send a Text</a>.
            </li>
            <li>
              Set up birthday and holiday reminders under <a href="/occasions">Occasions</a>.
            </li>
          </ol>
        ) : (
          <ol className="subtitle" style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Add your first leads on the <a href="/leads">Leads</a> page - one at a time, or paste in a whole list.
            </li>
            <li style={{ marginBottom: 8 }}>
              Once someone signs a policy, move them to <a href="/clients">Clients</a> and fill out
              their <a href="/clients/sheet">Client Sheet</a>.
            </li>
            <li style={{ marginBottom: 8 }}>
              Look up carrier phone numbers and logins any time on the <a href="/carriers">Carriers</a> page.
            </li>
            <li>
              Get your personal invite link and see your team on the <a href="/team">My Team</a> page.
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}
