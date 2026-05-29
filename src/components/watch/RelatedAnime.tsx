import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AnimeBasic } from "@/types/anime";

interface RelatedAnimeProps {
  relatedAnime: AnimeBasic[];
  title?: string;
}

const RelatedAnime = ({ relatedAnime, title = "Recommended" }: RelatedAnimeProps) => {
  if (!relatedAnime || relatedAnime.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/20">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <ScrollArea className="h-[600px]">
        <div className="p-3 space-y-2">
          {relatedAnime.map((anime) => (
            <Link
              key={anime.id}
              to={`/anime/${anime.id}`}
              className="flex gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
            >
              <img
                src={anime.poster || "/placeholder.svg"}
                alt={anime.title}
                className="w-14 h-[76px] object-cover rounded-md flex-shrink-0 bg-muted"
                loading="lazy"
                width={56}
                height={76}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {anime.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                  <span>{anime.tvInfo?.showType || "TV"}</span>
                  {anime.tvInfo?.eps && (
                    <>
                      <span className="text-border">•</span>
                      <span>{anime.tvInfo.eps} Eps</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RelatedAnime;
