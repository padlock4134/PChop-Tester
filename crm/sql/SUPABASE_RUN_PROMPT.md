# Supabase SQL Prompt (copy/paste)

Run this in Supabase SQL Editor in order.

```sql
-- 1) Core sales schema
\i crm/sql/001_sales_schema.sql

-- 2) Tasks + PM dashboard table/view
\i crm/sql/002_tasks_pm_dashboard.sql

-- 3) Task write rules (add/complete only, no delete) + save guards + RLS
\i crm/sql/003_tasks_write_rules.sql
```

If your SQL Editor does not support `\i`, paste files in this exact order:
1. `crm/sql/001_sales_schema.sql`
2. `crm/sql/002_tasks_pm_dashboard.sql`
3. `crm/sql/003_tasks_write_rules.sql`

## What this gives you
- Add tasks (insert)
- Edit/complete tasks (update)
- No hard-delete of tasks (blocked at DB trigger and no delete RLS policy)
- `updated_at` auto-saves on updates
- `completed_at` auto-managed from task status

4. `crm/sql/004_gmail_outreach.sql`

## Gmail setup note
After running SQL, create Google OAuth credentials and wire your callback handler to persist encrypted tokens into `revenue.gmail_accounts`.

5. `crm/sql/005_partner_deal_submissions.sql`

## Partner submission note
Use a server-side function (service role) for public partner form submissions; regular authenticated users do not get direct INSERT on `revenue.partner_deal_submissions`.
