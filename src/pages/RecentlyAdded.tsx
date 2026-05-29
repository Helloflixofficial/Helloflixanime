import { useQuery } from "@tanstack/react-query";
import { getAnimeByCategory } from "@/services/animeApi";
import AnimeCard from "@/components/AnimeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentlyAdded = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "dub" | "sub">("all");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["recently-added", page],
    queryFn: () => getAnimeByCategory("recently-added", page),
  });

  const animes = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const hasNextPage = page < totalPages;

  const filteredAnimes = animes.filter((anime: any) => {
    const subCount = anime.tvInfo?.episodeInfo?.sub || anime.tvInfo?.sub || 0;
    const dubCount = anime.tvInfo?.episodeInfo?.dub || anime.tvInfo?.dub || 0;
    if (filter === "dub") return dubCount > 0;
    if (filter === "sub") return subCount > 0;
    return true;
  });

  return (
    <div className="py-8">
      <div className="container px-4 mb-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("common.back", "Back")}
          </Button>
          <div className="flex gap-2 ml-auto">
            {(["all", "dub", "sub"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => { setFilter(f); }}
              >
                {f === "all" ? "All" : f === "dub" ? "DUB" : "SUB"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredAnimes.map((anime: any) => (
                <AnimeCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.name || anime.title}
                  image={anime.poster || anime.image}
                  type={anime.type}
                  episodes={anime.tvInfo?.eps || anime.tvInfo?.sub}
                  subtitle={anime.tvInfo?.sub ? `${anime.tvInfo.sub}` : undefined}
                  isDubbed={!!anime.tvInfo?.dub && anime.tvInfo.dub > 0}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("common.previous", "Previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("common.page", "Page")} {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
              >
                {t("common.next", "Next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecentlyAdded;
