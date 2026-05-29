import { supabase } from "@/integrations/supabase/client";

// Save watch progress
export const saveWatchProgress = async (params: {
  animeId: string;
  animeTitle: string;
  animeImage: string | null;
  episodeNo: number;
  progress: number;
  duration: number;
}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.from("watch_history").upsert(
    {
      user_id: session.user.id,
      anime_id: params.animeId,
      anime_title: params.animeTitle,
      anime_image: params.animeImage,
      episode_no: params.episodeNo,
      progress: params.progress,
      duration: params.duration,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,anime_id,episode_no" }
  );
  if (error) console.error("Failed to save watch progress:", error);
};

// Get continue watching list (latest episode per anime, sorted by recent)
export const getContinueWatching = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  // Get all watch history, ordered by updated_at desc
  const { data, error } = await supabase
    .from("watch_history")
    .select("*")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  // Deduplicate by anime_id, keeping the most recent episode
  const seen = new Set<string>();
  const result: typeof data = [];
  for (const item of data) {
    if (!seen.has(item.anime_id)) {
      seen.add(item.anime_id);
      result.push(item);
    }
  }
  return result.slice(0, 12);
};

// Toggle favorite
export const toggleFavorite = async (animeId: string, animeTitle: string, animeImage: string | null) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { added: false, error: "Not logged in" };

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("anime_id", animeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    return { added: false, error: error?.message };
  } else {
    const { error } = await supabase.from("favorites").insert({
      user_id: session.user.id,
      anime_id: animeId,
      anime_title: animeTitle,
      anime_image: animeImage,
    });
    return { added: true, error: error?.message };
  }
};

// Toggle watchlist (save for later)
export const toggleWatchlist = async (animeId: string, animeTitle: string, animeImage: string | null) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { added: false, error: "Not logged in" };

  const { data: existing } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("anime_id", animeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("watchlist").delete().eq("id", existing.id);
    return { added: false, error: error?.message };
  } else {
    const { error } = await supabase.from("watchlist").insert({
      user_id: session.user.id,
      anime_id: animeId,
      anime_title: animeTitle,
      anime_image: animeImage,
    });
    return { added: true, error: error?.message };
  }
};

// Get user's favorites
export const getUserFavorites = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get favorites:", error);
    return [];
  }
  return data || [];
};

// Get user's watchlist
export const getUserWatchlist = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get watchlist:", error);
    return [];
  }
  return data || [];
};

// Check if anime is in favorites/watchlist
export const checkAnimeStatus = async (animeId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { isFavorited: false, isInWatchlist: false };

  const [favResult, watchResult] = await Promise.all([
    supabase.from("favorites").select("id").eq("user_id", session.user.id).eq("anime_id", animeId).maybeSingle(),
    supabase.from("watchlist").select("id").eq("user_id", session.user.id).eq("anime_id", animeId).maybeSingle(),
  ]);

  return {
    isFavorited: !!favResult.data,
    isInWatchlist: !!watchResult.data,
  };
};
