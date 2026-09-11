// Vercel Serverless Function — proxies hindi API requests server-side
// This avoids CORS issues and removes the need for VITE_SUPABASE_URL in production

const HINDI_API_BASE = 'https://tatakaiapi-one.vercel.app/api/v1/hindidubbed';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path, q } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'path is required' });
  }

  let apiUrl = `${HINDI_API_BASE}/${path}`;
  if (q) {
    apiUrl += `?title=${encodeURIComponent(q)}`;
  }

  console.log('[hindi proxy] Fetching:', apiUrl);

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
    console.error('[hindi proxy] Error:', error);
    return res.status(500).json({ error: error.message || 'Proxy error' });
  }
}
