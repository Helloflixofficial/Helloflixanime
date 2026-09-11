import { Compass, ExternalLink, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { AnimeBasic } from "@/types/anime";

export default function AniVexaHomeRail({ animeList = [], loading = false }: { animeList?: AnimeBasic[]; loading?: boolean }) {
  if (loading || animeList.length === 0) return null;

  return (
    <section className="mx-auto my-5 max-w-7xl px-3 sm:px-4 md:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card/60 to-background p-5 shadow-[0_12px_40px_hsl(var(--primary)/0.08)] md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Zap className="h-3.5 w-3.5" /> AniVexa streaming
            </div>
            <h2 className="text-xl font-black tracking-tight md:text-2xl">Fast multi-provider anime playback</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The home catalog stays familiar, while AniVexa supplies the streaming routes and providers behind the player.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {['ReAnime', 'AniKoto', 'AnimeGG', 'AniNeko', 'AniDB'].map((provider) => (
                <span key={provider} className="rounded-full border border-border/50 bg-background/40 px-2.5 py-1">{provider}</span>
              ))}
            </div>
          </div>
          <Link to="/anivexa" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110">
            <Compass className="h-4 w-4" /> Open AniVexa Player <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
