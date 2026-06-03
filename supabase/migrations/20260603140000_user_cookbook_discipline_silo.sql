-- Enforce discipline-scoped user_cookbook rows to prevent cross-discipline data overwrites.
-- Mirrors the discipline_slug siloing already applied to user_kitchen.
-- Backward compatibility strategy:
--   1) Legacy rows with discipline_slug IS NULL are backfilled to 'culinary'.
--   2) App writes/reads always use explicit discipline_slug.
--   3) Future rows must provide a valid, non-empty discipline_slug.

-- Step 1: Add the discipline_slug column
ALTER TABLE public.user_cookbook
  ADD COLUMN IF NOT EXISTS discipline_slug text;

-- Step 2: Backfill legacy rows (all existing data was culinary-only)
UPDATE public.user_cookbook
SET discipline_slug = 'culinary'
WHERE discipline_slug IS NULL;

-- Step 3: Enforce NOT NULL and set defaults
ALTER TABLE public.user_cookbook
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN recipes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN recipes SET NOT NULL,
  ALTER COLUMN discipline_slug SET NOT NULL;

-- Step 4: Drop old user_id-only unique constraint
ALTER TABLE public.user_cookbook
  DROP CONSTRAINT IF EXISTS user_cookbook_user_id_unique;

ALTER TABLE public.user_cookbook
  DROP CONSTRAINT IF EXISTS user_cookbook_pkey;

-- Step 5: Add composite unique constraint on (user_id, discipline_slug)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_cookbook_user_id_discipline_slug_unique'
      AND conrelid = 'public.user_cookbook'::regclass
  ) THEN
    ALTER TABLE public.user_cookbook
      ADD CONSTRAINT user_cookbook_user_id_discipline_slug_unique
      UNIQUE (user_id, discipline_slug);
  END IF;
END
$$;

-- Step 6: Add index for faster lookups
CREATE INDEX IF NOT EXISTS user_cookbook_user_id_discipline_slug_idx
  ON public.user_cookbook (user_id, discipline_slug);

-- Step 7: Update RLS policies to scope by discipline_slug (non-empty)
DROP POLICY IF EXISTS "Users can insert their own cookbook" ON public.user_cookbook;
CREATE POLICY "Users can insert their own cookbook"
  ON public.user_cookbook
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug <> ''
  );

DROP POLICY IF EXISTS "Users can update their own cookbook" ON public.user_cookbook;
CREATE POLICY "Users can update their own cookbook"
  ON public.user_cookbook
  FOR UPDATE
  USING (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug <> ''
  )
  WITH CHECK (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug <> ''
  );

DROP POLICY IF EXISTS "Users can view their own cookbook" ON public.user_cookbook;
CREATE POLICY "Users can view their own cookbook"
  ON public.user_cookbook
  FOR SELECT
  USING (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug <> ''
  );
