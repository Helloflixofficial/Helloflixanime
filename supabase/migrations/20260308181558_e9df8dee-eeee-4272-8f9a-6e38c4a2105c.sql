
-- Comments table with threaded replies
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id text NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ratings table (5-star)
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id text NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, anime_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Team members table (for About Us page)
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Admin',
  avatar_url text,
  bio text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);

-- Follows table
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Donations table (records after Stripe payment)
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  message text,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view donations" ON public.donations FOR SELECT USING (true);
CREATE POLICY "System can insert donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Index for performance
CREATE INDEX idx_comments_anime_id ON public.comments(anime_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_ratings_anime_id ON public.ratings(anime_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
