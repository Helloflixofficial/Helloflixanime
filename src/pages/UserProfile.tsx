import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, UserPlus, UserMinus, MessageCircle, Star, Calendar, Loader2, ArrowLeft, Heart, Bookmark, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
  email: string | null;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);

  const [authAvatarUrl, setAuthAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setCurrentUserId(user?.id ?? null);
      // Get avatar from auth metadata as fallback
      if (user) {
        const metaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        setAuthAvatarUrl(metaAvatar || null);
        // Sync Google avatar to profiles table if profile has no avatar
        if (metaAvatar) {
          supabase.from("profiles").select("avatar_url").eq("id", user.id).single().then(({ data: p }) => {
            if (p && !p.avatar_url) {
              supabase.from("profiles").update({ avatar_url: metaAvatar }).eq("id", user.id);
            }
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      setLoading(true);

      const [
        { data: profileData },
        { data: followers },
        { data: following },
        { data: comments },
        { data: ratingsData },
        { data: favs },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("follows").select("id").eq("following_id", userId),
        supabase.from("follows").select("id").eq("follower_id", userId),
        supabase.from("comments").select("id, content, anime_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        supabase.from("ratings").select("id, anime_id, score, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("favorites").select("id, anime_id, anime_title, anime_image").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      setProfile(profileData);
      setFollowerCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);
      setCommentCount(comments?.length || 0);
      setRatingCount(ratingsData?.length || 0);
      setFavCount(favs?.length || 0);
      setRecentComments(comments || []);
      setRatings(ratingsData || []);
      setFavorites(favs || []);

      if (currentUserId && currentUserId !== userId) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };
    fetchProfile();
  }, [userId, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId) { toast.error("Please log in"); return; }
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", userId);
      setIsFollowing(false);
      setFollowerCount((c) => c - 1);
      toast.success("Unfollowed");
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId! });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
      toast.success("Following!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <User className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Home</Link>
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" })
    : "Unknown";

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Banner */}
      <div className="h-40 sm:h-52 bg-gradient-to-br from-primary/40 via-accent/20 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,hsl(var(--primary)/0.2),transparent)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container max-w-4xl px-4 -mt-16 relative z-10 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Avatar */}
          <div className="relative">
            <div className="p-1 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 shadow-[0_0_25px_hsl(var(--primary)/0.2)]">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background">
                <AvatarImage src={profile.avatar_url || (isOwnProfile ? authAvatarUrl : undefined) || undefined} />
                <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_8px_hsl(142_76%_36%/0.5)]" />
          </div>

          {/* Name & Info */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{profile.username || "User"}</h1>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Joined {joinDate}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isOwnProfile ? (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link to="/profile"><Edit className="h-3.5 w-3.5" /> Edit Profile</Link>
              </Button>
            ) : currentUserId ? (
              <Button
                onClick={handleFollow}
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="gap-2"
              >
                {isFollowing ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {[
            { label: "Followers", value: followerCount, icon: User },
            { label: "Following", value: followingCount, icon: UserPlus },
            { label: "Comments", value: commentCount, icon: MessageCircle },
            { label: "Ratings", value: ratingCount, icon: Star },
            { label: "Favorites", value: favCount, icon: Heart },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-panel rounded-xl p-2.5 sm:p-3 text-center space-y-1 hover:border-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-primary mx-auto" />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="comments" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 bg-card/50 border border-border/20">
            <TabsTrigger value="comments" className="gap-1.5 text-xs">
              <MessageCircle className="h-3.5 w-3.5" /> Comments
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-1.5 text-xs">
              <Heart className="h-3.5 w-3.5" /> Favorites
            </TabsTrigger>
            <TabsTrigger value="ratings" className="gap-1.5 text-xs">
              <Star className="h-3.5 w-3.5" /> Ratings
            </TabsTrigger>
          </TabsList>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Recent Comments
                <Badge variant="secondary" className="text-[9px] ml-auto">{commentCount}</Badge>
              </h2>
              {recentComments.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-xs text-muted-foreground">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentComments.map((c: any) => (
                    <Link key={c.id} to={`/anime/${c.anime_id}`} className="block">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={profile.avatar_url || (isOwnProfile ? authAvatarUrl : undefined) || undefined} />
                          <AvatarFallback className="bg-primary/15 text-primary text-xs">
                            {(profile.username || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-primary">{profile.username || "User"}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/80 line-clamp-2">{c.content}</p>
                          <Badge variant="secondary" className="text-[9px] mt-1.5">{c.anime_id}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" /> Favorites
                <Badge variant="secondary" className="text-[9px] ml-auto">{favCount}</Badge>
              </h2>
              {favorites.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Heart className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-xs text-muted-foreground">No favorites yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {favorites.map((fav: any) => (
                    <Link key={fav.id} to={`/anime/${fav.anime_id}`} className="group block">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted ring-1 ring-border/30 group-hover:ring-primary/40 transition-all">
                        <img
                          src={fav.anime_image || "/placeholder.svg"}
                          alt={fav.anime_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          width={200}
                          height={266}
                        />
                      </div>
                      <p className="text-[10px] mt-1.5 text-foreground font-medium truncate">{fav.anime_title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Ratings Tab */}
          <TabsContent value="ratings">
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" /> Ratings
                <Badge variant="secondary" className="text-[9px] ml-auto">{ratingCount}</Badge>
              </h2>
              {ratings.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Star className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-xs text-muted-foreground">No ratings yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ratings.map((r: any) => (
                    <Link key={r.id} to={`/anime/${r.anime_id}`} className="block">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= r.score ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                        <Badge variant="secondary" className="text-[9px]">{r.anime_id}</Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
