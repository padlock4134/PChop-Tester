-- Add publish metadata columns to content_staging table
ALTER TABLE content_staging
ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'All Students',
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'Notify Students';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_staging_publish_date ON content_staging(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_staging_visibility ON content_staging(visibility);
