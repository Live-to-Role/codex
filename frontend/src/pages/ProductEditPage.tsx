import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Save,
  X,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getProduct, updateProduct } from "@/api/products";
import { getSystems } from "@/api/systems";
import { getPublishers } from "@/api/publishers";
import type { Product } from "@/types";

interface ProductFormData {
  title: string;
  description: string;
  publisher_id: string;
  game_system_id: string;
  product_type: string;
  page_count: string;
  level_range_min: string;
  level_range_max: string;
  dtrpg_url: string;
  itch_url: string;
  tags: string;
}

const PRODUCT_TYPES = [
  { value: "adventure", label: "Adventure" },
  { value: "sourcebook", label: "Sourcebook" },
  { value: "supplement", label: "Supplement" },
  { value: "bestiary", label: "Bestiary" },
  { value: "tools", label: "Tools" },
  { value: "magazine", label: "Magazine" },
  { value: "core_rules", label: "Core Rules" },
  { value: "screen", label: "GM Screen" },
  { value: "other", label: "Other" },
];

export function ProductEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    publisher_id: "",
    game_system_id: "",
    product_type: "other",
    page_count: "",
    level_range_min: "",
    level_range_max: "",
    dtrpg_url: "",
    itch_url: "",
    tags: "",
  });
  const [editComment, setEditComment] = useState("");
  const [error, setError] = useState("");

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug!),
    enabled: !!slug,
  });

  const { data: systems } = useQuery({
    queryKey: ["systems"],
    queryFn: () => getSystems(),
  });

  const { data: publishers } = useQuery({
    queryKey: ["publishers"],
    queryFn: () => getPublishers(),
  });

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        publisher_id: product.publisher?.id || "",
        game_system_id: product.game_system?.id || "",
        product_type: product.product_type || "other",
        page_count: product.page_count?.toString() || "",
        level_range_min: product.level_range_min?.toString() || "",
        level_range_max: product.level_range_max?.toString() || "",
        dtrpg_url: product.dtrpg_url || "",
        itch_url: product.itch_url || "",
        tags: product.tags?.join(", ") || "",
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Product> & { edit_comment?: string }) =>
      updateProduct(slug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
      queryClient.invalidateQueries({ queryKey: ["productRevisions", slug] });
      navigate(`/products/${slug}`);
    },
    onError: () => {
      setError("Failed to save changes. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const data: Partial<Product> & { edit_comment?: string } = {
      title: formData.title,
      description: formData.description,
      product_type: formData.product_type as Product["product_type"],
      dtrpg_url: formData.dtrpg_url || undefined,
      itch_url: formData.itch_url || undefined,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      edit_comment: editComment,
    };

    if (formData.publisher_id) {
      data.publisher = { id: formData.publisher_id } as Product["publisher"];
    }
    if (formData.game_system_id) {
      data.game_system = { id: formData.game_system_id } as Product["game_system"];
    }
    if (formData.page_count) {
      data.page_count = parseInt(formData.page_count, 10);
    }
    if (formData.level_range_min) {
      data.level_range_min = parseInt(formData.level_range_min, 10);
    }
    if (formData.level_range_max) {
      data.level_range_max = parseInt(formData.level_range_max, 10);
    }

    updateMutation.mutate(data);
  };

  if (productLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
            Product Not Found
          </h2>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-codex-brown/70 mb-6">
        <Link to="/products" className="hover:text-codex-ink">
          Products
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/products/${slug}`} className="hover:text-codex-ink">
          {product.title}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-codex-ink">Edit</span>
      </nav>

      <div className="card p-6">
        <h1 className="font-display text-2xl font-semibold text-codex-ink mb-6 tracking-wide">
          Edit Product
        </h1>

        {error && (
          <div className="bg-red-900/10 text-red-900 px-4 py-3 mb-6 flex items-center gap-2 border border-red-900/20" style={{ borderRadius: "2px" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-32 resize-y"
              placeholder="A brief description of this product..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Publisher
              </label>
              <select
                value={formData.publisher_id}
                onChange={(e) => setFormData({ ...formData, publisher_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select publisher...</option>
                {publishers?.results.map((pub) => (
                  <option key={pub.id} value={pub.id}>
                    {pub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Game System
              </label>
              <select
                value={formData.game_system_id}
                onChange={(e) => setFormData({ ...formData, game_system_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select system...</option>
                {systems?.results.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Product Type
              </label>
              <select
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                className="input w-full"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Page Count
              </label>
              <input
                type="number"
                value={formData.page_count}
                onChange={(e) => setFormData({ ...formData, page_count: e.target.value })}
                className="input w-full"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Level Range Min
              </label>
              <input
                type="number"
                value={formData.level_range_min}
                onChange={(e) => setFormData({ ...formData, level_range_min: e.target.value })}
                className="input w-full"
                min="1"
                max="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Level Range Max
              </label>
              <input
                type="number"
                value={formData.level_range_max}
                onChange={(e) => setFormData({ ...formData, level_range_max: e.target.value })}
                className="input w-full"
                min="1"
                max="20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              DriveThruRPG URL
            </label>
            <input
              type="url"
              value={formData.dtrpg_url}
              onChange={(e) => setFormData({ ...formData, dtrpg_url: e.target.value })}
              className="input w-full"
              placeholder="https://www.drivethrurpg.com/product/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Itch.io URL
            </label>
            <input
              type="url"
              value={formData.itch_url}
              onChange={(e) => setFormData({ ...formData, itch_url: e.target.value })}
              className="input w-full"
              placeholder="https://example.itch.io/product"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input w-full"
              placeholder="horror, dungeon, low-level (comma separated)"
            />
          </div>

          <div className="border-t border-codex-brown/20 pt-6">
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Edit Summary
            </label>
            <input
              type="text"
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              className="input w-full"
              placeholder="Briefly describe your changes..."
            />
            <p className="text-xs text-codex-brown/50 mt-1">
              This will be shown in the edit history.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to={`/products/${slug}`}
              className="btn-ghost flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
