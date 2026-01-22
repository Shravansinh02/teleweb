import { Link } from "react-router-dom";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ScoreCard({ match, index = 0, isHero = false }) {
  const isLive = match?.status?.toLowerCase().includes("live") || 
                 match?.status?.toLowerCase().includes("innings") ||
                 (match?.score && match?.score.length > 0 && !match?.status?.toLowerCase().includes("won"));
  
  const teams = match?.teams || [];
  const scores = match?.score || [];
  
  // Get score for each team
  const getTeamScore = (teamIndex) => {
    if (scores.length === 0) return null;
    const teamScore = scores.find(s => s.inning?.toLowerCase().includes(teams[teamIndex]?.toLowerCase().split(' ')[0]));
    return teamScore || scores[teamIndex];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link 
        to={`/match/${match?.id}`}
        className={`match-card block p-5 md:p-6 ${isLive ? 'live' : ''} ${isHero ? 'col-span-full' : ''}`}
        data-testid={`match-card-${index}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="live-badge" data-testid="live-badge">
                <span className="live-dot"></span>
                LIVE
              </div>
            )}
            {match?.matchType && (
              <span className="match-type-badge">
                {match.matchType.toUpperCase()}
              </span>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Match Name */}
        <h3 className="font-score text-lg md:text-xl font-semibold text-white mb-4 line-clamp-1">
          {match?.name || "Match"}
        </h3>

        {/* Teams & Scores */}
        <div className="space-y-3">
          {teams.map((team, idx) => {
            const teamScore = getTeamScore(idx);
            return (
              <div 
                key={idx} 
                className="flex items-center justify-between bg-stadium-subtle/50 rounded-lg p-3"
              >
                <span className="team-name text-sm md:text-base text-white/90 flex-1 truncate">
                  {team}
                </span>
                {teamScore && (
                  <div className="flex items-baseline gap-1">
                    <span className="score-display small text-white">
                      {teamScore.r}/{teamScore.w}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({teamScore.o} ov)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status */}
        {match?.status && (
          <p className={`mt-4 text-sm font-medium ${isLive ? 'text-cricket-live' : 'text-cricket-blue'}`}>
            {match.status}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
          {match?.venue && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{match.venue}</span>
            </div>
          )}
          {match?.date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(match.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
