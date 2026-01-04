import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetType: "user" | "publisher" | "author";
  targetId: string;
  targetSlug?: string;
  initialFollowing?: boolean;
  initialCount?: number;
  onFollowChange?: (isFollowing: boolean, count: number) => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  className?: string;
}

export function FollowButton({
  targetType,
  targetId,
  targetSlug,
  initialFollowing = false,
  initialCount = 0,
  onFollowChange,
  size = "md",
  variant = "default",
  className = "",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialCount);
  const queryClient = useQueryClient();

  // Use slug for publishers/authors (backend uses slug lookup), id for users
  const lookupValue = (targetType === "publisher" || targetType === "author") && targetSlug 
    ? targetSlug 
    : targetId;

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/${targetType}s/${lookupValue}/follow/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to follow");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsFollowing(true);
      setFollowerCount(data.follower_count);
      onFollowChange?.(true, data.follower_count);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["me", "following"],
      });
      queryClient.invalidateQueries({
        queryKey: [targetType, targetId],
      });
    },
    onError: () => {
      console.error("Failed to follow");
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/${targetType}s/${lookupValue}/follow/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to unfollow");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsFollowing(false);
      setFollowerCount(data.follower_count);
      onFollowChange?.(false, data.follower_count);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["me", "following"],
      });
      queryClient.invalidateQueries({
        queryKey: [targetType, targetId],
      });
    },
    onError: () => {
      console.error("Failed to unfollow");
    },
  });

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Variant classes
  const variantClasses = {
    default: isFollowing
      ? "bg-codex-tan text-codex-brown hover:bg-codex-tan/80"
      : "bg-codex-olive text-white hover:bg-codex-dark",
    outline: isFollowing
      ? "border-codex-brown/30 text-codex-brown hover:bg-codex-tan/50"
      : "border-codex-olive text-codex-olive hover:bg-codex-olive/10",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 rounded-md font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-codex-olive focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variant === "outline" ? "border" : ""}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      
      {isFollowing ? (
        <span>Following</span>
      ) : (
        <span>Follow</span>
      )}
      
      {followerCount > 0 && (
        <span className="text-xs opacity-75">({followerCount})</span>
      )}
    </button>
  );
}
