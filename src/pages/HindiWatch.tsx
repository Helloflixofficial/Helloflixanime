import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Monitor, Play } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHindiAnimeDetail, type HindiAnimeDetail, type HindiEpisode } from "@/services/hindiApi";
import { cn } from "@/lib/utils";

function EmbedPlayer({ url }: { url: string }) {
  return <iframe src={url} title="Hindi anime player" className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="no-referrer" />;
}

export default function HindiWatch() {
  const { slug } = useParams<{ slug: string }>();
  const [anime, setAnime] = useState<HindiAnimeDetail | null>(null);
  const [episode, setEpisode] = useState<HindiEpisode | null>(null);
  const [serverIndex, setServerIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchHindiAnimeDetail(slug).then((data) => { setAnime(data); setEpisode(data?.episodes[0] || null); }).catch(() => setAnime(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="space-y-5 p-4 md:p-8"><Skeleton className="h-8 w-48" /><Skeleton className="aspect-video max-w-5xl rounded-2xl" /></div>;
  if (!anime) return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground"><p>Hindi anime not found.</p><Button asChild variant="outline"><Link to="/hindi"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hindi</Link></Button></div>;

  const activeServer = episode?.servers[serverIndex] || episode?.servers[0];
  const episodes = showAll ? anime.episodes : anime.episodes.slice(0, 30);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <Link to="/hindi" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Hindi Anime</Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/50 bg-black shadow-2xl">{activeServer ? <EmbedPlayer url={activeServer.url} /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select an episode to start watching.</div>}</div>
          {episode && episode.servers.length > 0 && <div className="flex flex-wrap gap-2 rounded-xl border border-border/50 bg-card/40 p-3"><span className="mr-2 flex items-center text-xs text-muted-foreground"><Monitor className="mr-1.5 h-3.5 w-3.5" /> Servers</span>{episode.servers.map((server, index) => <Button key={server.url} size="sm" variant={index === serverIndex ? "default" : "outline"} onClick={() => setServerIndex(index)} className="h-8 text-xs">{server.name}</Button>)}</div>}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Hindi Anime</p><h1 className="text-2xl font-bold">{anime.title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{anime.description || "No description available."}</p></div>
        </div>
        <aside className="rounded-2xl border border-border/50 bg-card/40 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Episodes</h2><span className="text-xs text-muted-foreground">{anime.episodes.length} total</span></div><div className="grid max-h-[520px] grid-cols-4 gap-2 overflow-y-auto pr-1">{episodes.map((item) => <button key={item.number} type="button" onClick={() => { setEpisode(item); setServerIndex(0); }} className={cn("flex h-10 items-center justify-center rounded-lg border text-xs transition", episode?.number === item.number ? "border-primary bg-primary text-primary-foreground" : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground")}>{episode?.number === item.number && <Play className="mr-1 h-3 w-3 fill-current" />}{item.number}</button>)}</div>{anime.episodes.length > 30 && <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" onClick={() => setShowAll((value) => !value)}>{showAll ? <>Show less <ChevronUp className="ml-1 h-3 w-3" /></> : <>Show all episodes <ChevronDown className="ml-1 h-3 w-3" /></>}</Button>}</aside>
      </div>
    </div>
  );
}
