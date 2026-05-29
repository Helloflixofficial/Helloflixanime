import { useState, useEffect, useRef } from "react";
import { User, LogOut, Settings, Search, X, MoreVertical, Info, HelpCircle, Mail, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import SearchSuggestions from "./SearchSuggestions";
import { useTranslation } from "react-i18next";
import { getUserAvatar } from "@/services/avatarService";
import { useAuth } from "@/contexts/AuthProvider";

const Header = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { suggestions, isLoading } = useSearchSuggestions(searchQuery);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    const fetchAvatar = async () => {
      try {
        const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      } catch {
        // DB unavailable - use default
      }
    };
    fetchAvatar();
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(t("common.loggedOut"));
    await signOut();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const displayName = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  const userInitial = (displayName?.charAt(0) || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="flex h-16 items-center px-4 gap-4">
        <SidebarTrigger className="h-11 w-11 flex-shrink-0 rounded-full hover:bg-muted" />

        {/* Search */}
        <div className="flex-1 flex justify-center" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="w-full max-w-md relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search here..."
                className="pl-10 pr-8 h-9 rounded-full bg-muted/60 border-transparent text-sm placeholder:text-muted-foreground/70 focus:bg-background focus:border-border focus:ring-1 focus:ring-primary/30 transition-all"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  aria-label="Clear search"
                  onClick={() => { setSearchQuery(""); setShowSuggestions(false); }} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <SearchSuggestions suggestions={suggestions} isLoading={isLoading} query={searchQuery} onSelect={() => { setShowSuggestions(false); setSearchQuery(""); }} />
            )}
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* 3-dot menu */}
          <div ref={moreRef} className="relative">
            <Button variant="ghost" size="icon" aria-label="More options" className="h-11 w-11 rounded-full hover:bg-muted" onClick={() => { setShowMore(!showMore); setShowProfile(false); }}>
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
            {showMore && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in">
                <Link to="/contact" onClick={() => setShowMore(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />{t("nav.contactUs")}
                </Link>
                <Link to="/contact" onClick={() => setShowMore(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />{t("nav.help")}
                </Link>
                <Link to="/about" onClick={() => setShowMore(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors border-t border-border/50">
                  <Info className="h-4 w-4 text-muted-foreground" />{t("nav.aboutUs")}
                </Link>
              </div>
            )}
          </div>

          {/* Auth / Profile */}
          {user ? (
            <div ref={profileRef} className="relative">
              <button
                className="h-11 w-11 rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all"
                onClick={() => { setShowProfile(!showProfile); setShowMore(false); }}
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src={getUserAvatar(user, avatarUrl ? { avatar_url: avatarUrl } : null)} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </button>

              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                  {/* User info header */}
                  <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-md">
                        <AvatarImage src={getUserAvatar(user, avatarUrl ? { avatar_url: avatarUrl } : null)} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">{userInitial}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.email_confirmed_at && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
                            <Shield className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Menu items */}
                  <div className="py-1">
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors" onClick={() => { setShowProfile(false); navigate("/profile"); }}>
                      <User className="h-4 w-4 text-muted-foreground" />{t("nav.viewProfile")}
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors" onClick={() => { setShowProfile(false); navigate("/settings"); }}>
                      <Settings className="h-4 w-4 text-muted-foreground" />{t("nav.settings")}
                    </button>
                    <div className="h-px bg-border/50 my-1" />
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />{t("nav.signOut")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button variant="default" size="sm" className="h-9 px-4 text-sm font-medium rounded-full" asChild>
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
