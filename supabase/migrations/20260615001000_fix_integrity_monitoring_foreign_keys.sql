-- Align previously-created integrity monitoring tables with the app's public.users ids.
-- Older setup SQL referenced auth.users, but the app passes public.users.id to these tables.

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid IN (
        'public.integrity_alerts'::regclass,
        'public.completion_tracking'::regclass,
        'public.text_submissions'::regclass,
        'public.user_activity_log'::regclass
      )
      AND conname LIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', constraint_record.table_name, constraint_record.conname);
  END LOOP;

  FOR constraint_record IN
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid = 'public.integrity_alerts'::regclass
      AND conname LIKE '%reviewed_by%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', constraint_record.table_name, constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE public.integrity_alerts
  ADD CONSTRAINT integrity_alerts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.integrity_alerts
  ADD CONSTRAINT integrity_alerts_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

ALTER TABLE public.completion_tracking
  ADD CONSTRAINT completion_tracking_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.text_submissions
  ADD CONSTRAINT text_submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_activity_log
  ADD CONSTRAINT user_activity_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
