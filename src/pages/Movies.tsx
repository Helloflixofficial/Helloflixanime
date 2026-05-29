import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AnimeCard from "@/components/AnimeCard";
import { getAnimeByCategory } from "@/services/animeApi";
import { cn } from "@/lib/utils";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance",
  "Thriller", "Horror", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
  "Mecha", "Isekai", "School", "Magic", "Mystery", "Ecchi",
  "Music", "Psychological", "Demons", "Military", "Historical",
  "Samurai", "Shounen", "Seinen", "Shoujo", "Josei", "Harem",
];

const Movies = () => {
  const navigate = useNavigate();
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "sub" | "dub">("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [showGenres, setShowGenres] = useState(false);

  const fetchMovies = async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const data = await getAnimeByCategory("movie", pageNum);
      const list = data?.data || data?.animes || [];
      if (append) {
        setAnimes(prev => [...prev, ...list]);
      } else {
        setAnimes(list);
      }
      setHasMore(data?.hasNextPage ?? list.length > 0);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMovies(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage, true);
  };

  const filteredAnimes = animes.filter((anime: any) => {
    const subCount = anime.tvInfo?.episodeInfo?.sub || anime.tvInfo?.sub || 0;
    const dubCount = anime.tvInfo?.episodeInfo?.dub || anime.tvInfo?.dub || 0;
    if (filter === "dub" && dubCount <= 0) return false;
    if (filter === "sub" && subCount <= 0) return false;
    // Genre filter (client-side, checks if genre appears in anime data)
    if (selectedGenre !== "All") {
      const genres = anime.genres || [];
      const genreMatch = genres.some((g: string) =>
        g.toLowerCase() === selectedGenre.toLowerCase()
      );
      if (!genreMatch) return false;
    }
    return true;
  });

  return (
    <div className="container px-4 py-6">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Sub/Dub/All filters */}
        <div className="flex gap-1.5 ml-auto">
          {(["all", "sub", "dub"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="text-xs px-3 h-8"
            >
              {f.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Genre filter bar */}
      <div className="mb-5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGenres(!showGenres)}
          className="text-xs gap-1.5 h-8"
        >
          Genre: {selectedGenre}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showGenres && "rotate-180")} />
        </Button>

        {showGenres && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Button
              size="sm"
              variant={selectedGenre === "All" ? "default" : "outline"}
              onClick={() => { setSelectedGenre("All"); setShowGenres(false); }}
              className="text-xs h-7 px-2.5"
            >
              All
            </Button>
            {GENRES.map((genre) => (
              <Button
                key={genre}
                size="sm"
                variant={selectedGenre === genre ? "default" : "outline"}
                onClick={() => { setSelectedGenre(genre); setShowGenres(false); }}
                className="text-xs h-7 px-2.5"
              >
                {genre}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAnimes.map((anime: any) => (
              <AnimeCard
                key={anime.id}
                id={anime.id}
                title={anime.name || anime.title}
                image={anime.poster || anime.image}
                episodes={anime.tvInfo?.eps || anime.tvInfo?.sub}
                subtitle={anime.tvInfo?.sub ? `${anime.tvInfo.sub}` : undefined}
                isDubbed={!!anime.tvInfo?.dub && anime.tvInfo.dub > 0}
              />
            ))}
          </div>

          {filteredAnimes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No movies found.</p>
            </div>
          )}

          {hasMore && animes.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button onClick={loadMore} disabled={loadingMore} variant="outline">
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Movies;
