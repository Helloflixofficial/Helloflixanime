import axios from 'axios';
import type { HomeData, Episode, StreamingInfo, Server } from '@/types/anime';
import { API_URL as API_BASE_URL } from '@/config/api';

// Create axios instance for AniList API
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Tatakai Proxy Base URL
const TATAKAI_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tatakai-proxy`;

const tatakaiFetch = async (provider: string, path: string, query?: string) => {
  const params: Record<string, string> = { provider, path };
  if (query) params.q = query;
  const { data } = await axios.get(TATAKAI_PROXY_URL, { params });
  return data;
};

const slugifyServer = (name?: string) =>
  (name || "").toString().trim().toLowerCase().replace(/\s+/g, "-");

// Map AniList API item to frontend AnimeBasic structure
const mapToAnimeBasic = (item: any): any => {
  if (!item) return null;
  const poster = item.coverImage?.extraLarge || item.coverImage?.large || item.image || '';
  const title = item.title?.english || item.title?.romaji || item.title?.userPreferred || '';
  const subCount = item.episodeNumber || item.nextAiringEpisode?.episode || undefined;
  const logo = item.logo || item.logoImage || undefined;

  return {
    id: item.id.toString(),
    data_id: item.id,
    poster,
    banner: item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large || item.image || '',
    logo,
    accentColor: item.coverImage?.color || undefined,
    title,
    japanese_title: item.title?.native || item.title?.romaji || '',
    description: item.description?.replace(/<[^>]*>/g, '') || '',
    genres: item.genres || [],
    score: item.averageScore || undefined,
    tvInfo: {
      sub: subCount,
      eps: item.episodes || undefined,
      quality: 'HD',
      duration: item.duration ? `${item.duration}m` : undefined,
      showType: item.format || 'TV',
    },
  };
};

// Map Spring 2026 API response item (slightly different shape from advanced-search)
const mapSpring2026Item = (item: any): any => {
  if (!item) return null;
  const poster = item.coverImage?.large || item.coverImage?.medium || item.image || '';
  const title = item.title?.english || item.title?.romaji || '';
  return {
    id: item.id.toString(),
    data_id: item.id,
    poster,
    banner: item.bannerImage || poster,
    logo: item.logo || item.logoImage || undefined,
    accentColor: item.coverImage?.color || undefined,
    title,
    japanese_title: item.title?.native || item.title?.romaji || '',
    description: item.description?.replace(/<[^>]*>/g, '') || '',
    genres: item.genres || [],
    score: item.averageScore || undefined,
    tvInfo: {
      eps: item.episodes || undefined,
      quality: 'HD',
      duration: item.duration ? `${item.duration}m` : undefined,
      showType: item.format || 'TV',
    },
  };
};

// Fetch Spring 2026 popular anime
export const getSpring2026Data = async (): Promise<any[]> => {
  try {
    const response = await axios.get(
      'https://anilistapi.vercel.app/api/meta/anilist/advanced-search?season=SPRING&seasonYear=2026&sort=POPULARITY_DESC&page=1',
      { timeout: 15000 }
    );
    return (response.data.results || []).map(mapSpring2026Item);
  } catch (error) {
    console.error('Error fetching Spring 2026 data:', error);
    return [];
  }
};

// Get home page data (trending, spotlights, etc.)
export const getHomeData = async (): Promise<HomeData> => {
  try {
    const [trendingRes, popularRes, recentRes, completedRes, spring2026Res] = await Promise.allSettled([
      api.get('/meta/anilist/trending'),
      api.get('/meta/anilist/popular'),
      api.get('/meta/anilist/recent'),
      api.get('/meta/anilist/advanced-search?status=FINISHED'),
      axios.get('https://anilistapi.vercel.app/api/meta/anilist/advanced-search?season=SPRING&seasonYear=2026&sort=POPULARITY_DESC&page=1', { timeout: 15000 }),
    ]);

    const trending = trendingRes.status === 'fulfilled' ? (trendingRes.value.data.results || []).map(mapToAnimeBasic) : [];
    const mostPopular = popularRes.status === 'fulfilled' ? (popularRes.value.data.results || []).map(mapToAnimeBasic) : [];
    const latestEpisode = recentRes.status === 'fulfilled' ? (recentRes.value.data.results || []).map(mapToAnimeBasic) : [];
    const latestCompleted = completedRes.status === 'fulfilled' ? (completedRes.value.data.results || []).map(mapToAnimeBasic) : [];
    const spring2026 = spring2026Res.status === 'fulfilled' ? (spring2026Res.value.data.results || []).map(mapSpring2026Item) : [];

    // Use Spring 2026 popular anime for spotlights; fallback to trending
    const spotlights = spring2026.length > 0 ? spring2026.slice(0, 8) : trending.slice(0, 5);

    const topAiring = trending;
    const mostFavorite = mostPopular;

    return {
      spotlights,
      trending,
      topAiring,
      mostPopular,
      mostFavorite,
      latestCompleted,
      latestEpisode,
      spring2026,
      genres: [],
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    throw error;
  }
};

// Get anime details by ID (returns full response with seasons and related data)
export const getAnimeDetails = async (id: string): Promise<any> => {
  try {
    const response = await api.get(`/meta/anilist/info/${id}`);
    const item = response.data;

    // relations is { edges: [{ relationType, node }] } — NOT a flat array
    const relationsEdges: any[] = item.relations?.edges || [];
    // recommendations is { edges: [{ node: { mediaRecommendation } }] } — NOT a flat array
    const recommendationEdges: any[] = item.recommendations?.edges || [];

    // Map details
    const mappedDetails = {
      adultContent: item.isAdult || false,
      id: item.id.toString(),
      data_id: item.id,
      title: item.title?.english || item.title?.romaji || item.title?.userPreferred || '',
      japanese_title: item.title?.native || item.title?.romaji || '',
      poster: item.coverImage?.extraLarge || item.coverImage?.large || item.image || '',
      banner: item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large || item.image || '',
      showType: item.format || 'TV',
      animeInfo: {
        Overview: item.description?.replace(/<[^>]*>/g, '') || '',
        Japanese: item.title?.native || '',
        Synonyms: item.synonyms?.join(', ') || '',
        Aired: item.startDate ? `${item.startDate.year}-${String(item.startDate.month).padStart(2,'0')}-${String(item.startDate.day).padStart(2,'0')}` : '',
        Premiered: item.season ? `${item.season} ${item.seasonYear}` : '',
        Duration: item.duration ? `${item.duration}m` : '',
        Status: item.status || '',
        'MAL Score': item.averageScore ? (item.averageScore / 10).toFixed(1) : '',
        Genres: (item.genres || []).map((g: string) => ({ name: g, url: `/genre/${g.toLowerCase().replace(/\s+/g, '-')}` })),
        Studios: item.studios?.nodes?.map((n: any) => n.name).join(', ') || '',
        Producers: [],
      },
    };

    // Collect all relation IDs to batch query their cover images from official AniList API
    const relationIds = relationsEdges.map((r: any) => r.node?.id).filter(Boolean);
    const imageMap = new Map<number, string>();
    if (relationIds.length > 0) {
      try {
        const gqlRes = await axios.post('https://graphql.anilist.co', {
          query: `query { Page { media(id_in: [${relationIds.join(',')}]) { id coverImage { large } } } }`
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 4000
        });
        const mediaList = gqlRes.data?.data?.Page?.media || [];
        mediaList.forEach((m: any) => {
          const img = m.coverImage?.large;
          if (img) imageMap.set(m.id, img);
        });
      } catch (err) {
        console.warn('Failed to batch fetch relation covers from AniList GraphQL:', err);
      }
    }

    const getPosterUrl = (node: any) => {
      if (!node) return '';
      if (imageMap.has(node.id)) return imageMap.get(node.id)!;
      if (typeof node.coverImage === 'string') return node.coverImage;
      return node.coverImage?.extraLarge || node.coverImage?.large || node.image || '';
    };

    // Extract seasons (SEQUEL/PREQUEL/PARENT) from relations.edges
    const seasonsList = relationsEdges
      .filter((r: any) => r.relationType === 'SEQUEL' || r.relationType === 'PREQUEL' || r.relationType === 'PARENT')
      .map((r: any) => {
        const node = r.node;
        const posterUrl = getPosterUrl(node) || mappedDetails.poster;
        return {
          id: node.id.toString(),
          data_number: 1,
          data_id: node.id,
          season: r.relationType === 'SEQUEL' ? 'Sequel' : r.relationType === 'PREQUEL' ? 'Prequel' : 'Alternative',
          title: node.title?.english || node.title?.romaji || '',
          japanese_title: node.title?.native || '',
          season_poster: posterUrl,
        };
      });

    // We want a rich set of related anime combining other relations (OVAs, specials, side stories) and recommendations
    const relatedMap = new Map<string, any>();

    // 1. Add other relations (only if they have a poster, or fallback to parent poster for specials/OVAs of same show)
    relationsEdges
      .filter((r: any) => r.relationType !== 'SEQUEL' && r.relationType !== 'PREQUEL')
      .forEach((r: any) => {
        const node = r.node;
        const posterUrl = getPosterUrl(node) || mappedDetails.poster;
        relatedMap.set(node.id.toString(), {
          id: node.id.toString(),
          data_id: node.id,
          title: node.title?.english || node.title?.romaji || '',
          japanese_title: node.title?.native || '',
          poster: posterUrl,
          duration: '',
          tvInfo: {
            dub: 0,
            sub: 0,
            showType: node.format || 'TV',
            eps: node.episodes || 0,
          },
        });
      });

    // 2. Add recommendations (always have rich coverImage)
    recommendationEdges.forEach((edge: any) => {
      const rec = edge.node?.mediaRecommendation;
      if (!rec) return;
      const recId = rec.id.toString();
      if (!relatedMap.has(recId)) {
        relatedMap.set(recId, {
          id: recId,
          data_id: rec.id,
          title: rec.title?.english || rec.title?.romaji || '',
          japanese_title: rec.title?.native || '',
          poster: getPosterUrl(rec) || mappedDetails.poster,
          duration: '',
          tvInfo: {
            dub: 0,
            sub: 0,
            showType: rec.format || 'TV',
            eps: rec.episodes || 0,
          },
        });
      }
    });

    const relatedList = Array.from(relatedMap.values());

    return {
      data: mappedDetails,
      seasons: seasonsList,
      related_data: relatedList,
    };
  } catch (error) {
    console.error('Error fetching anime details:', error);
    throw error;
  }
};

// Get episode list for an anime (mapped via Tatakai Proxy/Animeya)
export const getEpisodes = async (id: string): Promise<{ totalEpisodes: number; episodes: Episode[] }> => {
  try {
    // 1. Fetch AniList info to get the anime title and episode count
    const infoResponse = await api.get(`/meta/anilist/info/${id}`);
    const aniListInfo = infoResponse.data;
    const title = aniListInfo.title?.english || aniListInfo.title?.romaji || '';
    // Some ongoing series return null for episodes — fall back to a reasonable default
    const totalEps = aniListInfo.episodes || 1000;

    // 2. Search Animeya with the title
    let animeyaSlug: string | null = null;
    try {
      const searchRes = await tatakaiFetch('animeya', 'search', title);
      const results = searchRes?.data || [];
      // Find the slug that ends with -{id}
      const matchingSlugItem = results.find((r: any) => r.slug && r.slug.endsWith(`-${id}`));
      if (matchingSlugItem) {
        animeyaSlug = matchingSlugItem.slug;
      } else if (results.length > 0) {
        // Fallback: Use the first search result
        animeyaSlug = results[0].slug;
      }
    } catch (e) {
      console.warn('Failed to search Animeya:', e);
    }

    // 3. Fetch detailed episodes list from Animeya
    if (animeyaSlug) {
      try {
        const animeyaInfo = await tatakaiFetch('animeya', `info/${animeyaSlug}`);
        const eps = animeyaInfo?.data?.episodes || [];
        if (eps.length > 0) {
          return {
            totalEpisodes: eps.length,
            episodes: eps.map((ep: any) => ({
              episode_no: ep.number,
              id: ep.id.toString(),
              data_id: ep.id,
              jname: ep.title || `Episode ${ep.number}`,
              title: ep.title || `Episode ${ep.number}`,
              japanese_title: ep.title || `Episode ${ep.number}`,
            })),
          };
        }
      } catch (e) {
        console.warn('Failed to get Animeya info:', e);
      }
    }

    // 4. Fallback: Generate dummy episodes using total count from AniList
    console.log('Generating dummy episodes fallback for id:', id);
    const dummyEpisodes = Array.from({ length: totalEps }, (_, i) => {
      const num = i + 1;
      return {
        episode_no: num,
        id: `${id}-episode-${num}`,
        data_id: num,
        jname: `Episode ${num}`,
        title: `Episode ${num}`,
        japanese_title: `Episode ${num}`,
      };
    });

    return {
      totalEpisodes: totalEps,
      episodes: dummyEpisodes,
    };
  } catch (error) {
    console.error('Error fetching episodes:', error);
    throw error;
  }
};

// Get available servers for an episode
export const getServers = async (episodeId: string): Promise<Server[]> => {
  try {
    let resolvedEpisodeId = episodeId;

    // If it's a dummy generated episode ID (format: id-episode-num)
    if (episodeId.includes('-episode-')) {
      const parts = episodeId.split('-episode-');
      const animeId = parts[0];
      const epNum = parseInt(parts[1], 10);
      
      // Resolve Animeya episode ID
      const infoResponse = await api.get(`/meta/anilist/info/${animeId}`);
      const title = infoResponse.data?.title?.english || infoResponse.data?.title?.romaji || '';
      const searchRes = await tatakaiFetch('animeya', 'search', title);
      const results = searchRes?.data || [];
      const matchingSlugItem = results.find((r: any) => r.slug && r.slug.endsWith(`-${animeId}`));
      const slug = matchingSlugItem ? matchingSlugItem.slug : (results[0]?.slug || null);
      
      if (slug) {
        const info = await tatakaiFetch('animeya', `info/${slug}`);
        const foundEp = (info?.data?.episodes || []).find((ep: any) => ep.number === epNum);
        if (foundEp) {
          resolvedEpisodeId = foundEp.id.toString();
        }
      }
    }

    // Fetch sources from Animeya
    const watchData = await tatakaiFetch('animeya', `watch/${resolvedEpisodeId}`);
    const sources = watchData?.data?.sources || [];
    
    // Map to Servers list
    const servers: Server[] = [];
    sources.forEach((s: any, idx: number) => {
      const isDub = s.url.includes('/dub') || s.subType === 'NONE';
      const type = isDub ? 'dub' : 'sub';
      servers.push({
        type,
        data_id: idx,
        server_id: idx,
        server_name: s.name,
        serverName: s.name,
      });
    });

    return servers;
  } catch (error) {
    console.error('Error fetching servers:', error);
    return [];
  }
};

// Get streaming info for an episode
export const getStreamingInfo = async (
  episodeId: string,
  server: string = 'hd-1',
  type: string = 'sub'
): Promise<StreamingInfo> => {
  try {
    let resolvedEpisodeId = episodeId;

    // Resolve dummy episode ID if needed
    if (episodeId.includes('-episode-')) {
      const parts = episodeId.split('-episode-');
      const animeId = parts[0];
      const epNum = parseInt(parts[1], 10);
      
      const infoResponse = await api.get(`/meta/anilist/info/${animeId}`);
      const title = infoResponse.data?.title?.english || infoResponse.data?.title?.romaji || '';
      const searchRes = await tatakaiFetch('animeya', 'search', title);
      const results = searchRes?.data || [];
      const matchingSlugItem = results.find((r: any) => r.slug && r.slug.endsWith(`-${animeId}`));
      const slug = matchingSlugItem ? matchingSlugItem.slug : (results[0]?.slug || null);
      
      if (slug) {
        const info = await tatakaiFetch('animeya', `info/${slug}`);
        const foundEp = (info?.data?.episodes || []).find((ep: any) => ep.number === epNum);
        if (foundEp) {
          resolvedEpisodeId = foundEp.id.toString();
        }
      }
    }

    // Fetch watch sources
    const watchData = await tatakaiFetch('animeya', `watch/${resolvedEpisodeId}`);
    const sources = watchData?.data?.sources || [];

    // Map all servers
    const serversMapped: Server[] = [];
    sources.forEach((s: any, idx: number) => {
      const isDub = s.url.includes('/dub') || s.subType === 'NONE';
      serversMapped.push({
        type: isDub ? 'dub' : 'sub',
        data_id: idx,
        server_id: idx,
        server_name: s.name,
        serverName: s.name,
      });
    });

    // Find the source matching the server name and sub/dub type
    let matchedSource = sources.find((s: any) => {
      const isDub = s.url.includes('/dub') || s.subType === 'NONE';
      const sourceType = isDub ? 'dub' : 'sub';
      return slugifyServer(s.name) === slugifyServer(server) && sourceType === type;
    });

    // Fallback: If no exact type+name match, match just type, or just take first source
    if (!matchedSource) {
      matchedSource = sources.find((s: any) => {
        const isDub = s.url.includes('/dub') || s.subType === 'NONE';
        const sourceType = isDub ? 'dub' : 'sub';
        return sourceType === type;
      }) || sources[0];
    }

    if (!matchedSource) {
      throw new Error('No streaming sources found for this episode');
    }

    const isEmbed = matchedSource.type === 'EMBED' || matchedSource.url.includes('vidnest') || matchedSource.url.includes('embed') || !matchedSource.url.match(/\.(m3u8|mp4)/i);

    // Build the streaming link structure
    const streamingLink = [{
      id: 1,
      type: isEmbed ? 'embed' : 'hls',
      link: {
        file: matchedSource.url,
        type: isEmbed ? 'embed' : 'hls',
      },
      tracks: [],
      server: matchedSource.name,
    }];

    return {
      streamingLink: streamingLink as any,
      servers: serversMapped,
      isEmbed, // custom property passed to frontend
    } as any;
  } catch (error) {
    console.error('Error fetching streaming info:', error);
    throw error;
  }
};

export const getProxiedUrl = (url: string, headers?: Record<string, string>): string => {
  const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/m3u8-proxy?url=${encodeURIComponent(url)}`;
  if (headers && Object.keys(headers).length > 0) {
    return `${base}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
  }
  return base;
};

// Search anime — the Consumet AniList provider uses /advanced-search?query=
export const searchAnime = async (query: string, page: number = 1) => {
  try {
    const response = await api.get(`/meta/anilist/advanced-search?query=${encodeURIComponent(query)}&page=${page}`);
    return (response.data.results || []).map(mapToAnimeBasic);
  } catch (error) {
    console.error('Error searching anime:', error);
    throw error;
  }
};

// Get anime by category
const formatGenre = (g: string) => {
  return g
    .split('-')
    .map(word => {
      if (word.toLowerCase() === 'of') return 'of';
      if (word.toLowerCase() === 'sci') return 'Sci';
      if (word.toLowerCase() === 'fi') return 'Fi';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace('Sci Fi', 'Sci-Fi');
};

export const getAnimeByCategory = async (category: string, page: number = 1) => {
  try {
    let endpoint = '/meta/anilist/trending';
    
    if (category === 'top-airing' || category === 'trending') {
      endpoint = `/meta/anilist/trending?page=${page}`;
    } else if (category === 'most-popular' || category === 'most-favorite') {
      endpoint = `/meta/anilist/popular?page=${page}`;
    } else if (category === 'completed') {
      endpoint = `/meta/anilist/advanced-search?status=FINISHED&page=${page}`;
    } else if (category === 'recently-updated' || category === 'recently-added') {
      endpoint = `/meta/anilist/recent?page=${page}`;
    } else if (category === 'movie') {
      endpoint = `/meta/anilist/advanced-search?format=MOVIE&page=${page}`;
    } else if (category === 'special') {
      endpoint = `/meta/anilist/advanced-search?format=SPECIAL&page=${page}`;
    } else if (category === 'ova') {
      endpoint = `/meta/anilist/advanced-search?format=OVA&page=${page}`;
    } else if (category === 'ona') {
      endpoint = `/meta/anilist/advanced-search?format=ONA&page=${page}`;
    } else if (category === 'tv') {
      endpoint = `/meta/anilist/advanced-search?format=TV&page=${page}`;
    } else if (category === 'music') {
      endpoint = `/meta/anilist/advanced-search?format=MUSIC&page=${page}`;
    } else if (category.startsWith('genre/')) {
      const genreName = category.split('/')[1];
      const formatted = formatGenre(genreName);
      endpoint = `/meta/anilist/advanced-search?genres=["${formatted}"]&page=${page}`;
    }
    
    const response = await api.get(endpoint);
    const results = response.data.results || [];
    const hasNextPage = response.data.pageInfo?.hasNextPage || response.data.hasNextPage || false;
    
    return {
      data: results.map(mapToAnimeBasic),
      hasNextPage,
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};
