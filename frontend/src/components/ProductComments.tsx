import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, User, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getProductComments, postComment, type Comment } from "@/api/comments";
import { formatDate } from "@/lib/utils";

interface ProductCommentsProps {
  productSlug: string;
}

export function ProductComments({ productSlug }: ProductCommentsProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const { data: comments, isLoading } = useQuery({
    queryKey: ["productComments", productSlug],
    queryFn: () => getProductComments(productSlug),
  });

  const postMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      postComment(productSlug, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productComments", productSlug] });
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    postMutation.mutate({ content: newComment.trim() });
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    postMutation.mutate({ content: replyContent.trim(), parentId });
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? "ml-8 border-l-2 border-codex-tan pl-4" : ""}`}
    >
      <div className="flex items-start gap-3 py-3">
        <div className="w-8 h-8 bg-codex-tan flex items-center justify-center flex-shrink-0 border border-codex-brown/20" style={{ borderRadius: "2px" }}>
          {comment.user?.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.public_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-codex-brown/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-codex-ink text-sm">
              {comment.user?.public_name || "Anonymous"}
            </span>
            <span className="text-xs text-codex-brown/50">
              {formatDate(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-codex-brown/40">(edited)</span>
            )}
          </div>

          <p className="text-codex-brown text-sm leading-relaxed">
            {comment.content}
          </p>

          <div className="flex items-center gap-3 mt-2">
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-codex-brown/60 hover:text-codex-olive"
              >
                Reply
              </button>
            )}
            {comment.reply_count > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs text-codex-brown/60 hover:text-codex-olive flex items-center gap-1"
              >
                {expandedReplies.has(comment.id) ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    {comment.reply_count} {comment.reply_count === 1 ? "reply" : "replies"}
                  </>
                )}
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="input flex-1 text-sm"
              />
              <button
                onClick={() => handleReply(comment.id)}
                disabled={postMutation.isPending || !replyContent.trim()}
                className="btn-primary px-3"
              >
                {postMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {expandedReplies.has(comment.id) && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-8 pt-6 border-t border-codex-brown/20">
      <h3 className="font-display font-medium text-codex-ink mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Discussion
        {comments && comments.length > 0 && (
          <span className="text-sm text-codex-brown/50 font-normal">
            ({comments.length})
          </span>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add to the discussion..."
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={postMutation.isPending || !newComment.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {postMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-codex-olive" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="divide-y divide-codex-brown/10">
          {comments.map((comment) => renderComment(comment))}
        </div>
      ) : (
        <div className="text-center py-8 text-codex-brown/50">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to start the discussion!</p>
        </div>
      )}
    </div>
  );
}
