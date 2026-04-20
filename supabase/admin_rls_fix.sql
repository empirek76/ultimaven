-- Allow admins to read all submissions (all statuses)
DROP POLICY IF EXISTS "Admins can read all submissions" ON public.lb_submissions;
CREATE POLICY "Admins can read all submissions"
  ON public.lb_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Allow admins to update submissions (approve / reject)
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.lb_submissions;
CREATE POLICY "Admins can update all submissions"
  ON public.lb_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
