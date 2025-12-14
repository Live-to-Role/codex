import apiClient from "./client";
import type { User, Contribution, PaginatedResponse } from "@/types";

export async function getUserProfile(userId: string): Promise<User> {
  try {
    const response = await apiClient.get<User>(`/users/${userId}/`);
    return response.data;
  } catch {
    throw new Error("User not found");
  }
}

export async function getUserContributions(
  userId: string
): Promise<PaginatedResponse<Contribution>> {
  try {
    const response = await apiClient.get<PaginatedResponse<Contribution>>(
      `/users/${userId}/contributions/`
    );
    return response.data;
  } catch {
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export async function getMyContributions(): Promise<PaginatedResponse<Contribution>> {
  try {
    const response = await apiClient.get<PaginatedResponse<Contribution>>(
      `/contributions/`
    );
    return response.data;
  } catch {
    return { count: 0, next: null, previous: null, results: [] };
  }
}
