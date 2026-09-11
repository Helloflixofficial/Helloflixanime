import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import type { HindiAnimeItem } from "@/services/hindiApi";

export default function HindiHeroSection({ animeList, loading = false }: { animeList: HindiAnimeItem[]; loading?: boolean }) {
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const touch = useRef<number | null>(null);
  const slides = animeList.slice(0, 10);

  useEffect(() => {
    if (!autoPlay || slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [autoPlay, slides.length]);

  const move = useCallback((direction: number) => {
    if (!slides.length) return;
    setIndex((current) => (current + direction + slides.length) % slides.length);
    setAutoPlay(false);
  }, [slides.length]);

  if (loading) return <section className="px-3 md:px-6 py-4"><Skeleton className="h-[300px] md:h-[440px] w-full rounded-3xl" /></section>;
  if (!slides.length) return null;

  const active = slides[index];
  return (
    <section className="px-3 md:px-6 py-4">
      <div
        className="relative isolate h-[300px] overflow-hidden rounded-3xl border border-primary/15 bg-black shadow-2xl shadow-primary/10 md:h-[440px]"
        onPointerDown={(event) => { touch.current = event.clientX; }}
        onPointerUp={(event) => {
          if (touch.current === null) return;
          const delta = event.clientX - touch.current;
          touch.current = null;
          if (Math.abs(delta) > 50) move(delta > 0 ? -1 : 1);
        }}
      >
        {slides.map((slide, slideIndex) => (
          <div key={slide.slug} className={`absolute inset-0 transition-opacity duration-700 ${slideIndex === index ? "opacity-100" : "opacity-0"}`}>
            <img src={slide.thumbnail} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-40" />
            <img src={slide.thumbnail} alt={slide.title} className="relative h-full w-full object-cover object-center" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
        <button type="button" aria-label="Previous Hindi anime" onClick={() => move(-1)} className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur md:flex"><ChevronLeft /></button>
        <button type="button" aria-label="Next Hindi anime" onClick={() => move(1)} className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur md:flex"><ChevronRight /></button>
        <div className="absolute bottom-10 left-5 z-10 max-w-xl md:bottom-14 md:left-10">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300"><Zap className="h-3 w-3" /> Hindi Dubbed</span>
          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-2xl md:text-5xl">{active.title}</h1>
          <p className="mt-2 max-w-lg text-xs text-white/65 md:text-sm">Watch anime in Hindi with multiple servers and a fast episode list.</p>
          <Link to={`/hindi/${active.slug}`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black transition hover:bg-primary hover:text-white"><Play className="h-4 w-4 fill-current" /> Watch now</Link>
        </div>
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {slides.map((slide, slideIndex) => <button key={slide.slug} type="button" aria-label={`Hindi slide ${slideIndex + 1}`} onClick={() => { setIndex(slideIndex); setAutoPlay(false); }} className={`h-2 rounded-full transition-all ${slideIndex === index ? "w-7 bg-white" : "w-2 bg-white/35"}`} />)}
        </div>
      </div>
    </section>
  );
}
