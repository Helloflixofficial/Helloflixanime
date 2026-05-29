import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  theme: string;
  language: string;
  font: string;
  autoplay: boolean;
  default_quality: string;
  default_volume: number;
  notifications: boolean;
  email_updates: boolean;
  community_notifs: boolean;
}

const DEFAULTS: UserSettings = {
  theme: "sakura",
  language: "en",
  font: "inter",
  autoplay: false,
  default_quality: "360p",
  default_volume: 80,
  notifications: true,
  email_updates: true,
  community_notifs: false,
};

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_settings" as any)
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  const d = data as any;
  return {
    theme: d.theme,
    language: d.language,
    font: d.font || "inter",
    autoplay: d.autoplay,
    default_quality: d.default_quality,
    default_volume: d.default_volume,
    notifications: d.notifications,
    email_updates: d.email_updates,
    community_notifs: d.community_notifs,
  };
}

export async function saveUserSettings(settings: UserSettings): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_settings" as any)
    .upsert(
      {
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_id" }
    );

  return !error;
}

export function applySettingsToLocal(settings: UserSettings) {
  localStorage.setItem("theme", settings.theme);
  localStorage.setItem("language", settings.language);
  localStorage.setItem("font", settings.font);
  localStorage.setItem("autoPlay", String(settings.autoplay));
  localStorage.setItem("defaultQuality", settings.default_quality);
  localStorage.setItem("defaultVolume", String(settings.default_volume));
  localStorage.setItem("notifications", String(settings.notifications));
  localStorage.setItem("emailUpdates", String(settings.email_updates));
  localStorage.setItem("communityNotifs", String(settings.community_notifs));
}

export function getLocalSettings(): UserSettings {
  return {
    theme: localStorage.getItem("theme") || DEFAULTS.theme,
    language: localStorage.getItem("language") || DEFAULTS.language,
    font: localStorage.getItem("font") || DEFAULTS.font,
    autoplay: localStorage.getItem("autoPlay") !== "false",
    default_quality: localStorage.getItem("defaultQuality") || DEFAULTS.default_quality,
    default_volume: parseInt(localStorage.getItem("defaultVolume") || String(DEFAULTS.default_volume)),
    notifications: localStorage.getItem("notifications") !== "false",
    email_updates: localStorage.getItem("emailUpdates") !== "false",
    community_notifs: localStorage.getItem("communityNotifs") === "true",
  };
}

export { DEFAULTS as SETTING_DEFAULTS };
