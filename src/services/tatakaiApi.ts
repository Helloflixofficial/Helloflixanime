import axios from "axios";

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tatakai-proxy`;

const proxyFetch = async (provider: string, path: string, query?: string) => {
  const params: Record<string, string> = { provider, path };
  if (query) params.q = query;
  const { data } = await axios.get(PROXY_BASE, { params });
  return data;
};

// ===================== AnimeLok =====================

export interface AnimeLokItem {
  id: string;
  title: string;
  poster: string;
}

export interface AnimeLokSeason {
  id: string;
  title: string;
  poster: string;
}

export interface AnimeLokSource {
  name: string;
  url: string;
  type: string;
}

export const searchAnimeLok = async (query: string): Promise<AnimeLokItem[]> => {
  const data = await proxyFetch("animelok", "search", query);
  return (data?.data?.animes || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    poster: a.poster || "",
  }));
};

export const pingAnimeLok = async (): Promise<boolean> => {
  try {
    const results = await searchAnimeLok("naruto");
    return results.length > 0;
  } catch {
    return false;
  }
};

export const getAnimeLokSeasons = async (id: string): Promise<{ seasons: AnimeLokSeason[] }> => {
  const data = await proxyFetch("animelok", `anime/${id}/seasons`);
  return {
    seasons: (data?.data?.seasons || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      poster: s.poster || "",
    })),
  };
};

export const watchAnimeLok = async (id: string, ep: number): Promise<AnimeLokSource[]> => {
  const data = await proxyFetch("animelok", `watch/${id}`, undefined);
  // Pass ep as query param
  const params: Record<string, string> = { provider: "animelok", path: `watch/${id}`, ep: String(ep) };
  const { data: watchData } = await axios.get(PROXY_BASE, { params: { provider: "animelok", path: `watch/${id}?ep=${ep}` } });
  return (watchData?.data?.sources || []).map((s: any) => ({
    name: s.name || "Server",
    url: s.url,
    type: s.type || "EMBED",
  }));
};

// ===================== Animeya =====================

export interface AnimeyaItem {
  slug: string;
  title: string;
  cover: string;
  type?: string;
}

export interface AnimeyaEpisode {
  id: number;
  number: number;
  title: string;
  isFiller: boolean;
}

export interface AnimeyaSource {
  name: string;
  url: string;
  quality: string;
  langue: string;
  subType: string;
}

const extractAnilistId = (slug: string): number | null => {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const fetchAnilistCovers = async (ids: number[]): Promise<Record<number, string>> => {
  if (ids.length === 0) return {};
  try {
    const query = `query ($ids: [Int]) { Page(perPage: 50) { media(id_in: $ids, type: ANIME) { id coverImage { large } } } }`;
    const resp = await axios.post("https://graphql.anilist.co", { query, variables: { ids } });
    const media = resp.data?.data?.Page?.media || [];
    const map: Record<number, string> = {};
    media.forEach((m: any) => { map[m.id] = m.coverImage?.large || ""; });
    return map;
  } catch { return {}; }
};

export const fetchAnimeyaHome = async (): Promise<AnimeyaItem[]> => {
  const data = await proxyFetch("animeya", "home");
  const d = data?.data;
  if (!d) return [];
  const raw = [
    ...(d.featured || []).map((a: any) => ({ slug: a.slug, title: a.title, cover: a.cover || "", type: a.type })),
    ...(d.trending || []).map((a: any) => ({ slug: a.slug, title: a.title, cover: a.cover || "", type: a.type })),
  ];
  // Fetch missing covers from AniList
  const needCovers = raw.filter(a => !a.cover);
  const anilistIds = needCovers.map(a => extractAnilistId(a.slug)).filter((id): id is number => id !== null);
  const coverMap = await fetchAnilistCovers(anilistIds);
  return raw.map(a => {
    if (!a.cover) {
      const id = extractAnilistId(a.slug);
      if (id && coverMap[id]) a.cover = coverMap[id];
    }
    return a;
  });
};

export const searchAnimeya = async (query: string): Promise<AnimeyaItem[]> => {
  const data = await proxyFetch("animeya", "search", query);
  return (data?.data || []).map((a: any) => ({
    slug: a.slug, title: a.title, cover: a.cover || "", type: a.type,
  }));
};

export const getAnimeyaInfo = async (slug: string): Promise<{ title: string; cover: string; description: string; episodes: AnimeyaEpisode[] } | null> => {
  const data = await proxyFetch("animeya", `info/${slug}`);
  const d = data?.data;
  if (!d) return null;
  return {
    title: d.title || "",
    cover: d.cover || "",
    description: d.description || "",
    episodes: (d.episodes || []).map((e: any) => ({
      id: e.id, number: e.number, title: e.title, isFiller: e.isFiller || false,
    })),
  };
};

export const watchAnimeya = async (episodeId: number): Promise<AnimeyaSource[]> => {
  const data = await proxyFetch("animeya", `watch/${episodeId}`);
  return (data?.data?.sources || []).map((s: any) => ({
    name: s.name || "Server",
    url: s.url,
    quality: s.quality || "",
    langue: s.langue || "",
    subType: s.subType || "",
  }));
};

// ===================== AniWorld =====================

export interface AniWorldItem {
  slug: string;
  title: string;
  poster?: string;
  description?: string;
}

export interface AniWorldEpisode {
  number: number;
  title: string;
  slug: string;
}

export interface AniWorldSource {
  name: string;
  url: string;
  language: string;
}

export const searchAniWorld = async (query: string): Promise<AniWorldItem[]> => {
  const data = await proxyFetch("aniworld", "search", query);
  return (data?.data || []).map((a: any) => ({
    slug: a.slug || a.id, title: a.title, poster: a.poster || a.cover || "", description: a.description || "",
  }));
};

export const getAniWorldInfo = async (slug: string): Promise<{ title: string; description: string; poster: string; seasons: { number: number; episodes: AniWorldEpisode[] }[] } | null> => {
  const data = await proxyFetch("aniworld", `info/${slug}`);
  const d = data?.data;
  if (!d) return null;
  return {
    title: d.title || "",
    description: d.description || "",
    poster: d.poster || d.cover || "",
    seasons: (d.seasons || []).map((s: any) => ({
      number: s.number || s.seasonNumber || 1,
      episodes: (s.episodes || []).map((e: any) => ({
        number: e.number || e.episodeNumber,
        title: e.title || `Episode ${e.number}`,
        slug: e.slug || e.id || "",
      })),
    })),
  };
};

export const watchAniWorld = async (slug: string, episode: number): Promise<AniWorldSource[]> => {
  const data = await proxyFetch("aniworld", `watch/${slug}/episode/${episode}`);
  return (data?.data?.sources || []).map((s: any) => ({
    name: s.name || "Server",
    url: s.url,
    language: s.language || "",
  }));
};

// ===================== Fallback Helper =====================

/**
 * Fallback to Tatakai API (resolving against Animeya primarily) when primary HiAnime stream fails.
 * Designed to be dropped into the main WatchPage.
 */
export const getFallbackStream = async (title: string, episodeNumber: number): Promise<AnimeyaSource[]> => {
  try {
    // Clean up title for better search results
    const cleanTitle = title.replace(/\(Dub\)|\(Sub\)/ig, '').trim();
    
    // 1. Search Animeya
    const searchResults = await searchAnimeya(cleanTitle);
    if (!searchResults || searchResults.length === 0) return [];
    
    // Attempt to find a direct title match first, or fallback to first result
    let bestMatch = searchResults[0];
    const exactMatch = searchResults.find(r => r.title.toLowerCase() === cleanTitle.toLowerCase());
    if (exactMatch) bestMatch = exactMatch;

    // 2. Get Anime Info
    const animeInfo = await getAnimeyaInfo(bestMatch.slug);
    if (!animeInfo || !animeInfo.episodes) return [];

    // 3. Find the exact episode
    const episode = animeInfo.episodes.find((ep) => ep.number === episodeNumber);
    if (!episode) return [];

    // 4. Fetch streams
    const streams = await watchAnimeya(episode.id);
    return streams;
  } catch (error) {
    console.error("Fallback stream failed:", error);
    return [];
  }
};

