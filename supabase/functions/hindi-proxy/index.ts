import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const HINDI_API_BASE = Deno.env.get("TATAKAI_API_URL") ? `${Deno.env.get("TATAKAI_API_URL")}/hindidubbed` : "https://tatakaiapi-one.vercel.app/api/v1/hindidubbed";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "home";
    const query = url.searchParams.get("q") || "";

    let apiUrl = `${HINDI_API_BASE}/${path}`;
    if (query) {
      apiUrl += `?title=${encodeURIComponent(query)}`;
    }

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
