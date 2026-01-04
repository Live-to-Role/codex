import { useQuery } from "@tanstack/react-query";
import { RecommendationSection } from "./RecommendationSection";
import { api } from "@/lib/api";

interface RecommendationResponse {
  collaborative: any[];
  content_based: any[];
  from_following: any[];
  follow_ups: any[];
  trending: any[];
  new_releases: any[];
}

interface HomePageRecommendationsProps {
  isAuthenticated: boolean;
}

export function HomePageRecommendations({ isAuthenticated }: HomePageRecommendationsProps) {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations", "for-you"],
    queryFn: async () => {
      const response = await api.get("/recommendations/");
      return response.data as RecommendationResponse;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: trending } = useQuery({
    queryKey: ["recommendations", "trending"],
    queryFn: async () => {
      const response = await api.get("/recommendations/trending/?limit=10");
      return response.data.results;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // For authenticated users, show personalized recommendations
  if (isAuthenticated && recommendations) {
    return (
      <div className="space-y-8">
        {/* Follow-up adventures */}
        {recommendations.follow_ups.length > 0 && (
          <RecommendationSection
            title="Continue Your Adventures"
            products={recommendations.follow_ups}
            seeAllLink="/discover/follow-ups"
          />
        )}

        {/* From people you follow */}
        {recommendations.from_following.length > 0 && (
          <RecommendationSection
            title="From GMs You Follow"
            products={recommendations.from_following}
            seeAllLink="/discover/from-following"
          />
        )}

        {/* Collaborative recommendations */}
        {recommendations.collaborative.length > 0 && (
          <RecommendationSection
            title="Because You Liked Similar Adventures"
            products={recommendations.collaborative}
            seeAllLink="/discover/similar-users"
          />
        )}

        {/* Content-based recommendations */}
        {recommendations.content_based.length > 0 && (
          <RecommendationSection
            title="More Like Your Favorites"
            products={recommendations.content_based}
            seeAllLink="/discover/similar-content"
          />
        )}

        {/* New releases */}
        {recommendations.new_releases.length > 0 && (
          <RecommendationSection
            title="New From Publishers You Follow"
            products={recommendations.new_releases}
            seeAllLink="/discover/new-releases"
          />
        )}

        {/* Always show trending for authenticated users too */}
        {trending && trending.length > 0 && (
          <RecommendationSection
            title="Trending This Month"
            products={trending}
            seeAllLink="/discover/trending"
          />
        )}
      </div>
    );
  }

  // For anonymous users, show only global recommendations
  return (
    <div className="space-y-8">
      <RecommendationSection
        title="Trending This Month"
        products={trending || []}
        loading={isLoading}
        seeAllLink="/discover/trending"
        emptyMessage="Loading trending adventures..."
      />
    </div>
  );
}
