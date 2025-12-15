import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  Send,
  X,
  ChevronRight,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { getSystems } from "@/api/systems";
import { getPublishers } from "@/api/publishers";
import { submitContribution } from "@/api/contributions";
import { useAuth } from "@/contexts/AuthContext";

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

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { isAuthenticated: authenticated } = useAuth();

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    publisher_id: "",
    game_system_id: "",
    product_type: "adventure",
    page_count: "",
    level_range_min: "",
    level_range_max: "",
    dtrpg_url: "",
    itch_url: "",
    tags: "",
  });
  const [error, setError] = useState("");

  const { data: systems } = useQuery({
    queryKey: ["systems"],
    queryFn: () => getSystems(),
  });

  const { data: publishers } = useQuery({
    queryKey: ["publishers"],
    queryFn: () => getPublishers(),
  });

  const submitMutation = useMutation({
    mutationFn: submitContribution,
    onSuccess: (response) => {
      if (response.status === "applied" && response.product_id) {
        navigate(`/products/${response.product_id}`);
      } else {
        navigate("/contribution/success");
      }
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosError?.response?.data?.detail ||
          "Failed to submit. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    const data: Record<string, unknown> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      product_type: formData.product_type,
    };

    if (formData.publisher_id) {
      data.publisher_id = formData.publisher_id;
    }
    if (formData.game_system_id) {
      data.game_system_id = formData.game_system_id;
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
    if (formData.dtrpg_url) {
      data.dtrpg_url = formData.dtrpg_url;
    }
    if (formData.itch_url) {
      data.itch_url = formData.itch_url;
    }
    if (formData.tags) {
      data.tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    submitMutation.mutate({
      contribution_type: "new_product",
      data,
    });
  };

  if (!authenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
            Sign In Required
          </h2>
          <p className="text-codex-brown/70 mb-4">
            You need to be signed in to contribute to the archives.
          </p>
          <Link to="/login" className="btn-primary">
            Sign In
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
        <span className="text-codex-ink">Add New</span>
      </nav>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 bg-codex-dark flex items-center justify-center border border-codex-ink"
            style={{ borderRadius: "2px" }}
          >
            <BookOpen className="w-5 h-5 text-codex-tan" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
              Add a New Product
            </h1>
            <p className="text-sm text-codex-brown/70">
              Help grow the archives
            </p>
          </div>
        </div>

        <div
          className="bg-codex-tan/30 border border-codex-brown/20 px-4 py-3 mb-6 flex items-start gap-3"
          style={{ borderRadius: "2px" }}
        >
          <Info className="w-5 h-5 text-codex-olive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-codex-brown">
            <p className="font-medium text-codex-ink">Submission Review</p>
            <p>
              Your contribution will be reviewed by a moderator before going
              live. You'll be notified when it's approved.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="bg-red-900/10 text-red-900 px-4 py-3 mb-6 flex items-center gap-2 border border-red-900/20"
            style={{ borderRadius: "2px" }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input w-full"
              placeholder="The Tomb of the Serpent Kings"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input w-full h-32 resize-y"
              placeholder="A brief description of this product..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Publisher
              </label>
              <select
                value={formData.publisher_id}
                onChange={(e) =>
                  setFormData({ ...formData, publisher_id: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, game_system_id: e.target.value })
                }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Product Type <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.product_type}
                onChange={(e) =>
                  setFormData({ ...formData, product_type: e.target.value })
                }
                className="input w-full"
                required
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
                onChange={(e) =>
                  setFormData({ ...formData, page_count: e.target.value })
                }
                className="input w-full"
                min="1"
                placeholder="48"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Level Range Min
              </label>
              <input
                type="number"
                value={formData.level_range_min}
                onChange={(e) =>
                  setFormData({ ...formData, level_range_min: e.target.value })
                }
                className="input w-full"
                min="0"
                max="20"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-codex-brown mb-1">
                Level Range Max
              </label>
              <input
                type="number"
                value={formData.level_range_max}
                onChange={(e) =>
                  setFormData({ ...formData, level_range_max: e.target.value })
                }
                className="input w-full"
                min="0"
                max="20"
                placeholder="3"
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
              onChange={(e) =>
                setFormData({ ...formData, dtrpg_url: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, itch_url: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="input w-full"
              placeholder="horror, dungeon, low-level (comma separated)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-codex-brown/20">
            <Link to="/products" className="btn-ghost flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
