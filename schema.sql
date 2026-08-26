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

-- Already deployed this app before business_name existed? Run this line
-- by itself to add it without losing any existing profile data:
-- alter table profiles add column if not exists business_name text;

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
  created_at timestamptz default now(),
  deleted_at timestamptz, -- soft delete: set instead of actually deleting, so "Undo" can restore
  unique(owner_id, phone)
);

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

-- If you already ran this schema before this column existed, run this line
-- by itself to add it without losing any existing contacts:
-- alter table contacts add column if not exists type text not null default 'lead' check (type in ('lead', 'client'));

-- Already deployed this app before the "deleted_at" column existed? Run
-- this line by itself to add it without losing any existing contacts:
-- alter table contacts add column if not exists deleted_at timestamptz;

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
  coverage_amount text,
  monthly_premium text,
  policy_number text,
  draft_date text,
  application_submitted_date date default current_date,
  primary_beneficiaries jsonb not null default '[]'::jsonb, -- [{name, relationship, percentage}, ...]
  contingent_beneficiaries jsonb not null default '[]'::jsonb,
  date_of_birth date,
  birth_state text,
  email text,
  address_line text,
  city text,
  state text,
  zip text,
  ssn_encrypted text,
  health text,
  height text,
  weight text,
  bank_name text,
  routing_number_encrypted text,
  account_number_encrypted text,
  updated_at timestamptz default now()
);

alter table client_details enable row level security;

create policy "Users manage their own client details" on client_details
  for all using (auth.uid() = owner_id);

-- Already deployed this app before client_details existed? Just run the
-- create table statement above by itself (it's safe to run again - "if not
-- exists" - and won't touch your existing contacts, messages, or numbers).

-- Already have client_details but missing the newer application_submitted_date
-- column? Run this line by itself:
-- alter table client_details add column if not exists application_submitted_date date default current_date;

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

create policy "Users manage their own templates" on templates
  for all using (auth.uid() = owner_id);

-- Already deployed this app before message templates existed? Just run
-- the create table + policy statements above by themselves.

-- Row Level Security: makes sure people can only ever see their own data,
-- even if there were ever a bug in the app code.
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table messages enable row level security;

create policy "Users see their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users manage their own contacts" on contacts
  for all using (auth.uid() = owner_id);

create policy "Users manage their own messages" on messages
  for all using (auth.uid() = owner_id);

-- The very first admin account: after you sign in once through Supabase Auth
-- (see README), run this with your own email to make yourself an admin.
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');

-- Already deployed this app before the "member" role was renamed to "agent"?
-- Run these two lines by themselves to migrate existing rows and the check
-- constraint without losing any data:
-- alter table profiles drop constraint if exists profiles_role_check;
-- update profiles set role = 'agent' where role = 'member';
-- alter table profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'agent'));
-- alter table profiles alter column role set default 'agent';
