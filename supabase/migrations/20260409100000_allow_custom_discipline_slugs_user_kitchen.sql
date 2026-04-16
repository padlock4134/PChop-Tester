-- Allow dynamic/custom discipline slugs in user_kitchen so generated disciplines remain isolated.

ALTER TABLE public.user_kitchen
  DROP CONSTRAINT IF EXISTS user_kitchen_discipline_slug_check;

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
    AND discipline_slug IS NOT NULL
    AND btrim(discipline_slug) <> ''
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
    AND discipline_slug IS NOT NULL
    AND btrim(discipline_slug) <> ''
  )
  WITH CHECK (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug IS NOT NULL
    AND btrim(discipline_slug) <> ''
  );

DROP POLICY IF EXISTS "Users can view their own kitchen" ON public.user_kitchen;
CREATE POLICY "Users can view their own kitchen"
  ON public.user_kitchen
  FOR SELECT
  USING (
    user_id IN (
      SELECT users.id
      FROM public.users
      WHERE users.external_id = (auth.jwt() ->> 'sub'::text)
    )
    AND discipline_slug IS NOT NULL
    AND btrim(discipline_slug) <> ''
  );
