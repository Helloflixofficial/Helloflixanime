import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Loader2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AnimeCard from "@/components/AnimeCard";
import { searchAnime, getHomeData } from "@/services/animeApi";

const GENRE_BUTTONS = [
  { name: "Action", slug: "action", color: "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25" },
  { name: "Adventure", slug: "adventure", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25" },
  { name: "Cars", slug: "cars", color: "bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25" },
  { name: "Comedy", slug: "comedy", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25" },
  { name: "Dementia", slug: "dementia", color: "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25" },
  { name: "Demons", slug: "demons", color: "bg-rose-600/15 text-rose-400 border-rose-600/30 hover:bg-rose-600/25" },
  { name: "Drama", slug: "drama", color: "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25" },
  { name: "Ecchi", slug: "ecchi", color: "bg-pink-500/15 text-pink-400 border-pink-500/30 hover:bg-pink-500/25" },
  { name: "Fantasy", slug: "fantasy", color: "bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/25" },
  { name: "Game", slug: "game", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25" },
  { name: "Harem", slug: "harem", color: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30 hover:bg-fuchsia-500/25" },
  { name: "Historical", slug: "historical", color: "bg-amber-600/15 text-amber-400 border-amber-600/30 hover:bg-amber-600/25" },
  { name: "Horror", slug: "horror", color: "bg-red-700/15 text-red-300 border-red-700/30 hover:bg-red-700/25" },
  { name: "Isekai", slug: "isekai", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25" },
  { name: "Josei", slug: "josei", color: "bg-rose-400/15 text-rose-300 border-rose-400/30 hover:bg-rose-400/25" },
  { name: "Kids", slug: "kids", color: "bg-lime-500/15 text-lime-400 border-lime-500/30 hover:bg-lime-500/25" },
  { name: "Magic", slug: "magic", color: "bg-purple-600/15 text-purple-300 border-purple-600/30 hover:bg-purple-600/25" },
  { name: "Martial Arts", slug: "martial-arts", color: "bg-orange-600/15 text-orange-300 border-orange-600/30 hover:bg-orange-600/25" },
  { name: "Mecha", slug: "mecha", color: "bg-slate-500/15 text-slate-300 border-slate-500/30 hover:bg-slate-500/25" },
  { name: "Military", slug: "military", color: "bg-green-700/15 text-green-400 border-green-700/30 hover:bg-green-700/25" },
  { name: "Music", slug: "music", color: "bg-teal-500/15 text-teal-400 border-teal-500/30 hover:bg-teal-500/25" },
  { name: "Mystery", slug: "mystery", color: "bg-gray-500/15 text-gray-300 border-gray-500/30 hover:bg-gray-500/25" },
  { name: "Parody", slug: "parody", color: "bg-yellow-600/15 text-yellow-300 border-yellow-600/30 hover:bg-yellow-600/25" },
  { name: "Police", slug: "police", color: "bg-blue-700/15 text-blue-300 border-blue-700/30 hover:bg-blue-700/25" },
  { name: "Psychological", slug: "psychological", color: "bg-violet-700/15 text-violet-300 border-violet-700/30 hover:bg-violet-700/25" },
  { name: "Romance", slug: "romance", color: "bg-pink-400/15 text-pink-300 border-pink-400/30 hover:bg-pink-400/25" },
  { name: "Samurai", slug: "samurai", color: "bg-red-800/15 text-red-300 border-red-800/30 hover:bg-red-800/25" },
  { name: "School", slug: "school", color: "bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25" },
  { name: "Sci-Fi", slug: "sci-fi", color: "bg-cyan-600/15 text-cyan-300 border-cyan-600/30 hover:bg-cyan-600/25" },
  { name: "Seinen", slug: "seinen", color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/25" },
  { name: "Shoujo", slug: "shoujo", color: "bg-pink-600/15 text-pink-300 border-pink-600/30 hover:bg-pink-600/25" },
  { name: "Shoujo Ai", slug: "shoujo-ai", color: "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25" },
  { name: "Shounen", slug: "shounen", color: "bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/25" },
  { name: "Shounen Ai", slug: "shounen-ai", color: "bg-blue-400/15 text-blue-300 border-blue-400/30 hover:bg-blue-400/25" },
  { name: "Slice of Life", slug: "slice-of-life", color: "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25" },
  { name: "Space", slug: "space", color: "bg-indigo-600/15 text-indigo-300 border-indigo-600/30 hover:bg-indigo-600/25" },
  { name: "Sports", slug: "sports", color: "bg-emerald-600/15 text-emerald-300 border-emerald-600/30 hover:bg-emerald-600/25" },
  { name: "Super Power", slug: "super-power", color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/25" },
  { name: "Supernatural", slug: "supernatural", color: "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25" },
  { name: "Thriller", slug: "thriller", color: "bg-red-600/15 text-red-300 border-red-600/30 hover:bg-red-600/25" },
  { name: "Vampire", slug: "vampire", color: "bg-red-900/15 text-red-300 border-red-900/30 hover:bg-red-900/25" },
];

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance",
  "Thriller", "Horror", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
  "Mecha", "Isekai", "School", "Magic", "Mystery", "Ecchi",
  "Music", "Psychological",
];

interface AnimeResult {
  id: string;
  title: string;
  poster: string;
  tvInfo?: {
    showType?: string;
    sub?: number;
    dub?: number;
    eps?: number;
  };
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<AnimeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>(GENRES);

  // Load genres from API
  useEffect(() => {
    getHomeData().then((data) => {
      if (data?.genres?.length) setAvailableGenres(data.genres);
    }).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q: string, p: number, append = false) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchAnime(q.trim(), p);
      const items: AnimeResult[] = (data?.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        poster: item.poster,
        tvInfo: item.tvInfo,
      }));
      setResults((prev) => (append ? [...prev, ...items] : items));
      setHasMore(data?.hasNextPage ?? false);
    } catch {
      if (!append) setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search on mount / query param change
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setPage(1);
      doSearch(initialQuery, 1);
    }
  }, [initialQuery, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams(searchQuery.trim() ? { q: searchQuery.trim() } : {});
    doSearch(searchQuery, 1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    doSearch(searchQuery, next, true);
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Client-side filtering
  const filtered = results.filter((anime) => {
    if (selectedType && anime.tvInfo?.showType?.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    // Genre filter is client-side best-effort (API doesn't return genres in search)
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-glow mb-2">Search Anime</h1>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Type anime name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            autoFocus
          />
        </div>
        <Button type="submit" className="h-11 px-6">Search</Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {/* Genre Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Browse by Genre</h3>
        <div className="flex flex-wrap gap-2">
          {GENRE_BUTTONS.map((genre) => (
            <Link
              key={genre.slug}
              to={`/genre/${genre.slug}`}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${genre.color}`}
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="anime-card p-4 mb-6 space-y-4 animate-in slide-in-from-top-2">
          {/* Type filter */}
          <div>
            <p className="text-sm font-medium mb-2">Type</p>
            <div className="flex flex-wrap gap-2">
              {["", "TV", "Movie", "OVA", "ONA", "Special"].map((t) => (
                <Badge
                  key={t || "all"}
                  variant={selectedType === t ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedType(t)}
                >
                  {t || "All"}
                </Badge>
              ))}
            </div>
          </div>

          {/* Genre filter */}
          <div>
            <p className="text-sm font-medium mb-2">
              Genres
              {selectedGenres.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-5 text-xs text-muted-foreground"
                  onClick={() => setSelectedGenres([])}
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant={selectedGenres.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {searchQuery.trim() && !isLoading && (
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}

      {/* Loading */}
      {isLoading && results.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Searching...</span>
        </div>
      )}

      {/* Results Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((anime) => (
            <AnimeCard
              key={anime.id}
              id={anime.id}
              title={anime.title}
              image={anime.poster}
              type={anime.tvInfo?.showType}
              episodes={anime.tvInfo?.eps || anime.tvInfo?.sub}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && searchQuery.trim() && filtered.length === 0 && (
        <div className="text-center py-20">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium">No anime found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
        </div>
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}

      {isLoading && results.length > 0 && (
        <div className="flex justify-center mt-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default SearchPage;
