import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchHindiHome, searchHindiAnime, type HindiAnimeItem } from "@/services/hindiApi";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Play, Film, ChevronLeft, ChevronRight } from "lucide-react";
import HindiHeroSection from "@/components/HindiHeroSection";

const ITEMS_PER_PAGE = 12;

const AnimeCard = ({ anime }: { anime: HindiAnimeItem }) => (
  <Link
    to={`/hindi/${anime.slug}`}
    className="group relative rounded-xl overflow-hidden bg-card border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
  >
    <div className="aspect-video relative overflow-hidden">
      <img
        src={anime.thumbnail}
        alt={anime.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        width={320}
        height={180}
      />
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center" />
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-xs font-semibold text-white line-clamp-2 drop-shadow-md">{anime.title}</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
          <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
        </div>
      </div>
    </div>
    <div className="p-3">
      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {anime.title}
      </h3>
      {anime.categories && anime.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {anime.categories.slice(0, 2).map((cat) => (
            <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  </Link>
);

const Hindi = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: homeAnime, isLoading: homeLoading } = useQuery({
    queryKey: ["hindi-home"],
    queryFn: fetchHindiHome,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["hindi-search", debouncedQuery],
    queryFn: () => searchHindiAnime(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    clearTimeout((window as any).__hindiSearchTimer);
    (window as any).__hindiSearchTimer = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 500);
  };

  const isSearching = debouncedQuery.length >= 2;
  const heroSlugs = new Set((homeAnime || []).slice(0, 10).map((a) => a.slug));
  const allGridAnime = isSearching
    ? searchResults || []
    : (homeAnime || []).filter((a) => !heroSlugs.has(a.slug));
  const isLoading = isSearching ? searchLoading : homeLoading;

  const totalPages = Math.ceil(allGridAnime.length / ITEMS_PER_PAGE);
  const paginatedAnime = allGridAnime.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - only show when not searching */}
      {!isSearching && (
        <HindiHeroSection animeList={homeAnime || []} loading={homeLoading} />
      )}

      <div className="p-4 md:p-6 space-y-6">
        {/* Search */}
        <div className="flex justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Hindi anime..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-10 bg-card border-border/50"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : paginatedAnime.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedAnime.map((anime) => (
              <AnimeCard key={anime.slug} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {debouncedQuery ? "No results found" : "No anime available"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .reduce<(number | "dots")[]>((acc, page, idx, arr) => {
                if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push("dots");
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "dots" ? (
                  <span key={`dots-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <Button
                    key={item}
                    variant={currentPage === item ? "default" : "outline"}
                    size="icon"
                    className="h-9 w-9 text-xs"
                    onClick={() => goToPage(item as number)}
                  >
                    {item}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hindi;
