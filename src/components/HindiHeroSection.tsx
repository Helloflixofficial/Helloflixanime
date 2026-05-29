import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroAnimeItem {
  title: string;
  slug: string;
  thumbnail: string;
  logo?: string;
  categories?: string[];
}

interface HindiHeroSectionProps {
  animeList: HeroAnimeItem[];
  loading?: boolean;
  linkPrefix?: string;
}

const TAGS = [
  { label: "Trending",   cls: "bg-red-500/15 text-red-400 border-red-500/25" },
  { label: "Spotlight",  cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  { label: "New Season", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  { label: "Popular",    cls: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
];
const pickTag = (seed: number) => TAGS[seed % TAGS.length];

const HindiHeroSection = ({ animeList, loading = false, linkPrefix = "/hindi" }: HindiHeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchRef = useRef<{ startX: number; startY: number } | null>(null);

  const spotlights = animeList.slice(0, 10);

  useEffect(() => {
    if (!isAutoPlaying || spotlights.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % spotlights.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, spotlights.length]);

  const nextSlide = useCallback(() => {
    if (spotlights.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % spotlights.length);
    setIsAutoPlaying(false);
  }, [spotlights.length]);

  const prevSlide = useCallback(() => {
    if (spotlights.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + spotlights.length) % spotlights.length);
    setIsAutoPlaying(false);
  }, [spotlights.length]);

  /* ── Swipe ── */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    touchRef.current = { startX: e.clientX, startY: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!touchRef.current) return;
    const dx = e.clientX - touchRef.current.startX;
    const dy = Math.abs(e.clientY - touchRef.current.startY);
    touchRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  }, [nextSlide, prevSlide]);

  if (loading) {
    return (
      <section className="w-full px-4 md:px-6 lg:px-10 py-4">
        <Skeleton className="w-full rounded-2xl h-[360px] md:h-[420px] lg:h-[520px]" />
      </section>
    );
  }

  if (spotlights.length === 0) return null;

  const anime = spotlights[currentSlide];
  const tag = pickTag(currentSlide);

  return (
    <section className="w-full px-2 sm:px-4 md:px-6 lg:px-10 py-2 md:py-3">
      {/* ── Card wrapper ── */}
      <div
        className="relative w-full overflow-hidden rounded-2xl select-none
                   h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Background images (cross-fade) */}
        {spotlights.map((s, i) => (
          <div
            key={s.slug}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Blurred background image to fill sides seamlessly without plain black bars */}
            <img
              src={s.thumbnail}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 select-none pointer-events-none"
            />
            {/* Foreground zoomed-out containing image to show entire banner */}
            <img
              src={s.thumbnail}
              alt={s.title}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              width={1200}
              height={380}
              className="relative w-full h-full object-contain z-[1]"
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-[2]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-[2]" />

        {/* Left navigation arrow */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="
            hidden md:inline-flex items-center justify-center
            absolute left-4 top-1/2 -translate-y-1/2 z-50
            h-9 w-9 rounded-full
            border border-white/20
            bg-black/40 backdrop-blur-sm
            hover:bg-black/65 transition-colors duration-200
          "
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>

        {/* Right navigation arrow */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="
            hidden md:inline-flex items-center justify-center
            absolute right-4 top-1/2 -translate-y-1/2 z-50
            h-9 w-9 rounded-full
            border border-white/20
            bg-black/40 backdrop-blur-sm
            hover:bg-black/65 transition-colors duration-200
          "
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>

        {/* Content */}
        <div
          className="
            absolute z-[3]
            left-0 bottom-10 sm:bottom-12 md:bottom-14
            px-5 sm:px-8 md:px-10
            w-full md:w-[60%] lg:w-[52%]
          "
        >
          <div className="space-y-3">
            <span
              className={`
                inline-flex items-center gap-1 rounded-md px-2.5 py-0.5
                font-semibold border backdrop-blur-sm text-xs ${tag.cls}
              `}
            >
              <Zap className="h-3 w-3" />
              {tag.label}
            </span>

            {/* Title — logo image when available, text fallback otherwise */}
            {anime.logo ? (
              <img
                src={anime.logo}
                alt={anime.title}
                loading="lazy"
                className="max-h-[60px] sm:max-h-[72px] md:max-h-[90px] w-auto max-w-[280px] sm:max-w-[340px] md:max-w-[420px] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
              />
            ) : (
              <h1
                className="
                  font-semibold tracking-tight text-white leading-tight
                  text-xl sm:text-2xl md:text-3xl lg:text-4xl
                "
              >
                {anime.title}
              </h1>
            )}

            {anime.categories && anime.categories.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 text-xs">
                {anime.categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center rounded-md px-2.5 py-0.5 border border-white/10 bg-white/5 backdrop-blur-sm text-[10px] text-neutral-300"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Link
                to={`${linkPrefix}/${anime.slug}`}
                className="
                  inline-flex items-center justify-center gap-2
                  h-10 px-6 md:px-8 rounded-lg
                  bg-white text-black
                  text-sm font-semibold shadow-lg
                  hover:bg-gray-100 active:scale-95
                  transition-all duration-200
                "
              >
                <Play className="h-4 w-4 fill-black" />
                Watch Now
              </Link>
            </div>
          </div>
        </div>

        {/* Pagination dots (pill style) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
          {spotlights.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/65"
              }`}
              onClick={() => {
                setCurrentSlide(i);
                setIsAutoPlaying(false);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HindiHeroSection;
