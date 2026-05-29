import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { X, CalendarDays } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AiringMedia {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { medium: string };
}

interface AiringEntry {
  airingAt: number;
  episode: number;
  media: AiringMedia;
}

const QUERY = `
query ($start: Int, $end: Int) {
  Page(perPage: 100) {
    airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
      airingAt
      episode
      media {
        id
        title { romaji english }
        coverImage { medium }
      }
    }
  }
}`;

const fetchSchedule = async (): Promise<AiringEntry[]> => {
  const now = Math.floor(Date.now() / 1000);
  const end = now + 7 * 86400;
  const { data } = await axios.post("https://graphql.anilist.co", {
    query: QUERY,
    variables: { start: now, end },
  });
  return data?.data?.Page?.airingSchedules || [];
};

const formatTime = (ts: number) => {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};

const getGmtOffset = () => {
  const off = -new Date().getTimezoneOffset();
  const h = Math.floor(Math.abs(off) / 60);
  const m = Math.abs(off) % 60;
  const sign = off >= 0 ? "+" : "-";
  return `GMT${sign}${h}${m ? `.${(m / 60) * 10}` : ""}`;
};

interface GroupedDay {
  label: string;
  weekday: string;
  entries: AiringEntry[];
}

const groupByDay = (entries: AiringEntry[]): GroupedDay[] => {
  const map = new Map<string, GroupedDay>();
  for (const e of entries) {
    const d = new Date(e.airingAt * 1000);
    const key = d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    if (!map.has(key)) {
      map.set(key, {
        label: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }).toUpperCase(),
        weekday: d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
        entries: [],
      });
    }
    map.get(key)!.entries.push(e);
  }
  return Array.from(map.values());
};

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return (
    <div className="text-center py-4 border-b border-sidebar-border">
      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl font-mono font-bold text-sidebar-foreground tracking-wider">{time}</span>
        <span className="text-xs text-muted-foreground mt-1">{getGmtOffset()}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">Release time is estimated</p>
    </div>
  );
};

const AiringSchedule = () => {
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["airing-schedule"],
    queryFn: fetchSchedule,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const grouped = useMemo(() => (data ? groupByDay(data) : []), [data]);

  // Listen for toggle event from header button
  useEffect(() => {
    const handler = () => setOpen(prev => !prev);
    window.addEventListener("toggle-schedule", handler);
    return () => window.removeEventListener("toggle-schedule", handler);
  }, []);

  // Mobile swipe-from-right to open
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (open) return;
    const touch = e.touches[0];
    // Only trigger from right 30px edge
    if (touch.clientX > window.innerWidth - 30) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }
  }, [open]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (open || touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const dx = touchStartX.current - touch.clientX;
    const dy = Math.abs(touchStartY.current - touch.clientY);
    // Swipe left from right edge (min 50px, mostly horizontal)
    if (dx > 50 && dy < dx) {
      setOpen(true);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [open]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <>
      {/* Edge tab: icon+text on sm+, icon-only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-0 top-[60%] sm:top-1/2 -translate-y-1/2 z-40 flex",
          "flex-col items-center justify-center gap-1",
          "bg-destructive text-destructive-foreground",
          "p-2 rounded-l-lg shadow-lg",
          "hover:px-2.5 transition-all duration-200",
          open && "!hidden"
        )}
        title="Airing Schedule"
      >
        <CalendarDays className="h-5 w-5" />
        <span
          className="text-[9px] font-bold tracking-wider uppercase hidden sm:block"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          SCHEDULE
        </span>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full z-50 bg-sidebar border-l border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
          "w-[300px] sm:w-[340px]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-sidebar-foreground tracking-wide">AIRING SCHEDULE</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <LiveClock />

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-4 pb-6">
            {isLoading ? (
              <div className="space-y-4 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-5 w-24 mb-2 bg-sidebar-accent" />
                    <Skeleton className="h-4 w-16 mb-3 bg-sidebar-accent" />
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-5 w-full mb-2 bg-sidebar-accent" />
                    ))}
                  </div>
                ))}
              </div>
            ) : grouped.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center mt-8">No upcoming episodes found.</p>
            ) : (
              grouped.map((day, i) => (
                <div key={i} className="mt-4">
                  <div className="mb-2">
                    <span className="text-sidebar-foreground font-bold text-sm">{day.label}</span>
                    <br />
                    <span className="text-destructive font-bold text-xs tracking-wider">{day.weekday}</span>
                  </div>
                  <div className="space-y-0">
                    {day.entries.map((entry, j) => (
                      <div
                        key={`${entry.media.id}-${entry.episode}-${j}`}
                        className="flex items-start gap-3 py-1.5 border-b border-sidebar-border/50 last:border-b-0"
                      >
                        <span className="text-muted-foreground text-xs font-mono w-[42px] flex-shrink-0 pt-0.5">
                          {formatTime(entry.airingAt)}
                        </span>
                        <span className="text-sidebar-foreground/90 text-xs leading-snug truncate">
                          {entry.media.title.english || entry.media.title.romaji} Ep - {entry.episode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default AiringSchedule;
