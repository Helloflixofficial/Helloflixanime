import { useState, useEffect } from "react";
import { Search, Grid3X3, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PeerTubeCard from "@/components/PeerTubeCard";
import { getVideos, PT_CATEGORIES, type PeerTubeVideo } from "@/services/peertubeApi";
import { useTranslation } from "react-i18next";

const TVSeries = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-views');
  const [videos, setVideos] = useState<PeerTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true);
      try {
        // Fetch entertainment category (10) for TV series
        const data = await getVideos(0, 100, sortBy, [PT_CATEGORIES.ENTERTAINMENT]);
        setVideos(data.data || []);
      } catch (error) {
        console.error("Failed to fetch TV series:", error);
        try {
          const allData = await getVideos(0, 100, sortBy);
          setVideos(allData.data || []);
        } catch (e) {
          console.error("Failed to fetch all videos:", e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [sortBy]);

  const filteredSeries = videos.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("tvSeries.title")}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search TV series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-views">Most Viewed</SelectItem>
              <SelectItem value="-publishedAt">Newest</SelectItem>
              <SelectItem value="-likes">Most Liked</SelectItem>
              <SelectItem value="name">A-Z</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading TV series...</span>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredSeries.length} of {videos.length} results
            </p>
          </div>

          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {filteredSeries.map((video) => (
              <PeerTubeCard key={video.uuid} video={video} />
            ))}
          </div>

          {filteredSeries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No TV series found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TVSeries;
