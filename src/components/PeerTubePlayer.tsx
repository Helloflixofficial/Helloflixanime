import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { Loader2, AlertCircle, RefreshCw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/peertube-proxy`;

interface PeerTubePlayerProps {
  hlsUrl: string;
  poster?: string;
  title?: string;
}

function getProxiedUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const url = new URL(PROXY_BASE);
    url.searchParams.set("path", parsed.pathname);
    return url.toString();
  } catch {
    const url = new URL(PROXY_BASE);
    url.searchParams.set("path", rawUrl);
    return url.toString();
  }
}

function getProxiedThumbnail(thumbnailPath: string): string {
  if (!thumbnailPath || thumbnailPath === "/placeholder.svg") return "/placeholder.svg";
  try {
    const parsed = new URL(thumbnailPath);
    const url = new URL(PROXY_BASE);
    url.searchParams.set("path", parsed.pathname);
    return url.toString();
  } catch {
    const url = new URL(PROXY_BASE);
    url.searchParams.set("path", thumbnailPath);
    return url.toString();
  }
}

const PeerTubePlayer = ({ hlsUrl, poster, title }: PeerTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playerState, setPlayerState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const initPlayer = () => {
    if (!containerRef.current || !hlsUrl) return;

    // Cleanup previous
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (artRef.current) { artRef.current.destroy(false); artRef.current = null; }

    setPlayerState("loading");
    setErrorMsg("");

    const proxiedM3u8 = getProxiedUrl(hlsUrl);
    const proxiedPoster = poster ? getProxiedThumbnail(poster) : undefined;

    console.log("[PeerTubePlayer] Loading HLS:", proxiedM3u8);

    const art = new Artplayer({
      container: containerRef.current,
      url: proxiedM3u8,
      type: "m3u8",
      poster: proxiedPoster,
      volume: 0.7,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: true,
      setting: true,
      loop: false,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      theme: "hsl(262, 83%, 58%)",
      lang: "en",
      moreVideoAttr: {
        crossOrigin: "anonymous",
      },
      customType: {
        m3u8: function (video: HTMLVideoElement, url: string) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              startLevel: -1,
              enableWorker: true,
              debug: false,
            });
            hlsRef.current = hls;

            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
              console.log("[PeerTubePlayer] Manifest parsed, levels:", data.levels.length);
              setPlayerState("ready");
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
              console.error("[PeerTubePlayer] HLS error:", data.type, data.details, data.response?.code);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    if (data.response && data.response.code === 0) {
                      setPlayerState("error");
                      setErrorMsg("Server is offline or unreachable. Check if your PeerTube instance is running.");
                    } else {
                      console.log("[PeerTubePlayer] Attempting recovery from network error...");
                      hls.startLoad();
                    }
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("[PeerTubePlayer] Attempting recovery from media error...");
                    hls.recoverMediaError();
                    break;
                  default:
                    setPlayerState("error");
                    setErrorMsg(`Playback failed: ${data.details}`);
                    hls.destroy();
                    break;
                }
              }
            });

            art.on("destroy", () => {
              hls.destroy();
              hlsRef.current = null;
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
            setPlayerState("ready");
          } else {
            setPlayerState("error");
            setErrorMsg("Your browser does not support HLS playback");
          }
        },
      },
    });

    artRef.current = art;
  };

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (artRef.current) { artRef.current.destroy(false); artRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlsUrl, poster]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border/20 shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {playerState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-10 gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Loading Stream</p>
            <p className="text-xs text-muted-foreground">Connecting to server...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {playerState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-10 gap-5 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2 max-w-sm">
            <p className="text-base font-semibold text-foreground">Stream Unavailable</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</p>
          </div>
          <Button size="sm" variant="outline" onClick={initPlayer} className="gap-2 border-primary/30 hover:bg-primary/10">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
};

export default PeerTubePlayer;
