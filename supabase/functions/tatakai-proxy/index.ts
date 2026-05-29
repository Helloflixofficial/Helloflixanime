import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TATAKAI_BASE = Deno.env.get("TATAKAI_API_URL") || "https://tatakaiapi-one.vercel.app/api/v1";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || "";
    const path = url.searchParams.get("path") || "";
    const query = url.searchParams.get("q") || "";

    if (!provider || !path) {
      return new Response(JSON.stringify({ error: "provider and path required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let apiUrl = `${TATAKAI_BASE}/${provider}/${path}`;
    if (query) {
      apiUrl += `${apiUrl.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`;
    }

    console.log("Fetching:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
