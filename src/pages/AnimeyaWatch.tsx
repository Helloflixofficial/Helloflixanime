import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAnimeyaInfo, watchAnimeya, type AnimeyaSource } from "@/services/tatakaiApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Monitor, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Iframe that clears its src on unmount to stop video playback */
function IframeStopper({ url }: { url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };
  }, []);
  return (
    <iframe
      ref={iframeRef}
      key={url}
      src={url}
      className="absolute inset-0 w-full h-full"
      allowFullScreen
      allow="autoplay; encrypted-media; picture-in-picture; popups"
      referrerPolicy="no-referrer"
    />
  );
}


const EPISODES_PREVIEW = 24;

const AnimeyaWatch = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeEpId, setActiveEpId] = useState<number | null>(null);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [showAllEps, setShowAllEps] = useState(false);

  const { data: info, isLoading } = useQuery({
    queryKey: ["animeya-info", slug],
    queryFn: () => getAnimeyaInfo(slug!),
    enabled: !!slug,
  });

  const currentEpId = activeEpId || info?.episodes?.[0]?.id;

  const { data: sources } = useQuery({
    queryKey: ["animeya-watch", currentEpId],
    queryFn: () => watchAnimeya(currentEpId!),
    enabled: !!currentEpId,
  });

  const currentSource = sources?.[activeServerIndex];
  const episodes = info?.episodes || [];
  const visibleEps = showAllEps ? episodes : episodes.slice(0, EPISODES_PREVIEW);
  const currentEp = episodes.find(e => e.id === currentEpId);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full max-w-4xl rounded-xl" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Anime not found</p>
          <Link to="/animeya"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <Link to="/animeya" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Animeya
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          {currentSource ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border/30">
                <IframeStopper url={currentSource.url} />
              </div>
              {sources && sources.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, idx) => (
                    <Button key={idx} variant={activeServerIndex === idx ? "default" : "outline"} size="sm" onClick={() => setActiveServerIndex(idx)} className="h-8 text-xs">
                      <Monitor className="h-3 w-3 mr-1.5" />{s.name} {s.subType !== "NONE" ? `(${s.subType})` : ""}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video rounded-xl overflow-hidden bg-black border border-border/30 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Loading player...</p>
            </div>
          )}

          <div className="rounded-xl border border-border/30 bg-card p-5 space-y-3">
            <h1 className="text-xl font-bold text-foreground">{info.title}</h1>
            {currentEp && <p className="text-sm text-primary">Ep {currentEp.number}: {currentEp.title}</p>}
            {info.description && <p className="text-sm text-muted-foreground">{info.description}</p>}
            <p className="text-xs text-muted-foreground">{episodes.length} Episodes available</p>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 space-y-3 h-fit xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
          <h2 className="text-sm font-semibold sticky top-0 bg-card/80 backdrop-blur-sm py-2 z-10">Episodes ({episodes.length})</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-4 gap-2">
            {visibleEps.map((ep) => {
              const isActive = currentEpId === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => { setActiveEpId(ep.id); setActiveServerIndex(0); }}
                  className={cn(
                    "flex items-center justify-center h-10 rounded-lg text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                      : ep.isFiller
                        ? "bg-accent/50 text-accent-foreground hover:bg-accent border border-border/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30"
                  )}
                  title={ep.title}
                >
                  {isActive && <Play className="h-3 w-3 mr-1 fill-current" />}{ep.number}
                </button>
              );
            })}
          </div>
          {episodes.length > EPISODES_PREVIEW && (
            <Button variant="ghost" size="sm" onClick={() => setShowAllEps(!showAllEps)} className="w-full text-xs text-muted-foreground">
              {showAllEps ? <>Show Less <ChevronUp className="h-3 w-3 ml-1" /></> : <>Show All {episodes.length} Episodes <ChevronDown className="h-3 w-3 ml-1" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimeyaWatch;
