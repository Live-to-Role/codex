import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  CheckCircle,
  Bookmark,
  Star,
  ChevronDown,
  Loader2,
  LogIn,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProductAdventureRun,
  createOrUpdateAdventureRun,
  RUN_STATUS_OPTIONS,
  RUN_DIFFICULTY_OPTIONS,
  type RunStatus,
  type RunDifficulty,
} from "@/api/communityNotes";

interface AdventureRunStatusProps {
  productSlug: string;
}

export function AdventureRunStatus({ productSlug }: AdventureRunStatusProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: run, isLoading } = useQuery({
    queryKey: ["adventureRun", productSlug],
    queryFn: () => getProductAdventureRun(productSlug),
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createOrUpdateAdventureRun>[1]) =>
      createOrUpdateAdventureRun(productSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adventureRun", productSlug] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="card p-4 bg-codex-cream/50">
        <div className="flex items-center gap-2 text-codex-brown/70">
          <LogIn className="w-4 h-4" />
          <span className="text-sm">
            <Link to="/login" className="text-codex-olive hover:underline">
              Log in
            </Link>{" "}
            to track your runs
          </span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-codex-olive" />
          <span className="text-sm text-codex-brown/70">Loading...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: RunStatus | undefined) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "running":
        return <Play className="w-4 h-4 text-blue-600" />;
      case "want_to_run":
        return <Bookmark className="w-4 h-4 text-amber-600" />;
      default:
        return <Bookmark className="w-4 h-4 text-codex-brown/40" />;
    }
  };

  const getStatusColor = (status: RunStatus | undefined) => {
    switch (status) {
      case "completed":
        return "bg-green-100 border-green-200 text-green-800";
      case "running":
        return "bg-blue-100 border-blue-200 text-blue-800";
      case "want_to_run":
        return "bg-amber-100 border-amber-200 text-amber-800";
      default:
        return "bg-codex-tan border-codex-brown/20 text-codex-brown";
    }
  };

  const handleStatusChange = (newStatus: RunStatus) => {
    mutation.mutate({ status: newStatus });
    if (newStatus !== "completed") {
      setIsExpanded(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    mutation.mutate({ status: "completed", rating });
  };

  const handleDifficultyChange = (difficulty: RunDifficulty) => {
    mutation.mutate({ status: "completed", difficulty });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-medium text-codex-ink flex items-center gap-2">
          {getStatusIcon(run?.status)}
          Run Status
        </h3>
        {run && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-codex-brown/60 hover:text-codex-ink"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {!run ? (
        <div className="flex flex-wrap gap-2">
          {RUN_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={mutation.isPending}
              className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                mutation.isPending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-codex-tan/50"
              } ${getStatusColor(option.value)}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {RUN_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={mutation.isPending}
                className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                  run.status === option.value
                    ? getStatusColor(option.value)
                    : "bg-white border-codex-brown/20 text-codex-brown/70 hover:bg-codex-tan/30"
                } ${mutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {(run.status === "completed" || isExpanded) && (
            <div className="pt-3 border-t border-codex-brown/10 space-y-3">
              <div>
                <label className="block text-xs text-codex-brown/70 mb-1">
                  Rating (Would run again?)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(star)}
                      disabled={mutation.isPending}
                      className={`p-1 transition-colors ${
                        mutation.isPending ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          run.rating && star <= run.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-codex-brown/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-codex-brown/70 mb-1">
                  Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  {RUN_DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleDifficultyChange(option.value)}
                      disabled={mutation.isPending}
                      className={`px-2 py-1 text-xs border rounded transition-colors ${
                        run.difficulty === option.value
                          ? "bg-codex-olive/20 border-codex-olive text-codex-olive"
                          : "bg-white border-codex-brown/20 text-codex-brown/70 hover:bg-codex-tan/30"
                      } ${mutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {run.note_count > 0 && (
                <p className="text-xs text-codex-brown/60">
                  You have {run.note_count} note{run.note_count !== 1 ? "s" : ""} for this adventure
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {mutation.isPending && (
        <div className="flex items-center gap-2 mt-2 text-xs text-codex-brown/60">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
