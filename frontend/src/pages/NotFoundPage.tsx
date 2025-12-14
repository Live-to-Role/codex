import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-codex-olive/30 tracking-[0.3em] text-sm uppercase mb-4">❧ Lost in the Archives ❧</div>
        <h1 className="font-display text-6xl font-semibold text-codex-olive mb-4">404</h1>
        <h2 className="font-display text-2xl font-semibold text-codex-ink mb-2 tracking-wide">Page Not Found</h2>
        <p className="text-codex-brown/70 mb-8 max-w-md">The tome you seek has been lost to time, or perhaps never existed at all.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> Return Home</Link>
          <Link to="/search" className="btn-secondary"><Search className="w-4 h-4" /> Search Archives</Link>
        </div>
      </div>
    </div>
  );
}
