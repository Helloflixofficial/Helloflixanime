
CREATE TABLE public.watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  anime_id text NOT NULL,
  anime_title text NOT NULL,
  anime_image text,
  episode_no integer NOT NULL DEFAULT 1,
  progress real NOT NULL DEFAULT 0,
  duration real NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, anime_id, episode_no)
);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch history" ON public.watch_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watch history" ON public.watch_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watch history" ON public.watch_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watch history" ON public.watch_history FOR DELETE TO authenticated USING (auth.uid() = user_id);
