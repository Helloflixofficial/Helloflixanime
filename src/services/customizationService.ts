// Customization preferences stored in localStorage + synced to DB as metadata
// Images are stored as base64 data URLs in localStorage

export type IconPack = "default" | "rounded" | "sharp" | "duotone" | "neon";

export interface CustomizationSettings {
  sidebar_bg_image: string | null;
  right_sidebar_bg_image: string | null;
  home_bg_image: string | null;
  icon_pack: IconPack;
}

const DEFAULTS: CustomizationSettings = {
  sidebar_bg_image: null,
  right_sidebar_bg_image: null,
  home_bg_image: null,
  icon_pack: "default",
};

const KEYS = {
  sidebar_bg_image: "custom_sidebar_bg",
  right_sidebar_bg_image: "custom_right_sidebar_bg",
  home_bg_image: "custom_home_bg",
  icon_pack: "custom_icon_pack",
};

export function getCustomization(): CustomizationSettings {
  return {
    sidebar_bg_image: localStorage.getItem(KEYS.sidebar_bg_image),
    right_sidebar_bg_image: localStorage.getItem(KEYS.right_sidebar_bg_image),
    home_bg_image: localStorage.getItem(KEYS.home_bg_image),
    icon_pack: (localStorage.getItem(KEYS.icon_pack) as IconPack) || DEFAULTS.icon_pack,
  };
}

export function saveCustomization(settings: CustomizationSettings) {
  try {
    if (settings.sidebar_bg_image) localStorage.setItem(KEYS.sidebar_bg_image, settings.sidebar_bg_image);
    else localStorage.removeItem(KEYS.sidebar_bg_image);

    if (settings.right_sidebar_bg_image) localStorage.setItem(KEYS.right_sidebar_bg_image, settings.right_sidebar_bg_image);
    else localStorage.removeItem(KEYS.right_sidebar_bg_image);

    if (settings.home_bg_image) localStorage.setItem(KEYS.home_bg_image, settings.home_bg_image);
    else localStorage.removeItem(KEYS.home_bg_image);

    localStorage.setItem(KEYS.icon_pack, settings.icon_pack);
  } catch (e) {
    console.warn("Failed to save customization (quota exceeded?)", e);
  }
}

export function readImageAsDataUrl(file: File, maxSizeMb: number = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      reject(new Error(`File too large. Max ${maxSizeMb}MB`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        // Resize to max 400px wide for sidebar (keeps localStorage small)
        const maxW = 400;
        const maxH = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxW) { h = h * (maxW / w); w = maxW; }
        if (h > maxH) { w = w * (maxH / h); h = maxH; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Icon pack CSS class mapping
export const ICON_PACK_CLASSES: Record<IconPack, string> = {
  default: "",
  rounded: "icon-pack-rounded",
  sharp: "icon-pack-sharp",
  duotone: "icon-pack-duotone",
  neon: "icon-pack-neon",
};

export function applyIconPack(pack: IconPack) {
  const root = document.documentElement;
  Object.values(ICON_PACK_CLASSES).forEach(cls => { if (cls) root.classList.remove(cls); });
  if (ICON_PACK_CLASSES[pack]) root.classList.add(ICON_PACK_CLASSES[pack]);
}

export const ICON_PACK_OPTIONS = [
  { value: "default" as IconPack, label: "Default", desc: "Standard clean icons" },
  { value: "rounded" as IconPack, label: "Bubble", desc: "Soft rounded style" },
  { value: "sharp" as IconPack, label: "Sharp", desc: "Angular crisp edges" },
  { value: "duotone" as IconPack, label: "Duotone", desc: "Two-tone filled style" },
  { value: "neon" as IconPack, label: "Neon Glow", desc: "Glowing neon outline" },
];
