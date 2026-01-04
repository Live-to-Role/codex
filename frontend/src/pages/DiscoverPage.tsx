import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { RecommendationSection } from "@/components/RecommendationSection";
import { api } from "@/lib/api";

interface RecommendationResponse {
  collaborative: any[];
  content_based: any[];
  from_following: any[];
  follow_ups: any[];
  trending: any[];
  new_releases: any[];
}

export default function DiscoverPage() {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations", "for-you"],
    queryFn: async () => {
      const response = await api.get("/recommendations/");
      return response.data as RecommendationResponse;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: trending } = useQuery({
    queryKey: ["recommendations", "trending"],
    queryFn: async () => {
      const response = await api.get("/recommendations/trending/?limit=20");
      return response.data.results;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: topRated } = useQuery({
    queryKey: ["recommendations", "top-rated"],
    queryFn: async () => {
      const response = await api.get("/recommendations/top-rated/?limit=20");
      return response.data.results;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  return (
    <>
      <Helmet>
        <title>Discover - Codex</title>
        <meta name="description" content="Discover new TTRPG adventures and resources" />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover</h1>
          <p className="mt-2 text-gray-600">
            Find your next adventure with personalized recommendations
          </p>
        </div>

        {/* Personalized recommendations for authenticated users */}
        {recommendations && (
          <>
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
          </>
        )}

        {/* Global recommendations for all users */}
        <RecommendationSection
          title="Trending This Month"
          products={trending || []}
          loading={isLoading}
          seeAllLink="/discover/trending"
        />

        <RecommendationSection
          title="Top Rated Adventures"
          products={topRated || []}
          loading={isLoading}
          seeAllLink="/discover/top-rated"
        />
      </div>
    </>
  );
}
