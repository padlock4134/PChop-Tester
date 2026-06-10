-- Enforce one active browser/device session per Wristband user and tenant.
-- The app stores only the latest active session id here; auth cookies remain encrypted
-- HTTP-only session cookies and are still managed by the Netlify auth functions.
CREATE TABLE IF NOT EXISTS public.active_user_sessions (
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  active_session_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_active_user_sessions_last_seen_at
  ON public.active_user_sessions(last_seen_at DESC);

ALTER TABLE public.active_user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own active session" ON public.active_user_sessions;
CREATE POLICY "Users can insert own active session"
  ON public.active_user_sessions
  FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Users can view own active session" ON public.active_user_sessions;
CREATE POLICY "Users can view own active session"
  ON public.active_user_sessions
  FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own active session" ON public.active_user_sessions;
CREATE POLICY "Users can update own active session"
  ON public.active_user_sessions
  FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Users can delete own active session" ON public.active_user_sessions;
CREATE POLICY "Users can delete own active session"
  ON public.active_user_sessions
  FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub'));
