import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Activity, RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScoreCard from "@/components/ScoreCard";
import ScoreCardSkeleton from "@/components/ScoreCardSkeleton";
import TelegramWidget from "@/components/TelegramWidget";
import { toast } from "sonner";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const REFRESH_INTERVAL = 30000; // 30 seconds

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMatches = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const response = await axios.get(`${API}/matches/current`);
      if (response.data.status === "success") {
        setMatches(response.data.data || []);
        setError(null);
        setLastUpdate(new Date());
        if (showToast) toast.success("Scores updated!");
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Unable to fetch live scores. Please try again.");
      if (showToast) toast.error("Failed to refresh scores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    
    // Auto-refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => fetchMatches(), REFRESH_INTERVAL);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchMatches, autoRefresh]);

  const handleRefresh = () => {
    fetchMatches(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled (30s)");
  };

  // Separate live and other matches
  const liveMatches = matches.filter(m => 
    m.status?.toLowerCase().includes("live") || 
    m.status?.toLowerCase().includes("innings") ||
    (m.score && m.score.length > 0 && 
     !m.status?.toLowerCase().includes("won") &&
     !m.status?.toLowerCase().includes("match not started"))
  );
  const otherMatches = matches.filter(m => !liveMatches.includes(m));

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-section relative py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cricket-blue/10 border border-cricket-blue/20 mb-6">
              <Activity className="w-4 h-4 text-cricket-blue" />
              <span className="text-sm text-cricket-lightBlue font-medium">Live Cricket Scores</span>
            </div>
            
            <h1 className="font-score text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              KSP <span className="text-cricket-blue">CRICKET</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Real-time cricket scores with Telegram alerts. Auto-refreshes every 30 seconds.
            </p>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2 bg-cricket-blue hover:bg-cricket-blue/90 btn-press"
                size="lg"
                data-testid="refresh-btn"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Now'}
              </Button>
              
              <Button
                onClick={toggleAutoRefresh}
                variant="outline"
                size="lg"
                className={`gap-2 ${autoRefresh ? 'border-cricket-live text-cricket-live' : 'border-muted-foreground'}`}
                data-testid="auto-refresh-btn"
              >
                {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
              </Button>
            </div>

            {/* Last Update Time */}
            {lastUpdate && (
              <p className="text-xs text-muted-foreground mt-4">
                Last updated: {lastUpdate.toLocaleTimeString('en-IN')}
                {autoRefresh && " • Auto-refresh: 30s"}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Matches Section */}
      <section className="py-8 md:py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="mb-8">
              <h2 className="font-score text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="live-dot"></div>
                Live Matches
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <ScoreCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-cricket-wicket mx-auto mb-4" />
              <h3 className="font-score text-xl text-white mb-2">Oops! Something went wrong</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-cricket-blue mx-auto mb-4 opacity-50" />
              <h3 className="font-score text-xl text-white mb-2">No Live Matches</h3>
              <p className="text-muted-foreground">Check back later for live cricket action!</p>
            </div>
          ) : (
            <>
              {/* Live Matches */}
              {liveMatches.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-score text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                      <div className="live-dot"></div>
                      Live Matches
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({liveMatches.length})
                      </span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveMatches.map((match, index) => (
                      <ScoreCard 
                        key={`${match.id}-${match.status}`}
                        match={match} 
                        index={index}
                        isHero={index === 0 && liveMatches.length === 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Matches */}
              {otherMatches.length > 0 && (
                <div className="mb-10">
                  <h2 className="font-score text-xl md:text-2xl font-bold text-white mb-6">
                    Recent & Upcoming
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({otherMatches.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherMatches.slice(0, 9).map((match, index) => (
                      <ScoreCard 
                        key={`${match.id}-${match.status}`}
                        match={match} 
                        index={index + liveMatches.length}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Telegram Widget */}
          <div className="mt-12">
            <TelegramWidget />
          </div>
        </div>
      </section>
    </div>
  );
}
