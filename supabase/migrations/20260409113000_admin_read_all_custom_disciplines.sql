-- Allow admins to review unpublished/draft custom disciplines.

DROP POLICY IF EXISTS "Admins can read all custom disciplines" ON public.custom_disciplines;

CREATE POLICY "Admins can read all custom disciplines"
  ON public.custom_disciplines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );
