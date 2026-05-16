-- The Chop Shop CRM: external partner deal submissions

create table if not exists revenue.partner_deal_submissions (
  id uuid primary key default gen_random_uuid(),
  partner_company_name text not null,
  partner_contact_name text not null,
  partner_contact_email text not null,
  referred_org_name text not null,
  referred_contact_name text,
  referred_contact_email text,
  deal_summary text not null,
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  notes text,
  consent_confirmed boolean not null default false,

  status text not null default 'new' check (status in ('new','qualified','converted_to_opportunity','rejected')),
  assigned_owner_user_id uuid references auth.users(id) on delete set null,
  converted_opportunity_id uuid references revenue.sales_opportunities(id) on delete set null,

  source_ip inet,
  source_user_agent text,
  external_idempotency_key text,
  spam_score numeric(5,2),
  is_spam boolean not null default false,

  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_partner_submission_idempotency
  on revenue.partner_deal_submissions(external_idempotency_key)
  where external_idempotency_key is not null;

create index if not exists idx_partner_submission_status
  on revenue.partner_deal_submissions(status);

create index if not exists idx_partner_submission_owner
  on revenue.partner_deal_submissions(assigned_owner_user_id);

create index if not exists idx_partner_submission_submitted_at
  on revenue.partner_deal_submissions(submitted_at desc);

-- updated_at trigger

drop trigger if exists trg_partner_deal_submissions_updated_at on revenue.partner_deal_submissions;
create trigger trg_partner_deal_submissions_updated_at
before update on revenue.partner_deal_submissions
for each row execute function revenue.set_updated_at();

-- RLS
alter table revenue.partner_deal_submissions enable row level security;

-- Internal users can read/update; public ingestion should happen via service role function only.
drop policy if exists partner_submission_select_policy on revenue.partner_deal_submissions;
create policy partner_submission_select_policy
on revenue.partner_deal_submissions
for select
using (assigned_owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists partner_submission_update_policy on revenue.partner_deal_submissions;
create policy partner_submission_update_policy
on revenue.partner_deal_submissions
for update
using (assigned_owner_user_id = auth.uid() or revenue.is_admin())
with check (assigned_owner_user_id = auth.uid() or revenue.is_admin());

-- no direct insert policy for regular users (external submission handled server-side)
-- no delete policy
