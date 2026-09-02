-- Run this in Supabase's SQL Editor. Replaces the old single-user schema.

-- One row per person who can log in. Created automatically when an admin adds them.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'agent' check (role in ('admin', 'manager', 'agent')),
  twilio_number text unique, -- e.g. +15551234567, bought by this person themselves
  twilio_account_sid text, -- this person's OWN Twilio account - their own billing
  twilio_auth_token text,
  business_name text, -- DBA/friendly name as registered with Twilio's A2P Brand, if different from `name`
  created_at timestamptz default now()
);

-- Already deployed this app before business_name existed? Safe to re-run
-- any time - adds it without losing any existing profile data:
alter table profiles add column if not exists business_name text;

-- Every number an agent owns in their Twilio account, not just the one
-- currently active. Lets them register/keep several numbers (e.g. one per
-- A2P campaign) and switch which one is used for new outbound texts.
create table if not exists phone_numbers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  phone_number text not null unique,
  label text,
  created_at timestamptz default now()
);

create index if not exists phone_numbers_owner_id_idx on phone_numbers(owner_id);

alter table phone_numbers enable row level security;

drop policy if exists "Users manage their own phone numbers" on phone_numbers;
create policy "Users manage their own phone numbers" on phone_numbers
  for all using (auth.uid() = owner_id);

-- Each contact belongs to exactly one coworker.
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  type text not null default 'lead' check (type in ('lead', 'client')),
  state text, -- quick state reference (e.g. for leads); separate from client_details.state (mailing address)
  sms_consent boolean not null default true, -- false only when someone explicitly declined the texting checkbox on the public Request Info form
  created_at timestamptz default now(),
  deleted_at timestamptz, -- soft delete: set instead of actually deleting, so "Undo" can restore
  unique(owner_id, phone)
);

-- Already deployed this app before the "state" column existed? Safe to
-- re-run any time - adds it without losing any existing contacts:
alter table contacts add column if not exists state text;

-- Already deployed this app before "sms_consent" existed? Safe to re-run
-- any time - adds it (defaulting existing contacts to true, since they
-- predate this being tracked) without losing any existing contacts:
alter table contacts add column if not exists sms_consent boolean not null default true;

-- Already deployed this app before multiple numbers existed? This adds the
-- new column without losing any existing contacts, then the two
-- statements below bring your existing number into the new table and tag
-- your existing conversations with it. All safe to re-run.
alter table contacts add column if not exists twilio_number text; -- which of the agent's numbers this conversation is happening on

insert into phone_numbers (owner_id, phone_number)
  select id, twilio_number from profiles where twilio_number is not null
  on conflict (phone_number) do nothing;

update contacts set twilio_number = (
  select twilio_number from profiles where profiles.id = contacts.owner_id
) where twilio_number is null;

-- If you already ran this schema before this column existed, safe to
-- re-run any time - adds it without losing any existing contacts:
alter table contacts add column if not exists type text not null default 'lead' check (type in ('lead', 'client'));

-- Already deployed this app before the "deleted_at" column existed? Safe
-- to re-run any time - adds it without losing any existing contacts:
alter table contacts add column if not exists deleted_at timestamptz;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  owner_id uuid references profiles(id) on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  body text not null,
  created_at timestamptz default now()
);

create index if not exists messages_contact_id_idx on messages(contact_id);
create index if not exists contacts_owner_id_idx on contacts(owner_id);
create index if not exists profiles_twilio_number_idx on profiles(twilio_number);

-- Full policy/underwriting details for a client, one row per contact of
-- type 'client'. Kept separate from `contacts` since leads never need
-- these fields. SSN and bank numbers are stored encrypted (see lib/encryption.js) -
-- this column just holds the encrypted text, never the real number.
create table if not exists client_details (
  contact_id uuid primary key references contacts(id) on delete cascade,
  owner_id uuid references profiles(id) on delete cascade,
  carrier text,
  policy_product text check (policy_product in ('Whole Life', 'Term', 'IUL')),
  graded boolean, -- only meaningful when policy_product = 'Whole Life'
  coverage_amount text,
  monthly_premium text,
  policy_number text,
  policy_type text check (policy_type in ('first_write', 'policy_flip')),
  original_carrier text, -- only set when policy_type = 'policy_flip'
  draft_date text,
  effective_date date,
  application_submitted_date date default current_date,
  primary_beneficiaries jsonb not null default '[]'::jsonb, -- [{name, relationship, percentage}, ...]
  contingent_beneficiaries jsonb not null default '[]'::jsonb,
  date_of_birth date,
  birth_state text,
  smoker boolean,
  email text,
  address_line text,
  apt_unit text,
  city text,
  state text,
  zip text,
  ssn_encrypted text,
  health text,
  height text,
  weight text,
  is_owner boolean default true,
  owner_first_name text, -- only set when is_owner = false
  owner_last_name text,
  owner_relationship text,
  account_type text check (account_type in ('checking', 'savings', 'direct_express')),
  bank_name text,
  routing_number_encrypted text,
  account_number_encrypted text,
  updated_at timestamptz default now()
);

alter table client_details enable row level security;

drop policy if exists "Users manage their own client details" on client_details;
create policy "Users manage their own client details" on client_details
  for all using (auth.uid() = owner_id);

-- Already deployed this app before the Client Sheet fields existed? These
-- add the new columns without losing any existing client data - safe to
-- re-run any time, including as part of pasting this whole file again.
alter table client_details add column if not exists graded boolean;
alter table client_details add column if not exists policy_type text check (policy_type in ('first_write', 'policy_flip'));
alter table client_details add column if not exists original_carrier text;
alter table client_details add column if not exists smoker boolean;
alter table client_details add column if not exists apt_unit text;
alter table client_details add column if not exists is_owner boolean default true;
alter table client_details add column if not exists owner_first_name text;
alter table client_details add column if not exists owner_last_name text;
alter table client_details add column if not exists owner_relationship text;
alter table client_details add column if not exists account_type text check (account_type in ('checking', 'savings', 'direct_express'));
alter table client_details add column if not exists effective_date date;

-- Already deployed this app before "direct_express" was an account type
-- option? Run these two lines by themselves to widen the existing check
-- constraint without losing any existing client data:
alter table client_details drop constraint if exists client_details_account_type_check;
alter table client_details add constraint client_details_account_type_check
  check (account_type in ('checking', 'savings', 'direct_express'));

-- Underwriting pipeline stage - tracked separately from policy_status
-- below, since a policy only reaches "placed" once, while policy_status
-- keeps tracking its health for as long as it's in force after that.
alter table client_details add column if not exists underwriting_stage text
  check (underwriting_stage in (
    'applied', 'paramed_scheduled', 'paramed_complete', 'aps_requested',
    'underwriting', 'approved', 'rated', 'declined', 'placed'
  ))
  default 'applied';

-- Ongoing in-force health of a placed policy - lets an agent flag
-- something as lapsed/chargeback risk without waiting for real payment
-- data (this app doesn't process drafts, so this is set by the agent).
alter table client_details add column if not exists policy_status text not null default 'active'
  check (policy_status in ('active', 'lapsed', 'chargeback', 'cancelled'));

-- Whether the agent's own commission on this policy has actually been
-- paid out yet - splits Expected Payout on My Team into pending vs paid.
alter table client_details add column if not exists commission_status text not null default 'pending'
  check (commission_status in ('pending', 'paid'));

-- Only meaningful when policy_product = 'Term' - the date this term
-- policy stops being convertible to permanent coverage. Missing this
-- deadline loses the client's conversion option permanently.
alter table client_details add column if not exists term_conversion_deadline date;

-- Already deployed this app before client_details existed? Just run the
-- create table statement above by itself (it's safe to run again - "if not
-- exists" - and won't touch your existing contacts, messages, or numbers).

-- Already have client_details but missing the newer application_submitted_date
-- column? Safe to re-run any time:
alter table client_details add column if not exists application_submitted_date date default current_date;

-- Stores each phone/browser that's installed the app and allowed notifications.
-- A person can have more than one (e.g. installed on two phones).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on push_subscriptions;
create policy "Users manage their own push subscriptions" on push_subscriptions
  for all using (auth.uid() = owner_id);

-- Feedback/suggestions from the little box in the corner of the app.
-- Anyone can submit one; only admins/managers can read the list back
-- (enforced in the API route, not RLS, since it needs everyone's name too).
create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

alter table suggestions enable row level security;

drop policy if exists "Users submit their own suggestions" on suggestions;
create policy "Users submit their own suggestions" on suggestions
  for insert with check (auth.uid() = owner_id);

-- Already deployed this app before the suggestions box existed? Just run
-- the create table + policy statements above by themselves - safe to run
-- again ("if not exists") and won't touch anything else.

-- Reusable message templates (e.g. "missed call follow-up", "quote
-- follow-up") - picked from a dropdown on Send a Text and in a
-- conversation reply, instead of retyping the same message every time.
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  body text not null,
  created_at timestamptz default now()
);

alter table templates enable row level security;

drop policy if exists "Users manage their own templates" on templates;
create policy "Users manage their own templates" on templates
  for all using (auth.uid() = owner_id);

-- Already deployed this app before message templates existed? Just run
-- the create table + policy statements above by themselves.

-- Per-agent carrier login credentials, shown on the Carriers directory page.
-- Username is stored as plain text; password is encrypted at rest (see
-- lib/encryption.js) but decrypted and shown unmasked in the UI on purpose -
-- agents need to read these back at a glance, unlike SSNs/bank numbers.
create table if not exists carrier_logins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  carrier_id text not null,
  username text,
  password_encrypted text,
  updated_at timestamptz default now(),
  unique (owner_id, carrier_id)
);

alter table carrier_logins enable row level security;

drop policy if exists "Users manage their own carrier logins" on carrier_logins;
create policy "Users manage their own carrier logins" on carrier_logins
  for all using (auth.uid() = owner_id);

-- Already deployed this app before the Carriers page existed? Just run
-- the create table + policy statements above by themselves.

-- Each agent's own negotiated commission percentage with each carrier -
-- different agents can have different comp levels with the same carrier.
-- Used to estimate expected payout: annual premium x comp_percentage,
-- summed across an agent's written business. One row per agent per
-- carrier; carrier_id matches lib/carriers.js's ids, same as carrier_logins.
create table if not exists carrier_comp_rates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  carrier_id text not null,
  comp_percentage numeric not null check (comp_percentage >= 0 and comp_percentage <= 100),
  updated_at timestamptz default now(),
  unique (owner_id, carrier_id)
);

alter table carrier_comp_rates enable row level security;

drop policy if exists "Users manage their own comp rates" on carrier_comp_rates;
create policy "Users manage their own comp rates" on carrier_comp_rates
  for all using (auth.uid() = owner_id);

-- Already deployed this app before comp rates existed? Just run the
-- create table + policy statements above by themselves.

-- Which states each agent is currently licensed/appointed in. A row's
-- existence means "licensed" - there's nothing else to store per state
-- yet (renewal dates etc. can be added later), so no boolean column.
create table if not exists licensed_states (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  state text not null,
  created_at timestamptz default now(),
  unique (owner_id, state)
);

alter table licensed_states enable row level security;

drop policy if exists "Users manage their own licensed states" on licensed_states;
create policy "Users manage their own licensed states" on licensed_states
  for all using (auth.uid() = owner_id);

-- Already deployed this app before licensed_states existed? Just run
-- the create table + policy statements above by themselves.

-- Birthday/holiday/policy-anniversary auto-texts, configured on the
-- Occasions page. `kind` drives how the date is resolved each year:
-- 'fixed' (month+day), 'floating' (month+weekday+occurrence, e.g. "3rd
-- Monday of January"), 'easter', or the two per-contact kinds
-- 'birthday'/'policy_anniversary' (no fixed date - resolved per contact
-- from client_details).
create table if not exists occasions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('birthday', 'fixed', 'floating', 'easter', 'policy_anniversary')),
  month integer,
  day integer,
  weekday integer,
  occurrence integer,
  enabled boolean not null default true,
  message text not null default '',
  created_at timestamptz default now()
);

alter table occasions enable row level security;

drop policy if exists "Users manage their own occasions" on occasions;
create policy "Users manage their own occasions" on occasions
  for all using (auth.uid() = owner_id);

-- One row per occasion actually texted to a contact on a given date -
-- lets the daily cron job (see app/api/cron/occasions) skip a contact
-- it already texted today instead of double-sending.
create table if not exists occasion_sends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  occasion_id uuid references occasions(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  sent_date date not null,
  created_at timestamptz default now(),
  unique (occasion_id, contact_id, sent_date)
);

alter table occasion_sends enable row level security;

drop policy if exists "Users manage their own occasion sends" on occasion_sends;
create policy "Users manage their own occasion sends" on occasion_sends
  for all using (auth.uid() = owner_id);

-- Already deployed this app before Occasions existed? Just run the two
-- create table + policy blocks above by themselves - safe to run again
-- ("if not exists") and won't touch anything else.

-- Row Level Security: makes sure people can only ever see their own data,
-- even if there were ever a bug in the app code.
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table messages enable row level security;

drop policy if exists "Users see their own profile" on profiles;
create policy "Users see their own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users update their own profile" on profiles;
create policy "Users update their own profile" on profiles
  for update using (auth.uid() = id);

drop policy if exists "Users manage their own contacts" on contacts;
create policy "Users manage their own contacts" on contacts
  for all using (auth.uid() = owner_id);

drop policy if exists "Users manage their own messages" on messages;
create policy "Users manage their own messages" on messages
  for all using (auth.uid() = owner_id);

-- The very first admin account: after you sign in once through Supabase Auth
-- (see README), run this with your own email to make yourself an admin.
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');

-- Already deployed this app before the "member" role was renamed to "agent"?
-- Safe to re-run any time - migrates existing rows and the check
-- constraint without losing any data:
alter table profiles drop constraint if exists profiles_role_check;
update profiles set role = 'agent' where role = 'member';
alter table profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'agent'));
alter table profiles alter column role set default 'agent';

-- Who invited this person (their "upline"). Set from their personal
-- referral link (/signup?ref=<user id>) at signup, or to the inviting
-- admin/manager's own id when added directly from Team Admin. Null for
-- anyone who signed up without a referral link.
alter table profiles add column if not exists invited_by uuid references profiles(id) on delete set null;
create index if not exists profiles_invited_by_idx on profiles(invited_by);

-- Whether this person has ever sent their personal "Invite Downline"
-- link. The My Team nav tab stays hidden for agents until this flips to
-- true (managers/admins always see it), so the nav doesn't clutter up
-- for agents who aren't building a downline.
alter table profiles add column if not exists has_invited boolean not null default false;

-- Follow-up to-dos, optionally tied to a lead or client (contact_id null
-- means a general task with nothing to link to). Powers the Tasks page and
-- quick "call back in 3 days" reminders.
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists tasks_owner_id_idx on tasks(owner_id);
create index if not exists tasks_contact_id_idx on tasks(contact_id);

alter table tasks enable row level security;

drop policy if exists "Users manage their own tasks" on tasks;
create policy "Users manage their own tasks" on tasks
  for all using (auth.uid() = owner_id);

-- Manually-logged activity (calls, meetings, notes, life events) on a
-- contact - kept separate from `messages`, which is only actual SMS
-- history, so the timeline can show the whole relationship, not just texts.
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'call', 'meeting', 'life_event')),
  body text not null,
  created_at timestamptz default now()
);

create index if not exists activity_log_contact_id_idx on activity_log(contact_id);

alter table activity_log enable row level security;

drop policy if exists "Users manage their own activity log" on activity_log;
create policy "Users manage their own activity log" on activity_log
  for all using (auth.uid() = owner_id);

-- Which stage of the sales process a lead is in. Kept on `contacts` (not
-- just leads) so the stage history survives conversion to a client. Every
-- new contact starts at 'new', regardless of type.
alter table contacts add column if not exists pipeline_stage text not null default 'new'
  check (pipeline_stage in ('new', 'contacted', 'quoted', 'applied', 'issued'));

-- A reusable automated text sequence for nurturing cold leads. `steps` is
-- an ordered jsonb array of { delayDays, message }, where delayDays counts
-- from the PREVIOUS step (0 = send immediately on enrollment).
create table if not exists drip_sequences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table drip_sequences enable row level security;

drop policy if exists "Users manage their own drip sequences" on drip_sequences;
create policy "Users manage their own drip sequences" on drip_sequences
  for all using (auth.uid() = owner_id);

-- One row per contact enrolled in a sequence. current_step counts how many
-- steps have already been sent; next_send_date is compared as a plain date
-- (like occasion_sends) so the daily cron can find who's due today.
create table if not exists drip_enrollments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  sequence_id uuid references drip_sequences(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  current_step integer not null default 0,
  next_send_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz default now(),
  unique (sequence_id, contact_id)
);

create index if not exists drip_enrollments_due_idx on drip_enrollments(active, next_send_date);

alter table drip_enrollments enable row level security;

drop policy if exists "Users manage their own drip enrollments" on drip_enrollments;
create policy "Users manage their own drip enrollments" on drip_enrollments
  for all using (auth.uid() = owner_id);

-- When beneficiaries were last confirmed as up to date for this client -
-- drives the "review beneficiaries" reminder on the Alerts page. Null means
-- never confirmed.
alter table client_details add column if not exists beneficiaries_reviewed_at date;

-- Each agent's own Insurance Toolkits FEX Lite token (from their personal
-- widget/link, e.g. insurancetoolkits.com/fex/lite-form/?token=...) - lets
-- the Quoter page embed their own account's quoter, billed and licensed
-- under their own Insurance Toolkits subscription.
alter table profiles add column if not exists insurance_toolkits_token text;
