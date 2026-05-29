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

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

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

CREATE POLICY "Users can view own watchlist"
ON public.watchlist
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own watchlist"
ON public.watchlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
ON public.watchlist
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist"
ON public.watchlist
FOR DELETE
USING (auth.uid() = user_id);

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

CREATE POLICY "Users can view own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);