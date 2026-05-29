import { Link } from "react-router-dom";
import { Play, Star, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getThumbnailUrl, formatDuration, type PeerTubeVideo } from "@/services/peertubeApi";

interface PeerTubeCardProps {
  video: PeerTubeVideo;
  className?: string;
}

const PeerTubeCard = ({ video, className = "" }: PeerTubeCardProps) => {
  return (
    <div className={`group relative anime-card overflow-hidden ${className}`}>
      <div className="relative aspect-video overflow-hidden bg-muted rounded-t-lg">
        <img
          src={getThumbnailUrl(video.previewPath || video.thumbnailPath)}
          alt={video.name}
          loading="lazy"
          decoding="async"
          width={320}
          height={180}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              size="sm"
              className="w-full mb-2 bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs shadow-lg"
              asChild
            >
              <Link to={`/pt-watch/${video.uuid}`}>
                <Play className="h-3 w-3 mr-1" />
                Watch Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Category Badge */}
        {video.category?.label && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-secondary/90 backdrop-blur-sm text-xs"
          >
            {video.category.label}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <Link to={`/pt-watch/${video.uuid}`} className="block">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {video.name}
          </h3>
        </Link>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{video.views?.toLocaleString() || 0}</span>
          </div>
          {video.likes > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{video.likes}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(video.duration)}</span>
          </div>
        </div>

        {video.channel?.displayName && (
          <p className="text-xs text-muted-foreground truncate">
            {video.channel.displayName}
          </p>
        )}
      </div>
    </div>
  );
};

export default PeerTubeCard;
