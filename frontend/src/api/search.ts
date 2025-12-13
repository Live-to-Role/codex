import apiClient from "./client";
import type { SearchResponse } from "@/types";

export interface SearchParams {
  q: string;
  type?: "all" | "products" | "publishers" | "authors" | "systems";
  limit?: number;
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  const queryParams = new URLSearchParams();

  queryParams.append("q", params.q);
  if (params.type) queryParams.append("type", params.type);
  if (params.limit) queryParams.append("limit", String(params.limit));

  const response = await apiClient.get<SearchResponse>(
    `/search?${queryParams.toString()}`
  );
  return response.data;
}
