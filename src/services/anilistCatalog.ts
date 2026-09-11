import axios from "axios";
import type { AnimeBasic } from "@/types/anime";
import { getAnimeByCategory } from "@/services/animeApi";
import { getAniVexaEpisodes } from "@/services/anivexaApi";

const ANILIST_API_URL = import.meta.env.VITE_ANILIST_API_URL || "https://graphql.anilist.co";

const api = axios.create({
  baseURL: ANILIST_API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const RECENT_ANIME_QUERY = `
  query RecentlyAddedAnime($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, sort: [UPDATED_AT_DESC, ID_DESC]) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        format
        status
        episodes
        averageScore
        startDate { year }
        genres
      }
    }
  }
`;

const FORMAT_ANIME_QUERY = `
  query AniVexaFormatCatalog($page: Int!, $perPage: Int!, $format: MediaFormat!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, format: $format, sort: [UPDATED_AT_DESC, ID_DESC]) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        format
        status
        episodes
        averageScore
        startDate { year }
        genres
      }
    }
  }
`;

const ANIVEXA_HOME_QUERY = `
  query AniVexaHomeCatalog($page: Int!, $perPage: Int!) {
    trending: Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: [TRENDING_DESC]) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        format
        status
        episodes
        averageScore
        startDate { year }
        genres
      }
    }
    latest: Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: [UPDATED_AT_DESC]) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        format
        status
        episodes
        averageScore
        startDate { year }
        genres
      }
    }
    newAnime: Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: [START_DATE_DESC, ID_DESC]) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        format
        status
        episodes
        averageScore
        startDate { year }
        genres
      }
    }
  }
`;

const ANIME_INFO_QUERY = `
  query AniVexaAnimeInfo($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      coverImage { extraLarge large }
      bannerImage
      description(asHtml: false)
      format
      status
      episodes
      averageScore
      startDate { year }
      genres
      relations {
        edges {
          node {
            id
            title { romaji english native }
            coverImage { extraLarge large }
            bannerImage
            description(asHtml: false)
            format
            status
            episodes
            averageScore
            startDate { year }
            genres
          }
        }
      }
      recommendations(perPage: 12, sort: RATING_DESC) {
        nodes {
          mediaRecommendation {
            id
            title { romaji english native }
            coverImage { extraLarge large }
            bannerImage
            description(asHtml: false)
            format
            status
            episodes
            averageScore
            startDate { year }
            genres
          }
        }
      }
    }
  }
`;

interface AniListMedia {
  id: number;
  title?: { romaji?: string; english?: string; native?: string };
  coverImage?: { extraLarge?: string; large?: string };
  bannerImage?: string;
  description?: string;
  format?: string;
  status?: string;
  episodes?: number;
  averageScore?: number;
  startDate?: { year?: number };
  genres?: string[];
  relations?: { edges?: Array<{ node?: AniListMedia }> };
  recommendations?: { nodes?: Array<{ mediaRecommendation?: AniListMedia | null }> };
}

const cleanDescription = (description?: string) =>
  description?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";

const mapMedia = (media: AniListMedia): AnimeBasic => ({
  id: String(media.id),
  data_id: media.id,
  poster: media.coverImage?.extraLarge || media.coverImage?.large || "/placeholder.svg",
  banner: media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large || "/placeholder.svg",
  title: media.title?.english || media.title?.romaji || media.title?.native || "Untitled anime",
  japanese_title: media.title?.native || media.title?.romaji || "",
  description: cleanDescription(media.description),
  genres: media.genres || [],
  score: media.averageScore ? media.averageScore / 10 : undefined,
  category: "anivexa",
  tvInfo: {
    showType: media.format || "ANIME",
    releaseDate: media.startDate?.year ? String(media.startDate.year) : undefined,
    eps: media.episodes,
    sub: media.episodes || 1,
  },
  ongoing: media.status === "RELEASING",
});

export const getAniListRecentlyAdded = async (page = 1, perPage = 24) => {
  const { data } = await api.post("", {
    query: RECENT_ANIME_QUERY,
    variables: { page, perPage },
  });
  const pageData = data?.data?.Page;
  return {
    data: Array.isArray(pageData?.media) ? pageData.media.map(mapMedia) : [],
    hasNextPage: Boolean(pageData?.pageInfo?.hasNextPage),
    source: "anilist" as const,
  };
};

export const getAniListByFormat = async (format: "MOVIE" | "TV", page = 1, perPage = 24) => {
  const { data } = await api.post("", {
    query: FORMAT_ANIME_QUERY,
    variables: { page, perPage, format },
  });
  const pageData = data?.data?.Page;
  return {
    data: Array.isArray(pageData?.media) ? pageData.media.map(mapMedia) : [],
    hasNextPage: Boolean(pageData?.pageInfo?.hasNextPage),
    source: "anilist" as const,
  };
};

const keepPlayableAniVexaTitles = async (items: AnimeBasic[]) => {
  const checks = await Promise.allSettled(
    items.map(async (anime) => {
      const episodes = await getAniVexaEpisodes(anime.id, undefined, "sub");
      return episodes.length > 0 ? anime : null;
    }),
  );
  return checks
    .filter((check): check is PromiseFulfilledResult<AnimeBasic | null> => check.status === "fulfilled")
    .map((check) => check.value)
    .filter((anime): anime is AnimeBasic => Boolean(anime));
};

export const getAniVexaRecentlyAdded = async (page = 1) => {
  try {
    const result = await getAniListRecentlyAdded(page);
    if (result.data.length > 0) {
      const playable = await keepPlayableAniVexaTitles(result.data);

      // Keep the AniList metadata visible if AniVexa is temporarily rate-limited,
      // but prefer a list whose cards are confirmed to have episode routes.
      return { ...result, data: playable.length > 0 ? playable : result.data };
    }
  } catch (error) {
    console.warn("AniList catalog unavailable; using the existing catalog fallback.", error);
  }

  const fallback = await getAnimeByCategory("recently-added", page);
  return {
    data: fallback.data,
    hasNextPage: fallback.hasNextPage,
    source: "hindmovies" as const,
  };
};

export const getAniVexaByFormat = async (format: "MOVIE" | "TV", page = 1) => {
  try {
    const result = await getAniListByFormat(format, page);
    if (result.data.length > 0) {
      const playable = await keepPlayableAniVexaTitles(result.data);
      return { ...result, data: playable.length > 0 ? playable : result.data };
    }
  } catch (error) {
    console.warn(`AniList ${format.toLowerCase()} catalog unavailable; using the existing catalog fallback.`, error);
  }

  const fallback = await getAnimeByCategory(format === "MOVIE" ? "movie" : "all", page);
  return {
    data: fallback.data,
    hasNextPage: fallback.hasNextPage,
    source: "hindmovies" as const,
  };
};

export interface AniVexaHomeCatalog {
  trending: AnimeBasic[];
  latest: AnimeBasic[];
  newAnime: AnimeBasic[];
}

export interface AniVexaAnimeInfo {
  anime: AnimeBasic;
  related: AnimeBasic[];
}

export const getAniVexaHomeCatalog = async (page = 1, perPage = 18): Promise<AniVexaHomeCatalog> => {
  const { data } = await api.post("", {
    query: ANIVEXA_HOME_QUERY,
    variables: { page, perPage },
  });

  const home = data?.data;
  if (!home) throw new Error("AniList catalog did not return home sections");

  return {
    trending: Array.isArray(home.trending?.media) ? home.trending.media.map(mapMedia) : [],
    latest: Array.isArray(home.latest?.media) ? home.latest.media.map(mapMedia) : [],
    newAnime: Array.isArray(home.newAnime?.media) ? home.newAnime.media.map(mapMedia) : [],
  };
};

export const getAniVexaAnimeInfo = async (id: string | number): Promise<AniVexaAnimeInfo> => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) throw new Error("Invalid AniList anime ID");

  const { data } = await api.post("", {
    query: ANIME_INFO_QUERY,
    variables: { id: numericId },
  });
  const media = data?.data?.Media as AniListMedia | null | undefined;
  if (!media) throw new Error("Anime information was not found");

  const relationItems = media.relations?.edges?.map((edge) => edge.node).filter((item): item is AniListMedia => Boolean(item)) || [];
  const recommendationItems = media.recommendations?.nodes?.map((item) => item.mediaRecommendation).filter((item): item is AniListMedia => Boolean(item)) || [];
  const related = [...relationItems, ...recommendationItems]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 12)
    .map(mapMedia);

  return { anime: mapMedia(media), related };
};
