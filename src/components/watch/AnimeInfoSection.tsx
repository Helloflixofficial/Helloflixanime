import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronDown, ChevronUp, Heart, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toggleFavorite, toggleWatchlist, checkAnimeStatus } from "@/services/userDataService";
import { toast } from "sonner";

interface AnimeInfoSectionProps {
  anime: {
    id: string;
    title: string;
    japanese_title?: string;
    poster: string;
    showType?: string;
    animeInfo?: {
      Overview?: string;
      Aired?: string;
      Premiered?: string;
      Status?: string;
      Duration?: string;
      "MAL Score"?: string;
      Genres?: Array<{ name: string; url: string }>;
      Studios?: string;
      Producers?: Array<{ name: string; url: string }>;
    };
    tvInfo?: {
      rating?: string;
      quality?: string;
      sub?: number;
      dub?: number;
    };
  } | null;
  seasons?: Array<{
    id: string;
    season: string;
    season_poster: string;
  }>;
  currentAnimeId?: string;
}

const AnimeInfoSection = ({ anime, seasons, currentAnimeId }: AnimeInfoSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session && currentAnimeId) {
        checkAnimeStatus(currentAnimeId).then(({ isFavorited: f, isInWatchlist: w }) => {
          setIsFavorited(f);
          setIsInWatchlist(w);
        });
      }
    });
  }, [currentAnimeId]);

  const handleFavorite = async () => {
    if (!user) {
      toast.error("Please login to add favorites");
      return;
    }
    if (!currentAnimeId || !anime) return;
    if (loading) return;
    setLoading(true);
    const { added, error } = await toggleFavorite(currentAnimeId, anime.title, anime.poster);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setIsFavorited(added);
    toast.success(added ? "Added to favorites" : "Removed from favorites");
  };

  const handleWatchlist = async () => {
    if (!user) {
      toast.error("Please login to save for later");
      return;
    }
    if (!currentAnimeId || !anime) return;
    if (loading) return;
    setLoading(true);
    const { added, error } = await toggleWatchlist(currentAnimeId, anime.title, anime.poster);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setIsInWatchlist(added);
    toast.success(added ? "Added to watchlist" : "Removed from watchlist");
  };

  if (!anime) return null;

  const info = anime.animeInfo;
  const description = info?.Overview || "";
  const shouldTruncate = description.length > 300;
  const displayDescription =
    shouldTruncate && !isExpanded ? description.slice(0, 300) + "..." : description;

  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6">
      <div className="flex gap-5 flex-col md:flex-row">
        {/* Poster */}
        <div className="flex-shrink-0">
          <img
            src={anime.poster}
            alt={anime.title}
            className="w-28 h-40 object-cover rounded-lg shadow-lg"
            loading="lazy"
            width={112}
            height={160}
          />
          {/* Favorite & Watchlist Buttons */}
          <div className="flex gap-2 mt-3 w-28">
            <Button
              variant={isFavorited ? "default" : "outline"}
              size="icon"
              className={`flex-1 h-9 rounded-lg ${isFavorited ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
              onClick={handleFavorite}
              disabled={loading}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant={isInWatchlist ? "default" : "outline"}
              size="icon"
              className="flex-1 h-9 rounded-lg"
              onClick={handleWatchlist}
              disabled={loading}
              title={isInWatchlist ? "Remove from watchlist" : "Watch later"}
            >
              <Bookmark className={`h-4 w-4 ${isInWatchlist ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{anime.title}</h1>
            {anime.japanese_title && (
              <p className="text-xs text-muted-foreground mt-1">{anime.japanese_title}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {anime.tvInfo?.rating && (
              <Badge variant="secondary" className="text-xs">{anime.tvInfo.rating}</Badge>
            )}
            {anime.tvInfo?.quality && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{anime.tvInfo.quality}</Badge>
            )}
            {anime.tvInfo?.sub && (
              <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">SUB: {anime.tvInfo.sub}</Badge>
            )}
            {anime.tvInfo?.dub && (
              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">DUB: {anime.tvInfo.dub}</Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{displayDescription}</p>
            {shouldTruncate && (
              <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 h-auto text-primary text-xs">
                {isExpanded ? <>Less <ChevronUp className="h-3 w-3 ml-0.5" /></> : <>More <ChevronDown className="h-3 w-3 ml-0.5" /></>}
              </Button>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {anime.showType && (
              <div><span className="text-muted-foreground">Type: </span><span className="text-foreground">{anime.showType}</span></div>
            )}
            {info?.Premiered && (
              <div><span className="text-muted-foreground">Premiered: </span><span className="text-foreground">{info.Premiered}</span></div>
            )}
            {info?.Status && (
              <div><span className="text-muted-foreground">Status: </span><span className="text-foreground">{info.Status}</span></div>
            )}
            {info?.Duration && (
              <div><span className="text-muted-foreground">Duration: </span><span className="text-foreground">{info.Duration}</span></div>
            )}
            {info?.["MAL Score"] && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-foreground">{info["MAL Score"]}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {info?.Genres && info.Genres.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {info.Genres.map((genre, idx) => {
                const genreName = typeof genre === "string" ? genre : genre?.name;
                if (!genreName) return null;
                return (
                  <Link
                    key={idx}
                    to={`/genre/${genreName.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {genreName}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Seasons */}
      {seasons && seasons.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border/20">
          <h3 className="text-base font-semibold mb-3">Seasons</h3>
          <div className="flex gap-3 flex-wrap">
            {seasons.map((season) => (
              <Link
                key={season.id}
                to={`/watch/${season.id}`}
                className={`relative w-28 h-14 rounded-lg overflow-hidden group ${
                  currentAnimeId === season.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <img
                  src={season.season_poster}
                  alt={season.season}
                  className="w-full h-full object-cover blur-[2px] opacity-50 group-hover:opacity-70 transition-opacity"
                  loading="lazy"
                  width={112}
                  height={56}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold text-center px-2 ${
                    currentAnimeId === season.id ? "text-primary" : "text-foreground group-hover:text-primary"
                  } transition-colors`}>
                    {season.season}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimeInfoSection;