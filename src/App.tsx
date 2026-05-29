import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import { AuthProvider, useAuth } from "./contexts/AuthProvider";

// Lazy-load all non-critical pages
const Movies = lazy(() => import("./pages/Movies"));
const TVSeries = lazy(() => import("./pages/TVSeries"));
const GenrePage = lazy(() => import("./pages/GenrePage"));
const AnimeDetails = lazy(() => import("./pages/AnimeDetails"));
const WatchPage = lazy(() => import("./pages/WatchPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AZList = lazy(() => import("./pages/AZList"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const RecentlyAdded = lazy(() => import("./pages/RecentlyAdded"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PeerTubeWatch = lazy(() => import("./pages/PeerTubeWatch"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Hindi = lazy(() => import("./pages/Hindi"));
const HindiWatch = lazy(() => import("./pages/HindiWatch"));
const AnimeyaPage = lazy(() => import("./pages/AnimeyaPage"));
const AnimeyaWatch = lazy(() => import("./pages/AnimeyaWatch"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const UserProfile = lazy(() => import("./pages/UserProfile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000, // 10 min (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/most-popular" element={<Hindi />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv-series" element={<TVSeries />} />
              <Route path="/genre/:genreName" element={<GenrePage />} />
              <Route path="/anime/:id" element={<AnimeDetails />} />
              <Route path="/watch/:id" element={<WatchPage />} />
              <Route path="/uploads" element={<AZList />} />
              <Route path="/recently-added" element={<RecentlyAdded />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pt-watch/:uuid" element={<PeerTubeWatch />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/hindi" element={<Hindi />} />
              <Route path="/hindi/:slug" element={<HindiWatch />} />
              <Route path="/animeya" element={<AnimeyaPage />} />
              <Route path="/animeya/:slug" element={<AnimeyaWatch />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
