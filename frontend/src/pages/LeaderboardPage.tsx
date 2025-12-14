import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trophy, Medal, Award, User, Loader2 } from "lucide-react";
import { getLeaderboard, type LeaderboardEntry } from "@/api/leaderboard";

export function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-amber-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-codex-brown/50 font-medium">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-50 border-amber-200";
      case 2:
        return "bg-gray-50 border-gray-200";
      case 3:
        return "bg-orange-50 border-orange-200";
      default:
        return "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-codex-dark flex items-center justify-center border border-codex-ink" style={{ borderRadius: "2px" }}>
          <Award className="w-5 h-5 text-codex-tan" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
            Top Contributors
          </h1>
          <p className="text-sm text-codex-brown/70">
            Community members who help build the archives
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      ) : leaderboard && leaderboard.length > 0 ? (
        <div className="space-y-3">
          {leaderboard.map((entry: LeaderboardEntry, index: number) => (
            <div
              key={entry.id}
              className={`card p-4 flex items-center gap-4 ${getRankBg(index + 1)}`}
            >
              <div className="flex-shrink-0">
                {getRankIcon(index + 1)}
              </div>

              <div className="w-12 h-12 bg-codex-tan flex items-center justify-center border border-codex-brown/20 flex-shrink-0" style={{ borderRadius: "2px" }}>
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.public_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-codex-brown/40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-codex-ink truncate">
                    {entry.public_name}
                  </span>
                  {entry.is_moderator && (
                    <span className="badge-primary text-xs">Mod</span>
                  )}
                </div>
                <div className="text-sm text-codex-brown/60">
                  {entry.contribution_count} contribution{entry.contribution_count !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-display text-lg font-semibold text-codex-olive">
                  {entry.reputation}
                </div>
                <div className="text-xs text-codex-brown/50">reputation</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Award className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
          <p className="text-codex-brown/70">
            No contributors yet. Be the first to contribute!
          </p>
          <Link to="/products" className="btn-primary mt-4 inline-flex">
            Browse Products
          </Link>
        </div>
      )}

      <div className="mt-8 card p-6 bg-codex-cream/50">
        <h2 className="font-display text-lg font-semibold text-codex-ink mb-3">
          How to Earn Reputation
        </h2>
        <ul className="space-y-2 text-sm text-codex-brown/70">
          <li className="flex items-start gap-2">
            <span className="text-codex-olive font-medium">+5</span>
            <span>Add a new product to the database</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-codex-olive font-medium">+2</span>
            <span>Edit and improve existing product information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-codex-olive font-medium">+3</span>
            <span>Register a new file hash for product identification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-codex-olive font-medium">+1</span>
            <span>Your contribution is approved by a moderator</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
