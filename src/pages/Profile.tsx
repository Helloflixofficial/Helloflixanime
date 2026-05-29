import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import {
  Heart,
  Clock,
  Bookmark,
  Settings as SettingsIcon,
  LogOut,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserAvatar,
  DEFAULT_AVATARS,
  getDefaultAvatar,
} from "@/services/avatarService";
import { cn } from "@/lib/utils";

interface DbFavorite {
  id: string;
  anime_id: string;
  anime_title: string;
  anime_image: string | null;
}
interface DbWatchlist {
  id: string;
  anime_id: string;
  anime_title: string;
  anime_image: string | null;
  status: string | null;
}
interface DbProfile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    () => localStorage.getItem("default_avatar") || "batman"
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to favorites changes
    const favChannel = supabase
      .channel(`favorites-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["profile-favorites", user.id],
          });
        }
      )
      .subscribe();

    // Subscribe to watchlist changes
    const watchChannel = supabase
      .channel(`watchlist-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watchlist",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["profile-watching", user.id],
          });
          queryClient.invalidateQueries({
            queryKey: ["profile-completed", user.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(favChannel);
      supabase.removeChannel(watchChannel);
    };
  }, [user, queryClient]);

  const { data: profile } = useQuery({
    queryKey: ["profile-data", user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url")
          .eq("id", user!.id)
          .single();
        if (error) throw error;
        return data as DbProfile;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: favorites = [], isLoading: favLoading } = useQuery({
    queryKey: ["profile-favorites", user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("favorites")
          .select("id, anime_id, anime_title, anime_image")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as DbFavorite[];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });

  const { data: watching = [], isLoading: watchLoading } = useQuery({
    queryKey: ["profile-watching", user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("watchlist")
          .select("id, anime_id, anime_title, anime_image, status")
          .eq("user_id", user!.id)
          .eq("status", "watching")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as DbWatchlist[];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });

  const { data: completed = [], isLoading: compLoading } = useQuery({
    queryKey: ["profile-completed", user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("watchlist")
          .select("id, anime_id, anime_title, anime_image, status")
          .eq("user_id", user!.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as DbWatchlist[];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const removeFav = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("favorites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-favorites"] });
      toast({ title: "Removed from favorites" });
    },
  });

  const removeWatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("watchlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-watching"] });
      queryClient.invalidateQueries({ queryKey: ["profile-completed"] });
      toast({ title: "Removed from list" });
    },
  });

  const handleLogout = async () => {
    toast({ title: "Logged out" });
    await signOut();
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password must be at least 6 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }
    setChangingPassword(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        toast({ variant: "destructive", title: "Session expired" });
        navigate("/auth");
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarSelect = (key: string) => {
    setSelectedAvatar(key);
    localStorage.setItem("default_avatar", key);
    toast({
      title: `Default avatar set to ${key === "batman" ? "Batman" : "Catgirl"}`,
    });
  };

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  if (!user) return null;

  const displayName =
    profile?.username ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0];
  const avatarUrl = getUserAvatar(user, profile);
  const totalAnime = favorites.length + watching.length + completed.length;

  const AnimeListItem = ({
    item,
    onRemove,
  }: {
    item: {
      id: string;
      anime_id: string;
      anime_title: string;
      anime_image: string | null;
    };
    onRemove: (id: string) => void;
  }) => (
    <div className="relative group">
      <Link to={`/anime/${item.anime_id}`} className="block">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-primary/50 transition-all duration-300">
          <img
            src={item.anime_image || "/placeholder.svg"}
            alt={item.anime_title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            width={150}
            height={200}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <p className="text-xs mt-2 text-foreground font-medium truncate">
          {item.anime_title}
        </p>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove(item.id);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
        title="Remove"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );

  const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 opacity-30" />
      </div>
      <p className="text-sm">{text}</p>
    </div>
  );

  const LoadingGrid = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[3/4] rounded-xl" />
          <Skeleton className="h-3 w-3/4 mt-2" />
        </div>
      ))}
    </div>
  );

  const StatCard = ({
    value,
    label,
    icon: Icon,
  }: {
    value: number;
    label: string;
    icon: any;
  }) => (
    <div className="flex flex-col items-center p-3 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm hover:border-primary/30 transition-colors">
      <Icon className="h-4 w-4 text-primary mb-1" />
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
      {/* Profile Hero */}
      <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl">
        {/* Banner */}
        <div className="relative h-40 sm:h-52 md:h-64 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-accent/30 to-primary/20 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.3)_0%,_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.2)_0%,_transparent_50%)]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="relative px-4 md:px-8 pb-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative z-10">
              <div className="p-1 rounded-full bg-gradient-to-br from-primary via-accent to-primary">
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {(displayName?.charAt(0) || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background z-20" />
            </div>

            {/* Name */}
            <div className="flex-1 text-center sm:text-left z-10">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {user.email_confirmed_at ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                    <Shield className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold">
                    <Mail className="h-3 w-3" /> Unverified
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/30 text-accent-foreground text-[11px] font-semibold">
                  <Sparkles className="h-3 w-3" /> {totalAnime} Anime
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/settings")}
                className="backdrop-blur-sm bg-background/60"
              >
                <SettingsIcon className="h-4 w-4 mr-1.5" /> Settings
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="shadow-lg"
              >
                <LogOut className="h-4 w-4 mr-1.5" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <StatCard value={watching.length} label="Watching" icon={Clock} />
        <StatCard value={completed.length} label="Completed" icon={Bookmark} />
        <StatCard value={favorites.length} label="Favorites" icon={Heart} />
        <StatCard value={totalAnime} label="Total" icon={Sparkles} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="watching" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30 p-1">
          <TabsTrigger
            value="watching"
            className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Watching</span>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Completed</span>
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
          >
            <Heart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Favorites</span>
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watching" className="animate-fade-in">
          <Card className="anime-card border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Currently Watching
              </CardTitle>
              <CardDescription>
                Anime you're currently following
              </CardDescription>
            </CardHeader>
            <CardContent>
              {watchLoading ? (
                <LoadingGrid />
              ) : watching.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  text="No anime in your watching list yet"
                />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {watching.map((item) => (
                    <AnimeListItem
                      key={item.id}
                      item={item}
                      onRemove={(id) => removeWatch.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="animate-fade-in">
          <Card className="anime-card border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                Completed Anime
              </CardTitle>
            </CardHeader>
            <CardContent>
              {compLoading ? (
                <LoadingGrid />
              ) : completed.length === 0 ? (
                <EmptyState icon={Bookmark} text="No completed anime yet" />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {completed.map((item) => (
                    <AnimeListItem
                      key={item.id}
                      item={item}
                      onRemove={(id) => removeWatch.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="animate-fade-in">
          <Card className="anime-card border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Favorite Anime
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favLoading ? (
                <LoadingGrid />
              ) : favorites.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  text="No favorites yet — heart an anime to add it here"
                />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {favorites.map((item) => (
                    <AnimeListItem
                      key={item.id}
                      item={item}
                      onRemove={(id) => removeFav.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="animate-fade-in space-y-4">
          {/* Default Avatar Picker */}
          <Card className="anime-card border-border/30">
            <CardHeader>
              <CardTitle className="text-base">Default Avatar</CardTitle>
              <CardDescription>
                Choose your default profile picture (used when no Google account
                is linked)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {(Object.entries(DEFAULT_AVATARS) as [string, string][]).map(
                  ([key, src]) => (
                    <button
                      key={key}
                      onClick={() => handleAvatarSelect(key)}
                      className={cn(
                        "relative rounded-full overflow-hidden ring-4 transition-all duration-200 hover:scale-105",
                        selectedAvatar === key
                          ? "ring-primary shadow-lg shadow-primary/30"
                          : "ring-border/30 hover:ring-primary/50"
                      )}
                    >
                      <img
                        src={src}
                        alt={key}
                        className="w-20 h-20 object-cover"
                        loading="lazy"
                        width={80}
                        height={80}
                      />
                      <p className="absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-0.5 bg-background/80 backdrop-blur-sm capitalize">
                        {key}
                      </p>
                    </button>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="anime-card border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="w-full sm:w-auto"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="anime-card border-border/30">
            <CardContent className="pt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/settings")}
              >
                <SettingsIcon className="h-4 w-4 mr-2" /> App Settings
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="anime-card border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Are you sure? This will permanently delete your account."
                    )
                  )
                    return;
                  try {
                    await supabase
                      .from("favorites")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase
                      .from("watchlist")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase
                      .from("watch_history")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase
                      .from("comments")
                      .delete()
                      .eq("user_id", user.id);
                    await supabase.from("profiles").delete().eq("id", user.id);
                    await supabase.auth.signOut();
                    toast({ title: "Account deleted" });
                    navigate("/");
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: error.message,
                    });
                  }
                }}
              >
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
