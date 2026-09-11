import axios from "axios";
import { HINDI_API_BASE } from "@/config/api";

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

const api = axios.create({ baseURL: HINDI_API_BASE, timeout: 30000 });
const isJunkTitle = (title: string) => title.toLowerCase().includes("anime hindi world") || title.includes("𝔸𝕟𝕚𝕞𝕖 ℍ𝕚𝕟𝕕𝕚");

const cleanTitle = (title: string, slug: string) =>
  !title || isJunkTitle(title)
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase())
    : title;

const normalizeItem = (item: Record<string, unknown>): HindiAnimeItem => {
  const slug = String(item.slug || "");
  return {
    title: cleanTitle(String(item.title || ""), slug),
    slug,
    url: typeof item.url === "string" ? item.url : undefined,
    thumbnail: String(item.poster || item.thumbnail || item.image || "/placeholder.svg"),
    categories: Array.isArray(item.categories) ? item.categories.filter((value): value is string => typeof value === "string") : [],
  };
};

const getData = async (path: string, title?: string) => {
  const { data } = await api.get(path, title ? { params: { title } } : undefined);
  return data?.data;
};

export const fetchHindiHome = async (): Promise<HindiAnimeItem[]> => {
  const data = await getData("/home");
  const featured = Array.isArray(data?.featured) ? data.featured : [];
  return featured
    .filter((item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === "object" && "slug" in item))
    .map(normalizeItem);
};

export const searchHindiAnime = async (query: string): Promise<HindiAnimeItem[]> => {
  const data = await getData("/search", query);
  return Array.isArray(data?.animeList)
    ? data.animeList
        .filter((item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map(normalizeItem)
    : [];
};

export const fetchHindiAnimeDetail = async (slug: string): Promise<HindiAnimeDetail | null> => {
  const data = await getData(`/anime/${encodeURIComponent(slug)}`);
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  return {
    title: cleanTitle(String(record.title || ""), slug),
    slug: String(record.slug || slug),
    thumbnail: String(record.poster || record.thumbnail || record.image || "/placeholder.svg"),
    description: String(record.description || ""),
    rating: typeof record.rating === "string" ? record.rating : undefined,
    episodes: Array.isArray(record.episodes)
      ? record.episodes.map((episode: Record<string, unknown>) => ({
          number: Number(episode.number || 0),
          title: String(episode.title || `Episode ${episode.number || ""}`),
          servers: Array.isArray(episode.servers)
            ? episode.servers
                .map((server: Record<string, unknown>) => ({
                  name: String(server.name || "Server"),
                  url: String(server.url || ""),
                  language: String(server.language || "Hindi"),
                }))
                .filter((server: HindiEpisodeServer) => Boolean(server.url))
            : [],
        }))
      : [],
  };
};
