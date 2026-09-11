import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnimeCard from "@/components/AnimeCard";
import SearchSuggestions from "@/components/SearchSuggestions";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { getAnimeByCategory, getGenres, searchAnime } from "@/services/animeApi";
import type { AnimeBasic } from "@/types/anime";

type SortOption = "newest" | "oldest" | "az" | "za";

const getYear = (item: AnimeBasic) =>
  item.tvInfo?.releaseDate?.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "all";
  const urlYear = searchParams.get("year") || "all";
  const urlSort = (searchParams.get("sort") as SortOption) || "newest";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedGenre, setSelectedGenre] = useState(urlGenre);
  const [selectedYear, setSelectedYear] = useState(urlYear);
  const [sortBy, setSortBy] = useState<SortOption>(urlSort);
  const [results, setResults] = useState<AnimeBasic[]>([]);
  const [genres, setGenres] = useState<{ name: string; slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const requestIdRef = useRef(0);
  const { suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(searchQuery);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1999 }, (_, index) => String(currentYear - index));
  }, []);

  useEffect(() => {
    getGenres().then(setGenres).catch((error) => console.error("Failed to load genres:", error));
  }, []);

  useEffect(() => {
    setSearchQuery(urlQuery);
    setSelectedGenre(urlGenre);
    setSelectedYear(urlYear);
    setSortBy(urlSort);
  }, [urlQuery, urlGenre, urlYear, urlSort]);

  const updateUrl = useCallback((query: string, genre: string, year: string, sort: SortOption) => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (genre !== "all") next.set("genre", genre);
    if (year !== "all") next.set("year", year);
    if (sort !== "newest") next.set("sort", sort);
    setSearchParams(next, { replace: true });
  }, [setSearchParams]);

  const loadResults = useCallback(async (query: string, genre: string, year: string, sort: SortOption) => {
    const trimmed = query.trim();
    if (!trimmed && genre === "all") {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const response = genre !== "all" ? await getAnimeByCategory(genre, 1) : await searchAnime(trimmed, 1);
      if (requestId !== requestIdRef.current) return;

      let nextResults = response.data || [];
      if (genre !== "all" && trimmed) {
        const normalizedQuery = trimmed.toLowerCase();
        nextResults = nextResults.filter((item) => item.title.toLowerCase().includes(normalizedQuery));
      }
      if (year !== "all") nextResults = nextResults.filter((item) => getYear(item) === year);

      nextResults = [...nextResults].sort((a, b) => {
        if (sort === "az") return a.title.localeCompare(b.title);
        if (sort === "za") return b.title.localeCompare(a.title);
        const aDate = Date.parse(a.tvInfo?.releaseDate || "") || 0;
        const bDate = Date.parse(b.tvInfo?.releaseDate || "") || 0;
        return sort === "oldest" ? aDate - bDate : bDate - aDate;
      });
      setResults(nextResults);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        console.error("Search failed:", error);
        setResults([]);
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadResults(searchQuery, selectedGenre, selectedYear, sortBy), 350);
    return () => window.clearTimeout(timer);
  }, [loadResults, searchQuery, selectedGenre, selectedYear, sortBy]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setShowSuggestions(false);
    updateUrl(searchQuery, selectedGenre, selectedYear, sortBy);
  };

  const handleFilterChange = (kind: "genre" | "year" | "sort", value: string) => {
    const nextGenre = kind === "genre" ? value : selectedGenre;
    const nextYear = kind === "year" ? value : selectedYear;
    const nextSort = (kind === "sort" ? value : sortBy) as SortOption;
    if (kind === "genre") setSelectedGenre(value);
    if (kind === "year") setSelectedYear(value);
    if (kind === "sort") setSortBy(nextSort);
    updateUrl(searchQuery, nextGenre, nextYear, nextSort);
  };

  const clearFilters = () => {
    setSelectedGenre("all");
    setSelectedYear("all");
    setSortBy("newest");
    updateUrl(searchQuery, "all", "all", "newest");
  };

  const hasFilters = selectedGenre !== "all" || selectedYear !== "all" || sortBy !== "newest";
  const hasSearch = searchQuery.trim().length > 0 || hasFilters;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-glow md:text-3xl">Search Series & Anime</h1>
        <p className="text-sm text-muted-foreground">Search by title, then narrow the results by genre, year, or order.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Try Naruto, One Piece, or Jobless..."
            value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            className="h-11 rounded-xl border-border/50 bg-card/60 pl-10 pr-10 backdrop-blur-sm focus:border-primary/40 focus:ring-primary/20"
            autoFocus
          />
          {searchQuery && (
            <button type="button" aria-label="Clear search" onClick={() => { setSearchQuery(""); setShowSuggestions(false); updateUrl("", selectedGenre, selectedYear, sortBy); }} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <SearchSuggestions suggestions={suggestions} isLoading={suggestionsLoading} query={searchQuery} onSelect={() => setShowSuggestions(false)} />
          )}
        </div>
        <Button type="submit" className="h-11 rounded-xl px-6">Search</Button>
      </form>

      <div className="mb-7 rounded-xl border border-border/40 bg-card/35 p-3 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><SlidersHorizontal className="h-3.5 w-3.5 text-primary" />Filters</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-lg border border-border/35 bg-background/25 px-3 py-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="shrink-0">Genre</span>
            <select value={selectedGenre} onChange={(event) => handleFilterChange("genre", event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"><option value="all">All genres</option>{genres.map((genre) => <option key={genre.slug} value={genre.slug}>{genre.name}</option>)}</select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border/35 bg-background/25 px-3 py-2 text-xs text-muted-foreground">
            <span className="shrink-0 font-semibold text-primary">YEAR</span>
            <select value={selectedYear} onChange={(event) => handleFilterChange("year", event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"><option value="all">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border/35 bg-background/25 px-3 py-2 text-xs text-muted-foreground">
            <span className="shrink-0 font-semibold text-primary">SORT</span>
            <select value={sortBy} onChange={(event) => handleFilterChange("sort", event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">Title A-Z</option><option value="za">Title Z-A</option></select>
          </label>
        </div>
        {hasFilters && <button type="button" onClick={clearFilters} className="mt-3 text-xs font-medium text-primary transition-colors hover:text-primary/80">Clear filters</button>}
      </div>

      {genres.length > 0 && !hasSearch && (
        <div className="mb-6"><h3 className="mb-3 text-sm font-medium text-muted-foreground">Browse by Genre</h3><div className="flex flex-wrap gap-2">{genres.map((genre) => <button key={genre.slug} type="button" onClick={() => handleFilterChange("genre", genre.slug)} className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">{genre.name}</button>)}</div></div>
      )}

      {hasSearch && !isLoading && <p className="mb-4 text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""} found{searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ""}</p>}
      {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Searching...</span></div>}
      {!isLoading && results.length > 0 && <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{results.map((item) => <AnimeCard key={item.id} id={item.id} title={item.title} image={item.poster} year={Number(getYear(item)) || undefined} subtitle="SUB" isDubbed={!!item.tvInfo?.dub} />)}</div>}
      {!isLoading && hasSearch && results.length === 0 && <div className="py-20 text-center"><Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" /><p className="text-lg font-medium">No series found</p><p className="mt-1 text-sm text-muted-foreground">Try another title or remove one of the filters.</p></div>}
      {!isLoading && !hasSearch && <div className="py-14 text-center text-sm text-muted-foreground">Start typing to search the full catalog.</div>}
    </div>
  );
};

export default SearchPage;
