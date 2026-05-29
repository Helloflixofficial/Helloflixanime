import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHindiAnimeDetail, type HindiEpisode } from "@/services/hindiApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Play, ChevronDown, ChevronUp, Heart, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toggleFavorite, toggleWatchlist, checkAnimeStatus } from "@/services/userDataService";
import { useToast } from "@/hooks/use-toast";

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
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"
    />
  );
}

const HindiWatch = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeEpisode, setActiveEpisode] = useState<HindiEpisode | null>(null);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session && slug) {
        const animeId = `hindi-${slug}`;
        checkAnimeStatus(animeId).then(({ isFavorited: f, isInWatchlist: w }) => {
          setIsFavorited(f);
          setIsInWatchlist(w);
        });
      }
    });
  }, [slug]);

  const { data: anime, isLoading } = useQuery({
    queryKey: ["hindi-anime", slug],
    queryFn: () => fetchHindiAnimeDetail(slug!),
    enabled: !!slug,
  });

  const currentEpisode = activeEpisode || anime?.episodes?.[0];
  const currentServer = currentEpisode?.servers?.[activeServerIndex];
  const EPISODES_PREVIEW = 24;
  const episodes = anime?.episodes || [];
  const visibleEpisodes = showAllEpisodes ? episodes : episodes.slice(0, EPISODES_PREVIEW);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full max-w-4xl rounded-xl" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Anime not found</p>
          <Link to="/hindi">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Hindi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Back button */}
      <Link to="/hindi" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Hindi
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 max-w-7xl mx-auto">
        {/* Left: Player or Thumbnail + Info */}
        <div className="space-y-4">
          {/* Player or Thumbnail */}
          {currentServer ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border/30">
                <IframeStopper url={currentServer.url} />
              </div>
              {currentEpisode && currentEpisode.servers.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {currentEpisode.servers.map((server, idx) => (
                    <Button
                      key={idx}
                      variant={activeServerIndex === idx ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveServerIndex(idx)}
                      className="h-8 text-xs"
                    >
                      <Monitor className="h-3 w-3 mr-1.5" />
                      {server.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video rounded-xl overflow-hidden bg-black border border-border/30 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Select an episode to start watching</p>
            </div>
          )}

          {/* Anime Info */}
          <div className="rounded-xl border border-border/30 bg-card p-5 space-y-3">
            <h1 className="text-xl font-bold text-foreground">{anime.title}</h1>
            {anime.rating && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                ⭐ {anime.rating}
              </span>
            )}
            <p className="text-sm text-muted-foreground">
              {anime.description || "No description available."}
            </p>
            <p className="text-xs text-muted-foreground">
              {episodes.length} Episode{episodes.length !== 1 ? "s" : ""} available
            </p>
            {user && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 gap-1.5 text-xs ${isFavorited ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                  onClick={async () => {
                    const animeId = `hindi-${slug}`;
                    const { added, error: err } = await toggleFavorite(animeId, anime.title, anime.thumbnail || null);
                    if (err) { toast({ variant: "destructive", title: "Error", description: err }); return; }
                    setIsFavorited(added);
                    toast({ title: added ? "Added to favorites" : "Removed from favorites" });
                  }}
                >
                  <Heart className={`h-3.5 w-3.5 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Favorited" : "Favorite"}
                </Button>
                <Button
                  variant={isInWatchlist ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={async () => {
                    const animeId = `hindi-${slug}`;
                    const { added, error: err } = await toggleWatchlist(animeId, anime.title, anime.thumbnail || null);
                    if (err) { toast({ variant: "destructive", title: "Error", description: err }); return; }
                    setIsInWatchlist(added);
                    toast({ title: added ? "Added to watchlist" : "Removed from watchlist" });
                  }}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isInWatchlist ? "fill-current" : ""}`} />
                  {isInWatchlist ? "Saved" : "Watch Later"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Episode List */}
        <div className="glass-panel rounded-xl p-4 space-y-3 h-fit xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
          <h2 className="text-sm font-semibold text-foreground sticky top-0 bg-card/80 backdrop-blur-sm py-2 z-10">
            Episodes ({episodes.length})
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
            {visibleEpisodes.map((ep) => {
              const isActive = currentEpisode?.number === ep.number;
              return (
                <button
                  key={ep.number}
                  onClick={() => {
                    setActiveEpisode(ep);
                    setActiveServerIndex(0);
                  }}
                  className={cn(
                    "flex items-center justify-center h-10 rounded-lg text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30"
                  )}
                >
                  {isActive && <Play className="h-3 w-3 mr-1 fill-current" />}
                  {ep.number}
                </button>
              );
            })}
          </div>

          {episodes.length > EPISODES_PREVIEW && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllEpisodes(!showAllEpisodes)}
              className="w-full text-xs text-muted-foreground"
            >
              {showAllEpisodes ? (
                <>Show Less <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Show All {episodes.length} Episodes <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HindiWatch;
