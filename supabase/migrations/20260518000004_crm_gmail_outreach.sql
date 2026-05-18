-- The Chop Shop CRM: Gmail outreach integration schema
-- Depends on: 20260518000001_crm_sales_schema.sql (revenue schema, set_updated_at, is_admin)

create table if not exists revenue.gmail_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  email_address text not null,
  google_sub text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_expires_at timestamptz not null,
  scope text not null,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, email_address)
);

create unique index if not exists ux_gmail_accounts_single_primary
on revenue.gmail_accounts(owner_user_id)
where is_primary = true;

create table if not exists revenue.email_outreach (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  gmail_account_id uuid not null references revenue.gmail_accounts(id) on delete restrict,
  account_id uuid references revenue.sales_accounts(id) on delete set null,
  opportunity_id uuid references revenue.sales_opportunities(id) on delete set null,
  contact_id uuid references revenue.sales_contacts(id) on delete set null,
  subject text not null,
  body_text text,
  body_html text,
  to_recipients jsonb not null check (jsonb_array_length(to_recipients) > 0),
  cc_recipients jsonb,
  bcc_recipients jsonb,
  gmail_message_id text,
  status text not null default 'draft' check (status in ('draft','queued','sent','failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_outreach_owner_status
  on revenue.email_outreach(owner_user_id, status);
create index if not exists idx_email_outreach_opportunity
  on revenue.email_outreach(opportunity_id);
create index if not exists idx_email_outreach_sent_at
  on revenue.email_outreach(sent_at desc);

-- updated_at triggers

drop trigger if exists trg_gmail_accounts_updated_at on revenue.gmail_accounts;
create trigger trg_gmail_accounts_updated_at
before update on revenue.gmail_accounts
for each row execute function revenue.set_updated_at();

drop trigger if exists trg_email_outreach_updated_at on revenue.email_outreach;
create trigger trg_email_outreach_updated_at
before update on revenue.email_outreach
for each row execute function revenue.set_updated_at();

-- RLS
alter table revenue.gmail_accounts enable row level security;
alter table revenue.email_outreach enable row level security;

-- gmail_accounts: owner-only (tokens are sensitive)

drop policy if exists gmail_accounts_select_policy on revenue.gmail_accounts;
create policy gmail_accounts_select_policy
on revenue.gmail_accounts
for select
using (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists gmail_accounts_insert_policy on revenue.gmail_accounts;
create policy gmail_accounts_insert_policy
on revenue.gmail_accounts
for insert
with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists gmail_accounts_update_policy on revenue.gmail_accounts;
create policy gmail_accounts_update_policy
on revenue.gmail_accounts
for update
using (owner_user_id = auth.uid() or revenue.is_admin())
with check (owner_user_id = auth.uid() or revenue.is_admin());

-- no delete policy on purpose; soft-disable with is_active

-- email_outreach: team-wide reads, owner writes

drop policy if exists email_outreach_select_policy on revenue.email_outreach;
create policy email_outreach_select_policy
on revenue.email_outreach
for select
using (auth.role() = 'authenticated');

drop policy if exists email_outreach_insert_policy on revenue.email_outreach;
create policy email_outreach_insert_policy
on revenue.email_outreach
for insert
with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists email_outreach_update_policy on revenue.email_outreach;
create policy email_outreach_update_policy
on revenue.email_outreach
for update
using (owner_user_id = auth.uid() or revenue.is_admin())
with check (owner_user_id = auth.uid() or revenue.is_admin());
