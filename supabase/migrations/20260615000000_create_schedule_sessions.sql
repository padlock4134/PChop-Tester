CREATE TABLE IF NOT EXISTS public.schedule_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline_slug text NOT NULL DEFAULT 'culinary',
  dish_name text NOT NULL,
  cuisine text NOT NULL,
  description text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  session_type text NOT NULL DEFAULT 'practice',
  teacher_tag text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_sessions_discipline_slug_not_blank CHECK (btrim(discipline_slug) <> ''),
  CONSTRAINT schedule_sessions_session_type_not_blank CHECK (btrim(session_type) <> '')
);

CREATE INDEX IF NOT EXISTS schedule_sessions_user_discipline_date_idx
  ON public.schedule_sessions (user_id, discipline_slug, scheduled_date, scheduled_time);

CREATE INDEX IF NOT EXISTS schedule_sessions_discipline_date_idx
  ON public.schedule_sessions (discipline_slug, scheduled_date, scheduled_time);

ALTER TABLE public.schedule_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own scheduled sessions" ON public.schedule_sessions;
CREATE POLICY "Users can read their own scheduled sessions"
  ON public.schedule_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scheduled sessions" ON public.schedule_sessions;
CREATE POLICY "Users can insert their own scheduled sessions"
  ON public.schedule_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND btrim(discipline_slug) <> '');

DROP POLICY IF EXISTS "Users can update their own scheduled sessions" ON public.schedule_sessions;
CREATE POLICY "Users can update their own scheduled sessions"
  ON public.schedule_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND btrim(discipline_slug) <> '');

DROP POLICY IF EXISTS "Users can delete their own scheduled sessions" ON public.schedule_sessions;
CREATE POLICY "Users can delete their own scheduled sessions"
  ON public.schedule_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all scheduled sessions" ON public.schedule_sessions;
CREATE POLICY "Admins can manage all scheduled sessions"
  ON public.schedule_sessions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
