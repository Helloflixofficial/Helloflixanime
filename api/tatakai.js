// Vercel Serverless Function — proxies tatakai API requests server-side
// This avoids CORS issues and removes the need for VITE_SUPABASE_URL in production

const TATAKAI_BASE = 'https://tatakaiapi-one.vercel.app/api/v1';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { provider, path, q } = req.query;

  if (!provider || !path) {
    return res.status(400).json({ error: 'provider and path are required' });
  }

  let apiUrl = `${TATAKAI_BASE}/${provider}/${path}`;
  if (q) {
    apiUrl += `${apiUrl.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}`;
  }

  console.log('[tatakai proxy] Fetching:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('[tatakai proxy] Error:', error);
    return res.status(500).json({ error: error.message || 'Proxy error' });
  }
}
