import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const embedUrl = url.searchParams.get("url");

    if (!embedUrl) {
      return new Response("Missing url param", { status: 400, headers: corsHeaders });
    }

    const embedOrigin = new URL(embedUrl).origin;

    // Fetch the embed page HTML
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': embedOrigin + '/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    let html = await response.text();

    // Add <base> tag so all relative resources resolve to the embed origin
    if (!html.includes('<base')) {
      html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${embedOrigin}/">`);
    }

    // Inject anti-adblock script at the very beginning of <head> (after <base>)
    const antiDetectScript = `
<script>
(function(){
  // Fake ad elements that adblock detectors check for
  var d=document,f=d.createElement('div');
  f.id='ad_position_box';
  f.className='ads ad adsbox doubleclick ad-placement carbon-ads adsbygoogle';
  f.style.cssText='position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none;';
  f.innerHTML='&nbsp;';
  d.documentElement.appendChild(f);

  // Fake globals
  window.adsbygoogle=window.adsbygoogle||[{loaded:true}];
  window.google_ad_status=1;
  window.canRunAds=true;
  window.isAdBlockActive=false;
  window.blurred=false;
  window.AdBlockEnabled=false;

  // Intercept fetch calls to ad-check endpoints
  var origFetch=window.fetch;
  window.fetch=function(u,o){
    if(typeof u==='string'&&(/ads|pagead|doubleclick|adserv|ad[_-]?block/i.test(u)))
      return Promise.resolve(new Response('1',{status:200}));
    return origFetch.apply(this,arguments);
  };

  // Intercept XHR to ad-check endpoints
  var origOpen=XMLHttpRequest.prototype.open;
  var origSend=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,u){
    this._isAdCheck=typeof u==='string'&&(/ads|pagead|doubleclick|adserv|ad[_-]?block/i.test(u));
    return origOpen.apply(this,arguments);
  };
  XMLHttpRequest.prototype.send=function(){
    if(this._isAdCheck){
      Object.defineProperty(this,'status',{get:function(){return 200}});
      Object.defineProperty(this,'readyState',{get:function(){return 4}});
      Object.defineProperty(this,'responseText',{get:function(){return '1'}});
      var self=this;
      setTimeout(function(){
        if(self.onload)self.onload();
        if(self.onreadystatechange)self.onreadystatechange();
      },10);
      return;
    }
    return origSend.apply(this,arguments);
  };

  // Override setTimeout/setInterval to neutralize delayed ad checks
  var origSetTimeout=window.setTimeout;
  window.setTimeout=function(fn,delay){
    if(typeof fn==='function'){
      var s=fn.toString();
      if(/adblock|AdBlock|adsBlocked|adBlockDetected|blockadblock|fuckadblock/i.test(s))
        return 0;
    }
    return origSetTimeout.apply(this,arguments);
  };

  // MutationObserver to remove adblock overlay elements as they appear
  var obs=new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      m.addedNodes.forEach(function(n){
        if(n.nodeType===1){
          var el=n;
          var id=(el.id||'').toLowerCase();
          var cls=(el.className||'').toString().toLowerCase();
          var txt=(el.textContent||'').toLowerCase();
          if(
            /adblock|ad-block|adb-overlay|blockadblock/i.test(id+' '+cls) ||
            (txt.includes('adblock') && txt.includes('disable') && el.offsetHeight>100)
          ){
            el.remove();
          }
        }
      });
    });
  });
  obs.observe(d.documentElement,{childList:true,subtree:true});
})();
</script>`;

    // Insert anti-detect script after <base> tag
    html = html.replace(/(<base[^>]*>)/i, `$1${antiDetectScript}`);

    // If no <base> was added (fallback), inject after <head>
    if (!html.includes('antiDetectScript') && !html.includes('ad_position_box')) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${antiDetectScript}`);
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
