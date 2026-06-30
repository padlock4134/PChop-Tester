CREATE TABLE IF NOT EXISTS skill_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  video_url TEXT,
  video_name TEXT,
  notes TEXT,
  destination TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skill_claims ENABLE ROW LEVEL SECURITY;

-- Anyone can read public claims (used by the public evidence page - no login required)
CREATE POLICY "Public claims viewable by everyone"
ON skill_claims FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Only the owner can insert their own claims
CREATE POLICY "Users can insert own claims"
ON skill_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their own claims (e.g. toggle is_public)
CREATE POLICY "Users can update own claims"
ON skill_claims FOR UPDATE
USING (auth.uid() = user_id);
