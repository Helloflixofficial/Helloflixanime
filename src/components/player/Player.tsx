/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import artplayerPluginChapter from "./artPlayerPluginChapter";
import autoSkip from "./autoSkip";
import artplayerPluginVttThumbnail from "./artPlayerPluginVttThumbnail";
import {
  backward10Icon,
  backwardIcon,
  captionIcon,
  forward10Icon,
  forwardIcon,
  fullScreenOffIcon,
  fullScreenOnIcon,
  loadingIcon,
  logo,
  muteIcon,
  pauseIcon,
  pipIcon,
  playIcon,
  playIconLg,
  settingsIcon,
  volumeIcon,
} from "./PlayerIcons";
import "./Player.css";
import getChapterStyles from "./getChapterStyle";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginUploadSubtitle from "./artplayerPluginUploadSubtitle";
import { PROXY_URL, M3U8_PROXIES } from "@/config/api";

Artplayer.LOG_VERSION = false;
Artplayer.CONTEXTMENU = false;

const KEY_CODES = {
  M: "KeyM",
  I: "KeyI",
  F: "KeyF",
  V: "KeyV",
  SPACE: "Space",
  SPACE_LEGACY: "Spacebar",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_RIGHT: "ArrowRight",
  ARROW_LEFT: "ArrowLeft",
};

/**
 * Build the proxied video URL using the primary (own) proxy.
 * No pre-checking — let HLS handle errors and trigger server switch if needed.
 */
function buildProxiedUrl(streamUrl: string, headers: any): string {
  const proxy = M3U8_PROXIES[0]; // Own edge function proxy (most reliable)
  return proxy + encodeURIComponent(streamUrl) + "&headers=" + encodeURIComponent(JSON.stringify(headers));
}

export default function Player({
  streamUrl,
  subtitles,
  thumbnail,
  intro,
  outro,
  autoSkipIntro,
  autoPlay,
  autoNext,
  episodeId,
  episodes,
  playNext,
  animeInfo,
  episodeNum,
  streamInfo,
  onStreamError,
}: any) {
  const artRef = useRef<HTMLDivElement>(null);
  const leftAtRef = useRef(0);
  const boundKeydownRef = useRef<any>(null);
  const autoNextRef = useRef(autoNext);
  const autoSkipRef = useRef(autoSkipIntro);
  const currentEpisodeIndexRef = useRef(-1);
  const proxy = PROXY_URL;
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(
    episodes?.findIndex((episode: any) => episode.id.match(/ep=(\d+)/)?.[1] === episodeId)
  );

  // Keep refs in sync with props
  useEffect(() => { autoNextRef.current = autoNext; }, [autoNext]);
  useEffect(() => { autoSkipRef.current = autoSkipIntro; }, [autoSkipIntro]);

  useEffect(() => {
    if (episodes?.length > 0) {
      const newIndex = episodes.findIndex(
        (episode: any) => episode.id.match(/ep=(\d+)/)?.[1] === episodeId
      );
      setCurrentEpisodeIndex(newIndex);
      currentEpisodeIndexRef.current = newIndex;
    }
  }, [episodeId, episodes]);

  useEffect(() => {
    const applyChapterStyles = () => {
      const existingStyles = document.querySelectorAll("style[data-chapter-styles]");
      existingStyles.forEach((style) => style.remove());
      const styleElement = document.createElement("style");
      styleElement.setAttribute("data-chapter-styles", "true");
      const styles = getChapterStyles(intro, outro);
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
      return () => {
        styleElement.remove();
      };
    };

    if (streamUrl || intro || outro) {
      const cleanup = applyChapterStyles();
      return cleanup;
    }
  }, [streamUrl, intro, outro]);

  const hlsErrorCountRef = useRef(0);
  const HLS_FATAL_ERROR_THRESHOLD = 3;

  const playM3u8 = (video: HTMLMediaElement, url: string, art: any) => {
    if (Hls.isSupported()) {
      if (art.hls) art.hls.destroy();
      hlsErrorCountRef.current = 0;
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        capLevelToPlayerSize: true,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      art.hls = hls;

      // Listen for HLS fatal errors → trigger server switch
      let recoveryTimer: any = null;
      hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          hlsErrorCountRef.current++;
          console.log(`[Player] HLS fatal error (${hlsErrorCountRef.current}): ${data.type} - ${data.details}`);
          
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (hlsErrorCountRef.current <= 1) {
              console.log("[Player] Attempting HLS recovery...");
              hls.startLoad();
              // If no success within 5s after recovery, switch server
              recoveryTimer = setTimeout(() => {
                console.log("[Player] Recovery timed out, requesting server switch");
                onStreamError?.();
              }, 5000);
            } else {
              if (recoveryTimer) clearTimeout(recoveryTimer);
              console.log("[Player] Recovery failed, requesting server switch");
              onStreamError?.();
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            if (hlsErrorCountRef.current <= 1) {
              hls.recoverMediaError();
            } else {
              onStreamError?.();
            }
          } else {
            onStreamError?.();
          }
        }
      });

      // Clear recovery timer if manifest loads successfully
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (recoveryTimer) {
          clearTimeout(recoveryTimer);
          recoveryTimer = null;
        }
      });

      art.on("destroy", () => hls.destroy());

      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration) {
          art.pause();
          const idx = currentEpisodeIndexRef.current;
          if (idx < episodes?.length - 1 && autoNextRef.current) {
            playNext(episodes[idx + 1].id.match(/ep=(\d+)/)?.[1]);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;

      // Native HLS error handling
      video.addEventListener("error", () => {
        console.log("[Player] Native HLS playback error, requesting server switch");
        onStreamError?.();
      });

      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration) {
          art.pause();
          const idx = currentEpisodeIndexRef.current;
          if (idx < episodes?.length - 1 && autoNextRef.current) {
            playNext(episodes[idx + 1].id.match(/ep=(\d+)/)?.[1]);
          }
        }
      });
    } else {
      console.log("Unsupported playback format: m3u8");
    }
  };

  const createChapters = () => {
    const chapters = [];
    if (intro?.start !== 0 || intro?.end !== 0) {
      chapters.push({ start: intro.start, end: intro.end, title: "intro" });
    }
    if (outro?.start !== 0 || outro?.end !== 0) {
      chapters.push({ start: outro.start, end: outro.end, title: "outro" });
    }
    return chapters;
  };

  const isEditableElement = (el: any) => {
    if (!el) return false;
    const tagName = el.tagName?.toLowerCase();
    if (tagName === "input" || tagName === "textarea" || el.isContentEditable) return true;
    if (el.closest) {
      const editable = el.closest("input, textarea, [contenteditable='true']");
      return !!editable;
    }
    return false;
  };

  const handleKeydown = (event: KeyboardEvent, art: any) => {
    const container = artRef.current;
    if (!container || !art) return;

    const target = event.target;
    if (isEditableElement(target)) return;

    const eventIsInsidePlayer =
      container.contains(target as Node) || container.contains(document.activeElement);

    if (!eventIsInsidePlayer) return;

    const code = event.code;

    switch (code) {
      case KEY_CODES.M:
        art.muted = !art.muted;
        break;
      case KEY_CODES.I:
        art.pip = !art.pip;
        break;
      case KEY_CODES.F: {
        event.preventDefault();
        event.stopPropagation();

        const container = artRef.current;
        const doc = document;
        const fsEl =
          doc.fullscreenElement ||
          (doc as any).webkitFullscreenElement ||
          (doc as any).mozFullScreenElement ||
          (doc as any).msFullscreenElement;

        if (fsEl && (fsEl === container || container!.contains(fsEl))) {
          if (doc.exitFullscreen) doc.exitFullscreen();
          else if ((doc as any).webkitExitFullscreen) (doc as any).webkitExitFullscreen();
          else if ((doc as any).mozCancelFullScreen) (doc as any).mozCancelFullScreen();
          else if ((doc as any).msExitFullscreen) (doc as any).msExitFullscreen();
        } else {
          if (container!.requestFullscreen) container!.requestFullscreen();
          else if ((container as any).webkitRequestFullscreen) (container as any).webkitRequestFullscreen();
          else if ((container as any).mozRequestFullScreen) (container as any).mozRequestFullScreen();
          else if ((container as any).msRequestFullscreen) (container as any).msRequestFullscreen();
        }

        try {
          art.fullscreen = !art.fullscreen;
        } catch (e) {
          // ignore if art not available
        }
        break;
      }
      case KEY_CODES.V:
        event.preventDefault();
        event.stopPropagation();
        art.subtitle.show = !art.subtitle.show;
        break;
      case KEY_CODES.SPACE:
      case KEY_CODES.SPACE_LEGACY:
        event.preventDefault();
        event.stopPropagation();
        art.playing ? art.pause() : art.play();
        break;
      case KEY_CODES.ARROW_UP:
        event.preventDefault();
        event.stopPropagation();
        art.volume = Math.min(art.volume + 0.1, 1);
        break;
      case KEY_CODES.ARROW_DOWN:
        event.preventDefault();
        event.stopPropagation();
        art.volume = Math.max(art.volume - 0.1, 0);
        break;
      case KEY_CODES.ARROW_RIGHT:
        event.preventDefault();
        event.stopPropagation();
        art.currentTime = Math.min(art.currentTime + 10, art.duration);
        break;
      case KEY_CODES.ARROW_LEFT:
        event.preventDefault();
        event.stopPropagation();
        art.currentTime = Math.max(art.currentTime - 10, 0);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!streamUrl || !artRef.current) return;

    const iframeUrl = streamInfo?.streamingLink?.iframe;
    const headers = {
      referer: iframeUrl ? new URL(iframeUrl).origin + "/" : window.location.origin + "/",
    };

    const container = artRef.current;
    let fullscreenRefocusTimeout: any = null;
    let destroyed = false;

    try {
      if (!container.hasAttribute("tabindex")) container.setAttribute("tabindex", "0");
      else {
        const current = parseInt(container.getAttribute("tabindex") || "0", 10);
        if (isNaN(current) || current < 0) container.setAttribute("tabindex", "0");
      }
      container.style.outline = "none";
    } catch (e) {
      // ignore
    }

    // Initialize the player directly with primary proxy — no pre-checking
    const initPlayer = async () => {
      if (destroyed) return;

      const videoUrl = buildProxiedUrl(streamUrl, headers);

      const art = new Artplayer({
        url: videoUrl,
        container: artRef.current!,
        type: "m3u8",
        autoplay: autoPlay,
        volume: 1,
        setting: true,
        playbackRate: true,
        pip: true,
        hotkey: false,
        fullscreen: true,
        mutex: true,
        playsInline: true,
        lock: true,
        airplay: true,
        autoOrientation: true,
        fastForward: true,
        aspectRatio: true,
        moreVideoAttr: {
          crossOrigin: "anonymous",
          preload: "auto",
          playsInline: true,
        },
        plugins: [
          artplayerPluginHlsControl({
            quality: {
              setting: true,
              getName: (level: any) => level.height + "P",
              title: "Quality",
              auto: "Auto",
            },
          }),
          artplayerPluginUploadSubtitle(),
          artplayerPluginChapter({ chapters: createChapters() }),
        ],
        subtitle: {
          style: {
            color: "#fff",
            fontWeight: "400",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "2rem",
          } as any,
          escape: false,
        },
        layers: [
          {
            name: "website_logo",
            html: logo,
            tooltip: "Anime Site",
            style: {
              opacity: "1",
              position: "absolute",
              top: "5px",
              right: "5px",
              transition: "opacity 0.5s ease-out",
            } as any,
          },
          {
            html: "",
            style: {
              position: "absolute",
              left: "50%",
              top: "0",
              width: "20%",
              height: "100%",
              transform: "translateX(-50%)",
            } as any,
            disable: !(Artplayer as any).utils.isMobile,
            click: () => art.toggle(),
          },
          {
            name: "rewind",
            html: "",
            style: { position: "absolute", left: "0", top: "0", width: "40%", height: "100%" } as any,
            disable: !(Artplayer as any).utils.isMobile,
            click: () => {
              art.controls.show = !art.controls.show;
            },
          },
          {
            name: "forward",
            html: "",
            style: { position: "absolute", right: "0", top: "0", width: "40%", height: "100%" } as any,
            disable: !(Artplayer as any).utils.isMobile,
            click: () => {
              art.controls.show = !art.controls.show;
            },
          },
          {
            name: "backwardIcon",
            html: backwardIcon,
            style: {
              position: "absolute",
              left: "25%",
              top: "50%",
              transform: "translate(50%,-50%)",
              opacity: "0",
              transition: "opacity 0.5s ease-in-out",
            } as any,
            disable: !(Artplayer as any).utils.isMobile,
          },
          {
            name: "forwardIcon",
            html: forwardIcon,
            style: {
              position: "absolute",
              right: "25%",
              top: "50%",
              transform: "translate(50%, -50%)",
              opacity: "0",
              transition: "opacity 0.5s ease-in-out",
            } as any,
            disable: !(Artplayer as any).utils.isMobile,
          },
        ],
        controls: [
          {
            html: backward10Icon,
            position: "right",
            tooltip: "Backward 10s",
            click: () => {
              art.currentTime = Math.max(art.currentTime - 10, 0);
            },
          },
          {
            html: forward10Icon,
            position: "right",
            tooltip: "Forward 10s",
            click: () => {
              art.currentTime = Math.min(art.currentTime + 10, art.duration);
            },
          },
        ],
        icons: {
          play: playIcon,
          pause: pauseIcon,
          setting: settingsIcon,
          volume: volumeIcon,
          pip: pipIcon,
          volumeClose: muteIcon,
          state: playIconLg,
          loading: loadingIcon,
          fullscreenOn: fullScreenOnIcon,
          fullscreenOff: fullScreenOffIcon,
        },
        customType: { m3u8: playM3u8 },
      });

      art.on("resize", () => {
        art.subtitle.style({
          fontSize: (art.width > 500 ? art.width * 0.02 : art.width * 0.03) + "px",
        });
      });

      const refocusIfNeeded = (delay = 30) => {
        try {
          if (!container) return;
          const active = document.activeElement;
          if (!container.contains(active)) {
            fullscreenRefocusTimeout = setTimeout(() => {
              try {
                container.focus();
              } catch (e) {
                // ignore
              }
            }, delay);
          }
        } catch (e) {
          // ignore
        }
      };

      const onFullscreenChange = () => {
        if (!document.fullscreenElement && !(document as any).webkitIsFullScreen && !(document as any).mozFullScreen && !(document as any).msFullscreenElement) {
          refocusIfNeeded(40);
        } else {
          refocusIfNeeded(20);
        }
      };

      const fullscreenEvents = [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "MSFullscreenChange",
      ];
      fullscreenEvents.forEach((ev) => document.addEventListener(ev, onFullscreenChange));

      art.on("ready", async () => {
        try {
          container.focus();
        } catch (e) {
          // ignore
        }

        const continueWatchingList = JSON.parse(localStorage.getItem("continueWatching") || "[]");
        const currentEntry = continueWatchingList.find((item: any) => item.episodeId === episodeId);
        if (currentEntry?.leftAt) art.currentTime = currentEntry.leftAt;

        art.on("video:timeupdate", () => {
          leftAtRef.current = Math.floor(art.currentTime);
        });

        setTimeout(() => {
          (art.layers as any).website_logo.style.opacity = 0;
        }, 2000);

        // === SUBTITLE LOADING ===
        // Filter to only caption/subtitle tracks (exclude thumbnails)
        const captionTracks = (subtitles || []).filter(
          (s: any) => s.kind === "captions" || s.kind === "subtitles"
        );

        // Build subtitle list with multiple URL strategies
        const subs = captionTracks.map((s: any) => ({
          ...s,
          directUrl: s.file,
          proxyUrl1: `${proxy}${encodeURIComponent(s.file)}`,
          // Direct URL works best in production (corsproxy.io blocks non-localhost)
          url: s.file,
        }));

        // Function to try loading a subtitle with fallback
        const tryLoadSubtitle = async (sub: any) => {
          // Try direct first (works in production), then CORS proxy
          const urls = [sub.directUrl, sub.proxyUrl1];
          for (const url of urls) {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 5000);
              const res = await fetch(url, { signal: controller.signal });
              clearTimeout(timer);
              if (res.ok) {
                const text = await res.text();
                if (text && text.includes("WEBVTT")) {
                  return url;
                }
              }
            } catch {
              // Try next URL
            }
          }
          return sub.directUrl; // Default fallback
        };

        // Load default English subtitle with fallback strategy
        const defaultSubtitle =
          subs.find((sub: any) => sub.label?.toLowerCase() === "english" && sub.default) ||
          subs.find((sub: any) => sub.label?.toLowerCase() === "english") ||
          subs[0];

        if (defaultSubtitle) {
          try {
            const workingUrl = await tryLoadSubtitle(defaultSubtitle);
            defaultSubtitle.url = workingUrl;
            art.subtitle.switch(workingUrl, { name: defaultSubtitle.label });
            // Update all subs to use the same strategy that worked
            const useDirect = !workingUrl.startsWith(proxy);
            subs.forEach((s: any) => {
              s.url = useDirect ? s.directUrl : s.proxyUrl1;
            });
          } catch (e) {
            console.error("Failed to load default subtitle:", e);
          }
        }

        // Reactive auto-skip: checks ref on every timeupdate so toggling works live
        const skipRanges = [
          ...(intro?.start != null && intro?.end != null && intro.start + 1 < intro.end - 1 ? [[intro.start + 1, intro.end - 1]] : []),
          ...(outro?.start != null && outro?.end != null && outro.start + 1 < outro.end ? [[outro.start + 1, outro.end]] : []),
        ];
        if (skipRanges.length > 0) {
          art.on("video:timeupdate", () => {
            if (!autoSkipRef.current) return;
            const currentTime = art.currentTime;
            for (const [start, end] of skipRanges) {
              if (currentTime >= start && currentTime < end) {
                art.seek = end;
                break;
              }
            }
          });
        }

        const boundKeydown = (event: KeyboardEvent) => handleKeydown(event, art);
        boundKeydownRef.current = boundKeydown;
        document.addEventListener("keydown", boundKeydown);

        const focusOnPointerDown = () => {
          try {
            container.focus();
          } catch (err) {
            // ignore
          }
        };
        container.addEventListener("pointerdown", focusOnPointerDown, { passive: true } as any);

        const onWindowFocus = () => refocusIfNeeded(30);
        window.addEventListener("focus", onWindowFocus);

        art.on("destroy", () => {
          try {
            document.removeEventListener("keydown", boundKeydown);
          } catch (e) {}
          try {
            container.removeEventListener("pointerdown", focusOnPointerDown);
          } catch (e) {}
          try {
            window.removeEventListener("focus", onWindowFocus);
          } catch (e) {}
        });

        art.subtitle.style({
          fontSize: (art.width > 500 ? art.width * 0.02 : art.width * 0.03) + "px",
        });

        if (thumbnail) {
          art.plugins.add(
            artplayerPluginVttThumbnail({
              vtt: `${proxy}${encodeURIComponent(thumbnail)}`,
            })
          );
        }

        const $rewind = (art.layers as any)["rewind"];
        const $forward = (art.layers as any)["forward"];
        (Artplayer as any).utils.isMobile &&
          (art as any).proxy($rewind, "dblclick", () => {
            art.currentTime = Math.max(0, art.currentTime - 10);
            (art.layers as any)["backwardIcon"].style.opacity = 1;
            setTimeout(() => {
              (art.layers as any)["backwardIcon"].style.opacity = 0;
            }, 300);
          });
        (Artplayer as any).utils.isMobile &&
          (art as any).proxy($forward, "dblclick", () => {
            art.currentTime = Math.max(0, art.currentTime + 10);
            (art.layers as any)["forwardIcon"].style.opacity = 1;
            setTimeout(() => {
              (art.layers as any)["forwardIcon"].style.opacity = 0;
            }, 300);
          });

        // Subtitle settings menu
        if (subs?.length > 0) {
          const defaultEnglishSub =
            subs.find((sub: any) => sub.label?.toLowerCase() === "english" && sub.default) ||
            subs.find((sub: any) => sub.label?.toLowerCase() === "english");

          art.setting.add({
            name: "captions",
            icon: captionIcon,
            html: "Subtitle",
            tooltip: defaultEnglishSub?.label || subs[0]?.label || "default",
            position: "right",
            selector: [
              {
                html: "Display",
                switch: true,
                onSwitch: (item: any) => {
                  item.tooltip = item.switch ? "Hide" : "Show";
                  art.subtitle.show = !item.switch;
                  return !item.switch;
                },
              },
              ...subs.map((sub: any) => ({
                default: sub === defaultEnglishSub || (subs.length === 1),
                html: sub.label,
                url: sub.url,
              })),
            ],
            onSelect: (item: any) => {
              art.subtitle.switch(item.url, { name: item.html });
              return item.html;
            },
          });
        }
      });

      // Cleanup for this player instance
      const cleanup = () => {
        destroyed = true;
        if (art && art.destroy) {
          art.destroy(false);
        }

        fullscreenEvents.forEach((ev) => document.removeEventListener(ev, onFullscreenChange));
        if (boundKeydownRef.current) {
          try {
            document.removeEventListener("keydown", boundKeydownRef.current);
          } catch (e) {}
          boundKeydownRef.current = null;
        }
        if (fullscreenRefocusTimeout) clearTimeout(fullscreenRefocusTimeout);

        try {
          const continueWatching = JSON.parse(localStorage.getItem("continueWatching") || "[]");
          const newEntry = {
            id: animeInfo?.id,
            data_id: animeInfo?.data_id,
            episodeId,
            episodeNum,
            adultContent: animeInfo?.adultContent,
            poster: animeInfo?.poster,
            title: animeInfo?.title,
            japanese_title: animeInfo?.japanese_title,
            leftAt: leftAtRef.current,
            updatedAt: Date.now(),
          };

          if (!newEntry.data_id) return;

          const filtered = continueWatching.filter((item: any) => item.data_id !== newEntry.data_id);
          filtered.unshift(newEntry);
          localStorage.setItem("continueWatching", JSON.stringify(filtered));
        } catch (err) {
          console.error("Failed to save continueWatching:", err);
        }
      };

      // Store cleanup so the effect can call it
      cleanupRef.current = cleanup;
    };

    const cleanupRef = { current: () => { destroyed = true; } };
    initPlayer();

    return () => {
      cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, subtitles, intro, outro]);

  return <div ref={artRef} className="w-full h-full" />;
}
