// API Types based on HiAnime API

export interface TvInfo {
  showType?: string;
  duration?: string;
  releaseDate?: string;
  quality?: string;
  sub?: number;
  dub?: number;
  eps?: number;
  episodeInfo?: {
    sub: number;
    dub: number;
  };
}

export interface AnimeBasic {
  id: string;
  data_id: number;
  poster: string;
  banner?: string;
  logo?: string;
  accentColor?: string;
  title: string;
  japanese_title: string;
  description?: string;
  tvInfo?: TvInfo;
  number?: number;
  adultContent?: boolean;
  genres?: string[];
  score?: number;
  ongoing?: boolean;
  category?: string | null;
}

export interface AnimeInfo {
  Overview: string;
  Japanese: string;
  Synonyms: string;
  Aired: string;
  Premiered: string;
  Duration: string;
  Status: string;
  "MAL Score": string;
  Genres: Array<{ name: string; url: string }>;
  Studios: string;
  Producers: Array<{ name: string; url: string }>;
}

export interface AnimeDetails {
  adultContent: boolean;
  id: string;
  data_id: number;
  title: string;
  japanese_title: string;
  poster: string;
  banner?: string;
  showType: string;
  animeInfo: AnimeInfo;
}

export interface Episode {
  episode_no: number;
  id: string;
  data_id: number;
  jname: string;
  title: string;
  japanese_title: string;
  filename?: string;
  mvlink_id?: string;
}

export interface StreamTrack {
  file: string;
  label: string;
  kind: string;
  default: boolean;
}

export interface StreamLink {
  id: number;
  type: string;
  link: {
    file: string;
    type: string;
  };
  tracks: StreamTrack[];
  intro?: any;
  outro?: any;
  server: string;
}

export interface Server {
  type: string;
  data_id: number;
  server_id: number;
  server_name?: string;
  serverName?: string;
}

export interface StreamingInfo {
  streamingLink: StreamLink[];
  servers: Server[];
  mediaType?: "hls" | "mp4" | "webm" | "mkv" | "unknown";
  sourceFilename?: string;
}

export interface HomeData {
  spotlights: AnimeBasic[];
  trending: AnimeBasic[];
  topAiring: AnimeBasic[];
  mostPopular: AnimeBasic[];
  mostFavorite: AnimeBasic[];
  latestCompleted: AnimeBasic[];
  latestEpisode: AnimeBasic[];
  spring2026: AnimeBasic[];
  genres: string[];
}
