import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import AnimeSectionGrid from "@/components/AnimeSectionGrid";
import ContinueWatching from "@/components/ContinueWatching";
import { Flame, Clock, Star, Heart, CheckCircle, TrendingUp, Sparkles } from "lucide-react";
import { getHomeData } from "@/services/animeApi";
import type { HomeData } from "@/types/anime";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [homeBg, setHomeBg] = useState<string | null>(null);

  useEffect(() => {
    const bg = localStorage.getItem("custom_home_bg");
    setHomeBg(bg);
    const interval = setInterval(() => {
      const current = localStorage.getItem("custom_home_bg");
      setHomeBg(prev => prev !== current ? current : prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getHomeData();
        setHomeData(data);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div
      className={homeBg ? "space-y-0 relative custom-bg-image custom-bg-overlay" : "space-y-0"}
      style={homeBg ? { backgroundImage: `url(${homeBg})`, backgroundAttachment: "fixed" } : undefined}
    >
      <HeroSection />

      {/* Continue Watching — only shows for logged-in users with history */}
      <ContinueWatching />

      {/* Neon divider */}
      <div className="neon-line opacity-30 mx-auto max-w-7xl" />

      {/* ── Spring 2026 section — featured at top ── */}
      <AnimeSectionGrid
        title="Spring 2026"
        subtitle="This Season's Most Popular Anime"
        icon={Sparkles}
        animeList={homeData?.spring2026 || []}
        viewAllLink="/category/top-airing"
        loading={loading}
        limit={18}
      />

      <div className="neon-line opacity-20 mx-auto max-w-7xl" />

      <AnimeSectionGrid
        title={t("home.trendingNow")}
        subtitle={t("home.mostWatched")}
        icon={TrendingUp}
        animeList={homeData?.trending || []}
        viewAllLink="/category/trending"
        loading={loading}
        limit={18}
      />

      <AnimeSectionGrid
        title={t("home.topAiring")}
        subtitle={t("home.currentlyBroadcasting")}
        icon={Flame}
        animeList={homeData?.topAiring || []}
        viewAllLink="/category/top-airing"
        loading={loading}
        limit={12}
      />

      <AnimeSectionGrid
        title={t("home.mostPopular")}
        subtitle={t("home.fanFavorites")}
        icon={Star}
        animeList={homeData?.mostPopular || []}
        viewAllLink="/category/most-popular"
        loading={loading}
        limit={12}
      />

      <AnimeSectionGrid
        title={t("home.mostFavorite")}
        subtitle={t("home.highestRated")}
        icon={Heart}
        animeList={homeData?.mostFavorite || []}
        viewAllLink="/category/most-favorite"
        loading={loading}
        limit={12}
      />

      <AnimeSectionGrid
        title={t("home.recentlyCompleted")}
        subtitle={t("home.finishedAiring")}
        icon={CheckCircle}
        animeList={homeData?.latestCompleted || []}
        viewAllLink="/category/completed"
        loading={loading}
        limit={12}
      />

      <AnimeSectionGrid
        title={t("home.latestEpisodes")}
        subtitle={t("home.newestReleases")}
        icon={Clock}
        animeList={homeData?.latestEpisode || []}
        viewAllLink="/category/recently-updated"
        loading={loading}
        limit={18}
      />
    </div>
  );
};

export default Index;
