import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { User, BookOpen, Clock, CheckCircle, XCircle, Loader2, Shield, Award, LogOut, Key, Copy, RefreshCw, Trash2 } from "lucide-react";
import { getCurrentUser, logout, getAPIKey, generateAPIKey, revokeAPIKey } from "@/api/auth";
import { getMyContributions } from "@/api/users";
import { formatDate } from "@/lib/utils";

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  const { data: contributions, isLoading: contributionsLoading } = useQuery({
    queryKey: ["myContributions"],
    queryFn: getMyContributions,
  });

  const { data: apiKeyInfo, isLoading: apiKeyLoading } = useQuery({
    queryKey: ["apiKey"],
    queryFn: getAPIKey,
  });

  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateKeyMutation = useMutation({
    mutationFn: generateAPIKey,
    onSuccess: (data) => {
      setNewApiKey(data.key);
      queryClient.invalidateQueries({ queryKey: ["apiKey"] });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: revokeAPIKey,
    onSuccess: () => {
      setNewApiKey(null);
      queryClient.invalidateQueries({ queryKey: ["apiKey"] });
    },
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <User className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
            Not Signed In
          </h2>
          <p className="text-codex-brown/70 mb-4">
            Please sign in to view your profile.
          </p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Pending Review";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-codex-tan flex items-center justify-center border border-codex-brown/20" style={{ borderRadius: '2px' }}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.public_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-codex-brown/40" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
                {user.public_name || user.username}
              </h1>
              {user.is_moderator && (
                <span className="badge-primary flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Moderator
                </span>
              )}
              {user.is_publisher && (
                <span className="badge-secondary flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Publisher
                </span>
              )}
            </div>
            
            {user.bio && (
              <p className="text-codex-brown/70 mb-4">{user.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-6 text-sm text-codex-brown">
              <div>
                <span className="text-codex-brown/60">Contributions:</span>{" "}
                <span className="font-medium text-codex-ink">{user.contribution_count}</span>
              </div>
              <div>
                <span className="text-codex-brown/60">Reputation:</span>{" "}
                <span className="font-medium text-codex-ink">{user.reputation}</span>
              </div>
              <div>
                <span className="text-codex-brown/60">Member since:</span>{" "}
                <span className="font-medium text-codex-ink">{formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-codex-brown/10">
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="btn-ghost text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-codex-olive" />
          <h2 className="font-display text-xl font-semibold text-codex-ink tracking-wide">
            API Key for Grimoire
          </h2>
        </div>
        <p className="text-sm text-codex-brown/70 mb-4">
          Use this API key to connect Grimoire to your Codex account and contribute product identifications.
        </p>

        {apiKeyLoading ? (
          <div className="flex items-center gap-2 text-codex-brown/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : newApiKey ? (
          <div className="space-y-3">
            <div className="bg-codex-olive/10 border border-codex-olive/30 p-4" style={{ borderRadius: "2px" }}>
              <p className="text-sm font-medium text-codex-olive mb-2">Your new API key (copy it now!):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 font-mono text-sm border border-codex-brown/20" style={{ borderRadius: "2px" }}>
                  {newApiKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newApiKey)}
                  className="btn-secondary flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-codex-brown/60 mt-2">
                This key won't be shown again. Store it securely.
              </p>
            </div>
          </div>
        ) : apiKeyInfo?.has_key ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <code className="bg-codex-tan/50 px-3 py-2 font-mono text-sm" style={{ borderRadius: "2px" }}>
                {apiKeyInfo.key_preview}
              </code>
              <span className="text-sm text-codex-brown/60">
                Created {apiKeyInfo.created ? formatDate(apiKeyInfo.created) : ""}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => generateKeyMutation.mutate()}
                disabled={generateKeyMutation.isPending}
                className="btn-secondary flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${generateKeyMutation.isPending ? "animate-spin" : ""}`} />
                Regenerate
              </button>
              <button
                onClick={() => revokeKeyMutation.mutate()}
                disabled={revokeKeyMutation.isPending}
                className="btn-ghost text-red-700 hover:bg-red-50 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Revoke
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => generateKeyMutation.mutate()}
            disabled={generateKeyMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {generateKeyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            Generate API Key
          </button>
        )}
      </div>

      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-4 tracking-wide">
          Your Contributions
        </h2>
        
        {contributionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-codex-olive" />
          </div>
        ) : contributions?.results && contributions.results.length > 0 ? (
          <div className="space-y-3">
            {contributions.results.map((contribution) => (
              <div key={contribution.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(contribution.status)}
                      <span className="text-sm text-codex-brown/70">
                        {getStatusLabel(contribution.status)}
                      </span>
                      <span className="text-codex-brown/40">•</span>
                      <span className="text-sm text-codex-brown/60">
                        {formatDate(contribution.created_at)}
                      </span>
                    </div>
                    
                    {contribution.product ? (
                      <Link
                        to={`/products/${contribution.product.slug}`}
                        className="font-medium text-codex-dark hover:text-codex-olive"
                      >
                        Edit: {contribution.product.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-codex-ink">
                        New Product Submission
                      </span>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1 text-sm text-codex-brown/60">
                      <span className="badge-secondary text-xs">
                        {contribution.source === "grimoire" ? "Grimoire" : contribution.source === "api" ? "API" : "Web"}
                      </span>
                      {contribution.file_hash && (
                        <span className="font-mono text-xs">
                          Hash: {contribution.file_hash.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <BookOpen className="w-5 h-5 text-codex-brown/30 flex-shrink-0" />
                </div>
                
                {contribution.review_notes && (
                  <div className="mt-3 pt-3 border-t border-codex-brown/10">
                    <p className="text-sm text-codex-brown/70">
                      <span className="font-medium">Review notes:</span> {contribution.review_notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <BookOpen className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
            <p className="text-codex-brown/70">
              You haven't made any contributions yet.
            </p>
            <p className="text-sm text-codex-brown/50 mt-1">
              Start by adding or editing product information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
