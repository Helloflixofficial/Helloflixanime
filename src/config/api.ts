// API Configuration

export const API_URL = import.meta.env.VITE_HINIME_API_URL || 'https://anilistapi.vercel.app/api';

// Proxy server for CORS handling (subtitles, etc.)
export const PROXY_URL = import.meta.env.VITE_ZENIME_PROXY_URL || 'https://zenime-1-qejh.onrender.com/?url=';

// Vercel built-in M3U8 proxy (always available, no env vars needed)
export const VERCEL_M3U8_PROXY_URL = '/api/m3u8?url=';

// Supabase edge function proxy (available when VITE_SUPABASE_URL is set, i.e. locally)
export const OWN_PROXY_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/m3u8-proxy?url=`
  : VERCEL_M3U8_PROXY_URL;

// Primary M3U8 proxy — use Vercel proxy in production, Supabase locally
export const M3U8_PROXY_URL = OWN_PROXY_URL;

// List of M3U8 proxy servers ordered by priority
export const M3U8_PROXIES = [
  VERCEL_M3U8_PROXY_URL,        // Vercel built-in (always works)
  OWN_PROXY_URL,                 // Supabase (works locally)
  'https://proxyfy-two.vercel.app/m3u8-proxy?url=',
  'https://m3u8-proxy-cors-anywhere.onrender.com/cors?url=',
  'https://cors-anywhere-oxpk.onrender.com/?url=',
];

// Timeout in ms before trying the next proxy
export const PROXY_TIMEOUT_MS = 8000;
