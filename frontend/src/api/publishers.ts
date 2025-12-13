import apiClient from "./client";
import type { Publisher, Product, PaginatedResponse } from "@/types";

export interface PublisherFilters {
  page?: number;
  search?: string;
  is_verified?: boolean;
  ordering?: string;
}

export async function getPublishers(
  filters: PublisherFilters = {}
): Promise<PaginatedResponse<Publisher>> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<PaginatedResponse<Publisher>>(
    `/publishers/?${params.toString()}`
  );
  return response.data;
}

export async function getPublisher(slug: string): Promise<Publisher> {
  const response = await apiClient.get<Publisher>(`/publishers/${slug}/`);
  return response.data;
}

export async function getPublisherProducts(slug: string): Promise<Product[]> {
  const response = await apiClient.get<Product[]>(`/publishers/${slug}/products/`);
  return response.data;
}

export async function createPublisher(
  data: Partial<Publisher>
): Promise<Publisher> {
  const response = await apiClient.post<Publisher>("/publishers/", data);
  return response.data;
}

export async function updatePublisher(
  slug: string,
  data: Partial<Publisher>
): Promise<Publisher> {
  const response = await apiClient.patch<Publisher>(`/publishers/${slug}/`, data);
  return response.data;
}
