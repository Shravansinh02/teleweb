import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Calendar, Clock, Users, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TelegramWidget from "@/components/TelegramWidget";
import { toast } from "sonner";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MatchDetailsPage() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatchDetails = async () => {
    try {
      const response = await axios.get(`${API}/matches/${matchId}`);
      if (response.data.status === "success") {
        setMatch(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching match:", err);
      setError("Unable to load match details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails();
    const interval = setInterval(fetchMatchDetails, 30000);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: match?.name || "KSP Cricket Match",
          text: `Check out this match: ${match?.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const isLive = match?.status?.toLowerCase().includes("live") || 
                 match?.status?.toLowerCase().includes("innings") ||
                 (match?.score && match?.score.length > 0 && !match?.status?.toLowerCase().includes("won"));

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="skeleton w-32 h-8 rounded mb-8"></div>
            <div className="skeleton w-full h-64 rounded-2xl mb-6"></div>
            <div className="skeleton w-full h-48 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="font-score text-2xl text-white mb-4">Match Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "The match you're looking for doesn't exist."}</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8" data-testid="match-details-page">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="gap-2 mb-6" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" />
            Back to Matches
          </Button>
        </Link>

        {/* Match Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={`match-card p-6 md:p-8 mb-6 ${isLive ? 'live' : ''}`}>
            {/* Status Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {isLive && (
                  <div className="live-badge">
                    <span className="live-dot"></span>
                    LIVE
                  </div>
                )}
                {match.matchType && (
                  <span className="match-type-badge">
                    {match.matchType.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={fetchMatchDetails}
                  data-testid="refresh-match-btn"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleShare}
                  data-testid="share-btn"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Match Name */}
            <h1 className="font-score text-2xl md:text-3xl font-bold text-white mb-6">
              {match.name}
            </h1>

            {/* Scores */}
            <div className="space-y-4 mb-6">
              {match.teams?.map((team, idx) => {
                const teamScore = match.score?.find(s => 
                  s.inning?.toLowerCase().includes(team.toLowerCase().split(' ')[0])
                ) || match.score?.[idx];

                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between bg-stadium-subtle rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cricket-blue/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-cricket-blue" />
                      </div>
                      <span className="team-name text-base md:text-lg text-white">
                        {team}
                      </span>
                    </div>
                    {teamScore ? (
                      <div className="text-right">
                        <div className="score-display text-white">
                          {teamScore.r}/{teamScore.w}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ({teamScore.o} overs)
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Yet to bat</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status */}
            <div className={`text-center py-4 rounded-xl ${isLive ? 'bg-cricket-live/10' : 'bg-cricket-blue/10'}`}>
              <p className={`font-medium text-lg ${isLive ? 'text-cricket-live' : 'text-cricket-blue'}`}>
                {match.status}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Match Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="match-card p-6 mb-6">
            <h2 className="font-score text-lg font-bold text-white mb-4">Match Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {match.venue && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cricket-blue mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Venue</p>
                    <p className="text-white">{match.venue}</p>
                  </div>
                </div>
              )}
              {match.date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-cricket-blue mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="text-white">
                      {new Date(match.date).toLocaleDateString('en-IN', { 
                        weekday: 'long',
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {match.dateTimeGMT && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-cricket-blue mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Time (GMT)</p>
                    <p className="text-white">
                      {new Date(match.dateTimeGMT).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {match.tossWinner && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-cricket-boundary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Toss</p>
                    <p className="text-white">
                      {match.tossWinner} won the toss and chose to {match.tossChoice}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Telegram Widget */}
        <TelegramWidget />
      </div>
    </div>
  );
}
