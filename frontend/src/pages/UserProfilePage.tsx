import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, BookOpen, Users as UsersIcon, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { FollowButton } from "@/components/FollowButton";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import type { Product } from "@/types";

interface UserProfile {
  id: string;
  public_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  contribution_count: number;
  reputation: number;
  is_moderator: boolean;
  is_publisher: boolean;
  created_at: string;
  follower_count: number;
  following_count: number;
}

interface UserRun {
  id: string;
  product: Product;
  status: string;
  rating?: number;
  started_at?: string;
  completed_at?: string;
}

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      const response = await api.get(`/users/${username}/`);
      return response.data as UserProfile;
    },
    enabled: !!username,
  });

  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["user-runs", username],
    queryFn: async () => {
      const response = await api.get(`/users/${username}/runs/`);
      return response.data.results as UserRun[];
    },
    enabled: !!username,
  });

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <User className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
            User Not Found
          </h2>
          <p className="text-codex-brown/70 mb-4">
            The user you're looking for doesn't exist.
          </p>
          <Link to="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;
  const highlyRatedRuns = runs?.filter(run => run.rating && run.rating >= 4) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-codex-tan flex items-center justify-center border border-codex-brown/20" style={{ borderRadius: '2px' }}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.public_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-codex-brown/40" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
                {profile.public_name || profile.username}
              </h1>
              {!isOwnProfile && currentUser && (
                <FollowButton
                  targetType="user"
                  targetId={profile.id}
                  initialCount={profile.follower_count}
                />
              )}
            </div>
            
            {profile.bio && (
              <p className="text-codex-brown/70 mb-4">{profile.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-6 text-sm text-codex-brown">
              <div>
                <span className="text-codex-brown/60">Followers:</span>{" "}
                <span className="font-medium text-codex-ink">{profile.follower_count}</span>
              </div>
              <div>
                <span className="text-codex-brown/60">Following:</span>{" "}
                <span className="font-medium text-codex-ink">{profile.following_count}</span>
              </div>
              <div>
                <span className="text-codex-brown/60">Contributions:</span>{" "}
                <span className="font-medium text-codex-ink">{profile.contribution_count}</span>
              </div>
              <div>
                <span className="text-codex-brown/60">Reputation:</span>{" "}
                <span className="font-medium text-codex-ink">{profile.reputation}</span>
              </div>
              <div>
                <span className="text-codex-brown/60">Member since:</span>{" "}
                <span className="font-medium text-codex-ink">{formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {highlyRatedRuns.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-4 tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Products They Love
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {highlyRatedRuns.slice(0, 8).map((run) => (
              <Link
                key={run.id}
                to={`/products/${run.product.slug}`}
                className="card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[3/4] w-full bg-codex-tan flex items-center justify-center">
                  {run.product.thumbnail_url ? (
                    <img
                      src={run.product.thumbnail_url}
                      alt={run.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-codex-brown/40" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-codex-ink text-sm line-clamp-2">
                    {run.product.title}
                  </h3>
                  {run.rating && (
                    <div className="mt-1 text-xs text-codex-brown/70">
                      Rated {run.rating}★
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-4 tracking-wide flex items-center gap-2">
          <UsersIcon className="w-5 h-5" />
          Adventure Runs
        </h2>
        
        {runsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-codex-olive" />
          </div>
        ) : runs && runs.length > 0 ? (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 bg-codex-tan flex items-center justify-center flex-shrink-0">
                    {run.product.thumbnail_url ? (
                      <img
                        src={run.product.thumbnail_url}
                        alt={run.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-codex-brown/40" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${run.product.slug}`}
                      className="font-medium text-codex-dark hover:text-codex-olive"
                    >
                      {run.product.title}
                    </Link>
                    
                    <div className="mt-1 flex items-center gap-3 text-sm text-codex-brown/70">
                      <span className="badge-secondary text-xs">
                        {run.status}
                      </span>
                      {run.rating && (
                        <span>Rated {run.rating}★</span>
                      )}
                      {run.completed_at && (
                        <span>Completed {formatDate(run.completed_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <BookOpen className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
            <p className="text-codex-brown/70">
              No adventure runs yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
