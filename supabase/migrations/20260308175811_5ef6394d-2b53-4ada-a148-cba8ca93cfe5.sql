CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'dark',
  language text NOT NULL DEFAULT 'en',
  autoplay boolean NOT NULL DEFAULT true,
  default_quality text NOT NULL DEFAULT 'auto',
  default_volume integer NOT NULL DEFAULT 80,
  notifications boolean NOT NULL DEFAULT true,
  email_updates boolean NOT NULL DEFAULT true,
  community_notifs boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);