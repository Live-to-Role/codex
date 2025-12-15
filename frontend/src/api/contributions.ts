import apiClient from "./client";

export interface ContributionData {
  contribution_type: "new_product" | "edit_product" | "new_publisher" | "new_system";
  product_id?: string;
  data: Record<string, unknown>;
  comment?: string;
}

export interface ContributionResponse {
  status: "applied" | "pending";
  message: string;
  product_id?: string;
  contribution_id?: string;
}

export interface Contribution {
  id: string;
  contribution_type: string;
  product?: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    public_name: string;
  };
  data: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  review_notes: string;
  reviewed_by?: {
    id: string;
    public_name: string;
  };
  reviewed_at?: string;
  created_at: string;
}

export interface ContributionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contribution[];
}

export async function submitContribution(
  data: ContributionData
): Promise<ContributionResponse> {
  const response = await apiClient.post<ContributionResponse>(
    "/contributions/",
    data
  );
  return response.data;
}

export async function getModerationQueue(): Promise<Contribution[]> {
  const response = await apiClient.get<ContributionListResponse>(
    "/contributions/",
    {
      params: { status: "pending", moderation: "true" },
    }
  );
  return response.data.results;
}

export async function getContribution(id: string): Promise<Contribution> {
  const response = await apiClient.get<Contribution>(`/contributions/${id}/`);
  return response.data;
}

export async function reviewContribution(
  id: string,
  action: "approve" | "reject",
  reviewNotes?: string
): Promise<void> {
  await apiClient.post(`/contributions/${id}/review/`, {
    action,
    review_notes: reviewNotes || "",
  });
}

export async function getProductRevisions(
  productSlug: string
): Promise<
  {
    id: string;
    user?: { public_name: string };
    changes: Record<string, { old: string; new: string }>;
    comment: string;
    created_at: string;
  }[]
> {
  const response = await apiClient.get(`/products/${productSlug}/revisions/`);
  return response.data;
}
