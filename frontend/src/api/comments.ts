import apiClient from "./client";
import type { UserPublic } from "@/types";

export interface Comment {
  id: string;
  product: string;
  user?: UserPublic;
  parent?: string;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  replies: Comment[];
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export async function getProductComments(slug: string): Promise<Comment[]> {
  try {
    const response = await apiClient.get<Comment[]>(`/products/${slug}/comments/`);
    return response.data;
  } catch {
    return [];
  }
}

export async function postComment(
  slug: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  const response = await apiClient.post<Comment>(`/products/${slug}/comments/`, {
    content,
    parent: parentId || null,
  });
  return response.data;
}
