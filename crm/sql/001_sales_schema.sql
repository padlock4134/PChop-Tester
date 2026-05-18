-- Standalone CRM: Sales-only schema
create schema if not exists revenue;

-- Shared utility: auto-update updated_at on every row mutation.
-- Defined here (migration 001) so all later migrations can use it safely.
create or replace function revenue.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper: read caller role from Wristband/Supabase JWT app_metadata.
create or replace function revenue.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table if not exists revenue.sales_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_type text not null check (account_type in ('individual_college','state_system','whale_institute','partner','other')),
  website text,
  country text not null default 'US',
  state_region text,
  owner_user_id uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active','inactive')),
  estimated_students int,
  current_solution text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists revenue.sales_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references revenue.sales_accounts(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  title text not null,
  email text not null,
  phone text,
  role_in_deal text not null check (role_in_deal in ('champion','decision_maker','influencer','procurement','legal','finance','technical_reviewer')),
  is_primary boolean not null default false,
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, email)
);

create table if not exists revenue.sales_opportunities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references revenue.sales_accounts(id) on delete cascade,
  primary_contact_id uuid references revenue.sales_contacts(id) on delete set null,
  name text not null,
  stage text not null check (stage in ('lead_identified','discovery_scheduled','discovery_complete','demo_delivered','pilot_proposed','pilot_active','pilot_review','procurement_security','verbal_commit','closed_won','closed_lost')),
  amount numeric(12,2) check (amount is null or amount >= 0),
  probability_pct int not null default 0 check (probability_pct between 0 and 100),
  close_date_target date,
  owner_user_id uuid not null references auth.users(id),
  next_step text not null,
  next_step_due_date date,
  loss_reason text,
  notes text,
  discipline_focus text check (
    discipline_focus is null or discipline_focus in (
      'culinary','nursing','automotive','cosmetology',
      'hvac','welding','plumbing','barbering','other'
    )
  ),
  source_channel text check (
    source_channel is null or source_channel in (
      'cold_email','cold_call','linkedin','partner_referral',
      'inbound_demo_request','conference_event','content_webinar',
      'existing_network','other'
    )
  ),
  pilot_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- sales_activities: intentionally append-only (no updated_at).
-- Log a new activity row rather than editing past records.
create table if not exists revenue.sales_activities (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references revenue.sales_opportunities(id) on delete cascade,
  account_id uuid not null references revenue.sales_accounts(id) on delete cascade,
  contact_id uuid references revenue.sales_contacts(id) on delete set null,
  activity_type text not null check (activity_type in ('call','email','meeting','demo','note','task')),
  subject text not null,
  activity_at timestamptz not null,
  outcome text,
  next_step text,
  owner_user_id uuid not null references auth.users(id),
  duration_minutes int,
  external_event_id text,
  created_at timestamptz not null default now()
);

create table if not exists revenue.sales_files (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references revenue.sales_accounts(id) on delete cascade,
  opportunity_id uuid references revenue.sales_opportunities(id) on delete cascade,
  activity_id uuid references revenue.sales_activities(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (account_id is not null or opportunity_id is not null)
);

create index if not exists idx_sales_accounts_owner on revenue.sales_accounts(owner_user_id);
create index if not exists idx_sales_contacts_account on revenue.sales_contacts(account_id);
create index if not exists idx_sales_opps_account on revenue.sales_opportunities(account_id);
create index if not exists idx_sales_opps_owner_stage on revenue.sales_opportunities(owner_user_id, stage);
create index if not exists idx_sales_opps_close_date on revenue.sales_opportunities(close_date_target);
create index if not exists idx_sales_activities_opp_time on revenue.sales_activities(opportunity_id, activity_at desc);
create index if not exists idx_sales_files_opp on revenue.sales_files(opportunity_id);

-- Allow authenticated users to access the revenue schema.
-- RLS policies (migration 006) control row-level visibility.
grant usage on schema revenue to authenticated;
grant select, insert, update on all tables in schema revenue to authenticated;
grant usage, select on all sequences in schema revenue to authenticated;
