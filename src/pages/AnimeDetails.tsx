import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Play, Star, ArrowLeft, Calendar, Clock, Award, Film, Users, Tag, BookOpen, Tv, RefreshCw, ChevronDown, ChevronUp, Heart, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toggleFavorite, toggleWatchlist, checkAnimeStatus } from "@/services/userDataService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnimeDetails, getEpisodes } from "@/services/animeApi";
import type { AnimeDetails as AnimeDetailsType, Episode } from "@/types/anime";

interface Season {
  id: string;
  data_number: number;
  data_id: number;
  season: string;
  title: string;
  japanese_title: string;
  season_poster: string;
}

interface RelatedAnime {
  duration: string;
  data_id: number;
  id: string;
  title: string;
  japanese_title: string;
  poster: string;
  tvInfo: {
    dub: number;
    sub: number;
    showType: string;
    eps: number;
  };
}

interface AnimeDetailsResponse {
  data: AnimeDetailsType;
  seasons?: Season[];
  related_data?: RelatedAnime[];
}

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/10 last:border-0">
    <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-primary/70" />}
      {label}
    </span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, title, count }: { icon: any; title: string; count?: number }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="p-1.5 rounded-md bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <h2 className="text-base font-semibold tracking-tight text-foreground">
      {title}
      {count !== undefined && <span className="text-muted-foreground font-normal ml-1.5">({count})</span>}
    </h2>
  </div>
);

const AnimeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animeData, setAnimeData] = useState<AnimeDetailsResponse | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [error, setError] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const response = await getAnimeDetails(id);
      setAnimeData(response);
    } catch (error) {
      console.error('Failed to fetch anime details:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    if (!id) return;
    setLoadingEpisodes(true);
    try {
      const response = await getEpisodes(id);
      setEpisodes(response.episodes || []);
    } catch (error) {
      console.error('Failed to fetch episodes:', error);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchEpisodes();
  }, [id]);
  // Check auth and anime status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session && id) {
        checkAnimeStatus(id).then(({ isFavorited: f, isInWatchlist: w }) => {
          setIsFavorited(f);
          setIsInWatchlist(w);
        });
      }
    });
  }, [id]);

  const anime = animeData?.data;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative h-[45vh]">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10">
          <div className="flex gap-6">
            <Skeleton className="w-48 h-72 rounded-xl shrink-0" />
            <div className="flex-1 space-y-4 pt-8">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-sm">
          <p className="text-destructive mb-4 text-sm">Failed to load anime details</p>
          <Button onClick={fetchDetails} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Anime not found</p>
          <Button onClick={() => navigate('/')} variant="outline" size="sm">Back to Home</Button>
        </div>
      </div>
    );
  }

  const overview = anime.animeInfo?.Overview || "";
  const shouldTruncate = overview.length > 250;
  const displayOverview = shouldTruncate && !synopsisExpanded ? overview.slice(0, 250) + "..." : overview;
  const visibleEpisodes = showAllEpisodes ? episodes : episodes.slice(0, 24);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Banner */}
      <div className="relative h-[45vh] md:h-[55vh] overflow-hidden">
        <img
          src={anime.banner || anime.poster}
          alt={anime.title}
          loading="eager"
          fetchPriority="high"
          width={1200}
          height={450}
          className="w-full h-full object-cover scale-105 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="sm" className="glass-panel gap-2 text-xs hover:bg-primary/10" asChild>
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content — overlaps the hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-32 md:-mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster Card */}
          <div className="shrink-0 flex flex-col items-center md:items-start">
            <div className="w-40 md:w-48 rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/20">
              <img
                src={anime.poster}
                alt={anime.title}
                loading="eager"
                width={192}
                height={288}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
            {/* Play Button — below poster on desktop */}
            {episodes.length > 0 && (
              <Button size="lg" className="w-full mt-3 gap-2 rounded-xl shadow-lg shadow-primary/20" asChild>
                <Link to={`/watch/${id}?ep=${episodes[0].episode_no || 1}`}>
                  <Play className="h-4 w-4 fill-current" />
                  Watch Now
                </Link>
              </Button>
            )}
            {/* Favorite & Watchlist Buttons */}
              <div className="flex gap-2 mt-2 w-full">
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 gap-1.5 rounded-xl text-xs ${isFavorited ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                  onClick={async () => {
                    if (!user) { toast({ variant: "destructive", title: "Please login to add favorites" }); return; }
                    const { added, error: err } = await toggleFavorite(id!, anime.title, anime.poster);
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
                  className="flex-1 gap-1.5 rounded-xl text-xs"
                  onClick={async () => {
                    if (!user) { toast({ variant: "destructive", title: "Please login to save for later" }); return; }
                    const { added, error: err } = await toggleWatchlist(id!, anime.title, anime.poster);
                    if (err) { toast({ variant: "destructive", title: "Error", description: err }); return; }
                    setIsInWatchlist(added);
                    toast({ title: added ? "Added to watchlist" : "Removed from watchlist" });
                  }}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isInWatchlist ? "fill-current" : ""}`} />
                  {isInWatchlist ? "Saved" : "Watch Later"}
                </Button>
              </div>
          </div>

          {/* Title & Meta */}
          <div className="flex-1 min-w-0 space-y-4 pt-2 md:pt-8">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-foreground">
                {anime.title}
              </h1>
              {anime.japanese_title && (
                <p className="text-xs text-muted-foreground mt-1 tracking-wide">{anime.japanese_title}</p>
              )}
            </div>

            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {anime.animeInfo?.["MAL Score"] && (
                <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  {anime.animeInfo["MAL Score"]}
                </Badge>
              )}
              {anime.animeInfo?.Status && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{anime.animeInfo.Status}</Badge>
              )}
              {anime.showType && (
                <Badge variant="outline" className="text-xs">{anime.showType}</Badge>
              )}
              {anime.animeInfo?.Duration && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {anime.animeInfo.Duration}
                </Badge>
              )}
              {(anime as any).tvInfo?.quality && (
                <Badge className="bg-accent/20 text-accent-foreground border-accent/30 text-xs">{(anime as any).tvInfo.quality}</Badge>
              )}
              {(anime as any).tvInfo?.sub && (
                <Badge variant="outline" className="text-xs border-primary/25 text-primary">SUB {(anime as any).tvInfo.sub}</Badge>
              )}
              {(anime as any).tvInfo?.dub && (
                <Badge variant="outline" className="text-xs border-accent/25 text-accent-foreground">DUB {(anime as any).tvInfo.dub}</Badge>
              )}
            </div>

            {/* Synopsis */}
            {overview && (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">{displayOverview}</p>
                {shouldTruncate && (
                  <button
                    onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                    className="text-xs text-primary hover:text-primary/80 mt-1 flex items-center gap-0.5 transition-colors"
                  >
                    {synopsisExpanded ? <>Less <ChevronUp className="h-3 w-3" /></> : <>More <ChevronDown className="h-3 w-3" /></>}
                  </button>
                )}
              </div>
            )}

            {/* Genres */}
            {anime.animeInfo?.Genres && anime.animeInfo.Genres.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {anime.animeInfo.Genres.map((genre, idx) => (
                  <Link
                    key={idx}
                    to={`/genre/${genre.name?.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-primary/8 text-primary hover:bg-primary/15 transition-colors border border-primary/10"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mt-8">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Episodes */}
            {episodes.length > 0 && (
              <div className="glass-panel rounded-xl p-5">
                <SectionHeader icon={Tv} title="Episodes" count={episodes.length} />
                {loadingEpisodes ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                      {visibleEpisodes.map((episode) => (
                        <Link
                          key={episode.id}
                          to={`/watch/${id}?ep=${episode.episode_no}`}
                          className="group relative aspect-square flex items-center justify-center rounded-lg bg-secondary/30 hover:bg-primary/15 border border-border/10 hover:border-primary/30 transition-all text-sm font-medium text-foreground hover:text-primary"
                        >
                          {episode.episode_no}
                        </Link>
                      ))}
                    </div>
                    {episodes.length > 24 && (
                      <button
                        onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                        className="mt-3 text-xs text-primary hover:text-primary/80 flex items-center gap-1 mx-auto transition-colors"
                      >
                        {showAllEpisodes ? "Show Less" : `Show All ${episodes.length} Episodes`}
                        {showAllEpisodes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Seasons */}
            {animeData?.seasons && animeData.seasons.length > 0 && (
              <div className="glass-panel rounded-xl p-5">
                <SectionHeader icon={Tv} title="Seasons" count={animeData.seasons.length} />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {animeData.seasons.map((season) => (
                    <Link
                      key={season.id}
                      to={`/anime/${season.id}`}
                      className={`group relative overflow-hidden rounded-lg border transition-all hover:shadow-lg ${
                        season.id === id ? "border-primary/50 ring-1 ring-primary/20" : "border-border/20 hover:border-primary/30"
                      }`}
                    >
                      <div className="aspect-[3/4] relative">
                        <img 
                          src={season.season_poster} 
                          alt={season.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          loading="lazy"
                          width={150}
                          height={200}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 p-2">
                          <p className="text-[11px] font-medium line-clamp-2 text-foreground">{season.season}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Anime */}
            {animeData?.related_data && animeData.related_data.length > 0 && (
              <div className="glass-panel rounded-xl p-5">
                <SectionHeader icon={Film} title="Related" count={animeData.related_data.length} />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {animeData.related_data.slice(0, 10).map((related) => (
                    <Link
                      key={related.id}
                      to={`/anime/${related.id}`}
                      className="group relative overflow-hidden rounded-lg border border-border/20 hover:border-primary/30 transition-all hover:shadow-lg"
                    >
                      <div className="aspect-[3/4] relative">
                        <img 
                          src={related.poster} 
                          alt={related.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          loading="lazy"
                          width={150}
                          height={200}
                        />
                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                          {related.tvInfo?.sub > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/80 text-primary-foreground font-medium">SUB</span>
                          )}
                          {related.tvInfo?.dub > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-secondary-foreground font-medium">DUB</span>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 p-2">
                          <p className="text-[11px] font-medium line-clamp-2 text-foreground">{related.title}</p>
                          <p className="text-[10px] text-muted-foreground">{related.tvInfo?.showType}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Producers */}
            {anime.animeInfo?.Producers && anime.animeInfo.Producers.length > 0 && (
              <div className="glass-panel rounded-xl p-5">
                <SectionHeader icon={Users} title="Producers" />
                <div className="flex flex-wrap gap-2">
                  {anime.animeInfo.Producers.map((producer, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{producer.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Info Sidebar */}
          <div>
            <div className="glass-panel rounded-xl p-5 sticky top-20 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Film className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight">Information</h3>
              </div>

              {anime.animeInfo?.["MAL Score"] && (
                <div className="flex justify-between items-center py-2.5 border-b border-border/10">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-primary/70" />
                    Score
                  </span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {anime.animeInfo["MAL Score"]}
                  </span>
                </div>
              )}
              {anime.showType && <InfoRow label="Type" value={anime.showType} />}
              {anime.animeInfo?.Status && <InfoRow label="Status" value={anime.animeInfo.Status} />}
              {anime.animeInfo?.Premiered && <InfoRow label="Premiered" value={anime.animeInfo.Premiered} icon={Calendar} />}
              {anime.animeInfo?.Aired && <InfoRow label="Aired" value={anime.animeInfo.Aired} />}
              {anime.animeInfo?.Duration && <InfoRow label="Duration" value={anime.animeInfo.Duration} icon={Clock} />}
              {anime.animeInfo?.Studios && <InfoRow label="Studios" value={anime.animeInfo.Studios} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeDetails;
