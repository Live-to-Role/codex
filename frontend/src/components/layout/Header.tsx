import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, BookOpen, Users, Gamepad2, LogIn } from "lucide-react";
import { isAuthenticated } from "@/api/auth";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { to: "/products", label: "Products", icon: BookOpen },
    { to: "/publishers", label: "Publishers", icon: Users },
    { to: "/systems", label: "Systems", icon: Gamepad2 },
  ];

  return (
    <header className="bg-codex-cream border-b border-codex-brown/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-codex-dark flex items-center justify-center border border-codex-ink" style={{ borderRadius: '2px' }}>
                <BookOpen className="w-5 h-5 text-codex-tan" />
              </div>
              <span className="font-display font-semibold text-xl text-codex-ink tracking-wider">Codex</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-codex-brown hover:text-codex-ink hover:bg-codex-tan/50 font-medium transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/60" />
                <input
                  type="search"
                  placeholder="Search the archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-64"
                />
              </div>
            </form>

            {authenticated ? (
              <Link to="/profile" className="btn-ghost">
                Account
              </Link>
            ) : (
              <Link to="/login" className="btn-primary">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-codex-brown hover:text-codex-ink"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-codex-brown/20 bg-codex-cream">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/60" />
                <input
                  type="search"
                  placeholder="Search the archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-codex-brown hover:bg-codex-tan/50 hover:text-codex-ink transition-colors"
                    style={{ borderRadius: '2px' }}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
