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
    // Add moderation=true to get contributions user can moderate
    params.append("moderation", "true");
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
): Promise<{ status: string; message: string }> {
  const response = await apiClient.post<{ status: string; message: string }>(
    `/contributions/${id}/review/`,
    {
      action: status === "approved" ? "approve" : "reject",
      review_notes: notes,
    }
  );
  return response.data;
}
