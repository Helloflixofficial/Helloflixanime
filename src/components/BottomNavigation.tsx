import { Home, Search, Star, User, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const BottomNavigation = () => {
  const { t } = useTranslation();
  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: Search, label: t("nav.search"), path: "/search" },
    { icon: Star, label: t("nav.mostPopular"), path: "/most-popular" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
    { icon: Settings, label: t("nav.settings"), path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
      <div className="relative border-t border-border/40 shadow-lg overflow-hidden">
        {/* Fancy background matching sidebar */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 10% 50%, hsl(var(--primary) / 0.06) 0%, transparent 60%),
              radial-gradient(ellipse 100% 80% at 90% 50%, hsl(var(--primary) / 0.04) 0%, transparent 50%)
            `,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            maskImage: 'linear-gradient(90deg, transparent 0%, hsl(0 0% 0% / 0.3) 30%, hsl(0 0% 0% / 0.3) 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, hsl(0 0% 0% / 0.3) 30%, hsl(0 0% 0% / 0.3) 70%, transparent 100%)',
          }}
        />
        <div className="relative flex items-center justify-around px-2 pb-safe pt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "relative flex items-center justify-center transition-all duration-300",
                    isActive && "scale-110"
                  )}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  {isActive && (
                    <div className="absolute -bottom-1 w-8 h-0.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
