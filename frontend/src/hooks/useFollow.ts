import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface FollowResponse {
  is_following: boolean;
  follower_count: number;
}

export function useFollow(targetType: "user" | "publisher" | "author") {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const response = await api.post(`/${targetType}s/${targetId}/follow/`);
      return response.data as FollowResponse;
    },
    onSuccess: (data, targetId) => {
      // Update follow status in cache
      queryClient.setQueryData(
        [targetType, targetId, "follow-status"],
        { isFollowing: true, followerCount: data.follower_count }
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["me", "following"],
      });
      queryClient.invalidateQueries({
        queryKey: [targetType, targetId],
      });
      
      toast.success(`Following ${targetType}`);
    },
    onError: () => {
      toast.error(`Failed to follow ${targetType}`);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const response = await api.delete(`/${targetType}s/${targetId}/follow/`);
      return response.data as FollowResponse;
    },
    onSuccess: (data, targetId) => {
      // Update follow status in cache
      queryClient.setQueryData(
        [targetType, targetId, "follow-status"],
        { isFollowing: false, followerCount: data.follower_count }
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["me", "following"],
      });
      queryClient.invalidateQueries({
        queryKey: [targetType, targetId],
      });
      
      toast.success(`Unfollowed ${targetType}`);
    },
    onError: () => {
      toast.error(`Failed to unfollow ${targetType}`);
    },
  });

  const follow = (targetId: string) => followMutation.mutate(targetId);
  const unfollow = (targetId: string) => unfollowMutation.mutate(targetId);

  return {
    follow,
    unfollow,
    isFollowing: followMutation.isPending || unfollowMutation.isPending,
  };
}

export function useFollowStatus(targetType: "user" | "publisher" | "author", targetId: string) {
  return useQuery({
    queryKey: [targetType, targetId, "follow-status"],
    queryFn: async () => {
      // For now, we'll determine follow status from the entity data
      // This could be optimized with a dedicated endpoint
      const response = await api.get(`/${targetType}s/${targetId}/`);
      const entity = response.data;
      
      return {
        isFollowing: entity.is_following || false,
        followerCount: entity.follower_count || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFollowing(targetType: "users" | "publishers" | "authors") {
  return useQuery({
    queryKey: ["me", "following", targetType],
    queryFn: async () => {
      let url = `/me/following/`;
      if (targetType === "publishers") {
        url = "/me/followed-publishers/";
      } else if (targetType === "authors") {
        url = "/me/followed-authors/";
      }
      
      const response = await api.get(url);
      return response.data.results;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFollowers(targetType: "users") {
  return useQuery({
    queryKey: ["me", "followers"],
    queryFn: async () => {
      const response = await api.get("/me/followers/");
      return response.data.results;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
