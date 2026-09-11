import axios from "axios";
import type { AnimeBasic, Episode, HomeData, Server, StreamingInfo } from "@/types/anime";
import { API_URL, VIDEO_PROXY_URL } from "@/config/api";

/** Single adapter for the sibling HindMovies Vercel catalog and playback API. */
const api = axios.create({ baseURL: API_URL, timeout: 30000 });

interface SeriesCardResponse {
  title: string;
  slug: string;
  poster?: string;
  category?: string | null;
  quality_badge?: string;
  date?: string;
  ongoing?: boolean;
  raw_title?: string;
}

interface SeriesDetailResponse {
  title: string;
  slug: string;
  poster?: string;
  storyline?: string;
  imdb_rating?: string;
  release_year?: string;
  genres?: string;
  language?: string;
  subtitles?: string;
  metadata?: Record<string, string>;
  qualities?: Array<{ quality: string; mvlink_id: string; url: string }>;
}

interface CatalogResponse {
  page: number;
  category: string;
  total: number;
  results?: SeriesCardResponse[];
}

interface EpisodeResponse {
  mvlink_id: string;
  total: number;
  episodes?: Array<{
    name: string;
    filename: string;
    season?: number;
    episode?: number;
    resolution?: string;
  }>;
}

interface DdlResponse {
  mvlink_id: string;
  filename: string;
  servers?: string[];
}

interface ResolvedDdl extends DdlResponse {
  mvlinkId: string;
  filename: string;
}

interface GenreResponse { name: string; slug: string; }

const stableNumber = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) | 0;
  return Math.abs(hash);
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hasDub = (item: SeriesCardResponse) => /dual\s*audio|multi\s*audio|dub/i.test(item.raw_title || item.title);

const mapCard = (item: SeriesCardResponse): AnimeBasic => {
  const id = item.slug;
  return {
    id,
    data_id: stableNumber(id),
    poster: item.poster || "/placeholder.svg",
    banner: item.poster || "/placeholder.svg",
    title: item.title,
    japanese_title: "",
    description: "",
    genres: [],
    tvInfo: {
      showType: item.category ? `${item.category} series` : "Series",
      releaseDate: item.date,
      quality: item.quality_badge,
      sub: 1,
      dub: hasDub(item) ? 1 : 0,
    },
    ongoing: item.ongoing ?? false,
    category: item.category,
  };
};

const mapCards = (items: SeriesCardResponse[] = []) => items.filter(Boolean).map(mapCard);
const getCatalog = async (path: string, params?: Record<string, string | number>) => (await api.get<CatalogResponse>(path, { params })).data;
const getSeries = async (id: string) => (await api.get<SeriesDetailResponse>(`/series/${encodeURIComponent(id)}`)).data;
const getFirstQuality = (detail: SeriesDetailResponse) => detail.qualities?.[0];

const encodeEpisodeId = (mvlinkId: string, filename: string) => `hindmovies:${mvlinkId}:${encodeURIComponent(filename)}`;
const decodeEpisodeId = (episodeId: string) => {
  const match = episodeId.match(/^hindmovies:([^:]+):(.+)$/);
  if (!match) throw new Error("Invalid HindMovies episode id");
  return { mvlinkId: match[1], filename: decodeURIComponent(match[2]) };
};

const mapDetail = (detail: SeriesDetailResponse) => {
  const genreList = (detail.genres || "").split(",").map((genre) => genre.trim()).filter(Boolean);
  const metadata = detail.metadata || {};
  return {
    adultContent: false,
    id: detail.slug,
    data_id: stableNumber(detail.slug),
    title: detail.title,
    japanese_title: "",
    poster: detail.poster || "/placeholder.svg",
    banner: detail.poster || "/placeholder.svg",
    showType: detail.language ? `${detail.language} series` : "Series",
    tvInfo: {
      quality: metadata.Quality,
      sub: 1,
      dub: /dual\s*audio|multi\s*audio/i.test(`${detail.language} ${metadata.Language}`) ? 1 : 0,
    },
    animeInfo: {
      Overview: detail.storyline || "No synopsis is available for this title.",
      Japanese: "",
      Synonyms: "",
      Aired: detail.release_year || "",
      Premiered: detail.release_year || "",
      Duration: "",
      Status: metadata.Status || "Available",
      "MAL Score": detail.imdb_rating || "",
      Genres: genreList.map((name) => ({ name, url: `/genre/${slugify(name)}` })),
      Studios: "",
      Producers: [],
    },
    source: detail,
  };
};

export const getGenres = async (): Promise<GenreResponse[]> => {
  const { data } = await api.get<GenreResponse[]>("/genres");
  return Array.isArray(data) ? data.filter((genre) => genre.slug && !/^\d+$/.test(genre.slug)) : [];
};

export const getHomeData = async (): Promise<HomeData> => {
  const [allResult, animationResult, koreanResult, chineseResult, genresResult] = await Promise.allSettled([
    getCatalog("/home", { page: 1, category: "all" }),
    getCatalog("/genre/animation-series", { page: 1 }),
    getCatalog("/home", { page: 1, category: "korean" }),
    getCatalog("/home", { page: 1, category: "chinese" }),
    getGenres(),
  ]);
  const all = allResult.status === "fulfilled" ? mapCards(allResult.value.results) : [];
  const animation = animationResult.status === "fulfilled" ? mapCards(animationResult.value.results) : [];
  const korean = koreanResult.status === "fulfilled" ? mapCards(koreanResult.value.results) : [];
  const chinese = chineseResult.status === "fulfilled" ? mapCards(chineseResult.value.results) : [];
  const genres = genresResult.status === "fulfilled" ? genresResult.value.map((genre) => genre.name) : [];

  return {
    spotlights: (animation.length ? animation : all).slice(0, 5),
    trending: all,
    topAiring: all.filter((item) => item.ongoing),
    mostPopular: animation.length ? animation : all,
    mostFavorite: korean.length || chinese.length ? [...korean, ...chinese] : all,
    latestCompleted: all.filter((item) => !item.ongoing),
    latestEpisode: all,
    spring2026: animation,
    genres,
  };
};

export const getAnimeDetails = async (id: string) => {
  const detail = await getSeries(id);
  return { data: mapDetail(detail), seasons: [], related_data: [] };
};

export const getEpisodes = async (id: string): Promise<{ totalEpisodes: number; episodes: Episode[] }> => {
  const detail = await getSeries(id);
  const quality = getFirstQuality(detail);
  if (!quality) return { totalEpisodes: 0, episodes: [] };
  const { data } = await api.get<EpisodeResponse>(`/episode/${quality.mvlink_id}`);
  const episodes = (data.episodes || []).map((episode, index) => {
    const number = episode.episode || index + 1;
    return {
      episode_no: number,
      id: encodeEpisodeId(quality.mvlink_id, episode.filename),
      data_id: index + 1,
      jname: episode.name || `Episode ${number}`,
      title: episode.name || `Episode ${number}`,
      japanese_title: episode.name || `Episode ${number}`,
      filename: episode.filename,
      mvlink_id: quality.mvlink_id,
    };
  });
  return { totalEpisodes: data.total || episodes.length, episodes };
};

// One resolver request returns every mirror. Cache the in-flight promise so
// the first stream and the server selector never resolve the same file twice.
const ddlCache = new Map<string, Promise<ResolvedDdl>>();

const getDdl = (episodeId: string): Promise<ResolvedDdl> => {
  const cached = ddlCache.get(episodeId);
  if (cached) return cached;

  const { mvlinkId, filename } = decodeEpisodeId(episodeId);
  const request = api
    .get<DdlResponse>(`/ddl/${mvlinkId}`, { params: { file: filename } })
    .then(({ data }) => ({ ...data, mvlinkId, filename }))
    .catch((error) => {
      ddlCache.delete(episodeId);
      throw error;
    });
  ddlCache.set(episodeId, request);
  return request;
};

// DDL mirror URLs are signed/rotating. Keep the in-flight request cached for
// server switching, but allow the retry action to request a fresh mirror set.
export const clearDdlCache = (episodeId: string) => {
  ddlCache.delete(episodeId);
};

const mapResolvedServers = (servers: string[] = []): Server[] => servers.map((_, index) => ({
  type: "sub",
  data_id: index,
  server_id: index,
  server_name: `Server ${index + 1}`,
  serverName: `Server ${index + 1}`,
}));

const detectMediaType = (filename: string, source: string): StreamingInfo["mediaType"] => {
  const value = `${filename} ${source}`.toLowerCase();
  if (value.includes(".m3u8") || value.includes("mpegurl")) return "hls";
  if (value.includes(".mkv") || value.includes("matroska")) return "mkv";
  if (value.includes(".webm")) return "webm";
  if (value.includes(".mp4") || value.includes("video/mp4")) return "mp4";
  return "unknown";
};

export const getServers = async (episodeId: string): Promise<Server[]> => {
  const data = await getDdl(episodeId);
  return mapResolvedServers(data.servers);
};

export const getStreamingInfo = async (episodeId: string, server = "server-1", _type = "sub"): Promise<StreamingInfo> => {
  const data = await getDdl(episodeId);
  const serverNumber = Number(server.match(/(\d+)$/)?.[1] || 1) - 1;
  const source = data.servers?.[serverNumber] || data.servers?.[0];
  if (!source) throw new Error("No streaming servers found for this episode");
  const mediaType = detectMediaType(data.filename, source);
  return {
    streamingLink: [{
      id: serverNumber + 1,
      type: mediaType === "hls" ? "hls" : "file",
      link: { file: source, type: mediaType === "mkv" ? "video/x-matroska" : `video/${mediaType === "unknown" ? "mp4" : mediaType}` },
      tracks: [],
      server: `Server ${serverNumber + 1}`,
    }],
    servers: mapResolvedServers(data.servers),
    mediaType,
    sourceFilename: data.filename,
  };
};

export const getProxiedUrl = (url: string, headers?: Record<string, string>) => {
  const query = `${VIDEO_PROXY_URL}${encodeURIComponent(url)}`;
  return headers && Object.keys(headers).length > 0 ? `${query}&headers=${encodeURIComponent(JSON.stringify(headers))}` : query;
};

export const searchAnime = async (query: string, page = 1) => {
  const data = await getCatalog("/search", { q: query, page });
  const results = mapCards(data.results);
  return { data: results, hasNextPage: results.length >= 20 };
};

export const getAnimeByCategory = async (category: string, page = 1) => {
  const normalized = category.replace(/^genre\//, "");
  const homeCategories = new Set(["all", "trending", "top-airing", "most-popular", "most-favorite", "completed", "recently-updated", "recently-added"]);
  const data = homeCategories.has(normalized)
    ? await getCatalog("/home", { page, category: "all" })
    : normalized === "korean" || normalized === "chinese"
      ? await getCatalog("/home", { page, category: normalized })
      : await getCatalog(`/genre/${encodeURIComponent(normalized)}`, { page });
  const results = mapCards(data.results).filter((item) => normalized !== "completed" || !item.ongoing);
  return { data: results, hasNextPage: results.length >= 20, total: data.total, totalPages: results.length >= 20 ? page + 1 : page };
};

export const getCategoryTitle = (category: string) => {
  const titles: Record<string, string> = {
    all: "All Series",
    trending: "Trending Now",
    "top-airing": "Latest Series",
    "most-popular": "Most Popular",
    "recently-added": "Recently Added",
    completed: "Recently Completed",
    "recently-updated": "Latest Episodes",
    korean: "Korean Series",
    chinese: "Chinese Series",
    "animation-series": "Anime Series",
  };
  return titles[category] || category.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
};
