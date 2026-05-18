-- Standalone CRM: task write rules (add + complete, no delete) and save guarantees
-- Note: revenue.set_updated_at() and revenue.is_admin() are defined in 001_sales_schema.sql.
-- The create or replace below is kept for idempotency only (safe to re-run).

-- 1) Utility trigger to keep updated_at current
create or replace function revenue.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger across mutable CRM tables

drop trigger if exists trg_sales_accounts_updated_at on revenue.sales_accounts;
create trigger trg_sales_accounts_updated_at
before update on revenue.sales_accounts
for each row execute function revenue.set_updated_at();

drop trigger if exists trg_sales_contacts_updated_at on revenue.sales_contacts;
create trigger trg_sales_contacts_updated_at
before update on revenue.sales_contacts
for each row execute function revenue.set_updated_at();

drop trigger if exists trg_sales_opportunities_updated_at on revenue.sales_opportunities;
create trigger trg_sales_opportunities_updated_at
before update on revenue.sales_opportunities
for each row execute function revenue.set_updated_at();

drop trigger if exists trg_sales_tasks_updated_at on revenue.sales_tasks;
create trigger trg_sales_tasks_updated_at
before update on revenue.sales_tasks
for each row execute function revenue.set_updated_at();

-- 2) Task completion behavior: set/clear completed_at automatically
create or replace function revenue.sync_sales_task_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at = coalesce(new.completed_at, now());
  elsif new.status <> 'done' and old.status = 'done' then
    new.completed_at = null;
  end if;

  -- if blocked, require reason
  if new.status = 'blocked' and (new.blocked_reason is null or btrim(new.blocked_reason) = '') then
    raise exception 'blocked_reason is required when status = blocked';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sales_tasks_sync_completion on revenue.sales_tasks;
create trigger trg_sales_tasks_sync_completion
before update on revenue.sales_tasks
for each row execute function revenue.sync_sales_task_completion();

-- 3) No task deletes at DB level
create or replace function revenue.prevent_sales_task_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Deleting tasks is not allowed. Mark as done/cancelled instead.';
end;
$$;

drop trigger if exists trg_sales_tasks_no_delete on revenue.sales_tasks;
create trigger trg_sales_tasks_no_delete
before delete on revenue.sales_tasks
for each row execute function revenue.prevent_sales_task_delete();

-- 4) RLS: insert/update/select allowed by owner/admin, no delete policy
-- revenue.is_admin() is defined in 001_sales_schema.sql.
alter table revenue.sales_tasks enable row level security;

drop policy if exists sales_tasks_select_policy on revenue.sales_tasks;
create policy sales_tasks_select_policy
on revenue.sales_tasks
for select
using (auth.role() = 'authenticated');

drop policy if exists sales_tasks_insert_policy on revenue.sales_tasks;
create policy sales_tasks_insert_policy
on revenue.sales_tasks
for insert
with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_tasks_update_policy on revenue.sales_tasks;
create policy sales_tasks_update_policy
on revenue.sales_tasks
for update
using (owner_user_id = auth.uid() or revenue.is_admin())
with check (owner_user_id = auth.uid() or revenue.is_admin());

-- Intentionally no DELETE policy (plus DB trigger prevents delete regardless).

-- 5) Save-safe defaults/guards
alter table revenue.sales_tasks
  alter column created_at set default now(),
  alter column updated_at set default now(),
  alter column status set default 'todo',
  alter column priority set default 'medium';

-- Ensure title is never blank
alter table revenue.sales_tasks
  drop constraint if exists sales_tasks_title_not_blank;
alter table revenue.sales_tasks
  add constraint sales_tasks_title_not_blank check (btrim(title) <> '');
