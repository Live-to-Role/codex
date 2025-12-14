import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { getPendingContributions, reviewContribution } from "@/api/moderation";
import { formatDate } from "@/lib/utils";
import type { Contribution } from "@/types";

type FilterStatus = "pending" | "approved" | "rejected" | "all";

export function ModerationPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["contributions", filterStatus],
    queryFn: () => getPendingContributions(filterStatus === "all" ? undefined : filterStatus),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: "approved" | "rejected"; notes: string }) =>
      reviewContribution(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
  });

  const handleReview = (id: string, status: "approved" | "rejected") => {
    reviewMutation.mutate({
      id,
      status,
      notes: reviewNotes[id] || "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="badge-success">Approved</span>;
      case "rejected":
        return <span className="badge-warning">Rejected</span>;
      default:
        return <span className="badge-secondary">Pending</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-codex-dark flex items-center justify-center border border-codex-ink" style={{ borderRadius: "2px" }}>
          <Shield className="w-5 h-5 text-codex-tan" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
            Moderation Queue
          </h1>
          <p className="text-sm text-codex-brown/70">
            Review and approve community contributions
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "rejected", "all"] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === status
                ? "bg-codex-olive text-white"
                : "bg-codex-tan/50 text-codex-brown hover:bg-codex-tan"
            }`}
            style={{ borderRadius: "2px" }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      ) : contributions && contributions.length > 0 ? (
        <div className="space-y-4">
          {contributions.map((contribution: Contribution) => (
            <div key={contribution.id} className="card">
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === contribution.id ? null : contribution.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(contribution.status)}
                      {getStatusBadge(contribution.status)}
                      <span className="badge-secondary text-xs">
                        {contribution.source === "grimoire" ? "Grimoire" : contribution.source === "api" ? "API" : "Web"}
                      </span>
                      <span className="text-xs text-codex-brown/50">
                        {formatDate(contribution.created_at)}
                      </span>
                    </div>

                    {contribution.product ? (
                      <Link
                        to={`/products/${contribution.product.slug}`}
                        className="font-medium text-codex-dark hover:text-codex-olive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit: {contribution.product.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-codex-ink">
                        New Product Submission
                      </span>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-sm text-codex-brown/60">
                      <User className="w-3 h-3" />
                      <span>{contribution.user?.public_name || "Anonymous"}</span>
                      {contribution.file_hash && (
                        <>
                          <span className="text-codex-brown/30">•</span>
                          <span className="font-mono text-xs">
                            {contribution.file_hash.slice(0, 12)}...
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-codex-brown/30" />
                    {expandedId === contribution.id ? (
                      <ChevronUp className="w-5 h-5 text-codex-brown/50" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-codex-brown/50" />
                    )}
                  </div>
                </div>
              </div>

              {expandedId === contribution.id && (
                <div className="border-t border-codex-brown/10 p-4 bg-codex-cream/50">
                  <h4 className="font-medium text-codex-ink mb-2">Submitted Data:</h4>
                  <pre className="bg-codex-tan/30 p-3 text-xs overflow-x-auto mb-4" style={{ borderRadius: "2px" }}>
                    {JSON.stringify(contribution.data, null, 2)}
                  </pre>

                  {contribution.status === "pending" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-codex-brown mb-1">
                          Review Notes (optional)
                        </label>
                        <textarea
                          value={reviewNotes[contribution.id] || ""}
                          onChange={(e) =>
                            setReviewNotes({ ...reviewNotes, [contribution.id]: e.target.value })
                          }
                          className="input w-full h-20 resize-y"
                          placeholder="Add notes about your decision..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(contribution.id, "approved")}
                          disabled={reviewMutation.isPending}
                          className="btn-primary flex items-center gap-2"
                        >
                          {reviewMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(contribution.id, "rejected")}
                          disabled={reviewMutation.isPending}
                          className="btn-ghost text-red-700 hover:bg-red-50 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {contribution.review_notes && (
                    <div className="mt-4 pt-4 border-t border-codex-brown/10">
                      <p className="text-sm text-codex-brown/70">
                        <span className="font-medium">Review notes:</span> {contribution.review_notes}
                      </p>
                      {contribution.reviewed_by && (
                        <p className="text-xs text-codex-brown/50 mt-1">
                          Reviewed by {contribution.reviewed_by.public_name}
                          {contribution.reviewed_at && ` on ${formatDate(contribution.reviewed_at)}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Shield className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
          <p className="text-codex-brown/70">
            {filterStatus === "pending"
              ? "No pending contributions to review."
              : `No ${filterStatus} contributions found.`}
          </p>
        </div>
      )}
    </div>
  );
}
