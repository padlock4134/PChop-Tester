-- Standalone CRM: Tasks / PM dashboard support

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
  owner_user_id,
  status,
  priority,
  count(*) as task_count,
  count(*) filter (where due_date is not null and due_date < current_date and status not in ('done','cancelled')) as overdue_count,
  count(*) filter (where due_date is not null and due_date between current_date and current_date + interval '7 days' and status not in ('done','cancelled')) as due_next_7_days_count,
  count(*) filter (where completed_at >= date_trunc('week', now())) as completed_this_week_count
from revenue.sales_tasks
group by owner_user_id, status, priority;
