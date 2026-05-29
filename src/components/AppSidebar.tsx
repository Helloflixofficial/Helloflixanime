import { Home, List, Film, Tv, Settings, HelpCircle, User, Play, X, ChevronDown, Compass, Clock, Languages, Clapperboard, Star, Sparkles, Radio, Music, Monitor } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getSidebarBgImage, getCurrentSidebarBg } from "@/components/settings/SidebarBgPicker";

const getCategoriesData = () => [
  {
    label: "Browse",
    labelKey: "nav.browse",
    items: [
      { titleKey: "nav.uploads", url: "/uploads", icon: List },
      { titleKey: "nav.movies", url: "/movies", icon: Film },
      { titleKey: "nav.tvSeries", url: "/tv-series", icon: Tv },
    ],
  },
  {
    label: "Multi Server",
    labelKey: "nav.multiServer",
    items: [
      { titleKey: "nav.animeya", url: "/animeya", icon: Clapperboard },
    ],
  },
  {
    label: "Type",
    labelKey: "nav.type",
    items: [
      { titleKey: "nav.typeMovie", url: "/category/movie", icon: Film },
      { titleKey: "nav.typeSpecial", url: "/category/special", icon: Star },
      { titleKey: "nav.typeOva", url: "/category/ova", icon: Sparkles },
      { titleKey: "nav.typeOna", url: "/category/ona", icon: Monitor },
      { titleKey: "nav.typeTv", url: "/category/tv", icon: Tv },
      { titleKey: "nav.typeMusic", url: "/category/music", icon: Music },
    ],
  },
];

const socialLinks = [
  { title: "WhatsApp", url: "https://wa.me/", color: "hover:text-green-500", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  )},
  { title: "Telegram", url: "https://t.me/", color: "hover:text-blue-400", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  )},
  { title: "Discord", url: "https://discord.gg/", color: "hover:text-indigo-400", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1569 2.4189z"/></svg>
  )},
  { title: "Instagram", url: "https://instagram.com/", color: "hover:text-pink-500", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
  )},
];

function SidebarNavItem({ item, showText, onNavigate }: { item: { title: string; url: string; icon: React.ElementType }; showText: boolean; onNavigate?: () => void }) {
  return (
    <SidebarMenuItem>
      <NavLink
        to={item.url}
        end={item.url === "/"}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "flex items-center rounded-lg text-[13px] font-medium transition-all duration-200 relative group",
            showText ? "gap-3 px-3 py-[13px]" : "justify-center px-0 py-[13px]",
            isActive
              ? "bg-primary/15 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )
        }
      >
        {({ isActive }) => (
          <>
            <item.icon className={cn(
              "h-[18px] w-[18px] flex-shrink-0 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
            {showText && <span className="truncate">{item.title}</span>}
          </>
        )}
      </NavLink>
    </SidebarMenuItem>
  );
}

function CollapsibleCategory({
  label,
  items,
  showText,
  isOpen,
  onToggle,
  onNavigate,
}: {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  showText: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="border-b border-border/30 last:border-b-0">
      {showText ? (
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full px-3 py-3 text-[13px] font-semibold text-foreground/70 hover:text-foreground transition-colors"
        >
          <span>{label}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground/50 transition-transform duration-200",
              !isOpen && "-rotate-90"
            )}
          />
        </button>
      ) : (
        <div className="h-px bg-border/40 mx-3 my-2" />
      )}

      {(isOpen || !showText) && (
        <SidebarMenu className={cn("space-y-[1px] pb-1", showText && "ml-1")}>
          {items.map((item) => (
            <SidebarNavItem key={item.title} item={item} showText={showText} onNavigate={onNavigate} />
          ))}
        </SidebarMenu>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const showText = isMobile || open;
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string | null } | null>(null);
  const { t } = useTranslation();
  const [sidebarBg, setSidebarBg] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const preset = getCurrentSidebarBg();
      const img = getSidebarBgImage(preset);
      setSidebarBg(img);
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata;
        const name = meta?.full_name || meta?.name || user.email?.split("@")[0] || "User";
        const avatar = meta?.avatar_url || meta?.picture || null;
        setUserProfile({ name, avatar });
      } else {
        setUserProfile(null);
      }
    };
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => subscription.unsubscribe();
  }, []);


  const handleNavigate = () => {
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarContent
        className={cn("overflow-hidden relative", sidebarBg ? "custom-bg-image custom-sidebar-overlay" : "sidebar-fancy-bg")}
        style={sidebarBg ? { backgroundImage: `url(${sidebarBg})` } : undefined}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            aria-label="Close sidebar"
            className="absolute top-3 right-3 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3",
          showText ? "px-4" : "justify-center px-0",
          isMobile ? "py-4 pt-14" : "py-5"
        )}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-sm">
            <Play className="h-[18px] w-[18px] text-primary-foreground fill-current" />
          </div>
          {showText && (
            <span className="text-[15px] font-bold tracking-tight text-foreground">
              Helloflix
            </span>
          )}
        </div>

        {/* Home + Settings row */}
        <div className={cn(showText ? "px-3" : "px-1")}>
          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              onClick={handleNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center flex-1 rounded-lg text-[13px] font-medium transition-all duration-200 group",
                  showText ? "gap-3 px-3 py-[13px]" : "justify-center px-0 py-[13px]",
                  isActive
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Home className={cn(
                    "h-[18px] w-[18px] flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {showText && <span>{t("nav.home")}</span>}
                </>
              )}
            </NavLink>
            {showText && (
              <Link
                to="/settings"
                onClick={handleNavigate}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
              >
                <Settings className="h-[16px] w-[16px]" />
              </Link>
            )}
          </div>
        </div>

        {/* Divider line */}
        <div className="px-4 py-2">
          <div className="h-px bg-border/50" />
        </div>

        {/* Quick links */}
        <SidebarGroup className={cn("pt-0 pb-0", showText ? "px-3" : "px-1")}>
          {showText && (
            <div className="px-3 mb-1.5">
              <span className="text-[11px] font-medium text-muted-foreground/60 tracking-wide">
                {t("nav.quickAccess")}
              </span>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-[1px]">
              <SidebarNavItem item={{ title: t("nav.recentlyAdded"), url: "/recently-added", icon: Clock }} showText={showText} onNavigate={handleNavigate} />
              <SidebarNavItem item={{ title: t("nav.hindi"), url: "/hindi", icon: Languages }} showText={showText} onNavigate={handleNavigate} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider line */}
        <div className="px-4 py-2">
          <div className="h-px bg-border/50" />
        </div>

        {/* Menu label (like Firebase's "Product categories") */}
        {showText && (
          <div className="px-6 pb-1">
            <span className="text-[11px] font-medium text-muted-foreground/60 tracking-wide">
              {t("nav.menu")}
            </span>
          </div>
        )}

        {/* Collapsible Categories (Firebase-style) */}
        <div className={cn("flex-1", showText ? "px-3" : "px-1")}>
          <div className="border border-border/30 rounded-lg overflow-hidden">
            {getCategoriesData().map((cat) => {
              const items = cat.items.map(item => ({ title: t(item.titleKey), url: item.url, icon: item.icon }));
              if (items.length === 0) return null;
              return (
                <CollapsibleCategory
                  key={cat.label}
                  label={t(cat.labelKey)}
                  items={items}
                  showText={showText}
                  isOpen={openCategories.has(cat.label)}
                  onToggle={() => setOpenCategories(prev => { const next = new Set(prev); if (next.has(cat.label)) next.delete(cat.label); else next.add(cat.label); return next; })}
                  onNavigate={handleNavigate}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className={cn("mt-auto", showText ? "px-3" : "px-1", isMobile ? "pb-20" : "pb-3")}>
          <div className="h-px bg-border/50 mb-3 mx-1" />

          {/* Share icons */}
          {showText && (
            <div className="flex items-center justify-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.title}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.title}
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-md text-muted-foreground transition-all duration-200 hover:scale-110",
                    social.color
                  )}
                >
                  <social.icon />
                </a>
              ))}
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
