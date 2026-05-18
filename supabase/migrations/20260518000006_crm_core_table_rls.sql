-- Standalone CRM: Row-Level Security for core sales tables
-- Depends on: 20260518000001_crm_sales_schema.sql (revenue.is_admin defined there)
--
-- Access model: team-wide reads, owner-scoped writes.
--   - Any authenticated user can SELECT all rows (full team visibility)
--   - INSERT/UPDATE restricted to the row owner or admin
--   - No DELETE policies anywhere; hard deletes blocked at the app layer

-- ─── sales_accounts ─────────────────────────────────────────────────────────

alter table revenue.sales_accounts enable row level security;

drop policy if exists sales_accounts_select_policy on revenue.sales_accounts;
create policy sales_accounts_select_policy
on revenue.sales_accounts for select
using (auth.role() = 'authenticated');

drop policy if exists sales_accounts_insert_policy on revenue.sales_accounts;
create policy sales_accounts_insert_policy
on revenue.sales_accounts for insert
with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_accounts_update_policy on revenue.sales_accounts;
create policy sales_accounts_update_policy
on revenue.sales_accounts for update
using  (owner_user_id = auth.uid() or revenue.is_admin())
with check (owner_user_id = auth.uid() or revenue.is_admin());

-- ─── sales_contacts ──────────────────────────────────────────────────────────

alter table revenue.sales_contacts enable row level security;

drop policy if exists sales_contacts_select_policy on revenue.sales_contacts;
create policy sales_contacts_select_policy
on revenue.sales_contacts for select
using (auth.role() = 'authenticated');

drop policy if exists sales_contacts_insert_policy on revenue.sales_contacts;
create policy sales_contacts_insert_policy
on revenue.sales_contacts for insert
with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_contacts_update_policy on revenue.sales_contacts;
create policy sales_contacts_update_policy
on revenue.sales_contacts for update
using  (owner_user_id = auth.uid() or revenue.is_admin())
with check (owner_user_id = auth.uid() or revenue.is_admin());

-- ─── sales_opportunities ─────────────────────────────────────────────────────

alter table revenue.sales_opportunities enable row level security;

drop policy if exists sales_opps_select_policy on revenue.sales_opportunities;
create policy sales_opps_select_policy
on revenue.sales_opportunities for select
using (auth.role() = 'authenticated');

drop policy if exists sales_opps_insert_policy on revenue.sales_opportunities;
create policy sales_opps_insert_policy
on revenue.sales_opportunities for insert
with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_opps_update_policy on revenue.sales_opportunities;
create policy sales_opps_update_policy
on revenue.sales_opportunities for update
using  (owner_user_id = auth.uid() or revenue.is_admin())
with check (owner_user_id = auth.uid() or revenue.is_admin());

-- ─── sales_activities ────────────────────────────────────────────────────────
-- Append-only by design; update policy exists only for admin corrections.

alter table revenue.sales_activities enable row level security;

drop policy if exists sales_activities_select_policy on revenue.sales_activities;
create policy sales_activities_select_policy
on revenue.sales_activities for select
using (auth.role() = 'authenticated');

drop policy if exists sales_activities_insert_policy on revenue.sales_activities;
create policy sales_activities_insert_policy
on revenue.sales_activities for insert
with check (owner_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_activities_update_policy on revenue.sales_activities;
create policy sales_activities_update_policy
on revenue.sales_activities for update
using  (revenue.is_admin())
with check (revenue.is_admin());

-- ─── sales_files ─────────────────────────────────────────────────────────────

alter table revenue.sales_files enable row level security;

drop policy if exists sales_files_select_policy on revenue.sales_files;
create policy sales_files_select_policy
on revenue.sales_files for select
using (auth.role() = 'authenticated');

drop policy if exists sales_files_insert_policy on revenue.sales_files;
create policy sales_files_insert_policy
on revenue.sales_files for insert
with check (uploaded_by_user_id = auth.uid() or revenue.is_admin());

drop policy if exists sales_files_update_policy on revenue.sales_files;
create policy sales_files_update_policy
on revenue.sales_files for update
using  (uploaded_by_user_id = auth.uid() or revenue.is_admin())
with check (uploaded_by_user_id = auth.uid() or revenue.is_admin());
