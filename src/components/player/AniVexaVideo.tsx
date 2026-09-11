import Hls from "hls.js";
import { useEffect, useRef } from "react";

export default function AniVexaVideo({ src, title, onError }: { src: string; title: string; onError?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    const isHls = /\.m3u8(?:$|[?#])/i.test(src);
    const handleError = () => onError?.();

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, maxBufferLength: 30, maxMaxBufferLength: 60 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) onError?.();
      });
    } else {
      video.src = src;
      video.addEventListener("error", handleError);
    }

    return () => {
      hls?.destroy();
      video.removeEventListener("error", handleError);
      video.removeAttribute("src");
      video.load();
    };
  }, [src, onError]);

  return <video ref={videoRef} title={title} className="h-full w-full bg-black" controls autoPlay playsInline />;
}
