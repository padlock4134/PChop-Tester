-- 008_lead_hunter_usage.sql
-- Tracks daily lead imports per user for the CRM Lead Hunter feature.
-- Cap: 25 approved imports per user per day.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS revenue.lead_hunter_usage (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  import_date  date        NOT NULL DEFAULT CURRENT_DATE,
  leads_imported int       NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, import_date)
);

-- Allow authenticated users to read/write only their own rows
ALTER TABLE revenue.lead_hunter_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_hunter_usage_select_own"
  ON revenue.lead_hunter_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "lead_hunter_usage_insert_own"
  ON revenue.lead_hunter_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "lead_hunter_usage_update_own"
  ON revenue.lead_hunter_usage FOR UPDATE
  USING (user_id = auth.uid());

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION revenue.set_lead_hunter_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_hunter_usage_updated_at ON revenue.lead_hunter_usage;
CREATE TRIGGER trg_lead_hunter_usage_updated_at
  BEFORE UPDATE ON revenue.lead_hunter_usage
  FOR EACH ROW EXECUTE FUNCTION revenue.set_lead_hunter_updated_at();
