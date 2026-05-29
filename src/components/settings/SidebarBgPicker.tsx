import { Check, Image, X, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { toast } from "sonner";
import { readImageAsDataUrl } from "@/services/customizationService";

import galaxyBg from "@/assets/galaxy-sidebar-bg.webp";
import spaceNatureBg from "@/assets/sidebar-bg-space-nature.webp";
import darkFantasyBg from "@/assets/sidebar-bg-dark-fantasy.webp";
import moonBg from "@/assets/sidebar-bg-moon.webp";
import infernoBg from "@/assets/sidebar-bg-inferno.webp";

export type SidebarBgOption = "none" | "galaxy" | "space-nature" | "dark-fantasy" | "moon" | "inferno" | "custom";

const OPTIONS: { value: SidebarBgOption; label: string; image: string | null; emoji: string }[] = [
  { value: "none", label: "None", image: null, emoji: "🚫" },
  { value: "galaxy", label: "Galaxy", image: galaxyBg, emoji: "🌌" },
  { value: "space-nature", label: "Space Nature", image: spaceNatureBg, emoji: "🌿" },
  { value: "dark-fantasy", label: "Dark Fantasy", image: darkFantasyBg, emoji: "🏰" },
  { value: "moon", label: "Moon", image: moonBg, emoji: "🌙" },
  { value: "inferno", label: "Inferno", image: infernoBg, emoji: "🌋" },
];

export function getCurrentSidebarBg(): SidebarBgOption {
  const stored = localStorage.getItem("sidebar_bg_preset");
  if (stored && [...OPTIONS.map(o => o.value), "custom"].includes(stored)) return stored as SidebarBgOption;
  return "galaxy";
}

export function getSidebarBgImage(option: SidebarBgOption): string | null {
  if (option === "custom") return localStorage.getItem("sidebar_bg_custom_data");
  return OPTIONS.find(o => o.value === option)?.image ?? null;
}

export function applySidebarBg(option: SidebarBgOption) {
  try {
    localStorage.setItem("sidebar_bg_preset", option);
    const img = getSidebarBgImage(option);
    if (img) {
      localStorage.setItem("custom_sidebar_bg", img);
    } else {
      localStorage.removeItem("custom_sidebar_bg");
    }
  } catch (e) {
    console.warn("Failed to save sidebar bg (quota?)", e);
  }
}

interface SidebarBgPickerProps {
  value: SidebarBgOption;
  onChange: (v: SidebarBgOption) => void;
}

export function SidebarBgPicker({ value, onChange }: SidebarBgPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const customPreview = localStorage.getItem("sidebar_bg_custom_data");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file, 5);
      localStorage.setItem("sidebar_bg_custom_data", dataUrl);
      onChange("custom");
      toast.success("Custom background set!");
    } catch (err: any) {
      toast.error(err.message || "Failed to load image");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card className="anime-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="h-5 w-5 mr-2 text-primary" />
          Sidebar Background
        </CardTitle>
        <CardDescription>Choose a preset or upload your own image</CardDescription>
      </CardHeader>
      <CardContent>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative group rounded-lg overflow-hidden border-2 transition-all duration-200 aspect-[3/4]",
                value === opt.value
                  ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                  : "border-border/50 hover:border-primary/50 hover:scale-[1.01]"
              )}
            >
              {opt.image ? (
                <img 
                  src={opt.image} 
                  alt={opt.label} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                  width={80}
                  height={107}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <X className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                <span className="text-[10px] font-medium text-white leading-none">
                  {opt.emoji} {opt.label}
                </span>
              </div>
              {value === opt.value && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}

          {/* Upload custom */}
          <button
            onClick={() => value === "custom" ? fileRef.current?.click() : fileRef.current?.click()}
            className={cn(
              "relative group rounded-lg overflow-hidden border-2 border-dashed transition-all duration-200 aspect-[3/4]",
              value === "custom"
                ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                : "border-border/50 hover:border-primary/50 hover:scale-[1.01]"
            )}
          >
            {value === "custom" && customPreview ? (
              <img 
                src={customPreview} 
                alt="Custom" 
                className="w-full h-full object-cover" 
                loading="lazy"
                width={80}
                height={107}
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-center gap-1.5">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Upload</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
              <span className="text-[10px] font-medium text-white leading-none">
                📤 Custom
              </span>
            </div>
            {value === "custom" && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
