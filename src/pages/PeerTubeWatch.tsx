import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Eye, ThumbsUp, ThumbsDown, Calendar, Clock, Tag, Tv, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getVideoDetails, getThumbnailUrl, formatDuration, type PeerTubeVideo } from "@/services/peertubeApi";
import PeerTubePlayer from "@/components/PeerTubePlayer";

const PeerTubeWatch = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [video, setVideo] = useState<PeerTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!uuid) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getVideoDetails(uuid);
        setVideo(data);
      } catch (err: any) {
        console.error("Failed to fetch video:", err);
        setError(err.message || "Failed to load video");
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [uuid]);

  const getHlsUrl = (): string | null => {
    if (!video) return null;
    if (video.streamingPlaylists && video.streamingPlaylists.length > 0) {
      return video.streamingPlaylists[0].playlistUrl;
    }
    if (video.files && video.files.length > 0) {
      const videoFile = video.files.find((f: any) => f.hasVideo);
      if (videoFile) return videoFile.fileUrl;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Tv className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-destructive font-medium">{error || "Video not found"}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/az-list">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Videos
          </Link>
        </Button>
      </div>
    );
  }

  const hlsUrl = getHlsUrl();
  const descriptionTruncated = video.description && video.description.length > 200;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border/10">
        <div className="container max-w-7xl px-4 py-2.5 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs gap-1.5" asChild>
            <Link to="/az-list">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <div className="h-4 w-px bg-border/30" />
          <span className="text-xs text-muted-foreground truncate font-medium">{video.name}</span>
        </div>
      </div>

      {/* Player section - full width */}
      <div className="w-full bg-black/40">
        <div className="container max-w-6xl px-0 md:px-4 py-0 md:py-5">
          {hlsUrl ? (
            <PeerTubePlayer hlsUrl={hlsUrl} poster={video.previewPath} title={video.name} />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center text-muted-foreground glass-panel rounded-xl">
              <div className="text-center space-y-3">
                <Tv className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium">No playable stream found</p>
                <p className="text-xs text-muted-foreground">This video may not have been processed yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="container max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title & stats */}
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">{video.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {video.views?.toLocaleString() || 0} views
                </span>
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                  {video.likes || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                  {video.dislikes || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(video.duration)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(video.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            <div className="h-px bg-border/20" />

            {/* Channel */}
            {video.channel && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{video.channel.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">@{video.channel.name}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {video.category?.label && (
                <Badge className="text-[10px] bg-primary/15 text-primary border-primary/25 hover:bg-primary/20">
                  {video.category.label}
                </Badge>
              )}
              {video.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] gap-0.5">
                  <Hash className="h-2.5 w-2.5" />
                  {tag}
                </Badge>
              ))}
              {video.language?.label && (
                <Badge variant="outline" className="text-[10px]">{video.language.label}</Badge>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div className="glass-panel rounded-xl p-4 space-y-2">
                <h2 className="text-sm font-semibold">Description</h2>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {showFullDesc || !descriptionTruncated
                    ? video.description
                    : video.description.slice(0, 200) + "..."}
                </p>
                {descriptionTruncated && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {showFullDesc ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - quality & technical info */}
          <div className="space-y-4">
            {video.streamingPlaylists && video.streamingPlaylists.length > 0 && video.streamingPlaylists[0]?.files?.length > 0 && (
              <div className="glass-panel rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-semibold">Available Quality</h2>
                <div className="flex flex-wrap gap-1.5">
                  {video.streamingPlaylists[0].files.map((file: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-primary/25">
                      {file.resolution?.label || `Stream ${i + 1}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-semibold">Video Info</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(video.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-medium">{new Date(video.publishedAt).toLocaleDateString()}</span>
                </div>
                {video.category?.label && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{video.category.label}</span>
                  </div>
                )}
                {video.language?.label && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium">{video.language.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerTubeWatch;
