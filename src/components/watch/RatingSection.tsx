import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface RatingSectionProps {
  animeId: string;
}

const RatingSection = ({ animeId }: RatingSectionProps) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const fetchRatings = async () => {
      const { data } = await supabase
        .from("ratings")
        .select("score")
        .eq("anime_id", animeId);

      if (data && data.length > 0) {
        const avg = data.reduce((sum: number, r: any) => sum + r.score, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setTotalRatings(data.length);
      }

      if (userId) {
        const { data: userR } = await supabase
          .from("ratings")
          .select("score")
          .eq("anime_id", animeId)
          .eq("user_id", userId)
          .maybeSingle();
        if (userR) setUserRating(userR.score);
      }
    };
    fetchRatings();
  }, [animeId, userId]);

  const handleRate = async (score: number) => {
    if (!userId) { toast.error("Please log in to rate"); return; }

    const { error } = await supabase
      .from("ratings")
      .upsert({ user_id: userId, anime_id: animeId, score, updated_at: new Date().toISOString() }, { onConflict: "user_id,anime_id" });

    if (error) { toast.error("Failed to rate"); return; }
    setUserRating(score);
    toast.success(`Rated ${score}/5 ⭐`);

    // Refresh average
    const { data } = await supabase.from("ratings").select("score").eq("anime_id", animeId);
    if (data && data.length > 0) {
      const avg = data.reduce((sum: number, r: any) => sum + r.score, 0) / data.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setTotalRatings(data.length);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          Rate this Anime
        </h2>
        <div className="text-right">
          <span className="text-lg font-bold text-yellow-400">{avgRating || "—"}</span>
          <span className="text-xs text-muted-foreground ml-1">/ 5 ({totalRatings})</span>
        </div>
      </div>

      {userId ? (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRate(star)}
              className="transition-transform hover:scale-125"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  (hoverRating || userRating) >= star
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
          {userRating > 0 && (
            <span className="text-xs text-muted-foreground ml-2">Your rating: {userRating}/5</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline">Log in</Link> to rate
        </p>
      )}
    </div>
  );
};

export default RatingSection;
