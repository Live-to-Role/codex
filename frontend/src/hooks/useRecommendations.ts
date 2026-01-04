import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface ScoredProduct {
  product: {
    id: string;
    slug: string;
    title: string;
    product_type: string;
    cover_url?: string;
    thumbnail_url?: string;
    publisher?: string;
    game_system?: string;
    level_range_min?: number;
    level_range_max?: number;
    msrp?: number;
  };
  score: number;
  reason?: string;
  source?: {
    type: "user";
    id: string;
    name: string;
    rating: number;
  };
}

export function useRecommendations(type: "for-you" | "similar-users" | "trending" | "top-rated", options?: {
  gameSystem?: string;
  productType?: string;
  limit?: number;
  days?: number;
  productSlug?: string;
}) {
  return useQuery({
    queryKey: ["recommendations", type, options],
    queryFn: async () => {
      let url = `/recommendations/${type}/`;
      const params = new URLSearchParams();
      
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.gameSystem) params.append("game_system", options.gameSystem);
      if (options?.productType) params.append("product_type", options.productType);
      if (options?.days) params.append("days", options.days.toString());
      if (options?.productSlug) params.append("product", options.productSlug);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      return response.data.results as ScoredProduct[];
    },
    staleTime: {
      "for-you": 10 * 60 * 1000, // 10 minutes
      "similar-users": 30 * 60 * 1000, // 30 minutes
      "trending": 30 * 60 * 1000, // 30 minutes
      "top-rated": 24 * 60 * 60 * 1000, // 24 hours
    }[type],
  });
}

export function useSimilarProducts(productSlug: string, limit: number = 6) {
  return useQuery({
    queryKey: ["recommendations", "similar-products", productSlug, limit],
    queryFn: async () => {
      const response = await api.get(
        `/recommendations/similar-products/?product=${productSlug}&limit=${limit}`
      );
      return response.data.results as ScoredProduct[];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useFollowUps(limit: number = 10) {
  return useQuery({
    queryKey: ["recommendations", "follow-ups", limit],
    queryFn: async () => {
      const response = await api.get(`/recommendations/follow-ups/?limit=${limit}`);
      return response.data.results as ScoredProduct[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useFromFollowing(limit: number = 20) {
  return useQuery({
    queryKey: ["recommendations", "from-following", limit],
    queryFn: async () => {
      const response = await api.get(`/recommendations/from-following/?limit=${limit}`);
      return response.data.results as ScoredProduct[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useNewReleases(days: number = 90, limit: number = 20) {
  return useQuery({
    queryKey: ["recommendations", "new-releases", days, limit],
    queryFn: async () => {
      const response = await api.get(
        `/recommendations/new-releases/?days=${days}&limit=${limit}`
      );
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSuggestedFollows(limit: number = 10) {
  return useQuery({
    queryKey: ["recommendations", "suggested-follows", limit],
    queryFn: async () => {
      const response = await api.get(`/recommendations/suggested-follows/?limit=${limit}`);
      return response.data.results as {
        user: {
          id: string;
          public_name: string;
          avatar_url?: string;
        };
        reason: string;
        shared_products: number;
        note_upvotes: number;
      }[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
