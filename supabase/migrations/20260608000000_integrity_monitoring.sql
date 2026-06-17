-- Integrity Monitoring Tables
-- Uses the same RLS/auth pattern as all other tables in this app:
--   user_id IN (SELECT id FROM users WHERE external_id = auth.jwt()->>'sub')

-- Completion tracking: detect unusually fast or bot-like module completion
CREATE TABLE IF NOT EXISTS public.completion_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discipline VARCHAR(50) NOT NULL,
  module_type VARCHAR(50) NOT NULL,
  module_id VARCHAR(100) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (completed_at - started_at))::integer) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Text submissions: store assignment/post text for plagiarism detection
CREATE TABLE IF NOT EXISTS public.text_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discipline VARCHAR(50) NOT NULL,
  assignment_id VARCHAR(100) NOT NULL,
  assignment_title TEXT,
  submission_text TEXT NOT NULL,
  word_count INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plagiarism_checked BOOLEAN DEFAULT false,
  plagiarism_score DECIMAL(5,2),
  similar_submissions JSONB
);

-- User activity log: track logins and other events for anomaly detection
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  discipline VARCHAR(50),
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrity alerts: flagged events for admin review
CREATE TABLE IF NOT EXISTS public.integrity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discipline VARCHAR(50),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrity_alerts_user_id ON public.integrity_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_integrity_alerts_discipline ON public.integrity_alerts(discipline);
CREATE INDEX IF NOT EXISTS idx_integrity_alerts_reviewed ON public.integrity_alerts(reviewed);
CREATE INDEX IF NOT EXISTS idx_integrity_alerts_created_at ON public.integrity_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_tracking_user_id ON public.completion_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_completion_tracking_discipline ON public.completion_tracking(discipline);
CREATE INDEX IF NOT EXISTS idx_completion_tracking_completed_at ON public.completion_tracking(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_text_submissions_user_id ON public.text_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_text_submissions_assignment_id ON public.text_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_text_submissions_discipline ON public.text_submissions(discipline);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON public.user_activity_log(activity_type);

-- RLS
ALTER TABLE public.completion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_alerts ENABLE ROW LEVEL SECURITY;

-- completion_tracking policies
DROP POLICY IF EXISTS "Users can insert own completion tracking" ON public.completion_tracking;
CREATE POLICY "Users can insert own completion tracking" ON public.completion_tracking
  FOR INSERT WITH CHECK (
    user_id IN (SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Users can view own completion tracking" ON public.completion_tracking;
CREATE POLICY "Users can view own completion tracking" ON public.completion_tracking
  FOR SELECT USING (
    user_id IN (SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Admins can view all completion tracking" ON public.completion_tracking;
CREATE POLICY "Admins can view all completion tracking" ON public.completion_tracking
  FOR SELECT USING (
    is_admin((SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub')))
  );

-- text_submissions policies
DROP POLICY IF EXISTS "Users can insert own text submissions" ON public.text_submissions;
CREATE POLICY "Users can insert own text submissions" ON public.text_submissions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Authenticated users can read text submissions for comparison" ON public.text_submissions;
CREATE POLICY "Authenticated users can read text submissions for comparison" ON public.text_submissions
  FOR SELECT USING (
    (auth.jwt() ->> 'sub') IS NOT NULL
  );

-- user_activity_log policies
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity_log;
CREATE POLICY "Users can insert own activity" ON public.user_activity_log
  FOR INSERT WITH CHECK (
    user_id IN (SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_log;
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (
    user_id IN (SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Admins can view all activity" ON public.user_activity_log;
CREATE POLICY "Admins can view all activity" ON public.user_activity_log
  FOR SELECT USING (
    is_admin((SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub')))
  );

-- integrity_alerts policies
DROP POLICY IF EXISTS "Users can insert own integrity alerts" ON public.integrity_alerts;
CREATE POLICY "Users can insert own integrity alerts" ON public.integrity_alerts
  FOR INSERT WITH CHECK (
    user_id IN (SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Users can view own integrity alerts" ON public.integrity_alerts;
CREATE POLICY "Users can view own integrity alerts" ON public.integrity_alerts
  FOR SELECT USING (
    user_id IN (SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub'))
  );

DROP POLICY IF EXISTS "Admins can view all integrity alerts" ON public.integrity_alerts;
CREATE POLICY "Admins can view all integrity alerts" ON public.integrity_alerts
  FOR SELECT USING (
    is_admin((SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub')))
  );

DROP POLICY IF EXISTS "Admins can update integrity alerts" ON public.integrity_alerts;
CREATE POLICY "Admins can update integrity alerts" ON public.integrity_alerts
  FOR UPDATE USING (
    is_admin((SELECT users.id FROM public.users WHERE users.external_id = (auth.jwt() ->> 'sub')))
  );
