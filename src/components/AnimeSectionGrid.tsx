import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AnimeCard from "./AnimeCard";
import type { AnimeBasic } from "@/types/anime";

interface AnimeSectionGridProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  animeList: AnimeBasic[];
  viewAllLink?: string;
  loading?: boolean;
  showRank?: boolean;
  limit?: number;
  linkPrefix?: string;
}

const AnimeSectionGrid = memo(({
  title,
  subtitle,
  icon: Icon,
  animeList,
  viewAllLink,
  loading = false,
  showRank = false,
  limit = 12,
  linkPrefix = "/anime",
}: AnimeSectionGridProps) => {
  const displayList = useMemo(() => animeList.slice(0, limit), [animeList, limit]);

  if (loading) {
    return (
      <section className="py-6 md:py-10">
        <div className="container max-w-7xl px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayList.length === 0) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="container max-w-7xl px-4">
        <div className="flex items-center justify-between mb-5 md:mb-7">
          <div className="section-header flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/20">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight">{title}</h2>
              {subtitle && (
                <p className="text-muted-foreground text-xs hidden sm:block mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {viewAllLink && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary shrink-0" asChild>
              <Link to={viewAllLink}>
                View All
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {displayList.map((anime, index) => {
            const hasEpisodeInfo = anime.tvInfo?.episodeInfo;
            const subCount = hasEpisodeInfo ? anime.tvInfo.episodeInfo.sub : anime.tvInfo?.sub || 0;
            const dubCount = hasEpisodeInfo ? anime.tvInfo.episodeInfo.dub : anime.tvInfo?.dub || 0;
            const totalEpisodes = anime.tvInfo?.eps || subCount + dubCount;
            const yearMatch = anime.tvInfo?.releaseDate?.match(/(\d{4})/);
            const yearNumber = yearMatch ? parseInt(yearMatch[1]) : undefined;

            return (
              <div key={anime.id} className="relative group">
                {showRank && (
                  <div className="absolute -top-1 -left-1 z-10 flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground font-bold text-[10px] shadow-lg">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                )}
                <AnimeCard
                  id={anime.id}
                  title={anime.title}
                  image={anime.poster}
                  year={yearNumber}
                  episodes={totalEpisodes}
                  type={anime.tvInfo?.showType || "TV"}
                  subtitle={subCount > 0 ? "SUB" : undefined}
                  isDubbed={dubCount > 0}
                  linkPrefix={linkPrefix}
                  className="h-full"
                />
              </div>
            );
          })}
        </div>

        {viewAllLink && (
          <div className="flex justify-center mt-6 sm:hidden">
            <Button variant="outline" size="sm" className="w-full max-w-xs text-xs" asChild>
              <Link to={viewAllLink}>
                View All {title}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
});

AnimeSectionGrid.displayName = "AnimeSectionGrid";

export default AnimeSectionGrid;
