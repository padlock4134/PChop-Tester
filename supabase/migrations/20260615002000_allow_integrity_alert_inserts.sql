-- Ensure integrity alert writes from the app are accepted on older live databases too.
-- Some databases had integrity_alerts with RLS enabled but no user insert policy,
-- which made the browser POST /rest/v1/integrity_alerts fail even though alerts
-- are non-destructive monitoring records.

DROP POLICY IF EXISTS "Users can insert own integrity alerts" ON public.integrity_alerts;
DROP POLICY IF EXISTS "System can insert integrity alerts" ON public.integrity_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert integrity alerts" ON public.integrity_alerts;

CREATE POLICY "Authenticated users can insert integrity alerts" ON public.integrity_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

GRANT INSERT ON public.integrity_alerts TO authenticated;
