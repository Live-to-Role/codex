import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users, Gamepad2, Search, ArrowRight } from "lucide-react";
import { getProducts } from "@/api/products";
import { getPublishers } from "@/api/publishers";
import { getSystems } from "@/api/systems";

export function HomePage() {
  const { data: productsData } = useQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: () => getProducts({ page: 1 }),
  });

  const { data: publishersData } = useQuery({
    queryKey: ["publishers"],
    queryFn: () => getPublishers(),
  });

  const { data: systemsData } = useQuery({
    queryKey: ["systems"],
    queryFn: () => getSystems(),
  });

  const stats = [
    {
      label: "Products",
      value: productsData?.count || 0,
      icon: BookOpen,
      to: "/products",
    },
    {
      label: "Publishers",
      value: publishersData?.count || 0,
      icon: Users,
      to: "/publishers",
    },
    {
      label: "Game Systems",
      value: systemsData?.count || 0,
      icon: Gamepad2,
      to: "/systems",
    },
  ];

  return (
    <div>
      <section className="bg-codex-ink text-codex-cream py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D9D3C7' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-6 text-codex-olive/60 tracking-[0.3em] text-sm uppercase">
              ❧ Est. MMXXIV ❧
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 tracking-wide">
              The Grand Archive of<br />TTRPG Knowledge
            </h1>
            <p className="text-xl text-codex-tan/80 mb-10 leading-relaxed max-w-2xl mx-auto">
              Every adventure, sourcebook, and zine — cataloged and preserved. 
              A community-curated repository for the ages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="btn bg-codex-cream text-codex-ink hover:bg-codex-tan border border-codex-tan/30">
                <BookOpen className="w-5 h-5" />
                Browse the Archives
              </Link>
              <Link to="/search" className="btn bg-transparent text-codex-cream hover:bg-codex-dark border border-codex-olive/50">
                <Search className="w-5 h-5" />
                Search the Codex
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-codex-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className="card p-6 group transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-codex-olive/10 flex items-center justify-center group-hover:bg-codex-olive/20 transition-colors border border-codex-olive/20" style={{ borderRadius: '2px' }}>
                      <Icon className="w-7 h-7 text-codex-olive" />
                    </div>
                    <div>
                      <p className="font-display text-3xl font-semibold text-codex-ink">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-codex-brown">{stat.label}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">Recent Acquisitions</h2>
              <p className="text-codex-brown/70 mt-1">The latest additions to our archives</p>
            </div>
            <Link
              to="/products"
              className="text-codex-dark hover:text-codex-olive font-medium inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {productsData?.results?.slice(0, 10).map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="card overflow-hidden group transition-all duration-300"
              >
                <div className="aspect-[3/4] bg-codex-tan relative">
                  {product.cover_url || product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url || product.cover_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-codex-brown/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-codex-ink line-clamp-2 group-hover:text-codex-olive transition-colors">
                    {product.title}
                  </h3>
                  {product.game_system_name && (
                    <p className="text-xs text-codex-brown/70 mt-1">
                      {product.game_system_name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-codex-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23332514' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-4 text-codex-olive/50 tracking-[0.3em] text-xs uppercase">
              ✦ ✦ ✦
            </div>
            <h2 className="font-display text-2xl font-semibold text-codex-ink mb-4 tracking-wide">
              Part of the Live to Role Guild
            </h2>
            <p className="text-codex-brown leading-relaxed mb-8">
              The Codex powers product identification in{" "}
              <a
                href="https://github.com/Live-to-Role/grimoire"
                target="_blank"
                rel="noopener noreferrer"
                className="text-codex-dark hover:text-codex-olive font-medium underline underline-offset-2"
              >
                Grimoire
              </a>
              , the self-hosted RPG library manager. Your contributions help 
              the entire community organize their digital collections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/Live-to-Role/grimoire"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Learn About Grimoire
              </a>
              <Link to="/register" className="btn-primary">
                Become a Contributor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
