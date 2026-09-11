import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AnimeCard from "@/components/AnimeCard";
import { getAnimeByCategory } from "@/services/animeApi";
import type { AnimeBasic } from "@/types/anime";

const GenrePage = () => {
  const { genreName } = useParams<{ genreName: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const formatGenreName = (name: string) =>
    name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const { data, isLoading } = useQuery({
    queryKey: ["genre", genreName, page],
    queryFn: () => getAnimeByCategory(`genre/${genreName}`, page),
    enabled: !!genreName,
  });

  const animes = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const hasNextPage = page < totalPages;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Search & Genres
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {formatGenreName(genreName || "")} Anime
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : animes.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {animes.map((anime: AnimeBasic) => (
              <AnimeCard
                key={anime.id}
                id={anime.id}
                title={anime.title}
                image={anime.poster}
                type={anime.tvInfo?.showType}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg font-medium">No anime found</p>
          <p className="text-sm text-muted-foreground mt-1">
            No results for {formatGenreName(genreName || "")} genre
          </p>
        </div>
      )}
    </div>
  );
};

export default GenrePage;
