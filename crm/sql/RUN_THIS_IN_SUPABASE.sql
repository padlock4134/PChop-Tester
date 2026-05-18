-- ============================================================
-- THE CHOP SHOP CRM — FULL SCHEMA
-- Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================


-- ─── 1. SCHEMA + CORE TABLES ────────────────────────────────

create schema if not exists revenue;

create or replace function revenue.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function revenue.is_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); $$;

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
  discipline_focus text check (discipline_focus is null or discipline_focus in ('culinary','nursing','automotive','cosmetology','hvac','welding','plumbing','barbering','other')),
  source_channel text check (source_channel is null or source_channel in ('cold_email','cold_call','linkedin','partner_referral','inbound_demo_request','conference_event','content_webinar','existing_network','other')),
  pilot_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

grant usage on schema revenue to authenticated;
grant select, insert, update on all tables in schema revenue to authenticated;
grant usage, select on all sequences in schema revenue to authenticated;


-- ─── 2. TASKS ───────────────────────────────────────────────

create table if not exists revenue.sales_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','done','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  owner_user_id uuid not null references auth.users(id),
  created_by_user_id uuid not null references auth.users(id),
  account_id uuid references revenue.sales_accounts(id) on delete set null,
  opportunity_id uuid references revenue.sales_opportunities(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  blocked_reason text,
  estimate_hours numeric(8,2),
  actual_hours numeric(8,2),
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (estimate_hours is null or estimate_hours >= 0),
  check (actual_hours is null or actual_hours >= 0)
);

create index if not exists idx_sales_tasks_owner_status on revenue.sales_tasks(owner_user_id, status);
create index if not exists idx_sales_tasks_due_date on revenue.sales_tasks(due_date);
create index if not exists idx_sales_tasks_opp on revenue.sales_tasks(opportunity_id);
create index if not exists idx_sales_tasks_account on revenue.sales_tasks(account_id);

create or replace view revenue.sales_tasks_dashboard as
select
  owner_user_id, status, priority,
  count(*) as task_count,
  count(*) filter (where due_date is not null and due_date < current_date and status not in ('done','cancelled')) as overdue_count,
  count(*) filter (where due_date is not null and due_date between current_date and current_date + interval '7 days' and status not in ('done','cancelled')) as due_next_7_days_count,
  count(*) filter (where completed_at >= date_trunc('week', now())) as completed_this_week_count
from revenue.sales_tasks
group by owner_user_id, status, priority;


-- ─── 3. TRIGGERS + TASK RULES ───────────────────────────────

drop trigger if exists trg_sales_accounts_updated_at on revenue.sales_accounts;
create trigger trg_sales_accounts_updated_at before update on revenue.sales_accounts for each row execute function revenue.set_updated_at();

drop trigger if exists trg_sales_contacts_updated_at on revenue.sales_contacts;
create trigger trg_sales_contacts_updated_at before update on revenue.sales_contacts for each row execute function revenue.set_updated_at();

drop trigger if exists trg_sales_opportunities_updated_at on revenue.sales_opportunities;
create trigger trg_sales_opportunities_updated_at before update on revenue.sales_opportunities for each row execute function revenue.set_updated_at();

drop trigger if exists trg_sales_tasks_updated_at on revenue.sales_tasks;
create trigger trg_sales_tasks_updated_at before update on revenue.sales_tasks for each row execute function revenue.set_updated_at();

create or replace function revenue.sync_sales_task_completion()
returns trigger language plpgsql as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at = coalesce(new.completed_at, now());
  elsif new.status <> 'done' and old.status = 'done' then
    new.completed_at = null;
  end if;
  if new.status = 'blocked' and (new.blocked_reason is null or btrim(new.blocked_reason) = '') then
    raise exception 'blocked_reason is required when status = blocked';
  end if;
  return new;
end; $$;

drop trigger if exists trg_sales_tasks_sync_completion on revenue.sales_tasks;
create trigger trg_sales_tasks_sync_completion before update on revenue.sales_tasks for each row execute function revenue.sync_sales_task_completion();

create or replace function revenue.prevent_sales_task_delete()
returns trigger language plpgsql as $$
begin raise exception 'Deleting tasks is not allowed. Mark as done/cancelled instead.'; end; $$;

drop trigger if exists trg_sales_tasks_no_delete on revenue.sales_tasks;
create trigger trg_sales_tasks_no_delete before delete on revenue.sales_tasks for each row execute function revenue.prevent_sales_task_delete();

alter table revenue.sales_tasks alter column status set default 'todo';
alter table revenue.sales_tasks alter column priority set default 'medium';
alter table revenue.sales_tasks drop constraint if exists sales_tasks_title_not_blank;
alter table revenue.sales_tasks add constraint sales_tasks_title_not_blank check (btrim(title) <> '');


-- ─── 4. GMAIL OUTREACH ──────────────────────────────────────

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

create unique index if not exists ux_gmail_accounts_single_primary on revenue.gmail_accounts(owner_user_id) where is_primary = true;

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

create index if not exists idx_email_outreach_owner_status on revenue.email_outreach(owner_user_id, status);
create index if not exists idx_email_outreach_opportunity on revenue.email_outreach(opportunity_id);
create index if not exists idx_email_outreach_sent_at on revenue.email_outreach(sent_at desc);

drop trigger if exists trg_gmail_accounts_updated_at on revenue.gmail_accounts;
create trigger trg_gmail_accounts_updated_at before update on revenue.gmail_accounts for each row execute function revenue.set_updated_at();

drop trigger if exists trg_email_outreach_updated_at on revenue.email_outreach;
create trigger trg_email_outreach_updated_at before update on revenue.email_outreach for each row execute function revenue.set_updated_at();


-- ─── 5. PARTNER DEAL SUBMISSIONS ────────────────────────────

create table if not exists revenue.partner_deal_submissions (
  id uuid primary key default gen_random_uuid(),
  partner_company_name text not null,
  partner_contact_name text not null,
  partner_contact_email text not null check (partner_contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  referred_org_name text not null,
  referred_contact_name text,
  referred_contact_email text check (referred_contact_email is null or referred_contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  deal_summary text not null,
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  notes text,
  consent_confirmed boolean not null default false check (consent_confirmed = true),
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

create unique index if not exists ux_partner_submission_idempotency on revenue.partner_deal_submissions(external_idempotency_key) where external_idempotency_key is not null;
create index if not exists idx_partner_submission_status on revenue.partner_deal_submissions(status);
create index if not exists idx_partner_submission_owner on revenue.partner_deal_submissions(assigned_owner_user_id);
create index if not exists idx_partner_submission_submitted_at on revenue.partner_deal_submissions(submitted_at desc);

drop trigger if exists trg_partner_deal_submissions_updated_at on revenue.partner_deal_submissions;
create trigger trg_partner_deal_submissions_updated_at before update on revenue.partner_deal_submissions for each row execute function revenue.set_updated_at();


-- ─── 6. ROW-LEVEL SECURITY ──────────────────────────────────

alter table revenue.sales_accounts enable row level security;
alter table revenue.sales_contacts enable row level security;
alter table revenue.sales_opportunities enable row level security;
alter table revenue.sales_activities enable row level security;
alter table revenue.sales_files enable row level security;
alter table revenue.sales_tasks enable row level security;
alter table revenue.gmail_accounts enable row level security;
alter table revenue.email_outreach enable row level security;
alter table revenue.partner_deal_submissions enable row level security;

-- Team-wide reads
drop policy if exists sales_accounts_select_policy on revenue.sales_accounts;
create policy sales_accounts_select_policy on revenue.sales_accounts for select using (auth.role() = 'authenticated');

drop policy if exists sales_contacts_select_policy on revenue.sales_contacts;
create policy sales_contacts_select_policy on revenue.sales_contacts for select using (auth.role() = 'authenticated');

drop policy if exists sales_opps_select_policy on revenue.sales_opportunities;
create policy sales_opps_select_policy on revenue.sales_opportunities for select using (auth.role() = 'authenticated');

drop policy if exists sales_activities_select_policy on revenue.sales_activities;
create policy sales_activities_select_policy on revenue.sales_activities for select using (auth.role() = 'authenticated');

drop policy if exists sales_files_select_policy on revenue.sales_files;
create policy sales_files_select_policy on revenue.sales_files for select using (auth.role() = 'authenticated');

drop policy if exists sales_tasks_select_policy on revenue.sales_tasks;
create policy sales_tasks_select_policy on revenue.sales_tasks for select using (auth.role() = 'authenticated');

drop policy if exists email_outreach_select_policy on revenue.email_outreach;
create policy email_outreach_select_policy on revenue.email_outreach for select using (auth.role() = 'authenticated');

drop policy if exists partner_submission_select_policy on revenue.partner_deal_submissions;
create policy partner_submission_select_policy on revenue.partner_deal_submissions for select using (auth.role() = 'authenticated');

-- Gmail tokens: owner-only (sensitive)
drop policy if exists gmail_accounts_select_policy on revenue.gmail_accounts;
create policy gmail_accounts_select_policy on revenue.gmail_accounts for select using (owner_user_id = auth.uid() or revenue.is_admin());

-- Owner-scoped writes
drop policy if exists sales_accounts_insert_policy on revenue.sales_accounts;
create policy sales_accounts_insert_policy on revenue.sales_accounts for insert with check (owner_user_id = auth.uid() or revenue.is_admin());
drop policy if exists sales_accounts_update_policy on revenue.sales_accounts;
create policy sales_accounts_update_policy on revenue.sales_accounts for update using (owner_user_id = auth.uid() or revenue.is_admin()) with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_contacts_insert_policy on revenue.sales_contacts;
create policy sales_contacts_insert_policy on revenue.sales_contacts for insert with check (owner_user_id = auth.uid() or revenue.is_admin());
drop policy if exists sales_contacts_update_policy on revenue.sales_contacts;
create policy sales_contacts_update_policy on revenue.sales_contacts for update using (owner_user_id = auth.uid() or revenue.is_admin()) with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_opps_insert_policy on revenue.sales_opportunities;
create policy sales_opps_insert_policy on revenue.sales_opportunities for insert with check (owner_user_id = auth.uid() or revenue.is_admin());
drop policy if exists sales_opps_update_policy on revenue.sales_opportunities;
create policy sales_opps_update_policy on revenue.sales_opportunities for update using (owner_user_id = auth.uid() or revenue.is_admin()) with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_activities_insert_policy on revenue.sales_activities;
create policy sales_activities_insert_policy on revenue.sales_activities for insert with check (owner_user_id = auth.uid() or revenue.is_admin());
drop policy if exists sales_activities_update_policy on revenue.sales_activities;
create policy sales_activities_update_policy on revenue.sales_activities for update using (revenue.is_admin()) with check (revenue.is_admin());

drop policy if exists sales_files_insert_policy on revenue.sales_files;
create policy sales_files_insert_policy on revenue.sales_files for insert with check (uploaded_by_user_id = auth.uid() or revenue.is_admin());
drop policy if exists sales_files_update_policy on revenue.sales_files;
create policy sales_files_update_policy on revenue.sales_files for update using (uploaded_by_user_id = auth.uid() or revenue.is_admin()) with check (uploaded_by_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_tasks_insert_policy on revenue.sales_tasks;
create policy sales_tasks_insert_policy on revenue.sales_tasks for insert with check (owner_user_id = auth.uid() or revenue.is_admin());
drop policy if exists sales_tasks_update_policy on revenue.sales_tasks;
create policy sales_tasks_update_policy on revenue.sales_tasks for update using (owner_user_id = auth.uid() or revenue.is_admin()) with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists gmail_accounts_insert_policy on revenue.gmail_accounts;
create policy gmail_accounts_insert_policy on revenue.gmail_accounts for insert with check (owner_user_id = auth.uid() or revenue.is_admin());
drop policy if exists gmail_accounts_update_policy on revenue.gmail_accounts;
create policy gmail_accounts_update_policy on revenue.gmail_accounts for update using (owner_user_id = auth.uid() or revenue.is_admin()) with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists email_outreach_insert_policy on revenue.email_outreach;
create policy email_outreach_insert_policy on revenue.email_outreach for insert with check (owner_user_id = auth.uid() or revenue.is_admin());
drop policy if exists email_outreach_update_policy on revenue.email_outreach;
create policy email_outreach_update_policy on revenue.email_outreach for update using (owner_user_id = auth.uid() or revenue.is_admin()) with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists partner_submission_update_policy on revenue.partner_deal_submissions;
create policy partner_submission_update_policy on revenue.partner_deal_submissions for update using (assigned_owner_user_id = auth.uid() or revenue.is_admin()) with check (assigned_owner_user_id = auth.uid() or revenue.is_admin());


-- ─── 7. PIPELINE ANALYTICS VIEWS ────────────────────────────

create or replace view revenue.pipeline_view as
select
  o.id as opportunity_id, o.name as opportunity_name, o.stage,
  o.amount, o.probability_pct,
  round(coalesce(o.amount, 0) * o.probability_pct / 100.0, 2) as weighted_value,
  o.close_date_target,
  case when o.close_date_target < current_date and o.stage not in ('closed_won','closed_lost') then true else false end as is_overdue,
  o.next_step, o.next_step_due_date, o.discipline_focus, o.source_channel,
  o.pilot_required, o.loss_reason, o.owner_user_id,
  a.id as account_id, a.name as account_name, a.account_type, a.estimated_students, a.state_region,
  c.first_name || ' ' || c.last_name as primary_contact_name,
  c.email as primary_contact_email, c.title as primary_contact_title, c.role_in_deal as primary_contact_role,
  o.created_at, o.updated_at
from revenue.sales_opportunities o
join revenue.sales_accounts a on a.id = o.account_id
left join revenue.sales_contacts c on c.id = o.primary_contact_id
where o.stage <> 'closed_lost';

create or replace view revenue.pipeline_summary as
select
  stage,
  count(*) as deal_count,
  sum(coalesce(amount, 0)) as total_value,
  round(sum(coalesce(amount, 0) * probability_pct / 100.0)::numeric, 2) as weighted_value,
  round(avg(probability_pct)::numeric, 1) as avg_probability_pct,
  count(*) filter (where close_date_target between current_date and current_date + interval '30 days' and stage not in ('closed_won','closed_lost')) as closing_in_30_days,
  count(*) filter (where close_date_target < current_date and stage not in ('closed_won','closed_lost')) as overdue_close_count
from revenue.sales_opportunities
group by stage;

create or replace view revenue.activity_timeline as
select
  act.id as activity_id, act.activity_type, act.subject, act.outcome, act.next_step,
  act.activity_at, act.duration_minutes, act.owner_user_id,
  o.id as opportunity_id, o.name as opportunity_name, o.stage as opportunity_stage,
  a.id as account_id, a.name as account_name,
  c.first_name || ' ' || c.last_name as contact_name, c.title as contact_title, c.email as contact_email
from revenue.sales_activities act
join revenue.sales_opportunities o on o.id = act.opportunity_id
join revenue.sales_accounts a on a.id = act.account_id
left join revenue.sales_contacts c on c.id = act.contact_id
order by act.activity_at desc;

-- ============================================================
-- DONE. All CRM tables, triggers, RLS, and views are live.
-- ============================================================
