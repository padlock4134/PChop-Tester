-- Integrity Monitoring Tables for Anti-Cheating Measures

-- Table to track integrity flags and alerts
CREATE TABLE integrity_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline VARCHAR(50),
  alert_type VARCHAR(50) NOT NULL, -- 'fast_completion', 'plagiarism', 'activity_anomaly'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
  description TEXT NOT NULL,
  metadata JSONB, -- Additional context (e.g., completion time, similarity score, etc.)
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track module/lesson completion times for pattern detection
CREATE TABLE completion_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline VARCHAR(50) NOT NULL,
  module_type VARCHAR(50) NOT NULL, -- 'lesson', 'assignment', 'quiz', etc.
  module_id VARCHAR(100) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (completed_at - started_at))) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store text submissions for plagiarism checking
CREATE TABLE text_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline VARCHAR(50) NOT NULL,
  assignment_id VARCHAR(100) NOT NULL,
  assignment_title TEXT,
  submission_text TEXT NOT NULL,
  word_count INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plagiarism_checked BOOLEAN DEFAULT false,
  plagiarism_score DECIMAL(5,2), -- 0-100 similarity percentage
  similar_submissions JSONB -- Array of {user_id, similarity_score}
);

-- Table to track user activity patterns
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'module_start', 'module_complete', etc.
  discipline VARCHAR(50),
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_integrity_alerts_user_id ON integrity_alerts(user_id);
CREATE INDEX idx_integrity_alerts_discipline ON integrity_alerts(discipline);
CREATE INDEX idx_integrity_alerts_reviewed ON integrity_alerts(reviewed);
CREATE INDEX idx_integrity_alerts_created_at ON integrity_alerts(created_at DESC);

CREATE INDEX idx_completion_tracking_user_id ON completion_tracking(user_id);
CREATE INDEX idx_completion_tracking_discipline ON completion_tracking(discipline);
CREATE INDEX idx_completion_tracking_completed_at ON completion_tracking(completed_at DESC);

CREATE INDEX idx_text_submissions_user_id ON text_submissions(user_id);
CREATE INDEX idx_text_submissions_assignment_id ON text_submissions(assignment_id);
CREATE INDEX idx_text_submissions_discipline ON text_submissions(discipline);
CREATE INDEX idx_text_submissions_plagiarism_checked ON text_submissions(plagiarism_checked);

CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_activity_type ON user_activity_log(activity_type);

-- RLS Policies
ALTER TABLE integrity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE completion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all integrity alerts
CREATE POLICY "Admins can view all integrity alerts" ON integrity_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can update integrity alerts (review them)
CREATE POLICY "Admins can update integrity alerts" ON integrity_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own completion tracking
CREATE POLICY "Users can view own completion tracking" ON completion_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert completion tracking
CREATE POLICY "System can insert completion tracking" ON completion_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON text_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions" ON text_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions" ON text_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert activity logs
CREATE POLICY "System can insert activity logs" ON user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
