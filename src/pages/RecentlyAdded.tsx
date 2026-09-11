import { useQuery } from "@tanstack/react-query";
import { getAniVexaRecentlyAdded } from "@/services/anilistCatalog";
import AnimeCard from "@/components/AnimeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AnimeBasic } from "@/types/anime";

const RecentlyAdded = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["anivexa-recently-added", page],
    queryFn: () => getAniVexaRecentlyAdded(page),
  });

  const animes: AnimeBasic[] = data?.data || [];
  const hasNextPage = data?.hasNextPage ?? false;
  const sourceLabel = data?.source === "anilist" ? "AniList catalog · AniVexa playback" : "Catalog fallback · AniVexa playback";

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
          <div className="ml-auto rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">{sourceLabel}</div>
        </div>
        <div className="mt-5"><h1 className="text-2xl font-black tracking-tight">Recently Added Anime</h1><p className="mt-1 text-sm text-muted-foreground">Fresh anime metadata with AniVexa ready for playback.</p></div>
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
        ) : isError ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
            <h2 className="text-lg font-bold">Recently added anime could not load</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">The catalog or AniVexa episode service is temporarily unavailable.</p>
            <Button onClick={() => refetch()} className="mt-5 gap-2"><RefreshCw className="h-4 w-4" /> Try again</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {animes.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.title}
                  image={anime.poster}
                  type={anime.tvInfo?.showType}
                  episodes={anime.tvInfo?.eps || anime.tvInfo?.sub}
                  subtitle={anime.tvInfo?.sub ? `${anime.tvInfo.sub}` : undefined}
                  isDubbed={!!anime.tvInfo?.dub && anime.tvInfo.dub > 0}
                  linkPrefix={anime.category === "anivexa" ? "/anivexa" : undefined}
                />
              ))}
            </div>

            {isFetching && <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Checking AniVexa playback routes…</div>}

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
