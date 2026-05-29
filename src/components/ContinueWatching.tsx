import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, History } from "lucide-react";
import { getContinueWatching } from "@/services/userDataService";
import { supabase } from "@/integrations/supabase/client";

interface WatchItem {
  id: string;
  anime_id: string;
  anime_title: string;
  anime_image: string | null;
  episode_no: number;
  progress: number;
  duration: number;
}

const ContinueWatching = () => {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session) loadData();
    });
  }, []);

  const loadData = async () => {
    const data = await getContinueWatching();
    setItems(data as WatchItem[]);
  };

  if (!user || items.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-md bg-primary/10">
          <History className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Continue Watching
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((item) => {
          const progressPercent = item.duration > 0 ? Math.min((item.progress / item.duration) * 100, 100) : 0;

          return (
            <Link
              key={item.id}
              to={`/watch/${item.anime_id}?ep=${item.episode_no}`}
              className="group relative overflow-hidden rounded-lg border border-border/20 hover:border-primary/30 transition-all hover:shadow-lg"
            >
              <div className="aspect-[3/4] relative">
                <img
                  src={item.anime_image || "/placeholder.svg"}
                  alt={item.anime_title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  width={200}
                  height={266}
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2.5 rounded-full bg-primary/90 text-primary-foreground">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                </div>
                {/* Episode badge */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 text-foreground font-medium backdrop-blur-sm">
                    EP {item.episode_no}
                  </span>
                </div>
                {/* Gradient */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/60 to-transparent h-1/3" />
                {/* Title */}
                <div className="absolute bottom-0 inset-x-0 p-2">
                  <p className="text-[11px] font-medium line-clamp-2 text-foreground">{item.anime_title}</p>
                </div>
              </div>
              {/* Progress bar */}
              {progressPercent > 0 && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-muted/50">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatching;
