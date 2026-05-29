-- Fix donations insert policy to require user ownership

DROP POLICY IF EXISTS "System can insert donations" ON public.donations;
CREATE POLICY "Users can insert own donations" ON public.donations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);