import axios from "axios";

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hindi-proxy`;

export interface HindiAnimeItem {
  title: string;
  slug: string;
  url?: string;
  thumbnail: string;
  categories?: string[];
}

export interface HindiEpisodeServer {
  name: string;
  url: string;
  language: string;
}

export interface HindiEpisode {
  number: number;
  title: string;
  servers: HindiEpisodeServer[];
}

export interface HindiAnimeDetail {
  title: string;
  slug: string;
  thumbnail: string;
  description: string;
  rating?: string;
  episodes: HindiEpisode[];
}

export interface HindiHomeSection {
  title: string;
  anime: HindiAnimeItem[];
}

const proxyFetch = async (path: string, query?: string) => {
  const params: Record<string, string> = { path };
  if (query) params.q = query;
  const { data } = await axios.get(PROXY_BASE, { params });
  return data;
};

const JUNK_TITLES = ["𝔸𝕟𝕚𝕞𝕖 ℍ𝕚𝕟𝕕𝕚 𝕎𝕠𝕣𝕝𝕕", "anime hindi world"];

const slugToTitle = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const cleanTitle = (title: string, slug: string) => {
  if (!title || JUNK_TITLES.some((j) => title.toLowerCase().includes(j.toLowerCase()))) {
    return slugToTitle(slug);
  }
  return title;
};

const normalizeItems = (items: any[]): HindiAnimeItem[] =>
  items.map((item: any) => ({
    title: cleanTitle(item.title || "", item.slug || ""),
    slug: item.slug || "",
    url: item.url,
    thumbnail: item.poster || item.thumbnail || item.image || "",
    categories: item.categories,
  }));

export const fetchHindiHome = async (): Promise<HindiAnimeItem[]> => {
  const data = await proxyFetch("home");
  const d = data?.data;
  if (!d) return [];

  // Collect from all keys that are arrays of objects with slug
  const allItems: any[] = [];
  if (d && typeof d === "object") {
    for (const key of Object.keys(d)) {
      if (Array.isArray(d[key]) && d[key].length > 0 && d[key][0]?.slug) {
        allItems.push(...d[key]);
      }
    }
  }
  if (allItems.length > 0) return normalizeItems(allItems);

  if (d?.sections) {
    return normalizeItems(d.sections.flatMap((s: any) => s.anime || []));
  }
  return [];
};

export const searchHindiAnime = async (query: string): Promise<HindiAnimeItem[]> => {
  const data = await proxyFetch("search", query);
  return data?.data?.animeList || [];
};

export const fetchHindiAnimeDetail = async (slug: string): Promise<HindiAnimeDetail | null> => {
  const data = await proxyFetch(`anime/${slug}`);
  const d = data?.data;
  if (!d) return null;
  return {
    ...d,
    title: cleanTitle(d.title || "", d.slug || slug),
    thumbnail: d.poster || d.thumbnail || d.image || "",
    description: JUNK_TITLES.some((j) => (d.description || "").toLowerCase().includes(j.toLowerCase()))
      ? ""
      : d.description || "",
  };
};

export const fetchHindiCategory = async (name: string): Promise<HindiAnimeItem[]> => {
  const data = await proxyFetch(`category/${name}`);
  return data?.data?.anime || [];
};
