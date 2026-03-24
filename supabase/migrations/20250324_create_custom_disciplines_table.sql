-- Create custom_disciplines table for admin-generated trade programs
-- This allows educators to create new disciplines dynamically without code changes

CREATE TABLE IF NOT EXISTS custom_disciplines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  skin_config JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_custom_disciplines_slug ON custom_disciplines(slug);

-- Create index on school_id for multi-tenant filtering
CREATE INDEX IF NOT EXISTS idx_custom_disciplines_school_id ON custom_disciplines(school_id);

-- Create index on is_active for filtering active disciplines
CREATE INDEX IF NOT EXISTS idx_custom_disciplines_is_active ON custom_disciplines(is_active);

-- Add RLS policies
ALTER TABLE custom_disciplines ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active custom disciplines
CREATE POLICY "Anyone can read active custom disciplines"
  ON custom_disciplines
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can insert custom disciplines
CREATE POLICY "Admins can insert custom disciplines"
  ON custom_disciplines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policy: Admins can update custom disciplines
CREATE POLICY "Admins can update custom disciplines"
  ON custom_disciplines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policy: Admins can delete custom disciplines
CREATE POLICY "Admins can delete custom disciplines"
  ON custom_disciplines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_disciplines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_disciplines_updated_at
  BEFORE UPDATE ON custom_disciplines
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_disciplines_updated_at();

-- Add comment
COMMENT ON TABLE custom_disciplines IS 'Stores custom trade disciplines created by admins via AI generation';
