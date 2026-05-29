// API Configuration

export const API_URL = import.meta.env.VITE_HINIME_API_URL || 'https://hinime-two.vercel.app/api';

// Proxy server for CORS handling (subtitles, etc.)
export const PROXY_URL = import.meta.env.VITE_ZENIME_PROXY_URL || 'https://zenime-1-qejh.onrender.com/?url=';

// Our own edge function proxy (primary, most reliable — rewrites all m3u8 URLs through itself)
export const OWN_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/m3u8-proxy?url=`;

// Primary M3U8 proxy — use own proxy only since it handles full URL rewriting
export const M3U8_PROXY_URL = OWN_PROXY_URL;

// List of M3U8 proxy servers ordered by priority
export const M3U8_PROXIES = [
  OWN_PROXY_URL,
  'https://proxyfy-two.vercel.app/m3u8-proxy?url=',
  'https://m3u8-proxy-cors-anywhere.onrender.com/cors?url=',
  'https://cors-anywhere-oxpk.onrender.com/?url=',
];

// Timeout in ms before trying the next proxy
export const PROXY_TIMEOUT_MS = 8000;
