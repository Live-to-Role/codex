import apiClient from "./client";
import type { Author, ProductCredit, PaginatedResponse } from "@/types";

export interface AuthorFilters {
  page?: number;
  search?: string;
  ordering?: string;
}

export async function getAuthors(
  filters: AuthorFilters = {}
): Promise<PaginatedResponse<Author>> {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get<PaginatedResponse<Author>>(
      `/authors/?${params.toString()}`
    );
    return response.data;
  } catch {
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getAuthor(slug: string): Promise<Author> {
  const response = await apiClient.get<Author>(`/authors/${slug}/`);
  return response.data;
}

export interface AuthorCredit extends ProductCredit {
  product: {
    id: string;
    title: string;
    slug: string;
    cover_url?: string;
    publisher_name?: string;
  };
}

export async function getAuthorCredits(slug: string): Promise<AuthorCredit[]> {
  try {
    const response = await apiClient.get<AuthorCredit[]>(`/authors/${slug}/credits/`);
    return response.data;
  } catch {
    return [];
  }
}
