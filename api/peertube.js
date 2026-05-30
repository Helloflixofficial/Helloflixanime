// Vercel Serverless Function — proxies PeerTube video streams
// This avoids CORS issues and handles URL rewriting for playlists (.m3u8)

const PEERTUBE_DEFAULT_URL = 'https://subgloboid-kam-frequentable.ngrok-free.dev/';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing 'path' parameter" });
  }

  const peertubeBase = (process.env.PEERTUBE_URL || PEERTUBE_DEFAULT_URL).replace(/\/$/, "");
  let targetUrl;
  try {
    targetUrl = new URL(path, peertubeBase);
  } catch (err) {
    return res.status(400).json({ error: "Invalid path parameter" });
  }

  // Forward all other query params except 'path'
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== "path") {
      targetUrl.searchParams.set(key, value);
    }
  }

  console.log(`[peertube proxy] Proxying to: ${targetUrl.toString()}`);

  try {
    const fetchHeaders = {
      "User-Agent": "PeerTubeProxy/1.0",
      "ngrok-skip-browser-warning": "true",
      "Accept": "*/*",
    };

    if (req.headers.range) {
      fetchHeaders.Range = req.headers.range;
    }

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: fetchHeaders,
    });

    const contentType = response.headers.get("content-type") || "";

    // For m3u8 playlists - rewrite ALL URLs to go through this proxy
    if (path.endsWith(".m3u8") || contentType.includes("mpegurl") || contentType.includes("x-mpegURL")) {
      const m3u8Text = await response.text();
      const lines = m3u8Text.split("\n");
      const host = req.headers.host;
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const proxyBase = `${proto}://${host}/api/peertube`;

      const wrapUrl = (rawUrl) => {
        let resolvedPath = rawUrl;
        if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
          try {
            const parsed = new URL(rawUrl);
            resolvedPath = parsed.pathname;
          } catch {
            resolvedPath = rawUrl;
          }
        } else if (!rawUrl.startsWith("/")) {
          const parentPath = path.substring(0, path.lastIndexOf("/") + 1);
          resolvedPath = parentPath + rawUrl;
        }
        return `${proxyBase}?path=${encodeURIComponent(resolvedPath)}`;
      };

      const rewritten = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith("#") && trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${wrapUrl(uri)}"`);
        }

        if (trimmed.startsWith("#")) return line;

        return wrapUrl(trimmed);
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      return res.status(200).send(rewritten.join("\n"));
    }

    // For JSON responses
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(200).json(data);
    }

    // Binary data (video segments, images, etc.)
    const buffer = await response.arrayBuffer();
    
    // Copy response headers
    if (response.headers.get('content-range')) {
      res.setHeader('Content-Range', response.headers.get('content-range'));
      res.status(206);
    } else {
      res.status(200);
    }
    
    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Content-Length", buffer.byteLength);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("[peertube proxy] Error:", error);
    return res.status(500).json({ error: error.message || "Proxy error" });
  }
}
