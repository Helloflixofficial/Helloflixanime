export interface UiPreferences {
  card_style: "glass" | "solid" | "outline" | "gradient";
  border_radius: "none" | "sm" | "md" | "lg" | "xl" | "full";
  animation_intensity: "none" | "subtle" | "normal" | "dramatic";
  content_density: "compact" | "comfortable" | "spacious";
  blur_intensity: number; // 0-20
  glow_enabled: boolean;
  card_hover_effect: "none" | "lift" | "scale" | "glow" | "tilt";
  scrollbar_style: "default" | "thin" | "hidden" | "colored";
}

const DEFAULTS: UiPreferences = {
  card_style: "solid",
  border_radius: "md",
  animation_intensity: "none",
  content_density: "comfortable",
  blur_intensity: 0,
  glow_enabled: false,
  card_hover_effect: "none",
  scrollbar_style: "default",
};

export function getUiPreferences(): UiPreferences {
  try {
    const stored = localStorage.getItem("uiPreferences");
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULTS };
}

export function saveUiPreferences(prefs: UiPreferences) {
  localStorage.setItem("uiPreferences", JSON.stringify(prefs));
}

export function applyUiPreferences(prefs: UiPreferences) {
  const root = document.documentElement;

  // Remove old classes
  root.classList.remove(
    "card-glass", "card-solid", "card-outline", "card-gradient",
    "radius-none", "radius-sm", "radius-md", "radius-lg", "radius-xl", "radius-full",
    "anim-none", "anim-subtle", "anim-normal", "anim-dramatic",
    "density-compact", "density-comfortable", "density-spacious",
    "hover-none", "hover-lift", "hover-scale", "hover-glow", "hover-tilt",
    "scrollbar-default", "scrollbar-thin", "scrollbar-hidden", "scrollbar-colored",
    "glow-on", "glow-off"
  );

  // Apply new classes
  root.classList.add(`card-${prefs.card_style}`);
  root.classList.add(`radius-${prefs.border_radius}`);
  root.classList.add(`anim-${prefs.animation_intensity}`);
  root.classList.add(`density-${prefs.content_density}`);
  root.classList.add(`hover-${prefs.card_hover_effect}`);
  root.classList.add(`scrollbar-${prefs.scrollbar_style}`);
  root.classList.add(prefs.glow_enabled ? "glow-on" : "glow-off");

  // Set CSS variable for blur
  root.style.setProperty("--ui-blur", `${prefs.blur_intensity}px`);
}
