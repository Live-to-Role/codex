import apiClient from "./client";
import type { Product, Publisher, PaginatedResponse } from "@/types";

export interface ProductSeries {
  id: string;
  name: string;
  slug: string;
  description: string;
  publisher?: Publisher;
  publisher_name?: string;
  product_count: number;
  products?: Product[];
  created_at: string;
}

export interface SeriesFilters {
  page?: number;
  search?: string;
  ordering?: string;
}

export async function getSeries(
  filters: SeriesFilters = {}
): Promise<PaginatedResponse<ProductSeries>> {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get<PaginatedResponse<ProductSeries>>(
      `/series/?${params.toString()}`
    );
    return response.data;
  } catch {
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getSeriesDetail(slug: string): Promise<ProductSeries> {
  const response = await apiClient.get<ProductSeries>(`/series/${slug}/`);
  return response.data;
}
