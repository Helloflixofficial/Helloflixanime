import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Compass, Loader2, Play, Search, Server, Sparkles, Star } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AnimeSectionGrid from "@/components/AnimeSectionGrid";
import {
  ANIVEXA_PROVIDERS,
  getAniVexaCapabilities,
  getAniVexaEpisodesWithFallback,
  getAniVexaWatchUrl,
  resolveAniVexaPlayback,
  type AniVexaEpisode,
  type AniVexaMode,
  type AniVexaPlayback,
  type AniVexaProvider,
} from "@/services/anivexaApi";
import { getAniVexaAnimeInfo, type AniVexaAnimeInfo } from "@/services/anilistCatalog";
import AniVexaVideo from "@/components/player/AniVexaVideo";

interface AniVexaControlsProps {
  anilistId: string;
  provider: AniVexaProvider;
  mode: AniVexaMode;
  capabilities: { name: string; providers: string[]; routes: string[] } | null;
  onIdChange: (value: string) => void;
  onProviderChange: (provider: AniVexaProvider) => void;
  onModeChange: (mode: AniVexaMode) => void;
  onSubmit: (event: FormEvent) => void;
}

const AniVexaControls = ({
  anilistId,
  provider,
  mode,
  capabilities,
  onIdChange,
  onProviderChange,
  onModeChange,
  onSubmit,
}: AniVexaControlsProps) => (
  <section className="mt-4 rounded-2xl border border-border/50 bg-card/40 p-3 md:p-4">
    <form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_110px_auto]">
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={anilistId} onChange={(event) => onIdChange(event.target.value)} placeholder="AniList ID" aria-label="AniList ID" className="h-10 border-border/50 bg-background/50 pl-10" /></div>
      <select aria-label="AniVexa provider" value={provider} onChange={(event) => onProviderChange(event.target.value as AniVexaProvider)} className="h-10 rounded-md border border-border/50 bg-background/50 px-3 text-sm text-foreground">{ANIVEXA_PROVIDERS.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select aria-label="Audio mode" value={mode} onChange={(event) => onModeChange(event.target.value as AniVexaMode)} className="h-10 rounded-md border border-border/50 bg-background/50 px-3 text-sm text-foreground"><option value="sub">Sub</option><option value="dub">Dub</option></select>
      <Button type="submit" className="h-10 gap-2"><Play className="h-4 w-4 fill-current" /> Load</Button>
    </form>
    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1.5">{capabilities ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Server className="h-3.5 w-3.5" />} {capabilities ? "AniVexa connected" : "Connecting to AniVexa..."}</span><span>{capabilities?.providers.length || ANIVEXA_PROVIDERS.length} providers</span></div>
  </section>
);

export default function AniVexaPage() {
  const { id: pathId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [anilistId, setAnilistId] = useState(pathId || params.get("id") || "");
  const [provider, setProvider] = useState<AniVexaProvider>((params.get("provider") as AniVexaProvider) || "reanime");
  const [mode, setMode] = useState<AniVexaMode>((params.get("type") as AniVexaMode) || "sub");
  const [episode, setEpisode] = useState(Number(params.get("ep") || 1));
  const [episodes, setEpisodes] = useState<AniVexaEpisode[]>([]);
  const [capabilities, setCapabilities] = useState<{ name: string; providers: string[]; routes: string[] } | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  const [playback, setPlayback] = useState<AniVexaPlayback | null>(null);
  const [selectedServer, setSelectedServer] = useState(0);
  const [error, setError] = useState("");
  const [episodeError, setEpisodeError] = useState("");
  const [animeInfo, setAnimeInfo] = useState<AniVexaAnimeInfo | null>(null);
  const [loadingAnimeInfo, setLoadingAnimeInfo] = useState(false);
  const [started, setStarted] = useState(Boolean(pathId || params.get("id")));
  const lookupId = pathId || anilistId.trim();
  const routeProviderParam = params.get("provider");
  const routeModeParam = params.get("type");

  useEffect(() => {
    if (pathId) {
      const requestedProvider = routeProviderParam as AniVexaProvider | null;
      const requestedMode = routeModeParam === "dub" ? "dub" : "sub";
      setAnilistId(pathId);
      setStarted(true);
      setProvider(requestedProvider && ANIVEXA_PROVIDERS.includes(requestedProvider) ? requestedProvider : "reanime");
      setMode(requestedMode);
      setEpisodes([]);
      setEpisode(1);
      setEpisodeError("");
      setPlayback(null);
      setError("");
      setAnimeInfo(null);
      setSelectedServer(0);
    }
  }, [pathId, routeModeParam, routeProviderParam]);

  useEffect(() => {
    getAniVexaCapabilities().then(setCapabilities).catch(() => setCapabilities(null));
  }, []);

  useEffect(() => {
    if (!started || !lookupId) {
      setAnimeInfo(null);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setLoadingAnimeInfo(true);
      getAniVexaAnimeInfo(lookupId)
        .then((result) => { if (active) setAnimeInfo(result); })
        .catch(() => { if (active) setAnimeInfo(null); })
        .finally(() => { if (active) setLoadingAnimeInfo(false); });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [lookupId, started]);

  useEffect(() => {
    if (!lookupId) {
      setEpisodes([]);
      return;
    }
    let active = true;
    setLoadingEpisodes(true);
    setEpisodeError("");
    getAniVexaEpisodesWithFallback(lookupId, provider, mode)
      .then(({ episodes: items, provider: resolvedProvider }) => {
        if (!active) return;
        if (resolvedProvider !== provider) setProvider(resolvedProvider);
        setEpisodes(items);
        setEpisode((current) => items.some((item) => item.number === current) ? current : items[0]?.number || 1);
      })
      .catch((reason: Error) => {
        if (!active) return;
        setEpisodes([]);
        setEpisodeError(reason.message || `No ${mode.toUpperCase()} episodes are available on ${provider}.`);
      })
      .finally(() => { if (active) setLoadingEpisodes(false); });
    return () => { active = false; };
  }, [lookupId, mode, provider]);

  const currentEpisode = useMemo(
    () => episodes.find((item) => item.number === episode),
    [episodes, episode],
  );

  const watchUrl = useMemo(() => {
    if (!started || !lookupId || !currentEpisode?.id) return "";
    return getAniVexaWatchUrl({ provider, anilistId: lookupId, mode, episode, episodeId: currentEpisode.id });
  }, [currentEpisode?.id, episode, lookupId, mode, provider, started]);

  useEffect(() => {
    if (!watchUrl) {
    setPlayback(null);
      setError("");
      return;
    }
    let active = true;
    setLoadingPlayback(true);
    setPlayback(null);
    setSelectedServer(0);
    setError("");
    resolveAniVexaPlayback({ provider, anilistId: lookupId, mode, episode, episodeId: currentEpisode?.id })
      .then((result) => { if (active) setPlayback(result); })
      .catch((reason: Error) => { if (active) setError(reason.message || "This AniVexa server did not return a playable video."); })
      .finally(() => { if (active) setLoadingPlayback(false); });
    return () => { active = false; };
  }, [currentEpisode?.id, episode, lookupId, mode, provider, watchUrl]);

  const activeServer = playback?.servers[selectedServer];
  const activeSourceUrl = activeServer?.embed || activeServer?.url || playback?.url || "";
  const activeSourceKind = activeServer?.embed ? "embed" : activeServer?.url ? "media" : playback?.kind;
  const handlePlaybackError = useCallback(() => {
    if (playback && selectedServer < playback.servers.length - 1) {
      setSelectedServer((current) => current + 1);
      setError("");
      return;
    }
    setError("This AniVexa server could not play the video. Choose another server below.");
  }, [playback, selectedServer]);

  const startPlayer = (event: FormEvent) => {
    event.preventDefault();
    const nextId = anilistId.trim();
    if (!nextId) return;
    const next = new URLSearchParams(params);
    next.set("id", nextId);
    next.set("provider", provider);
    next.set("type", mode);
    next.set("ep", String(episode || 1));
    navigate(`/anivexa/${encodeURIComponent(nextId)}?${next.toString()}`);
    setStarted(true);
  };

  const selectEpisode = (number: number) => {
    setEpisode(number);
    const next = new URLSearchParams(params);
    next.set("ep", String(number));
    setParams(next, { replace: true });
  };

  const selectProvider = (nextProvider: AniVexaProvider) => {
    setProvider(nextProvider);
    setEpisodes([]);
    setEpisodeError("");
    setPlayback(null);
    setError("");
    setSelectedServer(0);
    const next = new URLSearchParams(params);
    next.set("provider", nextProvider);
    setParams(next, { replace: true });
  };

  const selectMode = (nextMode: AniVexaMode) => {
    setMode(nextMode);
    setEpisodes([]);
    setEpisodeError("");
    setPlayback(null);
    setError("");
    setSelectedServer(0);
    const next = new URLSearchParams(params);
    next.set("type", nextMode);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen pb-12">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {watchUrl ? <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <section className="overflow-hidden rounded-2xl border border-border/50 bg-black shadow-2xl">
              <div className="relative aspect-video">
                {loadingPlayback && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black text-sm text-white/70"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading {provider} first...</div>}
                {!loadingPlayback && activeSourceKind === "embed" && activeSourceUrl && <iframe key={activeSourceUrl} src={activeSourceUrl} title={`AniVexa ${provider} episode ${episode}`} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" />}
                {!loadingPlayback && activeSourceKind === "media" && activeSourceUrl && <AniVexaVideo key={activeSourceUrl} src={activeSourceUrl} title={`AniVexa ${provider} episode ${episode}`} onError={handlePlaybackError} />}
                {!loadingPlayback && !playback && <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">This server did not return a playable source. Choose another server below.</div>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-card/60 p-3 text-sm"><span className="text-muted-foreground">{provider} · {activeServer?.name || "Server 1"} · {mode.toUpperCase()} · Episode {episode}</span><a href={activeSourceUrl || watchUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open source</a></div>
            </section>
            <AniVexaControls anilistId={anilistId} provider={provider} mode={mode} capabilities={capabilities} onIdChange={setAnilistId} onProviderChange={selectProvider} onModeChange={selectMode} onSubmit={startPlayer} />
          </div>

          <aside className="rounded-2xl border border-border/50 bg-card/40 p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Providers</h2>{loadingPlayback && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</div>
            <div className="mb-5 grid grid-cols-2 gap-2">{ANIVEXA_PROVIDERS.map((item) => <button key={item} type="button" onClick={() => selectProvider(item)} className={cn("rounded-lg border px-2 py-2 text-xs capitalize transition", item === provider ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground")}>{item}</button>)}</div>
            {playback?.servers && playback.servers.length > 0 && <><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Video servers</h2><span className="text-xs text-muted-foreground">{playback.servers.length} found</span></div><div className="mb-5 grid grid-cols-2 gap-2">{playback.servers.map((server, index) => <button key={`${server.name}-${index}`} type="button" onClick={() => { setSelectedServer(index); setError(""); }} className={cn("rounded-lg border px-2 py-2 text-xs transition", index === selectedServer ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground")}>{server.name}</button>)}</div></>}
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Episodes</h2>{loadingEpisodes && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</div>
            {episodes.length > 0 ? <div className="grid max-h-[300px] grid-cols-4 gap-2 overflow-y-auto pr-1">{episodes.map((item) => <button key={`${item.id}-${item.number}`} type="button" onClick={() => selectEpisode(item.number)} className={cn("rounded-lg border px-2 py-2 text-xs", item.number === episode ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground hover:text-foreground")}>{item.number}</button>)}</div> : <p className="text-xs leading-5 text-muted-foreground">Episode metadata loads separately. The first server starts without waiting for this list.</p>}
          </aside>
        </div> : started ? <div><AniVexaControls anilistId={anilistId} provider={provider} mode={mode} capabilities={capabilities} onIdChange={setAnilistId} onProviderChange={selectProvider} onModeChange={selectMode} onSubmit={startPlayer} /><div className="mt-5 rounded-2xl border border-border/50 bg-card/40 p-8 text-center">
          {loadingEpisodes ? <><Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" /><h2 className="text-xl font-bold">Loading episode route</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">AniVexa is checking {provider} for {mode.toUpperCase()} episodes.</p></> : <><AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-400" /><h2 className="text-xl font-bold">This provider has no playable episode</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{episodeError || `AniVexa returned no ${mode.toUpperCase()} episode data for this AniList ID.`} Choose another provider above or verify the AniList ID.</p></>}
        </div></div> : <div className="rounded-2xl border border-border/50 bg-card/40 p-8 text-center"><Compass className="mx-auto mb-3 h-10 w-10 text-primary" /><h2 className="text-xl font-bold">Start AniVexa playback</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Enter an AniList ID above. AniVexa supplies playback and server routes, while your home and Hindi catalogs supply the titles.</p></div>}
        {error && <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

        {animeInfo && <section className="mt-8 overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-lg">
          <div className="relative h-32 overflow-hidden md:h-44">
            <img src={animeInfo.anime.banner || animeInfo.anime.poster} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-35 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 flex items-end gap-4 p-4 md:p-6">
              <img src={animeInfo.anime.poster} alt={animeInfo.anime.title} className="hidden h-28 w-20 rounded-lg object-cover shadow-xl sm:block md:h-36 md:w-24" />
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Anime information</div>
                <h2 className="line-clamp-1 text-xl font-black md:text-2xl">{animeInfo.anime.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {animeInfo.anime.tvInfo?.releaseDate && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {animeInfo.anime.tvInfo.releaseDate}</span>}
                  {animeInfo.anime.tvInfo?.showType && <span>{animeInfo.anime.tvInfo.showType}</span>}
                  {animeInfo.anime.score && <span className="inline-flex items-center gap-1 text-yellow-400"><Star className="h-3.5 w-3.5 fill-current" /> {animeInfo.anime.score.toFixed(1)}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-4 md:grid-cols-[1fr_260px] md:p-6">
            <div><p className="text-sm leading-6 text-muted-foreground">{animeInfo.anime.description || "No description is available for this anime yet."}</p>{animeInfo.anime.genres && <div className="mt-4 flex flex-wrap gap-2">{animeInfo.anime.genres.map((genre) => <span key={genre} className="rounded-full border border-border/50 bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">{genre}</span>)}</div>}</div>
            <div className="rounded-xl border border-border/50 bg-background/30 p-4 text-sm"><div className="mb-2 font-semibold">Watch details</div><div className="space-y-2 text-xs text-muted-foreground"><div className="flex justify-between gap-3"><span>Provider</span><span className="capitalize text-foreground">{provider}</span></div><div className="flex justify-between gap-3"><span>Audio</span><span className="uppercase text-foreground">{mode}</span></div><div className="flex justify-between gap-3"><span>Episode</span><span className="text-foreground">{episode}</span></div><div className="flex justify-between gap-3"><span>Servers</span><span className="text-foreground">{playback?.servers.length || 0}</span></div></div></div>
          </div>
        </section>}

        {loadingAnimeInfo && !animeInfo && <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading anime information…</div>}
        <AnimeSectionGrid title="You may also like" subtitle="Related anime and recommendations" icon={Sparkles} animeList={animeInfo?.related || []} loading={false} limit={12} linkPrefix="/anivexa" />
      </main>
    </div>
  );
}
