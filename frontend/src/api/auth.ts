import { request } from "./request";
import type { ApiResponse, User } from "../types";

export async function login(payload: { email: string; password: string }) {
  const { data } = await request.post<ApiResponse<{ token: string; user: User }>>("/auth/login", payload);
  return data.data;
}

export async function me() {
  const { data } = await request.get<ApiResponse<User>>("/auth/me");
  return data.data;
}

