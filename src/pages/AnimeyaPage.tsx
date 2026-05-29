import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAnimeyaHome, searchAnimeya, type AnimeyaItem } from "@/services/tatakaiApi";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Play, Film, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const AnimeCard = ({ anime }: { anime: AnimeyaItem }) => (
  <Link
    to={`/animeya/${anime.slug}`}
    className="group relative rounded-xl overflow-hidden bg-card border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
  >
    <div className="aspect-[3/4] relative overflow-hidden bg-muted">
      {anime.cover ? (
        <img 
          src={anime.cover} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          loading="lazy" 
          width={225}
          height={300}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <Film className="h-8 w-8 text-primary/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-xs font-semibold text-white line-clamp-2 drop-shadow-md">{anime.title}</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
          <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
        </div>
      </div>
      {anime.type && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/80 text-primary-foreground backdrop-blur-sm">{anime.type}</span>
      )}
    </div>
  </Link>
);

const AnimeyaPage = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: homeAnime, isLoading: homeLoading } = useQuery({
    queryKey: ["animeya-home"],
    queryFn: fetchAnimeyaHome,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["animeya-search", debouncedQuery],
    queryFn: () => searchAnimeya(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSearch = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
    clearTimeout((window as any).__animeyaTimer);
    (window as any).__animeyaTimer = setTimeout(() => setDebouncedQuery(value.trim()), 500);
  };

  const isSearching = debouncedQuery.length >= 2;
  const allAnime = isSearching ? searchResults || [] : homeAnime || [];
  const isLoading = isSearching ? searchLoading : homeLoading;

  const totalPages = Math.ceil(allAnime.length / ITEMS_PER_PAGE);
  const paginatedAnime = allAnime.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Animeya</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search Animeya..." value={query} onChange={(e) => handleSearch(e.target.value)} className="pl-9 h-10 bg-card border-border/50" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
        </div>
      ) : paginatedAnime.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {paginatedAnime.map((anime) => <AnimeCard key={anime.slug} anime={anime} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{debouncedQuery ? "No results found" : "No anime available"}</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="icon" className="h-9 w-9" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((page) => (
            <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" className="h-9 w-9 text-xs" onClick={() => goToPage(page)}>{page}</Button>
          ))}
          <Button variant="outline" size="icon" className="h-9 w-9" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnimeyaPage;
