import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Play, Star, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnimeBasic } from "@/types/anime";

interface AniVexaHeroProps {
  animeList: AnimeBasic[];
  loading?: boolean;
}

const AniVexaHero = ({ animeList, loading = false }: AniVexaHeroProps) => {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    setCurrent((index) => Math.min(index, Math.max(animeList.length - 1, 0)));
  }, [animeList.length]);

  useEffect(() => {
    if (!autoPlay || animeList.length < 2) return;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % animeList.length), 6500);
    return () => window.clearInterval(timer);
  }, [animeList.length, autoPlay]);

  const move = useCallback((direction: number) => {
    if (animeList.length === 0) return;
    setCurrent((index) => (index + direction + animeList.length) % animeList.length);
    setAutoPlay(false);
  }, [animeList.length]);

  if (loading) {
    return <section className="px-3 py-4 sm:px-4 md:px-6 lg:px-10"><Skeleton className="h-[430px] w-full rounded-3xl md:h-[540px]" /></section>;
  }

  if (!animeList.length) return null;
  const anime = animeList[current];
  const year = anime.tvInfo?.releaseDate?.match(/\d{4}/)?.[0];
  const score = anime.score ? anime.score.toFixed(1) : undefined;

  return (
    <section className="px-3 py-4 sm:px-4 md:px-6 lg:px-10">
      <div className="relative isolate h-[430px] overflow-hidden rounded-3xl border border-white/10 bg-[#080a12] shadow-2xl shadow-primary/10 md:h-[540px]">
        <img src={anime.banner || anime.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl" />
        <img src={anime.banner || anime.poster} alt={anime.title} className="absolute inset-0 h-full w-full object-cover object-center opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060b] via-[#05060b]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060b] via-transparent to-black/20" />

        <div className="absolute left-5 top-5 right-5 flex items-center justify-between md:left-8 md:top-8 md:right-8">
          <span className="rounded-full border border-primary/40 bg-primary/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground backdrop-blur-md">AniVexa spotlight</span>
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-medium text-white/75 backdrop-blur-md">Live multi-provider playback</span>
        </div>

        <div className="absolute bottom-10 left-5 z-10 max-w-xl md:bottom-14 md:left-10">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-white/80">
            {year && <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1">{year}</span>}
            {anime.tvInfo?.showType && <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1"><Tv className="h-3 w-3" /> {anime.tvInfo.showType}</span>}
            {score && <span className="inline-flex items-center gap-1 rounded-md border border-yellow-400/30 bg-yellow-400/15 px-2 py-1 text-yellow-300"><Star className="h-3 w-3 fill-current" /> {score}</span>}
          </div>
          <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg md:text-5xl">{anime.title}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(anime.genres || []).slice(0, 4).map((genre) => <span key={genre} className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/75">{genre}</span>)}
          </div>
          <p className="mt-3 line-clamp-2 max-w-2xl text-xs leading-5 text-white/70 md:text-sm">{anime.description || "Discover this anime with AniVexa's multi-provider player."}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/anivexa/${anime.id}?provider=reanime&type=sub&ep=1`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110"><Play className="h-4 w-4 fill-current" /> Watch now</Link>
            <Link to={`/anime/${anime.id}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"><Info className="h-4 w-4" /> Anime info</Link>
          </div>
        </div>

        <div className="absolute bottom-5 right-5 z-10 hidden items-end gap-2 lg:flex">
          {animeList.slice(0, 5).map((item, index) => <button key={item.id} type="button" aria-label={`Show ${item.title}`} onClick={() => { setCurrent(index); setAutoPlay(false); }} className={`h-16 w-12 overflow-hidden rounded-lg border-2 transition ${index === current ? "scale-110 border-primary opacity-100" : "border-white/20 opacity-60 hover:opacity-100"}`}><img src={item.poster} alt="" className="h-full w-full object-cover" /></button>)}
        </div>
        {animeList.length > 1 && <>
          <button type="button" aria-label="Previous spotlight" onClick={() => move(-1)} className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/60 md:flex"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Next spotlight" onClick={() => move(1)} className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/60 md:flex"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 lg:hidden">{animeList.slice(0, 8).map((item, index) => <button key={item.id} type="button" aria-label={`Show spotlight ${index + 1}`} onClick={() => { setCurrent(index); setAutoPlay(false); }} className={`h-1.5 rounded-full transition-all ${index === current ? "w-6 bg-primary" : "w-1.5 bg-white/50"}`} />)}</div>
        </>}
      </div>
    </section>
  );
};

export default AniVexaHero;
