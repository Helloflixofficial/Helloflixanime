import { useEffect, useMemo, useState } from "react";
import { Film, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AnimeCard from "@/components/AnimeCard";
import HindiHeroSection from "@/components/HindiHeroSection";
import { fetchHindiHome, searchHindiAnime, type HindiAnimeItem } from "@/services/hindiApi";

export default function Hindi() {
  const [home, setHome] = useState<HindiAnimeItem[]>([]);
  const [results, setResults] = useState<HindiAnimeItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchHindiHome().then(setHome).catch((error) => console.error("Hindi catalog failed", error)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); setSearching(false); return; }
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchHindiAnime(trimmed).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const items = useMemo(() => query.trim().length >= 2 ? results : home, [home, query, results]);
  const heroItems = query.trim().length >= 2 ? [] : home;

  return (
    <div className="min-h-screen pb-12">
      <HindiHeroSection animeList={heroItems} loading={loading} />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/35 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Hindi Anime</p><h2 className="mt-1 text-xl font-bold">Hindi Dubbed Anime</h2></div>
          <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Hindi anime..." className="h-10 pl-9 bg-background/60" /></div>
        </div>
        {searching && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>}
        {!searching && items.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{items.slice(query ? 0 : 10).map((item) => <AnimeCard key={item.slug} id={item.slug} title={item.title} image={item.thumbnail} subtitle="HINDI" isDubbed linkPrefix="/hindi" />)}</div>}
        {!loading && !searching && items.length === 0 && <div className="flex flex-col items-center py-20 text-center text-muted-foreground"><Film className="mb-3 h-10 w-10 opacity-40" /><p>No Hindi anime found.</p></div>}
      </div>
    </div>
  );
}
