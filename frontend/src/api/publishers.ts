import apiClient from "./client";
import type { Publisher, Product, PaginatedResponse } from "@/types";
import { getMockPublishers, getMockPublisher, mockProducts } from "./mockData";

export interface PublisherFilters {
  page?: number;
  search?: string;
  is_verified?: boolean;
  ordering?: string;
}

export async function getPublishers(
  filters: PublisherFilters = {}
): Promise<PaginatedResponse<Publisher>> {
  try {
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
  } catch {
    return getMockPublishers();
  }
}

export async function getPublisher(slug: string): Promise<Publisher> {
  try {
    const response = await apiClient.get<Publisher>(`/publishers/${slug}/`);
    return response.data;
  } catch {
    const mockPublisher = getMockPublisher(slug);
    if (mockPublisher) return mockPublisher;
    throw new Error("Publisher not found");
  }
}

export async function getPublisherProducts(slug: string): Promise<Product[]> {
  try {
    const response = await apiClient.get<Product[]>(`/publishers/${slug}/products/`);
    return response.data;
  } catch {
    return mockProducts.filter((p) => p.publisher?.slug === slug);
  }
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
