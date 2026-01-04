import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { FollowButton } from "@/components/FollowButton";
import { RecommendationSection } from "@/components/RecommendationSection";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  public_name: string;
  bio?: string;
  avatar_url?: string;
  follower_count: number;
  following_count: number;
  created_at: string;
  is_following?: boolean;
}

interface AdventureRun {
  id: string;
  product: {
    id: string;
    slug: string;
    title: string;
    cover_url?: string;
    thumbnail_url?: string;
  };
  status: string;
  rating?: number;
  completed_at?: string;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/`);
      return response.data as UserProfile;
    },
    enabled: !!userId,
  });

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["user", userId, "runs"],
    queryFn: async () => {
      const response = await api.get(`/adventure-runs/?user=${userId}`);
      return response.data.results as AdventureRun[];
    },
    enabled: !!userId,
  });

  const { data: lovedProducts } = useQuery({
    queryKey: ["user", userId, "loved"],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/loved-products/`);
      return response.data.results;
    },
    enabled: !!userId,
  });

  if (userLoading || runsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <div className="h-24 w-24 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-8 w-64 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-96 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const completedRuns = runs?.filter((r) => r.status === "completed") || [];
  const highlyRated = completedRuns.filter((r) => (r.rating || 0) >= 4);

  return (
    <>
      <Helmet>
        <title>{user.public_name} - Codex</title>
        <meta name="description" content={`View ${user.public_name}'s profile and adventures`} />
      </Helmet>

      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row">
            {/* Profile Info */}
            <div className="flex-shrink-0">
              <img
                src={
                  user.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user.public_name}`
                }
                alt={user.public_name}
                className="h-32 w-32 rounded-full bg-gray-100"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.public_name}
                  </h1>
                  
                  {user.bio && (
                    <p className="mt-2 text-gray-600">{user.bio}</p>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4" />
                      {user.follower_count} followers
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4" />
                      Following {user.following_count}
                    </div>
                  </div>
                </div>

                <FollowButton
                  targetType="user"
                  targetId={user.id}
                  initialFollowing={user.is_following}
                  initialCount={user.follower_count}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-900">
              {runs?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Adventures Run</div>
          </div>
          
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-900">
              {completedRuns.length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-900">
              {highlyRated.length}
            </div>
            <div className="text-sm text-gray-500">Highly Rated (4+★)</div>
          </div>
        </div>

        {/* Products They Love */}
        {lovedProducts && lovedProducts.length > 0 && (
          <RecommendationSection
            title="Products They Love"
            products={lovedProducts}
            emptyMessage="No highly rated products yet"
          />
        )}

        {/* Recent Runs */}
        {runs && runs.length > 0 && (
          <div className="py-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Recent Adventures
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {runs.slice(0, 9).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm"
                >
                  <img
                    src={run.product.thumbnail_url || "/placeholder.png"}
                    alt={run.product.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-gray-900">
                      {run.product.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <span className="capitalize">{run.status}</span>
                      {run.rating && (
                        <>
                          <span>•</span>
                          <span>{run.rating}★</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
