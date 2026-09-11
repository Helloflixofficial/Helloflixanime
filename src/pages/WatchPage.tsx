import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MoviPlayer from "@/components/player/MoviPlayer";
import EpisodeList from "@/components/watch/EpisodeList";
import ServerSelector from "@/components/watch/ServerSelector";
import WatchControls from "@/components/watch/WatchControls";
import RelatedAnime from "@/components/watch/RelatedAnime";
import AnimeInfoSection from "@/components/watch/AnimeInfoSection";
import CommentSection from "@/components/watch/CommentSection";
import RatingSection from "@/components/watch/RatingSection";
import { clearDdlCache, getEpisodes, getStreamingInfo, getAnimeDetails } from "@/services/animeApi";
import type { Episode, Server, AnimeBasic } from "@/types/anime";
import { Skeleton } from "@/components/ui/skeleton";
import { saveWatchProgress } from "@/services/userDataService";

const slugifyServer = (name?: string) =>
  (name || "").toString().trim().toLowerCase().replace(/\s+/g, "-");

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const epParam = searchParams.get("ep");

  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [totalEpisodes, setTotalEpisodes] = useState<number>(0);
  const [relatedAnime, setRelatedAnime] = useState<AnimeBasic[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [currentEpisodeNo, setCurrentEpisodeNo] = useState<number>(1);
  const currentEpisode = episodes.find((ep) => ep.episode_no === currentEpisodeNo);
  const [currentType, setCurrentType] = useState<"sub" | "dub">("sub");
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<string>("server-1");
  const [streamingData, setStreamingData] = useState<any>(null);
  const [loadingAnime, setLoadingAnime] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem("autoPlay") !== "false");
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem("autoNext") !== "false");
  const [autoSkip, setAutoSkip] = useState(() => localStorage.getItem("autoSkip") !== "false");
  const [streamError, setStreamError] = useState(false);
  const [allServersFailed, setAllServersFailed] = useState(false);
  const [streamRetry, setStreamRetry] = useState(0);
  const failedServersRef = useRef<Set<string>>(new Set());
  const streamRequestIdRef = useRef(0);
  const freshMirrorRetryRef = useRef(0);

  // Persist toggle preferences
  useEffect(() => { localStorage.setItem("autoPlay", String(autoPlay)); }, [autoPlay]);
  useEffect(() => { localStorage.setItem("autoNext", String(autoNext)); }, [autoNext]);
  useEffect(() => { localStorage.setItem("autoSkip", String(autoSkip)); }, [autoSkip]);

  // Fetch anime details
  useEffect(() => {
    const fetchAnimeDetails = async () => {
      if (!id) return;
      setLoadingAnime(true);
      try {
        const result = await getAnimeDetails(id);
        setAnime(result.data);
        setRelatedAnime(result.related_data || []);
        setSeasons(result.seasons || []);
      } catch (error) {
        console.error("Failed to fetch anime details:", error);
      } finally {
        setLoadingAnime(false);
      }
    };
    fetchAnimeDetails();
  }, [id]);

  // Fetch episodes
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!id) return;
      setLoadingEpisodes(true);
      try {
        const data = await getEpisodes(id);
        const eps = data.episodes || [];
        setEpisodes(eps);
        setTotalEpisodes(data.totalEpisodes || eps.length);
        const initialEp = epParam ? parseInt(epParam) : 1;
        const validEp = eps.find((ep) => ep.episode_no === initialEp)?.episode_no || eps[0]?.episode_no || 1;
        setCurrentEpisodeNo(validEp);
      } catch (error) {
        console.error("Failed to fetch episodes:", error);
      } finally {
        setLoadingEpisodes(false);
      }
    };
    fetchEpisodes();
  }, [id]);

  useEffect(() => {
    if (currentEpisodeNo) {
      setSearchParams({ ep: String(currentEpisodeNo) }, { replace: true });
    }
  }, [currentEpisodeNo, setSearchParams]);

  const getEpisodeIdForApi = useCallback(() => {
    if (!currentEpisode?.id) return null;
    return currentEpisode.id;
  }, [currentEpisode]);

  // Reset failed servers on episode change
  useEffect(() => {
    failedServersRef.current.clear();
    freshMirrorRetryRef.current = 0;
    setAllServersFailed(false);
    setStreamError(false);
    setStreamingData(null);
    setServers([]);
    setCurrentServer("server-1");
    setCurrentType("sub");
  }, [currentEpisodeNo]);

  const getNextServer = useCallback((): { serverId: string; type: "sub" | "dub" } | null => {
    const currentKey = `${currentType}:${currentServer}`;
    failedServersRef.current.add(currentKey);

    // Try same type first, then other type
    const typesToTry: ("sub" | "dub")[] = [currentType, currentType === "sub" ? "dub" : "sub"];
    
    for (const type of typesToTry) {
      const typeServers = servers.filter((s) => s.type === type);
      for (const server of typeServers) {
        const serverId = slugifyServer(server.server_name || server.serverName);
        const key = `${type}:${serverId}`;
        if (!failedServersRef.current.has(key)) {
          return { serverId, type };
        }
      }
    }
    return null; // All servers tried
  }, [servers, currentServer, currentType]);

  // Auto-fallback to next server
  const tryNextServer = useCallback(async () => {
    const next = getNextServer();
    if (next) {
      console.log(`[AutoFallback] Switching to server: ${next.type}:${next.serverId}`);
      setCurrentType(next.type);
      setCurrentServer(next.serverId);
      setStreamError(false);
      setStreamingData(null);
      setLoadingStream(true);
    } else {
      // Mirror URLs rotate and an entire resolver response can contain stale
      // or invalid file IDs. Refresh the resolver once before showing the
      // terminal error state to the user.
      const episodeApiId = getEpisodeIdForApi();
      if (episodeApiId && freshMirrorRetryRef.current < 1) {
        freshMirrorRetryRef.current += 1;
        clearDdlCache(episodeApiId);
        failedServersRef.current.clear();
        setAllServersFailed(false);
        setStreamingData(null);
        setLoadingStream(true);
        setCurrentType("sub");
        setCurrentServer("server-1");
        setStreamRetry((value) => value + 1);
        return;
      }
      console.log("[AutoFallback] All HindMovies servers failed");
      setAllServersFailed(true);
      setLoadingStream(false);
    }
  }, [getEpisodeIdForApi, getNextServer]);

  // Fetch streaming info with timeout fallback
  useEffect(() => {
    const fetchStream = async () => {
      const requestId = ++streamRequestIdRef.current;
      const episodeApiId = getEpisodeIdForApi();
      if (!episodeApiId || !currentServer) return;
      setLoadingStream(true);
      setStreamError(false);

      try {
        const info = await getStreamingInfo(episodeApiId, currentServer, currentType);
        if (requestId !== streamRequestIdRef.current) return;
        
        // The single DDL response already contains every mirror. Populate the
        // selector immediately after the first server URL is ready; never make
        // a second resolver request just to discover the other buttons.
        if (info.servers && info.servers.length > 0) {
          setServers((previous) => {
            const unchanged = previous.length === info.servers.length && previous.every((server, index) => {
              const next = info.servers[index];
              return next && server.type === next.type && server.data_id === next.data_id;
            });
            return unchanged ? previous : info.servers;
          });
        }

        const sl = Array.isArray(info?.streamingLink) ? info.streamingLink[0] : info?.streamingLink;
        const streamUrl = sl?.link?.file;
        if (!streamUrl) {
          // No stream URL - try next server
          console.log(`[AutoFallback] No stream URL from ${currentType}:${currentServer}`);
          tryNextServer();
          return;
        }

        setStreamingData(info);
      } catch (error) {
        if (requestId !== streamRequestIdRef.current) return;
        console.error("Failed to fetch streaming info:", error);
        // Auto-fallback on error
        tryNextServer();
        return;
      } finally {
        if (requestId === streamRequestIdRef.current) setLoadingStream(false);
      }
    };
    fetchStream();

    return () => {
      streamRequestIdRef.current += 1;
    };
  }, [currentEpisode?.id, currentServer, currentType, getEpisodeIdForApi, streamRetry, tryNextServer]);

  const handleEpisodeChange = useCallback((episodeNo: number) => {
    setCurrentEpisodeNo(episodeNo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goPrev = () => {
    const idx = episodes.findIndex((ep) => ep.episode_no === currentEpisodeNo);
    if (idx > 0) handleEpisodeChange(episodes[idx - 1].episode_no);
  };

  const goNext = () => {
    const idx = episodes.findIndex((ep) => ep.episode_no === currentEpisodeNo);
    if (idx < episodes.length - 1) handleEpisodeChange(episodes[idx + 1].episode_no);
  };

  const handleServerChange = (serverId: string, type: "sub" | "dub") => {
    failedServersRef.current.clear();
    setAllServersFailed(false);
    setStreamError(false);
    setStreamingData(null);
    setLoadingStream(true);
    setCurrentServer(serverId);
    setCurrentType(type);
  };

  const handleTypeChange = (type: "sub" | "dub") => {
    setCurrentType(type);
    const available = servers.filter((s) => s.type === type);
    if (available.length > 0) {
      setCurrentServer(slugifyServer(available[0].server_name || available[0].serverName));
    }
  };

  const handleRetryAll = () => {
    failedServersRef.current.clear();
    setAllServersFailed(false);
    setStreamError(false);
    const episodeApiId = getEpisodeIdForApi();
    if (episodeApiId) clearDdlCache(episodeApiId);
    freshMirrorRetryRef.current = 0;
    setStreamingData(null);
    setLoadingStream(true);
    setStreamRetry((value) => value + 1);
    // Re-trigger by resetting to first server
    const subServers = servers.filter((s) => s.type === "sub");
    if (subServers.length > 0) {
      setCurrentType("sub");
      setCurrentServer(slugifyServer(subServers[0].server_name || subServers[0].serverName));
    }
  };

  const sl = Array.isArray(streamingData?.streamingLink) ? streamingData.streamingLink[0] : streamingData?.streamingLink;
  const defaultStreamUrl = sl?.link?.file;
  const streamUrl = defaultStreamUrl;
  const currentIdx = episodes.findIndex((ep) => ep.episode_no === currentEpisodeNo);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < episodes.length - 1;

  // Save watch progress periodically
  const progressIntervalRef = useRef<any>(null);
  useEffect(() => {
    if (!id || !anime || !streamUrl) return;

    // Save progress every 30 seconds by checking the video element
    progressIntervalRef.current = setInterval(() => {
      const video = document.querySelector("video");
      if (video && video.currentTime > 10 && video.duration > 0) {
        saveWatchProgress({
          animeId: id,
          animeTitle: anime.title || "",
          animeImage: anime.poster || null,
          episodeNo: currentEpisodeNo,
          progress: video.currentTime,
          duration: video.duration,
        });
      }
    }, 30000);

    return () => {
      // Save on cleanup too
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      const video = document.querySelector("video");
      if (video && video.currentTime > 10 && id && anime) {
        saveWatchProgress({
          animeId: id,
          animeTitle: anime.title || "",
          animeImage: anime.poster || null,
          episodeNo: currentEpisodeNo,
          progress: video.currentTime,
          duration: video.duration,
        });
      }
    };
  }, [id, anime?.title, currentEpisodeNo, streamUrl]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Header Bar */}
      <div className="glass-panel border-b border-border/20">
        <div className="max-w-full px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" asChild className="shrink-0 hover:bg-primary/10">
              <Link to={`/anime/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline text-sm">Back</span>
              </Link>
            </Button>
            {anime?.title && (
              <h1 className="text-xs sm:text-sm text-muted-foreground truncate min-w-0 font-medium">
                {anime.title}
                <span className="text-primary ml-1.5">EP {currentEpisodeNo}</span>
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full px-2 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-3 sm:gap-4">
          {/* Left Sidebar - Episode List */}
          <div className="hidden xl:block">
            <div className="sticky top-4 h-[calc(100vh-120px)] rounded-xl overflow-hidden glass-panel">
              {loadingEpisodes ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <EpisodeList
                  episodes={episodes}
                  currentEpisode={String(currentEpisodeNo)}
                  onEpisodeClick={handleEpisodeChange}
                  totalEpisodes={totalEpisodes}
                  hasSubbed={servers.some((s) => s.type === "sub")}
                  hasDubbed={servers.some((s) => s.type === "dub")}
                />
              )}
            </div>
          </div>

          {/* Center - Player Area */}
          <div className="space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden max-w-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              {loadingStream ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-3 border-white/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading stream...</p>
                </div>
              ) : allServersFailed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 gap-3">
                  <p className="text-center text-sm font-medium text-destructive">All servers failed to load</p>
                  <p className="text-center text-xs text-muted-foreground">None of the available servers could provide a stream</p>
                  <Button size="sm" variant="outline" onClick={handleRetryAll} className="mt-2">
                    Retry All Servers
                  </Button>
                </div>
              ) : streamUrl ? (
                sl?.type === "embed" || streamingData?.isEmbed ? (
                  <iframe
                    key={streamUrl}
                    src={streamUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture; popups"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <MoviPlayer
                    streamUrl={streamUrl}
                    autoPlay={autoPlay}
                    title={`${anime?.title || "Video"} Episode ${currentEpisodeNo}`}
                    onError={tryNextServer}
                  />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
                  <p className="text-center mb-2">
                    {loadingEpisodes
                      ? "Loading..."
                      : servers.length === 0
                      ? "Loading servers..."
                      : "No stream available. Try another server."}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <WatchControls
              autoPlay={autoPlay}
              setAutoPlay={setAutoPlay}
              autoNext={autoNext}
              setAutoNext={setAutoNext}
              autoSkip={autoSkip}
              setAutoSkip={setAutoSkip}
              onPrev={goPrev}
              onNext={goNext}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />

            {/* Server Selector */}
            <ServerSelector
              servers={servers}
              activeServerId={currentServer}
              onServerChange={handleServerChange}
              currentType={currentType}
              onTypeChange={handleTypeChange}
              loading={loadingStream}
              episodeNumber={currentEpisodeNo}
            />

            {/* Mobile Episode List */}
            <div className="xl:hidden">
              <div className="glass-panel rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20">
                  <h3 className="font-semibold text-sm">
                    Episodes {totalEpisodes ? `(${totalEpisodes})` : ""}
                  </h3>
                </div>
                <div className="p-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                    {episodes.map((ep) => {
                      const isActive = ep.episode_no === currentEpisodeNo;
                      return (
                        <button
                          key={ep.id || ep.episode_no}
                          onClick={() => handleEpisodeChange(ep.episode_no)}
                          className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                              : "bg-secondary/30 hover:bg-secondary/60 text-foreground"
                          }`}
                        >
                          {ep.episode_no}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Anime Info */}
            <AnimeInfoSection anime={anime} seasons={seasons} currentAnimeId={id} />

            {/* Rating */}
            {id && <RatingSection animeId={id} />}

            {/* Comments */}
            {id && <CommentSection animeId={id} />}
          </div>

          {/* Right Sidebar - Related Anime */}
          <div className="hidden xl:block">
            <div className="sticky top-4">
              {loadingAnime ? (
                <div className="glass-panel rounded-xl p-4 space-y-4">
                  <Skeleton className="h-6 w-24" />
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-16 h-20 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <RelatedAnime relatedAnime={relatedAnime} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Related Anime */}
        <div className="xl:hidden mt-6">
          <RelatedAnime relatedAnime={relatedAnime} />
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
