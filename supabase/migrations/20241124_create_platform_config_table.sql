-- Create platform_config table for cross-platform configuration settings
CREATE TABLE IF NOT EXISTS platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_data JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Admins can view platform config
CREATE POLICY "Admins can view platform config"
  ON platform_config
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can insert platform config
CREATE POLICY "Admins can insert platform config"
  ON platform_config
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update platform config
CREATE POLICY "Admins can update platform config"
  ON platform_config
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Admins can delete platform config
CREATE POLICY "Admins can delete platform config"
  ON platform_config
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_platform_config_updated_at ON platform_config(updated_at);
