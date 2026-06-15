-- User Collections Table
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  emoji VARCHAR(10) NOT NULL DEFAULT '📁',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_discipline ON user_collections(discipline);

ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections" ON user_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON user_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON user_collections
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON user_collections
  FOR UPDATE USING (auth.uid() = user_id);
