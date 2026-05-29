import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PEERTUBE_URL = Deno.env.get("PEERTUBE_URL");
    if (!PEERTUBE_URL) {
      return new Response(JSON.stringify({ error: "PEERTUBE_URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.searchParams.get("path");
    if (!path) {
      return new Response(JSON.stringify({ error: "Missing 'path' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = PEERTUBE_URL.replace(/\/$/, "");
    const targetUrl = new URL(path, baseUrl);

    // Forward all other query params except 'path'
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "path") {
        targetUrl.searchParams.set(key, value);
      }
    }

    console.log(`Proxying to: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        "User-Agent": "PeerTubeProxy/1.0",
        "ngrok-skip-browser-warning": "true",
        "Accept": "*/*",
      },
    });

    const contentType = response.headers.get("content-type") || "";

    // Build proxy base URL for rewriting
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || url.origin;
    const proxyBase = `${supabaseUrl}/functions/v1/peertube-proxy`;

    // Helper to wrap a raw URL (relative or absolute) through this proxy
    const wrapUrl = (rawUrl: string): string => {
      let resolvedPath = rawUrl;
      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        // Extract just the pathname from absolute URL
        try {
          const parsed = new URL(rawUrl);
          resolvedPath = parsed.pathname;
        } catch {
          resolvedPath = rawUrl;
        }
      } else if (!rawUrl.startsWith("/")) {
        // Relative path - resolve relative to current m3u8 path
        const parentPath = path.substring(0, path.lastIndexOf("/") + 1);
        resolvedPath = parentPath + rawUrl;
      }
      return `${proxyBase}?path=${encodeURIComponent(resolvedPath)}`;
    };

    // For m3u8 playlists - rewrite ALL URLs to go through this proxy
    if (path.endsWith(".m3u8") || contentType.includes("mpegurl") || contentType.includes("x-mpegURL")) {
      const m3u8Text = await response.text();

      const lines = m3u8Text.split("\n");
      const rewritten = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite URI="..." inside tags like #EXT-X-MAP or #EXT-X-KEY
        if (trimmed.startsWith("#") && trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (_match, uri) => {
            return `URI="${wrapUrl(uri)}"`;
          });
        }

        // Skip other comment lines
        if (trimmed.startsWith("#")) return line;

        // URL line (segment or sub-playlist) — wrap through proxy
        if (trimmed.startsWith("http")) {
          return wrapUrl(trimmed);
        }

        // Relative path
        return wrapUrl(trimmed);
      });

      return new Response(rewritten.join("\n"), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-cache",
        },
      });
    }

    // For JSON responses
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For other responses (video segments, images, etc.), stream them through
    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType || "application/octet-stream",
        "Content-Length": body.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
