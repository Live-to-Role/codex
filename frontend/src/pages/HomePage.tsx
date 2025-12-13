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
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              The Community Database of TTRPG Products
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Every adventure, sourcebook, and zine — cataloged and searchable. 
              Powered by the community, for the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="btn bg-white text-primary-700 hover:bg-primary-50">
                <BookOpen className="w-5 h-5" />
                Browse Products
              </Link>
              <Link to="/search" className="btn bg-primary-500 text-white hover:bg-primary-400 border border-primary-400">
                <Search className="w-5 h-5" />
                Search Database
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className="card p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-neutral-900">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-neutral-500">{stat.label}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Recent Products</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
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
                className="card overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-[3/4] bg-neutral-200 relative">
                  {product.cover_url || product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url || product.cover_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {product.title}
                  </h3>
                  {product.game_system_name && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {product.game_system_name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Part of the Live to Role Ecosystem
            </h2>
            <p className="text-neutral-600 mb-8">
              Codex powers product identification in{" "}
              <a
                href="https://github.com/Live-to-Role/grimoire"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
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
                Start Contributing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
