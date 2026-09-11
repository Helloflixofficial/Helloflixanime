import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import AnimeCard from "@/components/AnimeCard";
import { getAnimeByCategory, getCategoryTitle } from "@/services/animeApi";
import { getAniVexaByFormat } from "@/services/anilistCatalog";
import type { AnimeBasic } from "@/types/anime";

const CategoryPage = () => {
  const { category = "all", format } = useParams<{ category: string; format?: string }>();
  const navigate = useNavigate();
  const [animes, setAnimes] = useState<AnimeBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "sub" | "dub">("all");

  const aniVexaFormat = format?.toLowerCase() === "movie" ? "MOVIE" : format?.toLowerCase() === "tv" ? "TV" : undefined;
  const title = aniVexaFormat === "MOVIE" ? "Anime Movies" : aniVexaFormat === "TV" ? "TV Anime Series" : getCategoryTitle(category);

  const fetchData = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const data = aniVexaFormat ? await getAniVexaByFormat(aniVexaFormat, pageNum) : await getAnimeByCategory(category, pageNum);
      const list = data?.data || [];
      if (append) {
        setAnimes(prev => [...prev, ...list]);
      } else {
        setAnimes(list);
      }
      setHasMore(data?.hasNextPage ?? list.length > 0);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [aniVexaFormat, category]);

  useEffect(() => {
    setAnimes([]);
    setPage(1);
    setLoading(true);
    fetchData(1);
  }, [category, fetchData]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  };

  const filteredAnimes = animes.filter((anime) => {
    const subCount = anime.tvInfo?.episodeInfo?.sub || anime.tvInfo?.sub || 0;
    const dubCount = anime.tvInfo?.episodeInfo?.dub || anime.tvInfo?.dub || 0;
    if (filter === "dub" && dubCount <= 0) return false;
    if (filter === "sub" && subCount <= 0) return false;
    return true;
  });

  return (
    <div className="container px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>

        {/* Sub/Dub/All */}
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

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filteredAnimes.map((anime) => {
              const subCount = anime.tvInfo?.episodeInfo?.sub || anime.tvInfo?.sub || 0;
              const dubCount = anime.tvInfo?.episodeInfo?.dub || anime.tvInfo?.dub || 0;
              const totalEps = anime.tvInfo?.eps || subCount + dubCount;

              return (
                <AnimeCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.title}
                  image={anime.poster}
                  episodes={totalEps}
                  type={anime.tvInfo?.showType || "TV"}
                  subtitle={subCount > 0 ? "SUB" : undefined}
                  isDubbed={dubCount > 0}
                  linkPrefix={aniVexaFormat ? "/anivexa" : undefined}
                />
              );
            })}
          </div>

          {filteredAnimes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No anime found.</p>
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

export default CategoryPage;
