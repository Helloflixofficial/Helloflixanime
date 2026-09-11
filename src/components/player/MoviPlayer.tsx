import { useEffect, useRef } from "react";
import { VIDEO_PROXY_URL } from "@/config/api";

interface MoviPlayerProps {
  streamUrl: string;
  autoPlay?: boolean;
  title?: string;
  onError?: () => void;
}

/**
 * The sibling Cloudflare player uses this custom element for the API's MKV
 * sources. Configure it fully, then attach it once per selected mirror.
 */
export default function MoviPlayer({
  streamUrl,
  autoPlay = true,
  title = "Video",
  onError,
}: MoviPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !streamUrl) return;

    // The live HindMovies worker expects the mirror URL encoded once. A
    // second encoding makes the worker request the wrong upstream URL and
    // returns 502 for otherwise valid Hindi mirrors.
    const proxyUrl = `${VIDEO_PROXY_URL}${encodeURIComponent(streamUrl)}`;
    const player = document.createElement("movi-player");
    player.setAttribute("src", proxyUrl);
    player.setAttribute("controls", "");
    player.setAttribute("playsinline", "");
    player.setAttribute("fallback", "native");
    player.setAttribute("ambientmode", "");
    player.setAttribute("resume", "");
    // Let Movi use hardware first and switch to its software decoder only
    // when the source actually needs it. This keeps the first playable frame
    // fast while still handling codecs Chromium cannot decode natively.
    player.setAttribute("sw", "auto");
    player.setAttribute("title", title);
    player.style.display = "block";
    player.style.width = "100%";
    player.style.height = "100%";

    if (autoPlay) {
      player.setAttribute("autoplay", "");
      player.setAttribute("muted", "");
      (player as HTMLElement & { muted?: boolean }).muted = true;
    }

    mount.replaceChildren(player);

    // A mirror can return HTTP 200 while still being unusable by the browser
    // decoder. Let the watch page move to the next mirror only after Movi has
    // emitted its terminal playback error; do not use a loading timer.
    const handleError = () => onError?.();
    player.addEventListener("error", handleError);

    return () => {
      player.removeEventListener("error", handleError);
      player.remove();
    };
  }, [streamUrl, autoPlay, title, onError]);

  return <div ref={mountRef} className="absolute inset-0 h-full w-full bg-black" />;
}
