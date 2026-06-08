-- AR Scenes Cache
-- Stores AI-generated AR/VR practice scenes per discipline + lesson.
-- Generated once by the first student who hits it, reused by everyone after.

CREATE TABLE IF NOT EXISTS public.ar_scenes_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline VARCHAR(50) NOT NULL,
  lesson_id VARCHAR(100) NOT NULL,
  lesson_title TEXT NOT NULL,
  scene_json JSONB NOT NULL,
  model_version VARCHAR(50) NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT ar_scenes_cache_discipline_lesson_unique UNIQUE (discipline, lesson_id)
);

CREATE INDEX IF NOT EXISTS ar_scenes_cache_lookup_idx
  ON public.ar_scenes_cache (discipline, lesson_id);

ALTER TABLE public.ar_scenes_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ar scene cache" ON public.ar_scenes_cache
  FOR SELECT USING ((auth.jwt() ->> 'sub') IS NOT NULL);

CREATE POLICY "Authenticated users can insert ar scene cache" ON public.ar_scenes_cache
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') IS NOT NULL);
