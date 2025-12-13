import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2 } from "lucide-react";
import { getSystems } from "@/api/systems";

export function SystemsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["systems"],
    queryFn: () => getSystems(),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Game Systems</h1>
        <p className="text-neutral-500 mt-1">{data?.count?.toLocaleString() || 0} game systems</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data?.results?.map((system) => (
            <Link key={system.id} to={`/systems/${system.slug}`} className="card p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200">
                  <Gamepad2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 group-hover:text-primary-600">{system.name}</h3>
                  {system.product_count !== undefined && (
                    <p className="text-sm text-neutral-500">{system.product_count} products</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
