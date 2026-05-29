
-- Fix the overly permissive INSERT policy on donations
DROP POLICY "System can insert donations" ON public.donations;
CREATE POLICY "Users can insert own donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
