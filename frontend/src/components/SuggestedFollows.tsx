import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { FollowButton } from "./FollowButton";
import { api } from "../lib/api";

interface SuggestedUser {
  id: string;
  public_name: string;
  avatar_url?: string;
  reason: string;
  shared_products: number;
  note_upvotes: number;
}

export function SuggestedFollows() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  const { data: suggestions } = useQuery({
    queryKey: ["recommendations", "suggested-follows"],
    queryFn: async () => {
      const response = await api.get("/recommendations/suggested-follows/");
      return response.data.results as SuggestedUser[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleDismiss = (userId: string) => {
    setDismissed((prev) => [...prev, userId]);
  };

  const visibleSuggestions = suggestions?.filter(
    (s) => !dismissed.includes(s.id)
  );

  if (!visibleSuggestions || visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Suggested follows</h3>
      </div>
      
      <div className="space-y-3">
        {visibleSuggestions.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="flex items-start gap-3"
          >
            <img
              src={
                user.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${user.public_name}`
              }
              alt={user.public_name}
              className="h-10 w-10 rounded-full bg-gray-100"
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="truncate font-medium text-gray-900">
                  {user.public_name}
                </h4>
                <button
                  onClick={() => handleDismiss(user.id)}
                  className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className="mt-1 text-xs text-gray-500">
                {user.reason === "high_quality_notes"
                  ? `${user.note_upvotes} upvotes on notes`
                  : `${user.shared_products} shared interests`}
              </p>
              
              <div className="mt-2">
                <FollowButton
                  targetType="user"
                  targetId={user.id}
                  size="sm"
                  variant="outline"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {suggestions && suggestions.length > 5 && (
        <button className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-700">
          See more suggestions
        </button>
      )}
    </div>
  );
}
