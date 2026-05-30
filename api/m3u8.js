// Vercel Serverless Function — proxies M3U8 streams and TS segments
// Rewrites all M3U8 playlist URLs to route through this proxy (bypasses CORS)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, headers: headersParam } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  const targetUrl = decodeURIComponent(url);
  const customHeaders = {};
  if (headersParam) {
    try {
      Object.assign(customHeaders, JSON.parse(decodeURIComponent(headersParam)));
    } catch {}
  }

  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ...customHeaders,
  };

  if (req.method === 'HEAD') {
    try {
      const headRes = await fetch(targetUrl, { method: 'HEAD', headers: fetchHeaders, redirect: 'follow' });
      return res.status(headRes.ok ? 200 : headRes.status).end();
    } catch {
      return res.status(502).end();
    }
  }

  try {
    const response = await fetch(targetUrl, { headers: fetchHeaders, redirect: 'follow' });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // For M3U8 playlists, rewrite all URLs to go through this proxy
    if (contentType.includes('mpegurl') || contentType.includes('x-mpegurl') || targetUrl.endsWith('.m3u8')) {
      let text = await response.text();

      const lastSlash = targetUrl.lastIndexOf('/');
      const baseUrl = lastSlash > 8 ? targetUrl.substring(0, lastSlash + 1) : targetUrl;
      const proxyBase = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/m3u8`;
      const encodedHeaders = headersParam ? `&headers=${encodeURIComponent(headersParam)}` : '';

      const wrapUrl = (rawUrl) => {
        let absolute = rawUrl;
        if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
          try {
            absolute = new URL(rawUrl, baseUrl).toString();
          } catch {
            absolute = baseUrl + rawUrl;
          }
        }
        return `${proxyBase}?url=${encodeURIComponent(absolute)}${encodedHeaders}`;
      };

      const lines = text.split('\n');
      const rewritten = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${wrapUrl(uri)}"`);
        }
        if (trimmed.startsWith('#')) return line;
        return wrapUrl(trimmed);
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(rewritten.join('\n'));
    }

    // Binary segments (.ts, .mp4)
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Proxy error' });
  }
}
