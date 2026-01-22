import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  RefreshCw,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TelegramWidget from "@/components/TelegramWidget";
import { toast } from "sonner";
import { motion } from "framer-motion";

/* ✅ VITE ENV (CORRECT) */
const BACKEND_URL = import.meta.env.VITE_API_URL;
const API = `${BACKEND_URL}/api`;

export default function MatchDetailsPage() {
  const { matchId } = useParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ✅ useCallback FIX (ESLint + Cloudflare) */
  const fetchMatchDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/matches/${matchId}`);
      if (response.data?.status === "success") {
        setMatch(response.data.data);
        setError(null);
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      console.error("Error fetching match:", err);
      setError("Unable to load match details.");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  /* ✅ useEffect dependency FIX */
  useEffect(() => {
    fetchMatchDetails();
    const interval = setInterval(fetchMatchDetails, 30000);
    return () => clearInterval(interval);
  }, [fetchMatchDetails]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: match?.name || "KSP Cricket Match",
          text: `Check out this match: ${match?.name}`,
          url: window.location.href,
        });
      } catch {
        /* ignored */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const isLive =
    match?.status?.toLowerCase().includes("live") ||
    match?.status?.toLowerCase().includes("innings") ||
    (match?.score?.length > 0 &&
      !match?.status?.toLowerCase().includes("won"));

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */
  if (error || !match) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Match Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || "The match you're looking for doesn't exist."}
          </p>
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

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Matches
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`p-6 mb-6 ${isLive ? "live" : ""}`}>
            <div className="flex justify-between mb-4">
              <div className="flex gap-2">
                {isLive && <span className="live-badge">LIVE</span>}
                {match.matchType && (
                  <span className="badge">
                    {match.matchType.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={fetchMatchDetails}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">
              {match.name}
            </h1>

            <div className="space-y-3 mb-4">
              {match.teams?.map((team, idx) => {
                const score = match.score?.[idx];
                return (
                  <div
                    key={idx}
                    className="flex justify-between bg-muted p-4 rounded-lg"
                  >
                    <span className="text-white">{team}</span>
                    {score ? (
                      <span className="text-white">
                        {score.r}/{score.w} ({score.o})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Yet to bat
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center font-semibold text-primary">
              {match.status}
            </p>
          </Card>
        </motion.div>

        <Card className="p-6 mb-6">
          <h2 className="font-bold mb-4">Match Info</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {match.venue && (
              <Info icon={MapPin} label="Venue" value={match.venue} />
            )}
            {match.date && (
              <Info
                icon={Calendar}
                label="Date"
                value={new Date(match.date).toLocaleDateString("en-IN")}
              />
            )}
            {match.dateTimeGMT && (
              <Info
                icon={Clock}
                label="Time"
                value={new Date(match.dateTimeGMT).toLocaleTimeString(
                  "en-IN"
                )}
              />
            )}
            {match.tossWinner && (
              <Info
                icon={Users}
                label="Toss"
                value={`${match.tossWinner} chose ${match.tossChoice}`}
              />
            )}
          </div>
        </Card>

        <TelegramWidget />
      </div>
    </div>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */
function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon className="w-5 h-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-white">{value}</p>
      </div>
    </div>
  );
}
