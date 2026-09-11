// The three sibling projects use this Vercel service as their catalog API.
// Keep the URL configurable so a redeployed backend can be used without a code change.
export const API_URL = import.meta.env.VITE_HINDMOVIES_API_URL || 'https://hindmovies-zeta.vercel.app';

// The sibling Cloudflare Worker streams the mirror URLs returned by /ddl and
// forwards Range requests so seeking works in the existing player.
export const VIDEO_PROXY_URL =
  import.meta.env.VITE_HINDMOVIES_VIDEO_PROXY_URL ||
  'https://hindmovies.abdullahdaniyal.workers.dev/?url=';

// Compatibility names used by the existing player/subtitle code.
export const PROXY_URL = VIDEO_PROXY_URL;
export const OWN_PROXY_URL = VIDEO_PROXY_URL;
export const M3U8_PROXY_URL = VIDEO_PROXY_URL;
export const M3U8_PROXIES = [VIDEO_PROXY_URL];
export const PROXY_TIMEOUT_MS = 8000;

// Separate sources used by the restored Hindi route and the AniVexa streaming API.
export const HINDI_API_BASE =
  import.meta.env.VITE_HINDI_API_BASE ||
  'https://tatakaiapi-one.vercel.app/api/v1/hindidubbed';

export const ANIVEXA_API_URL =
  import.meta.env.VITE_ANIVEXA_API_URL ||
  'https://amendments-dramatically-gabriel-each.trycloudflare.com';
