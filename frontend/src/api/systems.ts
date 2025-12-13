import apiClient from "./client";
import type { GameSystem, Product, PaginatedResponse } from "@/types";

export interface SystemFilters {
  page?: number;
  search?: string;
  publisher?: string;
  ordering?: string;
}

export async function getSystems(
  filters: SystemFilters = {}
): Promise<PaginatedResponse<GameSystem>> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<PaginatedResponse<GameSystem>>(
    `/systems/?${params.toString()}`
  );
  return response.data;
}

export async function getSystem(slug: string): Promise<GameSystem> {
  const response = await apiClient.get<GameSystem>(`/systems/${slug}/`);
  return response.data;
}

export async function getSystemProducts(slug: string): Promise<Product[]> {
  const response = await apiClient.get<Product[]>(`/systems/${slug}/products/`);
  return response.data;
}

export async function createSystem(
  data: Partial<GameSystem>
): Promise<GameSystem> {
  const response = await apiClient.post<GameSystem>("/systems/", data);
  return response.data;
}

export async function updateSystem(
  slug: string,
  data: Partial<GameSystem>
): Promise<GameSystem> {
  const response = await apiClient.patch<GameSystem>(`/systems/${slug}/`, data);
  return response.data;
}
