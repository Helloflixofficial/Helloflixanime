import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Info, ChevronLeft, ChevronRight, Star, Tv } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeData } from "@/services/animeApi";
import type { AnimeBasic } from "@/types/anime";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const [spotlights, setSpotlights] = useState<AnimeBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { t } = useTranslation();
  const touchRef = useRef<{ startX: number; startY: number } | null>(null);

  /* ── Data fetch ── */
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const data = await getHomeData();
        setSpotlights(data.spotlights || []);
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  /* ── Auto-play ── */
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

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <section className="w-full px-2 sm:px-4 md:px-6 lg:px-10 py-2 md:py-3">
        <Skeleton className="w-full rounded-2xl h-[320px] md:h-[460px] lg:h-[560px]" />
      </section>
    );
  }

  if (spotlights.length === 0) return null;

  const anime = spotlights[currentSlide];
  const accentRaw = anime?.accentColor || "#6366f1";
  // Make a softer version for backgrounds
  const genres = anime?.genres?.slice(0, 3) || [];
  const score = anime?.score;
  const showType = anime?.tvInfo?.showType;
  const eps = anime?.tvInfo?.eps;

  return (
    <section className="w-full px-2 sm:px-4 md:px-6 lg:px-10 py-2 md:py-3">
      {/* ── Card wrapper ── */}
      <div
        className="relative w-full overflow-hidden rounded-2xl select-none touch-pan-y
                   h-[320px] sm:h-[400px] md:h-[480px] lg:h-[560px]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { touchRef.current = null; }}
      >
        {/* ── Background images (cross-fade layers) ── */}
        {spotlights.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Blurred atmospheric background */}
            <img
              src={s.banner || s.poster}
              alt=""
              loading="lazy"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 select-none pointer-events-none"
            />
            {/* Main hero image — cover fills the full hero area */}
            <img
              src={s.banner || s.poster}
              alt={s.title}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              width={1400}
              height={560}
              className="relative w-full h-full object-cover object-center z-[1]"
            />
          </div>
        ))}

        {/* ── Accent color glow at bottom (uses the anime's brand color) ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 z-[2] pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${accentRaw}22 0%, transparent 100%)`,
          }}
        />

        {/* ── Gradient overlays ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-transparent z-[2]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent z-[2]" />

        {/* ── Left arrow ── */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="
            hidden md:inline-flex items-center justify-center
            absolute left-4 top-1/2 -translate-y-1/2 z-50
            h-10 w-10 rounded-full
            border border-white/20
            bg-black/40 backdrop-blur-sm
            hover:bg-black/65 hover:border-white/40 transition-all duration-200
          "
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>

        {/* ── Right arrow ── */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="
            hidden md:inline-flex items-center justify-center
            absolute right-4 top-1/2 -translate-y-1/2 z-50
            h-10 w-10 rounded-full
            border border-white/20
            bg-black/40 backdrop-blur-sm
            hover:bg-black/65 hover:border-white/40 transition-all duration-200
          "
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>

        {/* ── Content ── */}
        <div
          className="
            absolute z-[3]
            left-0 bottom-10 sm:bottom-14 md:bottom-16
            px-5 sm:px-8 md:px-12
            w-full md:w-[65%] lg:w-[55%]
          "
        >
          {/* Season badge */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest border backdrop-blur-sm"
              style={{ borderColor: `${accentRaw}55`, color: accentRaw, background: `${accentRaw}18` }}
            >
              🌸 Spring 2026
            </span>

            {showType && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-white/15 bg-white/8 backdrop-blur-sm text-white/80">
                <Tv className="h-3 w-3" />
                {showType}
              </span>
            )}

            {eps && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-white/15 bg-white/8 backdrop-blur-sm text-white/80">
                {eps} eps
              </span>
            )}

            {score && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border border-yellow-500/30 bg-yellow-500/15 backdrop-blur-sm text-yellow-400">
                <Star className="h-3 w-3 fill-yellow-400" />
                {(score / 10).toFixed(1)}
              </span>
            )}
          </div>

          {/* Logo image OR stylized title */}
          {anime.logo ? (
            <img
              src={anime.logo}
              alt={anime.title}
              loading="lazy"
              className="mb-2 max-h-[64px] sm:max-h-[80px] md:max-h-[100px] w-auto max-w-[260px] sm:max-w-[360px] md:max-w-[480px] object-contain object-left drop-shadow-[0_3px_16px_rgba(0,0,0,0.9)]"
            />
          ) : (
            <h1
              className="mb-2 font-black tracking-tight text-white leading-[1.1]
                text-2xl sm:text-3xl md:text-4xl lg:text-5xl
                drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            >
              {anime.title}
            </h1>
          )}

          {/* Genre pills */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {genres.map((g) => (
                <span
                  key={g}
                  className="rounded-md px-2 py-0.5 text-[10px] font-medium border border-white/10 bg-white/8 text-white/70 backdrop-blur-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {anime.description && (
            <p className="mb-4 max-w-lg text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2 sm:line-clamp-3">
              {anime.description}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap">
            <Link
              to={`/watch/${anime.id}`}
              className="
                inline-flex items-center justify-center gap-2
                h-10 sm:h-11 px-6 sm:px-8 rounded-xl
                font-bold text-sm text-black shadow-xl
                active:scale-95 transition-all duration-200
              "
              style={{ background: accentRaw || "#fff" }}
            >
              <Play className="h-4 w-4 fill-current" />
              {t("hero.watchNow")}
            </Link>

            <Link
              to={`/anime/${anime.id}`}
              className="
                inline-flex items-center justify-center gap-2
                h-10 sm:h-11 px-6 sm:px-8 rounded-xl
                bg-white/10 backdrop-blur-sm
                border border-white/20
                text-white text-sm font-medium
                hover:bg-white/20 active:scale-95
                transition-all duration-200
              "
            >
              <Info className="h-4 w-4" />
              Details
            </Link>
          </div>
        </div>

        {/* ── Thumbnail strip (desktop) ── */}
        <div className="hidden lg:flex absolute right-5 top-1/2 -translate-y-1/2 z-[4] flex-col gap-2">
          {spotlights.slice(0, 5).map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setCurrentSlide(i); setIsAutoPlaying(false); }}
              className={`relative w-14 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                i === currentSlide
                  ? "border-white/80 scale-105 shadow-lg"
                  : "border-white/15 opacity-60 hover:opacity-90 hover:border-white/35"
              }`}
            >
              <img
                src={s.poster}
                alt={s.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* ── Pagination dots ── */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 items-center lg:hidden">
          {spotlights.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/35 hover:bg-white/60"
              }`}
              onClick={() => { setCurrentSlide(i); setIsAutoPlaying(false); }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
