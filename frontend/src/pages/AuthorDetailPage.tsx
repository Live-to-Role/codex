import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, Globe, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { getAuthor, getAuthorCredits, type AuthorCredit } from "@/api/authors";
import { formatDate } from "@/lib/utils";
import { FollowButton } from "@/components/FollowButton";

export function AuthorDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: author, isLoading: authorLoading, error: authorError } = useQuery({
    queryKey: ["author", slug],
    queryFn: () => getAuthor(slug!),
    enabled: !!slug,
  });

  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ["authorCredits", slug],
    queryFn: () => getAuthorCredits(slug!),
    enabled: !!slug,
  });

  if (authorLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (authorError || !author) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <User className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
            Author Not Found
          </h2>
          <p className="text-codex-brown/70 mb-4">
            The author you seek doesn't exist in our archives.
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-codex-brown/70 mb-6">
        <Link to="/products" className="hover:text-codex-ink">
          Products
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-codex-ink">Authors</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-codex-ink truncate">{author.name}</span>
      </nav>

      <div className="card p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-codex-tan flex items-center justify-center border border-codex-brown/20 flex-shrink-0" style={{ borderRadius: '2px' }}>
            <User className="w-10 h-10 text-codex-brown/40" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
                {author.name}
              </h1>
              <FollowButton
                targetType="author"
                targetId={author.id}
                targetSlug={author.slug}
                initialFollowing={author.is_following}
                initialCount={author.follower_count}
                size="sm"
              />
            </div>
            {author.bio && (
              <p className="text-codex-brown/70 mb-4 leading-relaxed">{author.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-codex-dark hover:text-codex-olive"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
              {author.created_at && (
                <span className="text-codex-brown/60">
                  Added {formatDate(author.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-4 tracking-wide">
          Works
        </h2>
        
        {creditsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-codex-olive" />
          </div>
        ) : credits && credits.length > 0 ? (
          <div className="space-y-3">
            {credits.map((credit: AuthorCredit) => (
              <Link
                key={credit.id}
                to={`/products/${credit.product.slug}`}
                className="card p-4 flex items-center gap-4 hover:border-codex-olive/50 transition-colors"
              >
                <div className="w-12 h-16 bg-codex-tan flex items-center justify-center flex-shrink-0 border border-codex-brown/10" style={{ borderRadius: '2px' }}>
                  {credit.product.cover_url ? (
                    <img
                      src={credit.product.cover_url}
                      alt={credit.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-5 h-5 text-codex-brown/30" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-codex-ink truncate">
                    {credit.product.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-codex-brown/60">
                    <span className="badge-secondary text-xs">{credit.role_display}</span>
                    {credit.product.publisher_name && (
                      <>
                        <span className="text-codex-brown/30">•</span>
                        <span>{credit.product.publisher_name}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-codex-brown/30 flex-shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <BookOpen className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
            <p className="text-codex-brown/70">
              No works found for this author.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
