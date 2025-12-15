import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Play,
  CheckCircle,
  Bookmark,
  Star,
  FileText,
  Loader2,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAdventureRuns, type AdventureRun, type RunStatus } from "@/api/communityNotes";

export function MyRunsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<RunStatus | "">("");

  const { data: runs, isLoading } = useQuery({
    queryKey: ["myAdventureRuns"],
    queryFn: getUserAdventureRuns,
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
            Sign In Required
          </h2>
          <p className="text-codex-brown/70 mb-4">
            Log in to track your adventure runs.
          </p>
          <Link to="/login" className="btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const filteredRuns = runs?.filter((run) =>
    statusFilter ? run.status === statusFilter : true
  );

  const stats = runs
    ? {
        total: runs.length,
        completed: runs.filter((r) => r.status === "completed").length,
        running: runs.filter((r) => r.status === "running").length,
        wantToRun: runs.filter((r) => r.status === "want_to_run").length,
      }
    : null;

  // Helper functions moved to RunCard component to avoid duplication

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-codex-ink">
          My Adventure Runs
        </h1>
      </div>

      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold text-codex-ink">{stats.total}</p>
            <p className="text-sm text-codex-brown/60">Total</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
            <p className="text-sm text-codex-brown/60">Completed</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold text-blue-600">{stats.running}</p>
            <p className="text-sm text-codex-brown/60">Running</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold text-amber-600">{stats.wantToRun}</p>
            <p className="text-sm text-codex-brown/60">Want to Run</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-codex-brown/50" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RunStatus | "")}
          className="input text-sm py-1"
          aria-label="Filter by status"
        >
          <option value="">All Runs</option>
          <option value="completed">Completed</option>
          <option value="running">Currently Running</option>
          <option value="want_to_run">Want to Run</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-codex-olive" />
        </div>
      ) : filteredRuns && filteredRuns.length > 0 ? (
        <div className="space-y-4">
          {filteredRuns.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      ) : runs && runs.length > 0 ? (
        <div className="text-center py-12 text-codex-brown/50">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No runs match this filter.</p>
        </div>
      ) : (
        <div className="text-center py-12 text-codex-brown/50">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>You haven't tracked any adventure runs yet.</p>
          <p className="text-sm mt-1">
            Visit a product page to add it to your runs!
          </p>
          <Link to="/products" className="btn-primary mt-4 inline-flex">
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}

function RunCard({ run }: { run: AdventureRun }) {
  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "running":
        return <Play className="w-4 h-4 text-blue-600" />;
      case "want_to_run":
        return <Bookmark className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusBadgeClass = (status: RunStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "want_to_run":
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="card p-4">
      <div className="flex gap-4">
        <Link
          to={`/products/${run.product.slug}`}
          className="flex-shrink-0"
        >
          {run.product.thumbnail_url || run.product.cover_url ? (
            <img
              src={run.product.thumbnail_url || run.product.cover_url || ""}
              alt={run.product.title}
              className="w-16 h-20 object-cover border border-codex-brown/20"
              style={{ borderRadius: "2px" }}
            />
          ) : (
            <div
              className="w-16 h-20 bg-codex-tan flex items-center justify-center border border-codex-brown/20"
              style={{ borderRadius: "2px" }}
            >
              <BookOpen className="w-6 h-6 text-codex-brown/40" />
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                to={`/products/${run.product.slug}`}
                className="font-medium text-codex-ink hover:text-codex-olive line-clamp-1"
              >
                {run.product.title}
              </Link>
              {run.product.publisher_name && (
                <p className="text-sm text-codex-brown/60">
                  {run.product.publisher_name}
                </p>
              )}
            </div>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 text-xs border rounded flex-shrink-0 ${getStatusBadgeClass(
                run.status
              )}`}
            >
              {getStatusIcon(run.status)}
              {run.status_display}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-codex-brown/60">
            {run.status === "completed" && run.rating && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= run.rating!
                        ? "fill-amber-400 text-amber-400"
                        : "text-codex-brown/30"
                    }`}
                  />
                ))}
              </div>
            )}
            {run.difficulty_display && (
              <span>{run.difficulty_display}</span>
            )}
            {run.session_count && (
              <span>{run.session_count} sessions</span>
            )}
            {run.player_count && (
              <span>{run.player_count} players</span>
            )}
          </div>

          {run.note_count > 0 && (
            <Link
              to={`/products/${run.product.slug}`}
              className="inline-flex items-center gap-1 mt-2 text-sm text-codex-olive hover:underline"
            >
              <FileText className="w-3 h-3" />
              {run.note_count} note{run.note_count !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
