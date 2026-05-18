# Supabase SQL Run Order

Paste each file into the Supabase SQL Editor **in the order listed below**.
The `\i` syntax is psql-only and does NOT work in the Supabase dashboard editor.

---

## Run order

### 1. `crm/sql/001_sales_schema.sql`
Core revenue schema: accounts, contacts, opportunities, activities, files.
Also defines `revenue.set_updated_at()`, `revenue.is_admin()`, and GRANTs.

### 2. `crm/sql/002_tasks_pm_dashboard.sql`
Tasks table + PM dashboard aggregate view.

### 3. `crm/sql/003_tasks_write_rules.sql`
Task write rules: add/complete only, no hard-delete, `updated_at` triggers, RLS.

### 4. `crm/sql/004_gmail_outreach.sql`
Gmail OAuth token store + outbound email log tables.
> After running: create Google OAuth credentials and wire the callback to persist
> encrypted tokens into `revenue.gmail_accounts`. See `crm/docs/gmail-connect-checklist.md`.

### 5. `crm/sql/005_partner_deal_submissions.sql`
External partner deal submission table.
> Insert via service-role Netlify function only — no direct INSERT for regular users.

### 6. `crm/sql/006_core_table_rls.sql`
Row-Level Security policies for the 5 core sales tables.
**Run this before opening any CRM UI to authenticated users.**

### 7. `crm/sql/007_pipeline_analytics.sql`
Read-only views: `pipeline_view`, `pipeline_summary`, `activity_timeline`.

---

## Storage bucket

See `crm/storage/README.md` for the bucket creation SQL.
Create the `sales-files` bucket before allowing file uploads.

---

## What you get after all 7 migrations

- Full sales pipeline (accounts → contacts → opportunities → activities)
- Task/PM board with no hard-deletes and auto-managed completion timestamps
- Gmail inbox connection ready for OAuth wiring
- Partner deal intake with spam controls and idempotency
- Row-level security on every table (owner + admin access model)
- Pipeline forecast views with weighted deal values
