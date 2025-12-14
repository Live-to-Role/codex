import apiClient from "./client";
import type { GameSystem, Product, PaginatedResponse } from "@/types";
import { getMockSystems, getMockSystem, mockProducts } from "./mockData";

export interface SystemFilters {
  page?: number;
  search?: string;
  publisher?: string;
  ordering?: string;
}

export async function getSystems(
  filters: SystemFilters = {}
): Promise<PaginatedResponse<GameSystem>> {
  try {
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
  } catch {
    return getMockSystems();
  }
}

export async function getSystem(slug: string): Promise<GameSystem> {
  try {
    const response = await apiClient.get<GameSystem>(`/systems/${slug}/`);
    return response.data;
  } catch {
    const mockSystem = getMockSystem(slug);
    if (mockSystem) return mockSystem;
    throw new Error("System not found");
  }
}

export async function getSystemProducts(slug: string): Promise<Product[]> {
  try {
    const response = await apiClient.get<Product[]>(`/systems/${slug}/products/`);
    return response.data;
  } catch {
    return mockProducts.filter((p) => p.game_system?.slug === slug);
  }
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
