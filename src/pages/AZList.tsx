import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import PeerTubeCard from "@/components/PeerTubeCard";
import { getVideos, searchVideos, type PeerTubeVideo } from "@/services/peertubeApi";

const AZList = () => {
  const [selectedLetter, setSelectedLetter] = useState("All");
  const [videos, setVideos] = useState<PeerTubeVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<PeerTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const alphabet = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("")];

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const data = await getVideos(0, 100, "name");
        setVideos(data.data || []);
      } catch (error) {
        console.error("Failed to fetch PeerTube videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    let filtered = videos;

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by letter
    if (selectedLetter !== "All") {
      if (selectedLetter === "#") {
        filtered = filtered.filter((v) => /^[^a-zA-Z]/.test(v.name));
      } else {
        filtered = filtered.filter((v) =>
          v.name.toUpperCase().startsWith(selectedLetter)
        );
      }
    }

    setFilteredVideos(filtered);
  }, [videos, selectedLetter, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-glow mb-4">A-Z Video List</h1>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Alphabet Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1.5">
          {alphabet.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedLetter(letter)}
              className={letter === "All" ? "px-4 h-9" : "w-9 h-9"}
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading videos from PeerTube...</span>
        </div>
      )}

      {/* Video Grid */}
      {!loading && filteredVideos.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredVideos.length} of {videos.length} videos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredVideos.map((video) => (
              <PeerTubeCard key={video.uuid} video={video} />
            ))}
          </div>
        </>
      )}

      {/* No Results */}
      {!loading && filteredVideos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            {searchQuery
              ? `No videos found matching "${searchQuery}"`
              : `No videos found starting with "${selectedLetter}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AZList;
