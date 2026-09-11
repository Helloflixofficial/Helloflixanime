# Final Database Migration Plan for New Supabase Project

This plan outlines the steps to migrate your database structure (tables, RLS policies, triggers, and indices) to your new Supabase project.

## Step 1: Initialize Database Schema
Copy and run the following combined SQL script in your **Supabase SQL Editor**. This script combines all 8 migration files from your project in the correct order.

```sql
-- ==========================================
-- 1. Create Core Tables (Profiles, Watchlist, Favorites)
-- ==========================================

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create watchlist table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  anime_id TEXT NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT,
  status TEXT DEFAULT 'watching',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to own watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist" ON public.watchlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  anime_id TEXT NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 2. Create Watch History
-- ==========================================

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

-- ==========================================
-- 3. Create User Settings
-- ==========================================

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
  font text NOT NULL DEFAULT 'inter',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ==========================================
-- 4. Create Features (Comments, Ratings, Team, Follows, Donations)
-- ==========================================

-- Comments table
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

-- Ratings table
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

-- Team members table
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

-- Donations table
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
CREATE POLICY "Users can insert own donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 5. Realtime and Performance
-- ==========================================

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlist;

-- Performance Indices
CREATE INDEX idx_comments_anime_id ON public.comments(anime_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_ratings_anime_id ON public.ratings(anime_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
```

## Step 2: Code Refactoring (Completed)
The app now uses the sibling HindMovies Vercel API as its single catalog/playback API and the sibling Cloudflare Worker for streamed mirror URLs.

**Files updated:**
- `src/config/api.ts`
- `src/services/animeApi.ts`
- `src/config/api.ts`

## Step 3: API Configuration
Set these variables in `.env` if you need to override the deployed sibling services:

```env
VITE_HINDMOVIES_API_URL=https://hindmovies-zeta.vercel.app
VITE_HINDMOVIES_VIDEO_PROXY_URL=https://hindmovies.abdullahdaniyal.workers.dev/?url=
```

## Step 4: Final Checklist
To ensure everything works perfectly:
1. [ ] **Google Auth**: In your Supabase Dashboard, go to **Authentication > Providers > Google** and enable it if you plan to use Google login.
2. [ ] **Environment Variables**: Verify that your `.env` file contains the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. [ ] **Site URL**: In Supabase Dashboard, go to **Authentication > URL Configuration** and set the "Site URL" to your production domain or `http://localhost:5173` for local development.
4. [ ] **Realtime**: I have already included the SQL to enable Realtime for your tables in the script above.
