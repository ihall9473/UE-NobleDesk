# UE NobleDesk — Team Setup Guide

**How this version works:** each coworker signs up themselves, connects
their own free Twilio account, and buys their own texting number — so
Twilio bills each person individually, not you. You (the admin) never touch
anyone's number or billing; you just watch usage and stats.

> **Already have this app deployed?** You just need one quick database
> update, not a full re-setup. In Supabase's SQL Editor, run:
> ```sql
> alter table contacts add column if not exists type text not null default 'lead' check (type in ('lead', 'client'));
> ```
> Then redeploy the updated code. Everything else (your team, contacts,
> messages, numbers) stays exactly as it was.

---

## Part 1: Supabase — database + team logins

1. Sign up at https://supabase.com, create a new project.
2. Go to **SQL Editor → New Query**, paste in this project's `schema.sql`
   file, and click Run.
3. Go to **Authentication → Providers** and make sure **Email** is enabled.
4. Go to **Authentication → URL Configuration** and add your site's
   `/set-password` address (e.g. `https://your-app.vercel.app/set-password`)
   under **Redirect URLs**. Required for the email-invite option to work.
5. Go to **Settings → API** and copy down the **Project URL**, **anon
   public key**, and **service_role key**.

---

## Part 2: Deploy the website (Vercel)

1. Push this project's files to a GitHub repository.
2. In Vercel, **Add New → Project**, import that repository.
3. Add these Environment Variables:

   | Name | Value |
   |---|---|
   | SUPABASE_URL | Supabase Project URL |
   | NEXT_PUBLIC_SUPABASE_URL | same value again |
   | SUPABASE_SERVICE_ROLE_KEY | Supabase service_role key |
   | SUPABASE_ANON_KEY | Supabase anon public key |
   | NEXT_PUBLIC_SUPABASE_ANON_KEY | same value again |
   | APP_INVITE_CODE | any code you choose — coworkers need this to sign up |
   | ADMIN_ACCESS_CODE | a separate code you choose — admins/managers need this to unlock the Admin page, on top of their role |
   | NEXT_PUBLIC_VAPID_PUBLIC_KEY | included in `.env.example`, keep as-is |
   | VAPID_PRIVATE_KEY | included in `.env.example`, keep as-is |
   | NEXT_PUBLIC_SITE_URL | your Vercel address, e.g. `https://your-app.vercel.app` |
   | ENCRYPTION_KEY | included in `.env.example`, keep as-is |

4. Click **Deploy**.

---

## Part 3: Make yourself the first admin

1. In Supabase, go to **Authentication → Users → Add User** and create
   yourself an account (set a password directly here, this first time only).
2. Go to **SQL Editor** and run, with your real email:
   ```sql
   insert into profiles (id, name, role)
   select id, 'Your Name', 'admin' from auth.users where email = 'you@example.com';
   ```
3. Log into your site. You'll see **Admin** and **Settings** tabs.

---

## Part 4: How coworkers join and pay for their own texting

Send coworkers **two things**: your site's `/signup` link, and your
`APP_INVITE_CODE`. From there, each person does this themselves:

1. **Creates their account** — name, email, password, your invite code.
2. **Connects their own Twilio account** (in **Settings** inside the app):
   - Signs up free at https://www.twilio.com/try-twilio
   - Adds a payment method on their Twilio account (their card, their bill)
   - Registers their business info under **Messaging → Regulatory
     Compliance → A2P 10DLC** — required before real-volume texting works.
     This can take a few days to a couple weeks to get approved.
   - Copies their **Account SID** and **Auth Token** from the Twilio
     Console into the app's Settings page.
3. **Buys their own number** right there in Settings — search by area code,
   click Buy. Costs about $1.15/month plus roughly $0.012–0.013 per text,
   charged to their own Twilio account, not yours.

No number gets bought or assigned by you. If someone hasn't finished this
setup, they'll simply see a message telling them to connect Twilio before
they can send texts — everything else in the app still works for them.

**Alternative:** you can still invite someone directly by email from the
Admin page instead of using the link — they still connect their own Twilio
account and number themselves in Settings either way.

---

## Part 5: Admin — tracking your team

Your **Admin** page shows every coworker with:
- Whether they've connected a number yet
- How many contacts they've added
- How many texts they've sent/received
- Their **response rate** — the percentage of people they've texted who
  texted them back — a rough gauge of how effective someone's outreach is

**Admins** can also promote people to Manager or Admin. **Managers** can
invite people and see all the same stats, but can't grant anyone (including
themselves) elevated access — only a true Admin can do that.

---

## Installing it on your phone (Add to Home Screen)

**iPhone:** open the site in **Safari** → Share icon → **Add to Home
Screen**. Must be Safari specifically, not an in-app browser (e.g. a link
opened inside Slack or Gmail).

**Android:** open the site in **Chrome** → **⋮ menu** → **Add to Home
Screen**.

Once installed, open the app icon, log in, and tap **Enable** when asked
about notifications. Test by having someone text your number — a
notification should arrive even with the app closed, and tapping it opens
that conversation directly.

The included app icon is a plain placeholder — happy to swap in real
branding whenever you're ready for that.

---

## Leads vs. Clients — now separate pages

**Leads** (`/leads`) is simple, on purpose — add someone, remove someone,
import a whole lead pack. Nothing more to fill in.

**Clients** (`/clients`) is your full book of business. Add a client (just
name + phone to start), then open their record to fill in everything else:

- Carrier, Policy Product (Whole Life / Term / IUL), Policy Number, Amount
  of Coverage, Monthly Premium, Draft Date
- Primary and Contingent Beneficiaries — add as many of each as needed
- Date of Birth (age is calculated automatically as you type it), Birth
  State, Health, Height, Weight
- Email, and full mailing Address — start typing the street address and
  matching suggestions appear; pick one and City/State/Zip fill in
  automatically (this uses a free address lookup service, no API key or
  billing setup needed)
- SSN and Bank info (Bank Name, Routing Number, Account Number) for premium
  drafting

**On a lead becoming a client:** click **"Move to Clients"** on the Leads
page — their message history comes with them, and they're ready for you to
fill in their full profile on the Clients page.

**Security note on SSN/bank fields:** these are encrypted before they're
ever saved to the database (see `ENCRYPTION_KEY` in `.env.example`) — even
someone with direct database access would only see scrambled text, not the
real numbers. That said, this app hasn't gone through a compliance audit,
and storing real client SSNs and bank account numbers may carry legal
obligations depending on your state and how your agency is licensed —
worth a quick check with whoever handles compliance before this goes live
with real data.

The **Leads / Clients** filter still appears on the **Send a Text** page,
so you can message just your leads, just your clients, or everyone.
Conversations are tagged too.

New people who text your number for the first time (before you've added
them) come in as **Leads** by default.

---

## Importing a lead pack from Google Sheets

On the **Leads** page, either:
- **Copy/paste directly** — select the relevant columns in your Google
  Sheet (First Name, Last Name, and Phone all in one selection works fine —
  it doesn't need to be exactly 2 columns), copy, and paste into the
  "Import a lead pack" box. No reformatting needed; it handles Google
  Sheets' copy format automatically, joins multiple name columns together,
  and skips a header row if there is one.
- **Upload a CSV** — in Google Sheets, go to **File → Download → CSV**, then
  upload that file directly on the Contacts page.

Either way, all 150 (or however many) leads get added in one click.

---

## Costs, per person

- Twilio number: ~$1.15/month
- Texting: ~$0.012–0.013 per text sent or received, all-in with carrier fees
- 10DLC campaign registration: typically $1.50–$10/month
- Supabase & Vercel: free tier covers your whole team comfortably

Since it's all on individual Twilio accounts, there's no company-wide
texting bill to manage — each person's usage is their own.

## If something breaks

Send me the exact error message, which step you were on, and I'll help you
fix it.
