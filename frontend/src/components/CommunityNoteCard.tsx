import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ThumbsUp,
  Flag,
  Edit,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  voteOnNote,
  removeVoteFromNote,
  flagNote,
  deleteCommunityNote,
  getSpoilerLevelColor,
  getNoteTypeColor,
  FLAG_REASON_OPTIONS,
  type CommunityNote,
  type FlagReason,
} from "@/api/communityNotes";

interface CommunityNoteCardProps {
  note: CommunityNote;
  productSlug: string;
  onEdit?: (note: CommunityNote) => void;
}

export function CommunityNoteCard({
  note,
  productSlug,
  onEdit,
}: CommunityNoteCardProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState<FlagReason>("inappropriate");
  const [flagDetails, setFlagDetails] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(
    note.spoiler_level === "none"
  );

  const voteMutation = useMutation({
    mutationFn: () =>
      note.user_has_voted ? removeVoteFromNote(note.id) : voteOnNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["communityNotes", productSlug],
      });
    },
  });

  const flagMutation = useMutation({
    mutationFn: () => flagNote(note.id, { reason: flagReason, details: flagDetails }),
    onSuccess: () => {
      setShowFlagForm(false);
      setFlagDetails("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCommunityNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["communityNotes", productSlug],
      });
    },
  });

  const contentPreview =
    note.content.length > 200
      ? note.content.substring(0, 200) + "..."
      : note.content;

  const shouldBlurContent =
    !spoilerRevealed && note.spoiler_level !== "none";

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 bg-codex-tan flex items-center justify-center flex-shrink-0 border border-codex-brown/20"
          style={{ borderRadius: "2px" }}
        >
          {note.author.avatar_url ? (
            <img
              src={note.author.avatar_url}
              alt={note.author.public_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-codex-brown/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 text-xs border rounded ${getNoteTypeColor(
                note.note_type
              )}`}
            >
              {note.note_type_display}
            </span>
            <span
              className={`px-2 py-0.5 text-xs border rounded ${getSpoilerLevelColor(
                note.spoiler_level
              )}`}
            >
              {note.spoiler_level_display}
            </span>
          </div>

          <h4 className="font-medium text-codex-ink mb-1">{note.title}</h4>

          <div className="flex items-center gap-2 text-xs text-codex-brown/60 mb-2">
            <span>{note.author.public_name}</span>
            <span>•</span>
            <span>{formatDate(note.created_at)}</span>
          </div>

          {shouldBlurContent ? (
            <div className="relative">
              <p className="text-codex-brown text-sm leading-relaxed blur-sm select-none">
                {contentPreview}
              </p>
              <button
                onClick={() => setSpoilerRevealed(true)}
                className="absolute inset-0 flex items-center justify-center bg-codex-cream/80"
              >
                <span className="flex items-center gap-2 px-3 py-1.5 bg-codex-tan border border-codex-brown/20 rounded text-sm text-codex-ink">
                  <AlertTriangle className="w-4 h-4" />
                  Click to reveal {note.spoiler_level_display.toLowerCase()}
                </span>
              </button>
            </div>
          ) : (
            <div>
              <p className="text-codex-brown text-sm leading-relaxed whitespace-pre-wrap">
                {isExpanded || note.content.length <= 200
                  ? note.content
                  : contentPreview}
              </p>
              {note.content.length > 200 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-codex-olive hover:underline mt-1 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-codex-brown/10">
            <button
              onClick={() => voteMutation.mutate()}
              disabled={!isAuthenticated || note.is_own_note || voteMutation.isPending}
              className={`flex items-center gap-1 text-sm transition-colors ${
                note.user_has_voted
                  ? "text-codex-olive"
                  : "text-codex-brown/60 hover:text-codex-olive"
              } ${
                !isAuthenticated || note.is_own_note
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title={
                !isAuthenticated
                  ? "Log in to vote"
                  : note.is_own_note
                  ? "Cannot vote on your own note"
                  : note.user_has_voted
                  ? "Remove vote"
                  : "Upvote"
              }
            >
              {voteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ThumbsUp
                  className={`w-4 h-4 ${note.user_has_voted ? "fill-current" : ""}`}
                />
              )}
              <span>{note.upvote_count}</span>
            </button>

            {note.is_own_note && onEdit && (
              <>
                <button
                  onClick={() => onEdit(note)}
                  className="flex items-center gap-1 text-sm text-codex-brown/60 hover:text-codex-ink transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-sm text-codex-brown/60 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}

            {!note.is_own_note && isAuthenticated && (
              <button
                onClick={() => setShowFlagForm(!showFlagForm)}
                className="flex items-center gap-1 text-sm text-codex-brown/60 hover:text-amber-600 transition-colors ml-auto"
              >
                <Flag className="w-4 h-4" />
                Flag
              </button>
            )}
          </div>

          {showFlagForm && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <h5 className="text-sm font-medium text-amber-800 mb-2">
                Report this note
              </h5>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value as FlagReason)}
                className="input w-full text-sm mb-2"
              >
                {FLAG_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <textarea
                value={flagDetails}
                onChange={(e) => setFlagDetails(e.target.value)}
                placeholder="Additional details (optional)"
                className="input w-full text-sm mb-2"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => flagMutation.mutate()}
                  disabled={flagMutation.isPending}
                  className="btn-primary text-sm py-1"
                >
                  {flagMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Report"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowFlagForm(false);
                    setFlagDetails("");
                  }}
                  className="btn-ghost text-sm py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 mb-2">
                Are you sure you want to delete this note? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-ghost text-sm py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
