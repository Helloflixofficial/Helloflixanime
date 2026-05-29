const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/peertube-proxy`;

interface PeerTubeVideo {
  id: number;
  uuid: string;
  shortUUID: string;
  name: string;
  description: string;
  category: { id: number; label: string };
  language: { id: string; label: string };
  duration: number;
  views: number;
  likes: number;
  dislikes: number;
  nsfw: boolean;
  publishedAt: string;
  createdAt: string;
  thumbnailPath: string;
  previewPath: string;
  embedPath: string;
  url: string;
  account: { name: string; displayName: string };
  channel: { name: string; displayName: string };
  streamingPlaylists?: any[];
  files?: any[];
  tags?: string[];
}

interface PeerTubeListResponse {
  total: number;
  data: PeerTubeVideo[];
}

async function ptFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(PROXY_BASE);
  url.searchParams.set("path", path);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PeerTube API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Get all videos with pagination
export async function getVideos(
  start = 0,
  count = 50,
  sort = "-publishedAt",
  categoryOneOf?: number[]
): Promise<PeerTubeListResponse> {
  const params: Record<string, string> = {
    start: String(start),
    count: String(count),
    sort,
  };
  if (categoryOneOf && categoryOneOf.length > 0) {
    params.categoryOneOf = categoryOneOf.join(",");
  }
  return ptFetch<PeerTubeListResponse>("/api/v1/videos", params);
}

// Search videos
export async function searchVideos(
  search: string,
  start = 0,
  count = 50,
  sort = "-match"
): Promise<PeerTubeListResponse> {
  return ptFetch<PeerTubeListResponse>("/api/v1/search/videos", {
    search,
    start: String(start),
    count: String(count),
    sort,
  });
}

// Get single video details (includes streaming info)
export async function getVideoDetails(idOrUUID: string): Promise<PeerTubeVideo> {
  return ptFetch<PeerTubeVideo>(`/api/v1/videos/${idOrUUID}`);
}

// Get video categories
export async function getCategories(): Promise<Record<string, string>> {
  return ptFetch<Record<string, string>>("/api/v1/videos/categories");
}

// Helper: Get PeerTube instance base URL for embeds/thumbnails
export function getPeerTubeBaseUrl(): string {
  // We proxy everything through the edge function, but for embeds we need the actual URL
  // The embed will be proxied through our edge function as well
  return PROXY_BASE;
}

// Helper: get thumbnail URL through proxy
export function getThumbnailUrl(thumbnailPath: string): string {
  if (!thumbnailPath) return "/placeholder.svg";
  const url = new URL(PROXY_BASE);
  url.searchParams.set("path", thumbnailPath);
  return url.toString();
}

// Helper: get embed URL (iframe) - we'll build our own player instead
export function getEmbedUrl(uuid: string): string {
  const url = new URL(PROXY_BASE);
  url.searchParams.set("path", `/videos/embed/${uuid}`);
  return url.toString();
}

// Helper: format duration
export function formatDuration(seconds: number): string {
  if (!seconds) return "N/A";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// PeerTube category IDs mapping
export const PT_CATEGORIES = {
  MUSIC: 1,
  FILMS: 2,
  VEHICLES: 3,
  ART: 4,
  SPORTS: 5,
  TRAVELS: 6,
  GAMING: 7,
  PEOPLE: 8,
  COMEDY: 9,
  ENTERTAINMENT: 10,
  NEWS: 11,
  HOW_TO: 12,
  EDUCATION: 13,
  ACTIVISM: 14,
  SCIENCE: 15,
  ANIMALS: 16,
  KIDS: 17,
  FOOD: 18,
} as const;

export type { PeerTubeVideo, PeerTubeListResponse };
