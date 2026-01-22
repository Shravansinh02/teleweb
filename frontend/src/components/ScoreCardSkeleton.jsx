export default function ScoreCardSkeleton() {
  return (
    <div className="match-card p-5 md:p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-16 h-6 rounded-full"></div>
          <div className="skeleton w-12 h-5 rounded"></div>
        </div>
        <div className="skeleton w-5 h-5 rounded"></div>
      </div>

      {/* Match Name */}
      <div className="skeleton w-3/4 h-6 rounded mb-4"></div>

      {/* Teams & Scores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-stadium-subtle/50 rounded-lg p-3">
          <div className="skeleton w-32 h-5 rounded"></div>
          <div className="skeleton w-20 h-7 rounded"></div>
        </div>
        <div className="flex items-center justify-between bg-stadium-subtle/50 rounded-lg p-3">
          <div className="skeleton w-28 h-5 rounded"></div>
          <div className="skeleton w-20 h-7 rounded"></div>
        </div>
      </div>

      {/* Status */}
      <div className="skeleton w-48 h-4 rounded mt-4"></div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
        <div className="skeleton w-24 h-4 rounded"></div>
        <div className="skeleton w-16 h-4 rounded"></div>
      </div>
    </div>
  );
}
