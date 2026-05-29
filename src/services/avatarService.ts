import batmanAvatar from "@/assets/avatar-batman.webp";
import catgirlAvatar from "@/assets/avatar-catgirl.webp";

export const DEFAULT_AVATARS = {
  batman: batmanAvatar,
  catgirl: catgirlAvatar,
};

/**
 * Get the user's avatar URL.
 * Priority: Google profile image > custom uploaded > default based on selection
 */
export function getUserAvatar(user: any, profile?: { avatar_url?: string | null } | null): string {
  // Google / OAuth avatar (highest priority)
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  if (googleAvatar) return googleAvatar;

  // Profile avatar from database
  if (profile?.avatar_url) return profile.avatar_url;

  // Default avatar from localStorage preference
  const pref = localStorage.getItem("default_avatar") || "batman";
  return DEFAULT_AVATARS[pref as keyof typeof DEFAULT_AVATARS] || DEFAULT_AVATARS.batman;
}

export function getDefaultAvatar(): string {
  const pref = localStorage.getItem("default_avatar") || "batman";
  return DEFAULT_AVATARS[pref as keyof typeof DEFAULT_AVATARS] || DEFAULT_AVATARS.batman;
}

// Sync Google avatar to profiles table
export async function syncGoogleAvatar(user: any) {
  if (!user) return;

  const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  if (!googleAvatar) return;

  try {
    // Check if profile exists and has no avatar
    const { data: existingProfile } = await import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
    );

    if (existingProfile && !existingProfile.avatar_url) {
      // Update profile with Google avatar
      await import("@/integrations/supabase/client").then(({ supabase }) =>
        supabase.from("profiles").update({ avatar_url: googleAvatar }).eq("id", user.id)
      );
    }
  } catch (error) {
    console.warn("Failed to sync Google avatar:", error);
  }
}
