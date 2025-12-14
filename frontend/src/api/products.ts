import apiClient from "./client";
import type { Product, PaginatedResponse, IdentifyResponse } from "@/types";
import { getMockProducts, getMockProduct } from "./mockData";

export interface ProductFilters {
  page?: number;
  search?: string;
  game_system__slug?: string;
  publisher__slug?: string;
  product_type?: string;
  status?: string;
  level_min?: number;
  level_max?: number;
  tags?: string;
  ordering?: string;
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedResponse<Product>> {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get<PaginatedResponse<Product>>(
      `/products/?${params.toString()}`
    );
    return response.data;
  } catch {
    console.log("API unavailable, using mock data");
    return getMockProducts(filters);
  }
}

export async function getProduct(slug: string): Promise<Product> {
  try {
    const response = await apiClient.get<Product>(`/products/${slug}/`);
    return response.data;
  } catch {
    const mockProduct = getMockProduct(slug);
    if (mockProduct) return mockProduct;
    throw new Error("Product not found");
  }
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const response = await apiClient.post<Product>("/products/", data);
  return response.data;
}

export async function updateProduct(
  slug: string,
  data: Partial<Product>
): Promise<Product> {
  const response = await apiClient.patch<Product>(`/products/${slug}/`, data);
  return response.data;
}

export async function identifyProduct(params: {
  hash?: string;
  title?: string;
  filename?: string;
}): Promise<IdentifyResponse> {
  const queryParams = new URLSearchParams();

  if (params.hash) queryParams.append("hash", params.hash);
  if (params.title) queryParams.append("title", params.title);
  if (params.filename) queryParams.append("filename", params.filename);

  const response = await apiClient.get<IdentifyResponse>(
    `/identify?${queryParams.toString()}`
  );
  return response.data;
}

export interface Revision {
  id: string;
  user?: {
    id: string;
    public_name: string;
  };
  changes: Record<string, unknown>;
  comment: string;
  created_at: string;
}

export async function getProductRevisions(slug: string): Promise<Revision[]> {
  try {
    const response = await apiClient.get<Revision[]>(`/products/${slug}/revisions/`);
    return response.data;
  } catch {
    return [];
  }
}
