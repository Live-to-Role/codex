import apiClient from "./client";
import type { Contribution } from "@/types";

export async function getPendingContributions(
  status?: string
): Promise<Contribution[]> {
  try {
    const params = new URLSearchParams();
    if (status) {
      params.append("status", status);
    }
    const response = await apiClient.get<{ results: Contribution[] }>(
      `/contributions/?${params.toString()}`
    );
    return response.data.results;
  } catch {
    return [];
  }
}

export async function reviewContribution(
  id: string,
  status: "approved" | "rejected",
  notes: string
): Promise<Contribution> {
  const response = await apiClient.patch<Contribution>(`/contributions/${id}/review/`, {
    status,
    review_notes: notes,
  });
  return response.data;
}
