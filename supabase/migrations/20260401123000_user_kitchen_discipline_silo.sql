-- Enforce discipline-scoped user_kitchen rows without runtime fallback reads.
-- Backward compatibility strategy:
--   1) Legacy rows with discipline_slug IS NULL are backfilled to 'culinary'.
--   2) App writes/reads always use explicit discipline_slug.
--   3) Future rows must provide a valid, non-null discipline_slug.

ALTER TABLE public.user_kitchen
  ADD COLUMN IF NOT EXISTS discipline_slug text;

-- One-time backfill for legacy rows created before discipline siloing.
UPDATE public.user_kitchen
SET discipline_slug = 'culinary'
WHERE discipline_slug IS NULL;

-- Ensure row shape matches discipline-silo model.
ALTER TABLE public.user_kitchen
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN ingredients SET DEFAULT '[]'::jsonb,
  ALTER COLUMN ingredients SET NOT NULL,
  ALTER COLUMN discipline_slug SET NOT NULL;

-- Keep discipline values bounded to first-party disciplines.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_kitchen_discipline_slug_check'
      AND conrelid = 'public.user_kitchen'::regclass
  ) THEN
    ALTER TABLE public.user_kitchen
      ADD CONSTRAINT user_kitchen_discipline_slug_check
      CHECK (
        discipline_slug = ANY (
          ARRAY[
            'culinary',
            'plumbing',
            'automotive',
            'construction',
            'electrical',
            'hvac',
            'manufacturing',
            'logistics',
            'machining'
          ]::text[]
        )
      );
  END IF;
END
$$;

ALTER TABLE public.user_kitchen
  DROP CONSTRAINT IF EXISTS user_kitchen_user_id_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_kitchen_user_id_discipline_slug_unique'
      AND conrelid = 'public.user_kitchen'::regclass
  ) THEN
    ALTER TABLE public.user_kitchen
      ADD CONSTRAINT user_kitchen_user_id_discipline_slug_unique
      UNIQUE (user_id, discipline_slug);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS user_kitchen_user_id_discipline_slug_idx
  ON public.user_kitchen (user_id, discipline_slug);

-- Keep policies aligned with non-null, valid discipline rows.
DROP POLICY IF EXISTS "Users can insert their own kitchen" ON public.user_kitchen;
CREATE POLICY "Users can insert their own kitchen"
  ON public.user_kitchen
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug = ANY (
      ARRAY[
        'culinary',
        'plumbing',
        'automotive',
        'construction',
        'electrical',
        'hvac',
        'manufacturing',
        'logistics',
        'machining'
      ]::text[]
    )
  );

DROP POLICY IF EXISTS "Users can update their own kitchen" ON public.user_kitchen;
CREATE POLICY "Users can update their own kitchen"
  ON public.user_kitchen
  FOR UPDATE
  USING (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug = ANY (
      ARRAY[
        'culinary',
        'plumbing',
        'automotive',
        'construction',
        'electrical',
        'hvac',
        'manufacturing',
        'logistics',
        'machining'
      ]::text[]
    )
  );
