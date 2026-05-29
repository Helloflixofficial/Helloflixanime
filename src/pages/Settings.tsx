import { useState, useEffect, useCallback } from "react";
import { Monitor, Moon, Sun, Bell, Shield, Download, Globe, Leaf, Flame, Sparkles, Heart, Loader2, Type, Palette, Maximize, Zap, LayoutGrid, Layers, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { fetchUserSettings, saveUserSettings, applySettingsToLocal, getLocalSettings } from "@/services/settingsService";
import { supabase } from "@/integrations/supabase/client";
import { getCustomization, saveCustomization, applyIconPack, type CustomizationSettings } from "@/services/customizationService";
import { CustomizationCard } from "@/components/settings/CustomizationCard";
import { applyUiPreferences, getUiPreferences, saveUiPreferences, type UiPreferences } from "@/services/uiPreferencesService";
import { SidebarBgPicker, getCurrentSidebarBg, applySidebarBg, type SidebarBgOption } from "@/components/settings/SidebarBgPicker";

type ThemeOption = "light" | "dark" | "emerald" | "crimson" | "sakura" | "cyber" | "ocean" | "inferno" | "kawaii";

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

const FONT_OPTIONS = [
  { value: "inter", label: "Inter", desc: "Clean & Modern" },
  { value: "orbitron", label: "Orbitron", desc: "Sci-Fi Gaming" },
  { value: "press-start", label: "Press Start 2P", desc: "Retro 8-bit" },
  { value: "rajdhani", label: "Rajdhani", desc: "Futuristic" },
  { value: "audiowide", label: "Audiowide", desc: "Racing / Arcade" },
  { value: "exo2", label: "Exo 2", desc: "Geometric Tech" },
  { value: "chakra", label: "Chakra Petch", desc: "Cyberpunk" },
];

const applyFont = (font: string) => {
  const root = document.documentElement;
  FONT_OPTIONS.forEach((f) => root.classList.remove(`font-${f.value}`));
  root.classList.add(`font-${font}`);
};

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Initialize from localStorage
  const local = getLocalSettings();
  const [theme, setTheme] = useState<ThemeOption>(local.theme as ThemeOption);
  const [font, setFont] = useState(local.font);
  const [notifications, setNotifications] = useState(local.notifications);
  const [emailUpdates, setEmailUpdates] = useState(local.email_updates);
  const [communityNotifs, setCommunityNotifs] = useState(local.community_notifs);
  const [autoplay, setAutoplay] = useState(local.autoplay);
  const [quality, setQuality] = useState(local.default_quality);
  const [volume, setVolume] = useState([local.default_volume]);
  const [language, setLanguage] = useState(i18n.language || "en");
  const [customization, setCustomization] = useState<CustomizationSettings>(getCustomization);
  const [uiPrefs, setUiPrefs] = useState<UiPreferences>(getUiPreferences);
  const [sidebarBg, setSidebarBg] = useState<SidebarBgOption>(getCurrentSidebarBg);

  // Load settings from DB on mount if logged in
  useEffect(() => {
    const loadFromDb = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (!user) return;

      const dbSettings = await fetchUserSettings();
      if (dbSettings) {
        setTheme(dbSettings.theme as ThemeOption);
        setFont(dbSettings.font);
        setLanguage(dbSettings.language);
        setAutoplay(dbSettings.autoplay);
        setQuality(dbSettings.default_quality);
        setVolume([dbSettings.default_volume]);
        setNotifications(dbSettings.notifications);
        setEmailUpdates(dbSettings.email_updates);
        setCommunityNotifs(dbSettings.community_notifs);
        applySettingsToLocal(dbSettings);
        applyTheme(dbSettings.theme as ThemeOption);
        applyFont(dbSettings.font);
        i18n.changeLanguage(dbSettings.language);
      }
    };
    loadFromDb();
  }, []);

  // Apply icon pack on mount
  useEffect(() => { applyIconPack(customization.icon_pack); }, []);
  useEffect(() => { applyUiPreferences(uiPrefs); }, []);

  // Persist to localStorage on change
  useEffect(() => { localStorage.setItem("theme", theme); applyTheme(theme); }, [theme]);
  useEffect(() => { localStorage.setItem("font", font); applyFont(font); }, [font]);
  useEffect(() => { localStorage.setItem("notifications", String(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem("emailUpdates", String(emailUpdates)); }, [emailUpdates]);
  useEffect(() => { localStorage.setItem("communityNotifs", String(communityNotifs)); }, [communityNotifs]);
  useEffect(() => { localStorage.setItem("autoPlay", String(autoplay)); }, [autoplay]);
  useEffect(() => { localStorage.setItem("defaultQuality", quality); }, [quality]);
  useEffect(() => { localStorage.setItem("defaultVolume", String(volume[0])); }, [volume]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as ThemeOption);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const handleSave = useCallback(async () => {
    // Save sidebar bg preset
    applySidebarBg(sidebarBg);

    // Save customization & UI prefs to localStorage
    saveCustomization(customization);
    saveUiPreferences(uiPrefs);
    applyUiPreferences(uiPrefs);

    // Save other settings to localStorage
    applySettingsToLocal({
      theme, language, font, autoplay,
      default_quality: quality,
      default_volume: volume[0],
      notifications, email_updates: emailUpdates,
      community_notifs: communityNotifs,
    });

    if (!isLoggedIn) {
      toast.success("Settings saved locally!");
      return;
    }

    setSaving(true);
    const success = await saveUserSettings({
      theme, language, font, autoplay,
      default_quality: quality,
      default_volume: volume[0],
      notifications, email_updates: emailUpdates,
      community_notifs: communityNotifs,
    });
    setSaving(false);

    if (success) {
      toast.success("Settings saved to your account!");
    } else {
      toast.error("Failed to save settings to account. Saved locally.");
    }
  }, [theme, language, font, autoplay, quality, volume, notifications, emailUpdates, communityNotifs, isLoggedIn, customization, uiPrefs, sidebarBg]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-glow mb-4">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Appearance Settings */}
        <Card className="anime-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-primary" />
              {t("settings.appearance")}
            </CardTitle>
            <CardDescription>
              {t("settings.appearanceDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t("settings.theme")}</label>
                <p className="text-sm text-muted-foreground">{t("settings.themeDesc")}</p>
              </div>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="h-4 w-4 mr-2 text-amber-500" />
                      {t("settings.light")}
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="h-4 w-4 mr-2 text-blue-400" />
                      {t("settings.dark")}
                    </div>
                  </SelectItem>
                  <SelectItem value="emerald">
                    <div className="flex items-center">
                      <Leaf className="h-4 w-4 mr-2 text-emerald-400" />
                      Emerald
                    </div>
                  </SelectItem>
                  <SelectItem value="crimson">
                    <div className="flex items-center">
                      <Flame className="h-4 w-4 mr-2 text-red-400" />
                      Crimson
                    </div>
                  </SelectItem>
                  <SelectItem value="sakura">
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                      Sakura
                    </div>
                  </SelectItem>
                  <SelectItem value="cyber">
                    <div className="flex items-center">
                      <Monitor className="h-4 w-4 mr-2 text-cyan-400" />
                      ⚡ Cyber
                    </div>
                  </SelectItem>
                  <SelectItem value="ocean">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-teal-400" />
                      🌊 Ocean
                    </div>
                  </SelectItem>
                  <SelectItem value="inferno">
                    <div className="flex items-center">
                      <Flame className="h-4 w-4 mr-2 text-orange-400" />
                      🔥 Inferno
                    </div>
                  </SelectItem>
                  <SelectItem value="kawaii">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-2 text-pink-400" />
                      🌸 Kawaii
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Font Style</label>
                <p className="text-sm text-muted-foreground">Choose your display font</p>
              </div>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <div className="flex items-center">
                        <Type className="h-4 w-4 mr-2 text-primary" />
                        <span>{f.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({f.desc})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t("settings.language")}</label>
                <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Playback Settings */}
        <Card className="anime-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-primary" />
              {t("settings.playback")}
            </CardTitle>
            <CardDescription>
              {t("settings.playbackDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t("settings.autoplay")}</label>
                <p className="text-sm text-muted-foreground">{t("settings.autoplayDesc")}</p>
              </div>
              <Switch checked={autoplay} onCheckedChange={setAutoplay} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t("settings.defaultQuality")}</label>
                <p className="text-sm text-muted-foreground">{t("settings.qualityDesc")}</p>
              </div>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("settings.defaultVolume")}</label>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-1">{volume[0]}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="anime-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              {t("settings.notifications")}
            </CardTitle>
            <CardDescription>
              {t("settings.notificationsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t("settings.pushNotifications")}</label>
                <p className="text-sm text-muted-foreground">{t("settings.pushDesc")}</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t("settings.emailUpdates")}</label>
                <p className="text-sm text-muted-foreground">{t("settings.emailDesc")}</p>
              </div>
              <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t("settings.communityNotifications")}</label>
                <p className="text-sm text-muted-foreground">{t("settings.communityDesc")}</p>
              </div>
              <Switch checked={communityNotifs} onCheckedChange={setCommunityNotifs} />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="anime-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              {t("settings.privacy")}
            </CardTitle>
            <CardDescription>
              {t("settings.privacyDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Password change is handled via email reset")}>
              <Shield className="h-4 w-4 mr-2" />
              {t("settings.changePassword")}
            </Button>
            
            <Button variant="outline" className="w-full justify-start" onClick={() => {
              const history = localStorage.getItem("continueWatching") || "[]";
              const blob = new Blob([history], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "watch-history.json";
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Watch history exported!");
            }}>
              <Download className="h-4 w-4 mr-2" />
              {t("settings.exportHistory")}
            </Button>
            
            <Button variant="outline" className="w-full justify-start" onClick={() => window.open("/contact", "_self")}>
              <Globe className="h-4 w-4 mr-2" />
              {t("settings.privacyPolicy")}
            </Button>
            
            <Button variant="destructive" className="w-full justify-start" onClick={() => {
              localStorage.removeItem("continueWatching");
              localStorage.removeItem("autoPlay");
              localStorage.removeItem("autoNext");
              localStorage.removeItem("autoSkip");
              localStorage.removeItem("defaultQuality");
              localStorage.removeItem("defaultVolume");
              toast.success("Local data cleared!");
            }}>
              {t("settings.clearData")}
            </Button>
          </CardContent>
        </Card>

        {/* Customization */}
        <CustomizationCard customization={customization} onChange={setCustomization} />

        {/* Sidebar Background */}
        <SidebarBgPicker value={sidebarBg} onChange={setSidebarBg} />

        {/* UI Preferences */}
        <Card className="anime-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="h-5 w-5 mr-2 text-primary" />
              UI Preferences
            </CardTitle>
            <CardDescription>Fine-tune the look and feel of every element</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Card Style
                </label>
                <Select value={uiPrefs.card_style} onValueChange={(v) => setUiPrefs(p => ({ ...p, card_style: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glass">🪟 Glass (Blur)</SelectItem>
                    <SelectItem value="solid">◼ Solid</SelectItem>
                    <SelectItem value="outline">▢ Outline</SelectItem>
                    <SelectItem value="gradient">🌈 Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Maximize className="h-3.5 w-3.5 text-primary" /> Border Radius
                </label>
                <Select value={uiPrefs.border_radius} onValueChange={(v) => setUiPrefs(p => ({ ...p, border_radius: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sharp (0px)</SelectItem>
                    <SelectItem value="sm">Small (4px)</SelectItem>
                    <SelectItem value="md">Medium (8px)</SelectItem>
                    <SelectItem value="lg">Large (12px)</SelectItem>
                    <SelectItem value="xl">Extra Large (16px)</SelectItem>
                    <SelectItem value="full">Pill (9999px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Animation Intensity */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" /> Animation Intensity
                </label>
                <Select value={uiPrefs.animation_intensity} onValueChange={(v) => setUiPrefs(p => ({ ...p, animation_intensity: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Off</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="dramatic">Dramatic ✨</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Density */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5 text-primary" /> Content Density
                </label>
                <Select value={uiPrefs.content_density} onValueChange={(v) => setUiPrefs(p => ({ ...p, content_density: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Card Hover Effect */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <CircleDot className="h-3.5 w-3.5 text-primary" /> Card Hover Effect
                </label>
                <Select value={uiPrefs.card_hover_effect} onValueChange={(v) => setUiPrefs(p => ({ ...p, card_hover_effect: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="lift">Lift ↑</SelectItem>
                    <SelectItem value="scale">Scale ⬡</SelectItem>
                    <SelectItem value="glow">Glow ✦</SelectItem>
                    <SelectItem value="tilt">Tilt ⟳</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scrollbar Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Scrollbar Style
                </label>
                <Select value={uiPrefs.scrollbar_style} onValueChange={(v) => setUiPrefs(p => ({ ...p, scrollbar_style: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="thin">Thin</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="colored">Colored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Blur Intensity */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">Blur Intensity: {uiPrefs.blur_intensity}px</label>
                <Slider
                  value={[uiPrefs.blur_intensity]}
                  onValueChange={([v]) => setUiPrefs(p => ({ ...p, blur_intensity: v }))}
                  max={20} min={0} step={1}
                />
              </div>

              {/* Glow Effects */}
              <div className="flex items-center justify-between sm:col-span-2 lg:col-span-2">
                <div>
                  <label className="text-sm font-medium">Glow Effects</label>
                  <p className="text-xs text-muted-foreground">Enable glowing accents on interactive elements</p>
                </div>
                <Switch checked={uiPrefs.glow_enabled} onCheckedChange={(v) => setUiPrefs(p => ({ ...p, glow_enabled: v }))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-center">
        <Button size="lg" className="glow-effect px-8" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : t("settings.saveChanges")}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
