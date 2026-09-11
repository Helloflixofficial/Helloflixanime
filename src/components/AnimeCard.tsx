import { memo } from "react";
import { Link } from "react-router-dom";
import { Play, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimeCardProps {
  id: string;
  title: string;
  image: string;
  rating?: number;
  year?: number;
  episodes?: number;
  type?: string;
  status?: string;
  genres?: string[];
  subtitle?: string;
  className?: string;
  isDubbed?: boolean;
  linkPrefix?: string;
}

const AnimeCard = memo(({
  id,
  title,
  image,
  year,
  episodes,
  subtitle,
  className = "",
  isDubbed = false,
  linkPrefix = "/anime",
}: AnimeCardProps) => {
  return (
    <Link 
      to={`${linkPrefix}/${id}`} 
      className={cn(
        "group block transition-all duration-300 ease-out hover:-translate-y-1.5", 
        className
      )}
    >
      {/* Poster Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-900 shadow-md group-hover:shadow-xl transition-all duration-300 border border-white/5">
        {/* Poster Image */}
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          loading="lazy"
          decoding="async"
          width={225}
          height={300}
          className="w-full h-full object-cover transform scale-[1.01] transition-all duration-500 group-hover:scale-105 group-hover:blur-[2px] group-hover:brightness-[0.85]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />

        {/* Hover Play Button Overlay (cosmic-main style) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-350 flex items-center justify-center bg-black/10 z-10">
          <div className="h-10 w-10 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center transform scale-[0.85] group-hover:scale-100 transition-all duration-300 shadow-lg">
            <Play className="h-4.5 w-4.5 text-white fill-white ml-[2px]" />
          </div>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {subtitle && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/85 text-primary-foreground backdrop-blur-sm shadow-sm border border-primary/20">
              SUB
            </span>
          )}
          {isDubbed && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary/85 text-secondary-foreground backdrop-blur-sm shadow-sm border border-secondary/20">
              DUB
            </span>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-2 space-y-1">
        <h3 className="font-semibold text-[13px] sm:text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200 text-white/90">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-neutral-400">
          {year && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {year}
            </span>
          )}
          {episodes !== undefined && episodes > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {episodes} eps
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

AnimeCard.displayName = "AnimeCard";

export default AnimeCard;
