import { Link } from "react-router-dom";
import { BookOpen, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-codex-ink text-codex-tan/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-codex-dark flex items-center justify-center border border-codex-olive/30" style={{ borderRadius: '2px' }}>
                <BookOpen className="w-5 h-5 text-codex-tan" />
              </div>
              <span className="font-display font-semibold text-xl text-codex-cream tracking-wider">Codex</span>
            </Link>
            <p className="text-codex-tan/60 max-w-md leading-relaxed">
              The community-curated archive of tabletop RPG products. 
              Every adventure, sourcebook, and zine — cataloged and preserved for posterity.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-codex-cream mb-4 tracking-wide">Browse</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-codex-tan/70 hover:text-codex-cream transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/publishers" className="text-codex-tan/70 hover:text-codex-cream transition-colors">
                  Publishers
                </Link>
              </li>
              <li>
                <Link to="/systems" className="text-codex-tan/70 hover:text-codex-cream transition-colors">
                  Game Systems
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-codex-cream mb-4 tracking-wide">Live to Role</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://livetorole.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-codex-tan/70 hover:text-codex-cream transition-colors inline-flex items-center gap-1"
                >
                  Main Site
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Live-to-Role/grimoire"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-codex-tan/70 hover:text-codex-cream transition-colors inline-flex items-center gap-1"
                >
                  <Github className="w-4 h-4" />
                  Grimoire
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-codex-olive/20 mt-8 pt-8 text-sm text-codex-tan/40">
          <p>&copy; {new Date().getFullYear()} Live to Role LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
