import { Link } from "react-router-dom";
import { BookOpen, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Codex</span>
            </Link>
            <p className="text-neutral-400 max-w-md">
              The community-curated database of tabletop RPG products. 
              Every adventure, sourcebook, and zine, cataloged and searchable.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Browse</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/publishers" className="hover:text-white transition-colors">
                  Publishers
                </Link>
              </li>
              <li>
                <Link to="/systems" className="hover:text-white transition-colors">
                  Game Systems
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Live to Role</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://livetorole.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
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
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <Github className="w-4 h-4" />
                  Grimoire
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-8 text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Live to Role LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
