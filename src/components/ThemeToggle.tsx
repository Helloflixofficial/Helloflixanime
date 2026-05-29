import { Moon, Sun, Leaf, Flame, Sparkles, Monitor, Globe, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { applyIconPack, type IconPack } from "@/services/customizationService";
import { applyUiPreferences, getUiPreferences } from "@/services/uiPreferencesService";

type ThemeOption = "light" | "dark" | "emerald" | "crimson" | "sakura" | "cyber" | "ocean" | "inferno" | "kawaii";

const THEME_ORDER: ThemeOption[] = ["dark", "light", "emerald", "crimson", "sakura", "cyber", "ocean", "inferno", "kawaii"];

const THEME_CLASSES: Record<ThemeOption, string[]> = {
  light: [],
  dark: ["dark"],
  emerald: ["dark", "theme-emerald"],
  crimson: ["dark", "theme-crimson"],
  sakura: ["dark", "theme-sakura"],
  cyber: ["dark", "theme-cyber"],
  ocean: ["dark", "theme-ocean"],
  inferno: ["dark", "theme-inferno"],
  kawaii: ["dark", "theme-kawaii"],
};

const applyTheme = (theme: ThemeOption) => {
  const root = document.documentElement;
  root.classList.remove("dark", "theme-emerald", "theme-crimson", "theme-sakura", "theme-cyber", "theme-ocean", "theme-inferno", "theme-kawaii");
  THEME_CLASSES[theme].forEach((cls) => root.classList.add(cls));
};

const THEME_ICON: Record<ThemeOption, React.ReactNode> = {
  light: <Sun className="h-4 w-4 lg:h-5 lg:w-5" />,
  dark: <Moon className="h-4 w-4 lg:h-5 lg:w-5" />,
  emerald: <Leaf className="h-4 w-4 lg:h-5 lg:w-5" />,
  crimson: <Flame className="h-4 w-4 lg:h-5 lg:w-5" />,
  sakura: <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />,
  cyber: <Zap className="h-4 w-4 lg:h-5 lg:w-5" />,
  ocean: <Globe className="h-4 w-4 lg:h-5 lg:w-5" />,
  inferno: <Flame className="h-4 w-4 lg:h-5 lg:w-5" />,
  kawaii: <Heart className="h-4 w-4 lg:h-5 lg:w-5" />,
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeOption>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeOption) || "dark";
    setTheme(saved);
    applyTheme(saved);
    // Apply saved font
    const savedFont = localStorage.getItem("font") || "inter";
    const root = document.documentElement;
    ["inter","orbitron","press-start","rajdhani","audiowide","exo2","chakra"].forEach(f => root.classList.remove(`font-${f}`));
    root.classList.add(`font-${savedFont}`);
    // Apply saved icon pack
    const savedPack = (localStorage.getItem("custom_icon_pack") as IconPack) || "default";
    applyIconPack(savedPack);
    // Apply saved UI preferences
    applyUiPreferences(getUiPreferences());
  }, []);

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(theme);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="relative h-8 w-8 md:h-8 md:w-8 lg:h-10 lg:w-10 rounded-xl transition-all duration-300 hover:bg-accent/50"
      aria-label="Toggle theme"
    >
      {THEME_ICON[theme]}
    </Button>
  );
}
