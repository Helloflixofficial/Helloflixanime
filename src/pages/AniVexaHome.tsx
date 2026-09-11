import { useEffect, useMemo, useState } from "react";
import { Clock3, Flame, Layers3, Loader2, Play, Sparkles, Tv2, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import AnimeSectionGrid from "@/components/AnimeSectionGrid";
import AniVexaHero from "@/components/AniVexaHero";
import { ANIVEXA_PROVIDERS, getAniVexaCapabilities } from "@/services/anivexaApi";
import { getAniVexaHomeCatalog, getAniVexaRecentlyAdded, type AniVexaHomeCatalog } from "@/services/anilistCatalog";
import type { AnimeBasic } from "@/types/anime";

const emptyCatalog: AniVexaHomeCatalog = { trending: [], latest: [], newAnime: [] };

const AniVexaHome = () => {
  const [catalog, setCatalog] = useState<AniVexaHomeCatalog>(emptyCatalog);
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([getAniVexaHomeCatalog(1, 18), getAniVexaCapabilities()]).then(async ([catalogResult, capabilitiesResult]) => {
      if (!active) return;
      if (catalogResult.status === "fulfilled") {
        setCatalog(catalogResult.value);
      } else {
        try {
          const fallback = await getAniVexaRecentlyAdded(1);
          if (!active) return;
          const fallbackList = fallback.data;
          setCatalog({ trending: fallbackList, latest: fallbackList, newAnime: fallbackList });
          setCatalogError("AniList is temporarily unavailable; showing the latest available catalog.");
        } catch {
          setCatalogError("The anime catalog is temporarily unavailable. Try refreshing in a moment.");
        }
      }
      if (capabilitiesResult.status === "fulfilled") setProviders(capabilitiesResult.value.providers);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const heroAnime = useMemo(() => catalog.trending.slice(0, 8), [catalog.trending]);
  const allProviders = providers.length ? providers : [...ANIVEXA_PROVIDERS];
  const totalTitles = new Set([...catalog.trending, ...catalog.latest, ...catalog.newAnime].map((anime) => anime.id)).size;
  const infoAnime: AnimeBasic | undefined = heroAnime[0] || catalog.latest[0];

  return (
    <div className="min-h-screen pb-12">
      <AniVexaHero animeList={heroAnime} loading={loading} />

      <section className="mx-auto -mt-1 max-w-7xl px-3 sm:px-4 md:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/15 via-card/70 to-card/30 p-4 shadow-lg shadow-primary/5 md:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {infoAnime?.poster && <img src={infoAnime.poster} alt="" className="hidden h-20 w-14 rounded-lg object-cover shadow-xl sm:block" />}
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Anime info banner</div>
                <h2 className="truncate text-lg font-black text-foreground md:text-xl">{infoAnime?.title || "Your AniVexa anime hub"}</h2>
                <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-muted-foreground">{infoAnime?.description || "Browse trending, recently updated, and new anime, then watch with AniVexa's provider network."}</p>
              </div>
            </div>
            {infoAnime && <Link to={`/anivexa/${infoAnime.id}?provider=reanime&type=sub&ep=1`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"><Play className="h-4 w-4 fill-current" /> Play with AniVexa</Link>}
          </div>
        </div>
      </section>

      {catalogError && <div className="mx-auto mt-5 max-w-7xl px-3 text-center text-xs text-muted-foreground sm:px-4 md:px-6 lg:px-10">{catalogError}</div>}

      <section className="mx-auto mt-6 grid max-w-7xl gap-3 px-3 sm:grid-cols-3 sm:px-4 md:px-6 lg:px-10">
        <div className="rounded-xl border border-border/50 bg-card/40 p-4"><div className="flex items-center gap-2 text-primary"><Flame className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Trending</span></div><p className="mt-2 text-2xl font-black">{catalog.trending.length || "—"}</p><p className="text-xs text-muted-foreground">spotlight titles</p></div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4"><div className="flex items-center gap-2 text-primary"><Wifi className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Providers</span></div><p className="mt-2 text-2xl font-black">{allProviders.length}</p><p className="text-xs text-muted-foreground">AniVexa sources available</p></div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4"><div className="flex items-center gap-2 text-primary"><Layers3 className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Catalog</span></div><p className="mt-2 text-2xl font-black">{totalTitles || "—"}</p><p className="text-xs text-muted-foreground">unique titles loaded</p></div>
      </section>

      <div className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-2 px-3 text-[10px] text-muted-foreground sm:px-4 md:px-6 lg:px-10">
        <span className="mr-1 inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-foreground"><Tv2 className="h-3.5 w-3.5 text-primary" /> Multi-server network</span>
        {allProviders.map((provider) => <span key={provider} className="rounded-full border border-border/50 bg-card/30 px-2.5 py-1 capitalize">{provider}</span>)}
      </div>

      <div className="mx-auto mt-2 max-w-7xl px-3 sm:px-4 md:px-6 lg:px-10"><div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" /></div>

      <AnimeSectionGrid title="Trending anime" subtitle="What viewers are watching now" icon={Flame} animeList={catalog.trending} loading={loading} limit={18} linkPrefix="/anivexa" />
      <AnimeSectionGrid title="Latest updates" subtitle="Recently updated anime and episodes" icon={Clock3} animeList={catalog.latest} loading={loading} limit={18} linkPrefix="/anivexa" />
      <AnimeSectionGrid title="New anime" subtitle="Fresh titles to add to your watchlist" icon={Sparkles} animeList={catalog.newAnime} loading={loading} limit={18} linkPrefix="/anivexa" />

      {!loading && !catalog.trending.length && !catalog.latest.length && !catalog.newAnime.length && <div className="mx-auto mt-12 max-w-xl px-4 text-center"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">No catalog titles are available right now.</p></div>}
    </div>
  );
};

export default AniVexaHome;
