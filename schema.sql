-- Run this in Supabase's SQL Editor. Replaces the old single-user schema.

-- One row per person who can log in. Created automatically when an admin adds them.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'agent' check (role in ('admin', 'manager', 'agent')),
  frozen boolean not null default false, -- frozen accounts can still log in and view data, but can't change anything
  twilio_number text unique, -- e.g. +15551234567, bought by this person themselves
  twilio_account_sid text, -- this person's OWN Twilio account - their own billing
  twilio_auth_token text,
  created_at timestamptz default now()
);

-- Each contact belongs to exactly one coworker.
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  type text not null default 'lead' check (type in ('lead', 'client')),
  created_at timestamptz default now(),
  unique(owner_id, phone)
);

-- If you already ran this schema before this column existed, run this line
-- by itself to add it without losing any existing contacts:
-- alter table contacts add column if not exists type text not null default 'lead' check (type in ('lead', 'client'));

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

-- Already deployed this app before the "frozen" column existed? Run this
-- line by itself to add it without losing any existing data:
-- alter table profiles add column if not exists frozen boolean not null default false;

-- Already deployed this app before the "member" role was renamed to "agent"?
-- Run these two lines by themselves to migrate existing rows and the check
-- constraint without losing any data:
-- alter table profiles drop constraint if exists profiles_role_check;
-- update profiles set role = 'agent' where role = 'member';
-- alter table profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'agent'));
-- alter table profiles alter column role set default 'agent';
