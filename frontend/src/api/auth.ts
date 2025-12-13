import apiClient from "./client";
import type { User, AuthTokens, LoginCredentials, RegisterData } from "@/types";

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const response = await apiClient.post<AuthTokens>("/auth/login/", credentials);

  const { access, refresh } = response.data;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);

  return response.data;
}

export async function register(data: RegisterData): Promise<AuthTokens> {
  const response = await apiClient.post<AuthTokens>("/auth/registration/", data);

  const { access, refresh } = response.data;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);

  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout/");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/auth/user/");
  return response.data;
}

export async function updateCurrentUser(data: Partial<User>): Promise<User> {
  const response = await apiClient.patch<User>("/auth/user/", data);
  return response.data;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}
