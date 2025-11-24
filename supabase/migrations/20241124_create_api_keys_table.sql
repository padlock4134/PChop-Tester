-- Create api_keys table for admin-generated API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Admins can view all API keys
CREATE POLICY "Admins can view all API keys"
  ON api_keys
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can create API keys
CREATE POLICY "Admins can create API keys"
  ON api_keys
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update API keys
CREATE POLICY "Admins can update API keys"
  ON api_keys
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Admins can delete API keys
CREATE POLICY "Admins can delete API keys"
  ON api_keys
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create indexes for faster lookups
CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
