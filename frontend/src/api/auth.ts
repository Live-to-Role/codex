import apiClient from "./client";
import type { User, LoginCredentials, RegisterData } from "@/types";

export interface LoginResponse {
  user: User;
  access?: string;
  refresh?: string;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiClient.post<LoginResponse>("/auth/login/", credentials);
  return response.data.user;
}

export async function register(data: RegisterData): Promise<void> {
  await apiClient.post("/auth/registration/", data);
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout/");
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/auth/user/");
  return response.data;
}

export async function updateCurrentUser(data: Partial<User>): Promise<User> {
  const response = await apiClient.patch<User>("/auth/user/", data);
  return response.data;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post("/auth/password/reset/", { email });
}

export async function confirmPasswordReset(
  uid: string,
  token: string,
  newPassword1: string,
  newPassword2: string
): Promise<void> {
  await apiClient.post("/auth/password/reset/confirm/", {
    uid,
    token,
    new_password1: newPassword1,
    new_password2: newPassword2,
  });
}

export interface APIKeyInfo {
  has_key: boolean;
  key_preview: string | null;
  created: string | null;
}

export interface APIKeyGenerated {
  key: string;
  message: string;
  created: string;
}

export async function getAPIKey(): Promise<APIKeyInfo> {
  const response = await apiClient.get<APIKeyInfo>("/users/api-key/");
  return response.data;
}

export async function generateAPIKey(): Promise<APIKeyGenerated> {
  const response = await apiClient.post<APIKeyGenerated>("/users/api-key/");
  return response.data;
}

export async function revokeAPIKey(): Promise<void> {
  await apiClient.delete("/users/api-key/");
}
