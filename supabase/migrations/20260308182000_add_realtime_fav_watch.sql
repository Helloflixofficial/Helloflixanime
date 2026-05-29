-- Add realtime publication for favorites and watchlist tables
-- Run this migration after the core tables exist

ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlist;