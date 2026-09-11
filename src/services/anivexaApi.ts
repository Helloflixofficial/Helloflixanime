import axios from "axios";
import { ANIVEXA_API_URL } from "@/config/api";

export const ANIVEXA_PROVIDERS = [
  "mkissa",
  "reanime",
  "anikoto",
  "animegg",
  "anineko",
  "anidbapp",
  "2dhive",
  "animenosub",
  "anizone",
  "aniwaves",
  "anibd",
  "senshi",
  "kaa",
  "animedunya",
] as const;

export type AniVexaProvider = (typeof ANIVEXA_PROVIDERS)[number];
export type AniVexaMode = "sub" | "dub";

interface AniVexaIndex {
  name?: string;
  cache?: boolean;
  providers?: string[];
  routes?: string[];
}

export interface AniVexaEpisode {
  number: number;
  id: string;
  title: string;
  provider?: string;
}

export interface AniVexaPlayback {
  url: string;
  kind: "embed" | "media";
  mediaType?: string;
  servers: AniVexaServer[];
}

export interface AniVexaServer {
  name: string;
  type?: string;
  url?: string;
  embed?: string;
}

const api = axios.create({
  baseURL: ANIVEXA_API_URL,
  timeout: 12000,
});

const isApiIndex = (data: unknown): data is AniVexaIndex => {
  if (!data || typeof data !== "object") return false;
  const value = data as AniVexaIndex;
  return typeof value.name === "string" && Array.isArray(value.routes);
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const assertPayload = (data: unknown) => {
  if (isApiIndex(data)) {
    throw new Error("AniVexa returned its route index instead of stream data");
  }
  return data;
};

export const getAniVexaCapabilities = async () => {
  const { data } = await api.get<AniVexaIndex>("/");
  return {
    name: data.name || "AniVexa API",
    providers: data.providers?.length ? data.providers : [...ANIVEXA_PROVIDERS],
    routes: data.routes || [],
  };
};

export const getAniVexaMap = async (anilistId: string | number) => {
  const { data } = await api.get(`/map/${encodeURIComponent(anilistId)}`);
  return assertPayload(data);
};

const readEpisodeList = (payload: unknown): AniVexaEpisode[] => {
  const record = isRecord(payload) ? payload : {};
  const data = isRecord(record.data) ? record.data : {};
  const raw = Array.isArray(payload)
    ? payload
    : record.episodes || data.episodes || record.results || data.results || [];

  return (Array.isArray(raw) ? raw : []).map((value: unknown, index: number) => {
    const episode = isRecord(value) ? value : {};
    const number = Number(episode.number ?? episode.episode ?? episode.episodeNumber ?? index + 1);
    return {
      number: Number.isFinite(number) ? number : index + 1,
      id: String(episode.id ?? episode.episodeId ?? number),
      title: String(episode.title ?? episode.name ?? `Episode ${number}`),
      provider: episode.provider ? String(episode.provider) : undefined,
    };
  });
};

const readProviderEpisodes = (
  payload: unknown,
  provider: AniVexaProvider | undefined,
  mode: AniVexaMode,
): AniVexaEpisode[] => {
  const root = isRecord(payload) ? payload : {};
  const providerNames = provider ? [provider] : ANIVEXA_PROVIDERS;

  for (const providerName of providerNames) {
    const providerPayload = isRecord(root[providerName]) ? root[providerName] : undefined;
    if (!providerPayload) continue;

    if (typeof providerPayload.error === "string") {
      if (provider) throw new Error(providerPayload.error);
      continue;
    }

    const episodeGroups = isRecord(providerPayload.episodes) ? providerPayload.episodes : {};
    const rawEpisodes = episodeGroups[mode];
    if (!Array.isArray(rawEpisodes)) continue;

    return rawEpisodes
      .map((value: unknown, index: number) => {
        const episode = isRecord(value) ? value : {};
        const number = Number(episode.number ?? episode.episode ?? index + 1);
        return {
          number: Number.isFinite(number) ? number : index + 1,
          id: String(episode.id ?? ""),
          title: String(episode.title ?? `Episode ${number}`),
          provider: providerName,
        };
      })
      .filter((item) => Boolean(item.id));
  }

  return readEpisodeList(payload);
};

export const getAniVexaEpisodes = async (
  anilistId: string | number,
  provider?: AniVexaProvider,
  mode: AniVexaMode = "sub",
) => {
  const endpoint = provider ? `/episodes/${provider}/${encodeURIComponent(anilistId)}` : `/episodes/${encodeURIComponent(anilistId)}`;
  const { data } = await api.get(endpoint, { params: { map: true } });
  return readProviderEpisodes(assertPayload(data), provider, mode);
};

export const getAniVexaEpisodesWithFallback = async (
  anilistId: string | number,
  preferredProvider: AniVexaProvider,
  mode: AniVexaMode,
) => {
  try {
    const episodes = await getAniVexaEpisodes(anilistId, preferredProvider, mode);
    if (episodes.length > 0) return { episodes, provider: preferredProvider };
  } catch {
    // Try the remaining documented providers below.
  }

  const fallbackProviders = ANIVEXA_PROVIDERS.filter((item) => item !== preferredProvider);
  try {
    return await Promise.any(fallbackProviders.map(async (provider) => {
      const episodes = await getAniVexaEpisodes(anilistId, provider, mode);
      if (episodes.length === 0) throw new Error(`No ${mode.toUpperCase()} episodes on ${provider}`);
      return { episodes, provider };
    }));
  } catch {
    throw new Error(`AniVexa has no ${mode.toUpperCase()} episodes for AniList ID ${anilistId} on any provider.`);
  }
};

export const getAniVexaWatchUrl = ({
  provider,
  anilistId,
  mode = "sub",
  episode,
  episodeId,
}: {
  provider: AniVexaProvider;
  anilistId: string | number;
  mode?: AniVexaMode;
  episode: number | string;
  episodeId?: string;
}) => {
  if (episodeId?.startsWith("watch/")) return `${ANIVEXA_API_URL}/${episodeId}`;
  return `${ANIVEXA_API_URL}/watch/${provider}/${encodeURIComponent(anilistId)}/${mode}/${provider}-${encodeURIComponent(episode)}`;
};

const isHttpUrl = (value: unknown): value is string => typeof value === "string" && /^https?:\/\//i.test(value);
const isMediaUrl = (value: string) => /\.(m3u8|mp4|webm|mpd|mkv)(?:$|[?#])/i.test(value);

const findPlaybackCandidate = (value: unknown, depth = 0): { url: string; mediaType?: string } | null => {
  if (depth > 5 || value === null || value === undefined) return null;
  if (isHttpUrl(value)) return { url: value };
  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = findPlaybackCandidate(item, depth + 1);
      if (candidate) return candidate;
    }
    return null;
  }
  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const preferredKeys = ["url", "file", "src", "source", "stream", "streamUrl", "embed", "iframe", "link"];
  for (const key of preferredKeys) {
    const candidate = findPlaybackCandidate(record[key], depth + 1);
    if (candidate) {
      const mediaType = typeof record.type === "string" ? record.type : typeof record.mime === "string" ? record.mime : undefined;
      return { ...candidate, mediaType: candidate.mediaType || mediaType };
    }
  }
  for (const item of Object.values(record)) {
    const candidate = findPlaybackCandidate(item, depth + 1);
    if (candidate) return candidate;
  }
  return null;
};

export const resolveAniVexaPlayback = async ({
  provider,
  anilistId,
  mode = "sub",
  episode,
  episodeId,
}: {
  provider: AniVexaProvider;
  anilistId: string | number;
  mode?: AniVexaMode;
  episode: number | string;
  episodeId?: string;
}): Promise<AniVexaPlayback> => {
  const watchUrl = getAniVexaWatchUrl({ provider, anilistId, mode, episode, episodeId });
  const response = await api.get<string>(watchUrl.replace(ANIVEXA_API_URL, ""), { responseType: "text" });
  const contentType = String(response.headers["content-type"] || "").toLowerCase();
  const raw = response.data;

  if (contentType.includes("text/html")) return { url: watchUrl, kind: "embed", servers: [{ name: provider, embed: watchUrl }] };

  let payload: unknown = raw;
  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch {
      if (isHttpUrl(raw.trim())) payload = raw.trim();
    }
  }

  if (isApiIndex(payload)) throw new Error("AniVexa returned its route index instead of a playback source");
  const record = isRecord(payload) ? payload : {};
  const streams = Array.isArray(record.streams) ? record.streams.filter(isRecord) : [];
  const allServers = Array.isArray(record.allServers) ? record.allServers.filter(isRecord) : [];
  const embeds = Array.isArray(record.embeds) ? record.embeds.filter(isRecord) : [];
  const sources = Array.isArray(record.sources) ? record.sources.filter(isRecord) : [];
  const orderedSources = [...sources].sort((left, right) => {
    const leftDirect = String(left.type || "").toLowerCase() !== "iframe" || isMediaUrl(String(left.extractedUrl || ""));
    const rightDirect = String(right.type || "").toLowerCase() !== "iframe" || isMediaUrl(String(right.extractedUrl || ""));
    if (leftDirect !== rightDirect) return rightDirect ? 1 : -1;
    const leftIframe = String(left.type || "").toLowerCase() === "iframe" ? 1 : 0;
    const rightIframe = String(right.type || "").toLowerCase() === "iframe" ? 1 : 0;
    if (leftIframe !== rightIframe) return rightIframe - leftIframe;
    return Number(right.priority || 0) - Number(left.priority || 0);
  });
  const sourceServers: AniVexaServer[] = orderedSources.map((item, index) => {
    const sourceUrl = isHttpUrl(item.url) ? item.url : isHttpUrl(item.extractedUrl) ? item.extractedUrl : undefined;
    const isIframe = String(item.type || "").toLowerCase() === "iframe";
    const extractedMediaUrl = isHttpUrl(item.extractedUrl) && isMediaUrl(item.extractedUrl) ? item.extractedUrl : undefined;
    return {
      name: String(item.name || `Server ${index + 1}`),
      type: String(item.extractedType || item.type || ""),
      url: extractedMediaUrl || (isIframe ? undefined : sourceUrl),
      embed: isIframe && !extractedMediaUrl ? sourceUrl : undefined,
    };
  });
  const servers: AniVexaServer[] = streams.length
    ? streams.map((item, index: number) => {
      const isEmbedStream = String(item.type || "").toLowerCase() === "embed" || String(item.type || "").toLowerCase() === "iframe";
      return {
        name: String(item.server || allServers[index]?.name || embeds[index]?.name || `Server ${index + 1}`),
        type: item.audio ? String(item.audio) : String(item.type || allServers[index]?.type || ""),
        url: !isEmbedStream && isHttpUrl(item.url) ? item.url : undefined,
        embed: isEmbedStream && isHttpUrl(item.url) ? item.url : isHttpUrl(item.embed) ? item.embed : isHttpUrl(allServers[index]?.embed) ? allServers[index].embed : undefined,
      };
    })
      : allServers.length
        ? allServers.map((item, index: number) => ({ name: String(item.name || `Server ${index + 1}`), type: item.type ? String(item.type) : undefined, embed: isHttpUrl(item.embed) ? item.embed : undefined, url: isHttpUrl(item.url) ? item.url : undefined }))
      : embeds.length
        ? embeds.map((item, index: number) => ({ name: String(item.name || `Server ${index + 1}`), type: item.type ? String(item.type) : undefined, embed: isHttpUrl(item.url) ? item.url : undefined }))
        : sourceServers;
  // AniVexa's HLS tokens can be bound to the API server IP. Prefer the
  // provider's browser-safe embed URL; only fall back to direct media when an
  // embed was not returned.
  const candidate = [
    sourceServers.find((item) => item.embed)?.embed,
    streams[0]?.embed,
    allServers[0]?.embed,
    embeds[0]?.url,
    sourceServers.find((item) => item.url)?.url,
    streams[0]?.url,
    record.stream_url,
  ].find(isHttpUrl) || findPlaybackCandidate(payload)?.url;
  if (!candidate) throw new Error("AniVexa did not return a playable source");

  return {
    url: candidate,
    kind: sourceServers.some((item) => item.embed) || streams[0]?.embed || allServers[0]?.embed || embeds[0]?.url ? "embed" : isMediaUrl(candidate) || /video|mpegurl|hls/i.test(String(streams[0]?.type || "")) ? "media" : "embed",
    mediaType: streams[0]?.type ? String(streams[0].type) : sourceServers[0]?.type,
    servers,
  };
};

export const getAniVexaStreamUrl = ({
  provider,
  anilistId,
  mode = "sub",
  episode,
}: {
  provider: "reanime" | "2dhive";
  anilistId: string | number;
  mode?: AniVexaMode;
  episode: number | string;
}) => `${ANIVEXA_API_URL}/stream/${provider}/${encodeURIComponent(anilistId)}/${mode}/${encodeURIComponent(episode)}`;
