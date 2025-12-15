import { Link } from "react-router-dom";
import { CheckCircle, Plus, Home } from "lucide-react";

export function ContributionSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        <div
          className="w-16 h-16 bg-codex-olive/20 flex items-center justify-center mx-auto mb-6 border border-codex-olive"
          style={{ borderRadius: "2px" }}
        >
          <CheckCircle className="w-10 h-10 text-codex-olive" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide mb-2">
          Thank You for Contributing!
        </h1>

        <p className="text-codex-brown/70 mb-6">
          Your submission is now pending review. You'll be notified when it's
          approved.
        </p>

        <div className="card p-4 text-left text-sm text-codex-brown/70 mb-6">
          <h3 className="font-medium text-codex-ink mb-2">What happens next?</h3>
          <ul className="space-y-1">
            <li>• A moderator will review your entry</li>
            <li>• You may be asked for clarifications</li>
            <li>• Once approved, it goes live in the archives</li>
            <li>• You'll earn reputation points for approved contributions</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/products/new" className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add Another
          </Link>
          <Link to="/" className="btn-ghost flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
